import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendNextDayCheckinConfirmation, sendAdminNextDayCheckin } from "@/lib/email"

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
  return NextResponse.json({
    valid: true,
    alreadySubmitted: row.followup_sent === true,
  })
}

// POST — save check-in responses
export async function POST(req: NextRequest) {
  try {
    const { token, scores } = await req.json()
    if (!token || !scores) {
      return NextResponse.json({ ok: false, error: "token and scores required" }, { status: 400 })
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

    // Fire emails
    if (email) {
      Promise.allSettled([
        sendNextDayCheckinConfirmation(email, firstName),
        sendAdminNextDayCheckin(client_id, firstName, lastName, email, scores),
      ]).catch(console.error)
    }

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
