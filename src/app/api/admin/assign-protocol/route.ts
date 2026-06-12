import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { clientId, peptide, protocol, notes } = await req.json()
    if (!clientId || !peptide) {
      return NextResponse.json({ ok: false, error: "clientId and peptide required" }, { status: 400 })
    }

    // Upsert assignment into roc.client_protocols
    await query(
      `INSERT INTO roc.client_protocols (client_id, peptide, protocol, coach_notes, assigned_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (client_id) DO UPDATE
         SET peptide = EXCLUDED.peptide,
             protocol = EXCLUDED.protocol,
             coach_notes = EXCLUDED.coach_notes,
             assigned_at = NOW()`,
      [clientId, peptide, protocol ?? "", notes ?? ""]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[assign-protocol]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const clientId = new URL(req.url).searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ protocol: null })
  const result = await query(
    "SELECT peptide, protocol, coach_notes, assigned_at FROM roc.client_protocols WHERE client_id = $1",
    [clientId]
  )
  return NextResponse.json({ protocol: result.rows[0] ?? null })
}
