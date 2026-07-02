/**
 * GET /api/cron/schedule-alerts — daily (see vercel.json).
 *
 * Computes the coaching schedule and, for check-ins + renewals that are due
 * today or overdue:
 *   1. Creates a bell notification (deduped per client per cycle: the
 *      ref_id embeds the due date, and the partial unique index on
 *      (type, ref_id) WHERE resolved=false makes re-runs no-ops).
 *   2. Sends the coach ONE digest email listing everything.
 *
 * Secured like the nextday cron: honours x-cron-secret AND Vercel's own
 * Authorization: Bearer CRON_SECRET header.
 */
import { NextRequest, NextResponse } from "next/server"
import { computeSchedule } from "@/lib/schedule"
import { createNotification } from "@/lib/notifications"
import { sendAdminScheduleDigest } from "@/lib/email"
import { getSetting } from "@/lib/settings"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret")
    const bearer = req.headers.get("authorization")
    if (secret !== process.env.CRON_SECRET && bearer !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
  }

  try {
    const { overdue, days } = await computeSchedule(30)
    const today = new Date().toISOString().slice(0, 10)
    const dueToday = (days.find(d => d.date === today)?.items ?? [])
      .filter(i => i.type !== "protocol_end")
    const overdueActionable = overdue.filter(i => i.type !== "protocol_end")

    // Bell notifications — one per client per due-cycle, idempotent across runs
    for (const i of [...dueToday, ...overdueActionable]) {
      const late = i.days_overdue > 0 ? ` (${i.days_overdue}d overdue)` : ""
      await createNotification({
        // protocol_end is filtered out above — only actionable types remain
        type: i.type as "checkin_due" | "renewal_due",
        refId: `${i.client_id}:${i.type}:${i.due_date}`,
        refType: "schedule",
        message: i.type === "renewal_due"
          ? `Payment renewal due for ${i.client_name}${i.rate ? ` — $${i.rate}` : ""}${late}`
          : `2-week check-in due from ${i.client_name}${late}`,
      })
    }

    // One digest email to the coach when there's anything actionable
    if (dueToday.length || overdueActionable.length) {
      const to = (await getSetting("admin_email")) || process.env.ADMIN_EMAIL || "richard@richardortizcoaching.com"
      // Await — Vercel freezes the function after the response returns.
      await sendAdminScheduleDigest(to, dueToday, overdueActionable)
    }

    return NextResponse.json({ ok: true, dueToday: dueToday.length, overdue: overdueActionable.length })
  } catch (err) {
    console.error("[schedule-alerts]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
