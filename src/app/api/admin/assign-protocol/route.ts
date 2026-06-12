import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { clientId, peptide, doseAmount, doseUnit, frequencyDays, notes } = await req.json()
    if (!clientId || !peptide) {
      return NextResponse.json({ ok: false, error: "clientId and peptide required" }, { status: 400 })
    }
    await query(
      `INSERT INTO roc.client_protocols
         (client_id, peptide, protocol, dose_amount, dose_unit, frequency_days, coach_notes, assigned_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (client_id) DO UPDATE SET
         peptide = EXCLUDED.peptide,
         protocol = EXCLUDED.protocol,
         dose_amount = EXCLUDED.dose_amount,
         dose_unit = EXCLUDED.dose_unit,
         frequency_days = EXCLUDED.frequency_days,
         coach_notes = EXCLUDED.coach_notes,
         assigned_at = NOW()`,
      [clientId, peptide, "custom", doseAmount ?? "", doseUnit ?? "mg", JSON.stringify(frequencyDays ?? []), notes ?? ""]
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
    "SELECT peptide, protocol, dose_amount, dose_unit, frequency_days, coach_notes, assigned_at FROM roc.client_protocols WHERE client_id = $1",
    [clientId]
  )
  return NextResponse.json({ protocol: result.rows[0] ?? null })
}
