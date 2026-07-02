import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendCheckinConfirmation, sendAdminCheckin } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getSetting } from "@/lib/settings"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { urgentFlag = false, clientEmail: bodyEmail = "", clientName: bodyName = "" } = data
    // email from header (logged-in dashboard) or from body (default no-login link)
    const email = (req.headers.get("x-user-email") || bodyEmail || "").trim()
    let clientName = (bodyName || req.headers.get("x-user-name") || "").trim()

    // Match the email to an existing client record so the check-in lands in the
    // right profile (admin keys per-client history off client_email) even with
    // no login. Backfill the name from the record if the client didn't type one.
    if (email && !clientName) {
      const matched = await query<{ first_name: string; last_name: string }>(
        `SELECT first_name, last_name FROM roc.intakes WHERE lower(email) = lower($1) ORDER BY submitted_at DESC LIMIT 1`,
        [email],
      ).catch(() => ({ rows: [] as { first_name: string; last_name: string }[] }))
      if (matched.rows[0]) clientName = `${matched.rows[0].first_name ?? ""} ${matched.rows[0].last_name ?? ""}`.trim()
    }
    const firstName = clientName.split(" ")[0] || ""
    // Persist the typed name + email into the stored data blob for admin display.
    data.clientName = clientName
    data.clientEmail = email

    // Urgency = client-requested OR any score at/below the configurable threshold
    const threshold = Number(await getSetting("urgent_threshold")) || 5
    const scores = [data.progressScore, data.energyScore, data.moodScore].map(Number).filter(n => !Number.isNaN(n))
    const lowScore = scores.some(s => s <= threshold)
    const isUrgent = Boolean(urgentFlag) || lowScore

    const result = await query(
      `INSERT INTO roc.checkins (data, urgent_flag, client_email) VALUES ($1, $2, $3) RETURNING id`,
      [JSON.stringify(data), isUrgent ? "true" : "false", email]
    )
    const checkinId = (result.rows[0] as { id: string }).id

    // Progress photos (optional) — uploaded client-direct to Vercel Blob
    // before submit; we index the URLs here. Degrade-safe.
    const photos = (data.photos ?? {}) as Record<string, string | null>
    for (const kind of ["front", "side", "back"] as const) {
      const url = photos[kind]
      if (url && email) {
        await query(
          `INSERT INTO roc.client_photos (client_email, checkin_id, source, kind, url, marketing_consent)
           VALUES ($1, $2, 'checkin', $3, $4, $5)`,
          [email, checkinId, kind, url, data.photoConsent ? "true" : "false"],
        ).catch(err => console.error("[checkin] photo save", err))
      }
    }

    // In-app admin notification feed (degrade-safe; pre-migration → no-op)
    const who = clientName || email || "A client"
    if (isUrgent) {
      await createNotification({
        type: "urgent_checkin", refId: checkinId, refType: "checkin",
        message: `Urgent check-in from ${who}${lowScore && !urgentFlag ? " (low score)" : ""}`,
      })
    } else {
      await createNotification({
        type: "checkin_submitted", refId: checkinId, refType: "checkin",
        message: `New check-in from ${who}`,
      })
    }

    // Always notify the coach on every check-in; client gets a confirmation.
    // IMPORTANT: await — on Vercel serverless the function freezes after the
    // response returns, so a fire-and-forget send often never completes.
    await Promise.allSettled([
      email ? sendCheckinConfirmation(email, firstName) : Promise.resolve(),
      sendAdminCheckin(clientName, email, data, isUrgent),
    ])

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('checkin_submitted', $1)`,
      [JSON.stringify({ checkinId, urgentFlag, email })]
    )

    return NextResponse.json({ ok: true, checkinId })
  } catch (err) {
    console.error("[checkin]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
