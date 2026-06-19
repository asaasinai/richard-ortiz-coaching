import { NextRequest, NextResponse } from "next/server"
import { getSettings, setSetting } from "@/lib/settings"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ settings: await getSettings() })
}

// POST { settings: { key: value, ... } }
export async function POST(req: NextRequest) {
  try {
    const { settings } = await req.json()
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ ok: false, error: "settings object required" }, { status: 400 })
    }
    for (const [k, v] of Object.entries(settings)) {
      await setSetting(k, String(v))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
