/**
 * GET /api/cron/nextday-trigger
 *
 * Intended to be called by a Vercel cron (once daily, e.g. 9am UTC).
 * Finds all protocols where:
 *   - protocol_start_date = YESTERDAY (so we fire on Day+1)
 *   - followup_sent = FALSE
 *   - followup_token IS NOT NULL
 *
 * For each, sends the next-day check-in email + logs a draft SMS.
 * Marks followup_sent = TRUE only after email delivery (the POST /api/nextday-checkin
 * route also sets it when the form is actually submitted — this flag purely gates
 * re-sending the trigger, NOT whether the checkin has been submitted).
 *
 * Note: followup_sent here means "trigger email sent". The checkin submission
 * sets it to TRUE again after form submit — that's fine, it's still "sent+done".
 *
 * Secured by CRON_SECRET env var (set in Vercel).
 */
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendNextDayTrigger } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  try {
    // Find protocols starting yesterday (Day+1 trigger)
    const result = await query<{
      client_id: string
      followup_token: string
      protocol_start_date: string
    }>(
      `SELECT cp.client_id, cp.followup_token, cp.protocol_start_date
       FROM roc.client_protocols cp
       WHERE cp.protocol_start_date = CURRENT_DATE - INTERVAL '1 day'
         AND cp.followup_sent = FALSE
         AND cp.followup_token IS NOT NULL`
    )

    const rows = result.rows
    if (!rows.length) {
      return NextResponse.json({ ok: true, triggered: 0, message: "No protocols due today." })
    }

    let sent = 0
    for (const row of rows) {
      // Get client contact info
      const userResult = await query<{ email: string; first_name: string; last_name: string; phone: string }>(
        `SELECT email, first_name, last_name, data->>'phone' as phone
         FROM roc.intakes
         WHERE id = $1
         ORDER BY submitted_at DESC LIMIT 1`,
        [row.client_id]
      ).catch(() => ({ rows: [] as { email: string; first_name: string; last_name: string; phone: string }[] }))

      const user = userResult.rows[0]
      if (!user?.email) continue

      const checkinUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://richardortizcoaching.com"}/next-day-checkin?token=${row.followup_token}`

      await sendNextDayTrigger(user.email, user.first_name, checkinUrl)

      // Log SMS draft to activity_log so admin can see it
      const smsDraft = `Hi ${user.first_name}! It's Day 1 of your new protocol. How are you feeling? Take 2 min to fill out your check-in: ${checkinUrl}`
      await query(
        `INSERT INTO roc.activity_log (action, details)
         VALUES ('nextday_sms_draft', $1)`,
        [JSON.stringify({
          clientId: row.client_id,
          phone: user.phone ?? "",
          email: user.email,
          smsDraft,
          checkinUrl,
        })]
      )

      // Mark trigger sent (not the same as form submitted — just prevents re-send)
      await query(
        `UPDATE roc.client_protocols SET followup_sent = TRUE WHERE client_id = $1 AND followup_token = $2`,
        [row.client_id, row.followup_token]
      )

      sent++
    }

    return NextResponse.json({ ok: true, triggered: sent })
  } catch (err) {
    console.error("[nextday-trigger]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
