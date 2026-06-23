import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendNextDayCheckinConfirmation, sendAdminNextDayCheckin } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

type Scores = Record<string, number>

// Surface a next-day check-in in the unified admin Check-Ins queue (roc.checkins),
// tagged so the admin UI renders the next-day metrics. week_number = 0
// distinguishes it from the 2-week check-in (default 2).
async function addToCheckinQueue(email: string, clientName: string, scores: Scores) {
  const overall = Number(scores.overall)
  const nausea = Number(scores.nausea)
  const isUrgent = (!Number.isNaN(overall) && overall <= 3) || (!Number.isNaN(nausea) && nausea >= 8)
  const data = { checkin_type: "next_day", clientName, clientEmail: email, ...scores }
  const res = await query<{ id: string }>(
    `INSERT INTO roc.checkins (data, urgent_flag, client_email, week_number)
     VALUES ($1, $2, $3, 0) RETURNING id`,
    [JSON.stringify(data), isUrgent ? "true" : "false", email],
  )
  const id = res.rows[0]?.id
  const who = clientName || email || "A client"
  await createNotification({
    type: isUrgent ? "urgent_checkin" : "checkin_submitted",
    refId: id, refType: "checkin",
    message: `Day-1 check-in from ${who}${isUrgent ? " (flagged)" : ""}`,
  }).catch(() => {})
}

// GET — validate token (called on page load)
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false, alreadySubmitted: false })

  const result = await query<{ client_id: string; followup_sent: boolean }>(
    `SELECT client_id, followup_sent FROM roc.client_protocols WHERE followup_token = $1`,
    [token]
  )

  if (!result.rows.length) return NextResponse.json({ valid: false, alreadySubmitted: false })

  const row = result.rows[0]
  // Link never expires — stays valid even after submission so client sees "already done" not "expired"
  return NextResponse.json({
    valid: true,
    alreadySubmitted: row.followup_sent === true,
  })
}

// POST — save check-in responses.
// Two modes: tokenized (per-client link, single-use) OR default (no token —
// client self-identifies with name + email, matched to their record).
export async function POST(req: NextRequest) {
  try {
    const { token, scores, clientName = "", clientEmail = "" } = await req.json()
    if (!scores) {
      return NextResponse.json({ ok: false, error: "scores required" }, { status: 400 })
    }

    // ── Default mode (no token): match by email, save, notify coach ──
    if (!token) {
      const email = String(clientEmail).trim()
      if (!email) {
        return NextResponse.json({ ok: false, error: "name and email required" }, { status: 400 })
      }
      const matched = await query<{ id: string; first_name: string; last_name: string }>(
        `SELECT id, first_name, last_name FROM roc.intakes WHERE lower(email) = lower($1) ORDER BY submitted_at DESC LIMIT 1`,
        [email],
      ).catch(() => ({ rows: [] as { id: string; first_name: string; last_name: string }[] }))
      const m = matched.rows[0]
      const clientId = m?.id ?? `unmatched:${email}`
      const fullName = String(clientName).trim() || `${m?.first_name ?? ""} ${m?.last_name ?? ""}`.trim()
      const firstName = m?.first_name ?? (fullName.split(" ")[0] || "")
      const lastName = m?.last_name ?? (fullName.split(" ").slice(1).join(" ") || "")

      await query(
        `INSERT INTO roc.nextday_checkins
           (client_id, client_email, appetite, cravings, fullness, energy, focus,
            nausea, bloating, hydration, protein_goal, overall, raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          clientId, email,
          scores.appetite, scores.cravings, scores.fullness, scores.energy, scores.focus,
          scores.nausea, scores.bloating, scores.hydration, scores.protein_goal, scores.overall,
          JSON.stringify(scores),
        ],
      )

      // Surface in the admin Check-Ins queue.
      await addToCheckinQueue(email, fullName, scores).catch(e => console.error("[nextday queue]", e))

      // Await sends — serverless freezes after the response returns.
      await Promise.allSettled([
        email ? sendNextDayCheckinConfirmation(email, firstName) : Promise.resolve(),
        sendAdminNextDayCheckin(clientId, firstName, lastName, email, scores),
      ])

      await query(
        `INSERT INTO roc.activity_log (action, details) VALUES ('nextday_checkin_submitted', $1)`,
        [JSON.stringify({ clientId, email, matched: Boolean(m), mode: "default" })],
      ).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    // Look up protocol by token
    const protResult = await query<{ client_id: string; followup_sent: boolean; followup_token: string }>(
      `SELECT client_id, followup_sent FROM roc.client_protocols WHERE followup_token = $1`,
      [token]
    )
    if (!protResult.rows.length) {
      return NextResponse.json({ ok: false, error: "invalid token" }, { status: 403 })
    }
    const { client_id, followup_sent } = protResult.rows[0]
    if (followup_sent) {
      return NextResponse.json({ ok: false, error: "already submitted" }, { status: 409 })
    }

    // Look up client email
    const userResult = await query<{ email: string; first_name: string; last_name: string }>(
      `SELECT email, first_name, last_name FROM roc.intakes WHERE id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [client_id]
    ).catch(() => ({ rows: [] as { email: string; first_name: string; last_name: string }[] }))
    const userRow = userResult.rows[0]
    const email = userRow?.email ?? ""
    const firstName = userRow?.first_name ?? ""
    const lastName = userRow?.last_name ?? ""

    // Save check-in
    await query(
      `INSERT INTO roc.nextday_checkins
         (client_id, client_email, followup_token, appetite, cravings, fullness, energy, focus,
          nausea, bloating, hydration, protein_goal, overall, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        client_id, email, token,
        scores.appetite, scores.cravings, scores.fullness, scores.energy, scores.focus,
        scores.nausea, scores.bloating, scores.hydration, scores.protein_goal, scores.overall,
        JSON.stringify(scores),
      ]
    )

    // Mark sent so it can't be re-submitted
    await query(
      `UPDATE roc.client_protocols SET followup_sent = TRUE WHERE followup_token = $1`,
      [token]
    )

    // Surface in the admin Check-Ins queue.
    await addToCheckinQueue(email, `${firstName} ${lastName}`.trim(), scores).catch(e => console.error("[nextday queue]", e))

    // Await sends — serverless freezes after the response returns.
    await Promise.allSettled([
      email ? sendNextDayCheckinConfirmation(email, firstName) : Promise.resolve(),
      sendAdminNextDayCheckin(client_id, firstName, lastName, email, scores),
    ])

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('nextday_checkin_submitted', $1)`,
      [JSON.stringify({ client_id, email })]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[nextday-checkin]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
