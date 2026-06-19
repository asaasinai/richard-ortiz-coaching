import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { resolveNotifications } from "@/lib/notifications"

export const dynamic = "force-dynamic"

// PATCH /api/admin/checkins/[id]
// Actions:
//   { action: "mark_read", read?: boolean }
//   { action: "follow_up", follow_up_action, follow_up_notes, resolved, resolved_by }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const action = body.action as string

    if (action === "mark_read") {
      const read = body.read !== false
      await query(`UPDATE roc.checkins SET read = $1 WHERE id = $2`, [read, id])
      return NextResponse.json({ ok: true })
    }

    if (action === "follow_up") {
      const resolved = body.resolved === true
      await query(
        `UPDATE roc.checkins SET
           follow_up_action = $1,
           follow_up_notes  = $2,
           read             = true,
           resolved         = $3,
           resolved_by      = CASE WHEN $3 THEN $4 ELSE resolved_by END,
           resolved_at      = CASE WHEN $3 THEN NOW() ELSE resolved_at END,
           urgent_flag      = CASE WHEN $3 THEN false ELSE urgent_flag END
         WHERE id = $5`,
        [body.follow_up_action ?? null, body.follow_up_notes ?? null, resolved, body.resolved_by ?? "Admin", id]
      )
      if (resolved) await resolveNotifications("urgent_checkin", id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
