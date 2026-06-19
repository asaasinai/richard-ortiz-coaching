import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getNotifications } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET() {
  const { rows, unread } = await getNotifications(20)
  return NextResponse.json({ notifications: rows, unread })
}

// POST { action: "mark_all_read" } | { action: "mark_read", id }
export async function POST(req: NextRequest) {
  try {
    const { action, id } = await req.json()
    if (action === "mark_all_read") {
      await query(`UPDATE roc.notifications SET read = true WHERE read = false`)
      return NextResponse.json({ ok: true })
    }
    if (action === "mark_read" && id) {
      await query(`UPDATE roc.notifications SET read = true WHERE id = $1`, [id])
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
