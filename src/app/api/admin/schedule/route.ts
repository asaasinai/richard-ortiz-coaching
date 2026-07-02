import { NextResponse } from "next/server"
import { computeSchedule } from "@/lib/schedule"

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
