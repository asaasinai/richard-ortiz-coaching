import { NextRequest, NextResponse } from "next/server"
import { computeSchedule } from "@/lib/schedule"
import { query } from "@/lib/db"
import { resolveNotifications } from "@/lib/notifications"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

// Rolling 30-day coaching agenda: check-ins due, payment renewals, protocol
// completions. Computed live — nothing cached (see badge-cache lesson).
export async function GET() {
  try {
    const data = await computeSchedule(30)
    return NextResponse.json({ ok: true, ...data }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (err) {
    console.error("[schedule]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// Dismiss one schedule item ("addressed it") for its current cycle. The item
// reappears next cycle under a fresh due date. Also resolves the matching
// bell notification so the alert clears everywhere at once.
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, error: "key required" }, { status: 400 })
    }
    await query(
      `INSERT INTO roc.schedule_dismissals (key) VALUES ($1) ON CONFLICT (key) DO NOTHING`,
      [key],
    )
    const type = key.split(":")[1]
    if (type === "checkin_due" || type === "renewal_due") {
      await resolveNotifications(type, key)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[schedule dismiss]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
