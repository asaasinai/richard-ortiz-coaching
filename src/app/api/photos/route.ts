import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export interface ClientPhoto {
  id: string
  client_email: string
  checkin_id: string | null
  source: "intake" | "checkin"
  kind: "front" | "side" | "back"
  url: string
  marketing_consent: boolean
  created_at: string
}

// Progress photos for one client, newest first. Used by the client dashboard
// and the admin record (same weak email-keyed model as the rest of the app).
export async function GET(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").trim()
    if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 })
    const result = await query<ClientPhoto>(
      `SELECT id, client_email, checkin_id, source, kind, url, marketing_consent, created_at
       FROM roc.client_photos
       WHERE lower(client_email) = lower($1)
       ORDER BY created_at DESC`,
      [email],
    )
    return NextResponse.json({ ok: true, photos: result.rows }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (err) {
    console.error("[photos]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
