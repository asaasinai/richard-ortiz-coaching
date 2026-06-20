import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

const COLS = `ci.id, ci.submitted_at, ci.urgent_flag, ci.client_email, ci.data,
              ci.read, ci.resolved, ci.follow_up_action, ci.follow_up_notes,
              ci.resolved_by, ci.resolved_at, ci.dismissed, ci.dismissed_at,
              i.first_name, i.last_name, i.id as client_intake_id`

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const clientEmail = url.searchParams.get("clientEmail")
  const filter = url.searchParams.get("filter") // urgent | unread | resolved | thisweek

  let sql: string
  const params: string[] = []

  if (clientEmail && clientEmail !== "all") {
    // Per-client history (profile view) keeps everything, dismissed included —
    // dismissing only clears the queue, the data still lives on the profile.
    sql = `SELECT ${COLS}
           FROM roc.checkins ci
           LEFT JOIN roc.intakes i ON lower(i.email) = lower(ci.client_email)
           WHERE lower(ci.client_email) = lower($1)
           ORDER BY ci.submitted_at ASC LIMIT 500`
    params.push(clientEmail)
  } else {
    // The main queue hides dismissed check-ins unless the Dismissed tab is open.
    const base = filter === "dismissed" ? "ci.dismissed = true" : "ci.dismissed = false"
    const extra =
      filter === "urgent"   ? " AND ci.urgent_flag = true" :
      filter === "unread"   ? " AND ci.read = false" :
      filter === "resolved" ? " AND ci.resolved = true" :
      filter === "thisweek" ? " AND ci.submitted_at > NOW() - INTERVAL '7 days'" :
      ""
    sql = `SELECT ${COLS}
           FROM roc.checkins ci
           LEFT JOIN roc.intakes i ON lower(i.email) = lower(ci.client_email)
           WHERE ${base}${extra}
           ORDER BY ci.submitted_at DESC LIMIT 200`
  }

  const result = await query(sql, params.length ? params : undefined)

  // Filter counts for pill tabs (single round-trip). Active-queue counts exclude
  // dismissed; `dismissed` is its own bucket.
  const counts = await query<{ all: string; unread: string; urgent: string; resolved: string; thisweek: string; dismissed: string }>(`
    SELECT COUNT(*) FILTER (WHERE dismissed = false) AS all,
           COUNT(*) FILTER (WHERE dismissed = false AND read = false)     AS unread,
           COUNT(*) FILTER (WHERE dismissed = false AND urgent_flag = true) AS urgent,
           COUNT(*) FILTER (WHERE dismissed = false AND resolved = true)  AS resolved,
           COUNT(*) FILTER (WHERE dismissed = false AND submitted_at > NOW() - INTERVAL '7 days') AS thisweek,
           COUNT(*) FILTER (WHERE dismissed = true) AS dismissed
    FROM roc.checkins`)

  return NextResponse.json({ checkins: result.rows, counts: counts.rows[0] ?? {} })
}

// POST — bulk actions: { action: "mark_all_read" }
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    if (action === "mark_all_read") {
      await query(`UPDATE roc.checkins SET read = true WHERE read = false`)
      await query(`UPDATE roc.notifications SET read = true WHERE type IN ('urgent_checkin','checkin_submitted') AND read = false`)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
