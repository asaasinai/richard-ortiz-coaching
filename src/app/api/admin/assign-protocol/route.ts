import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { clientId, peptide, doseAmount, doseUnit, frequencyDays, notes, skuId, monthlyRate, billingStatus, billingNotes, secondaryPeptide, secondarySkuId, durationWeeks, internalNotes } = await req.json()
    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 })
    }
    await query(
      `INSERT INTO roc.client_protocols
         (client_id, peptide, protocol, dose_amount, dose_unit, frequency_days, coach_notes, assigned_at,
          sku_id, monthly_rate, billing_status, billing_notes,
          secondary_peptide, secondary_sku_id, duration_weeks, internal_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (client_id) DO UPDATE SET
         peptide = COALESCE(EXCLUDED.peptide, roc.client_protocols.peptide),
         protocol = EXCLUDED.protocol,
         dose_amount = COALESCE(EXCLUDED.dose_amount, roc.client_protocols.dose_amount),
         dose_unit = COALESCE(EXCLUDED.dose_unit, roc.client_protocols.dose_unit),
         frequency_days = COALESCE(EXCLUDED.frequency_days, roc.client_protocols.frequency_days),
         coach_notes = COALESCE(EXCLUDED.coach_notes, roc.client_protocols.coach_notes),
         assigned_at = NOW(),
         sku_id = COALESCE(EXCLUDED.sku_id, roc.client_protocols.sku_id),
         monthly_rate = COALESCE(EXCLUDED.monthly_rate, roc.client_protocols.monthly_rate),
         billing_status = COALESCE(EXCLUDED.billing_status, roc.client_protocols.billing_status),
         billing_notes = COALESCE(EXCLUDED.billing_notes, roc.client_protocols.billing_notes),
         secondary_peptide = EXCLUDED.secondary_peptide,
         secondary_sku_id = EXCLUDED.secondary_sku_id,
         duration_weeks = EXCLUDED.duration_weeks,
         internal_notes = EXCLUDED.internal_notes`,
      [
        clientId, peptide ?? "", "custom", doseAmount ?? "", doseUnit ?? "mg",
        JSON.stringify(frequencyDays ?? []), notes ?? "",
        skuId ?? null, monthlyRate != null ? String(monthlyRate) : null,
        billingStatus ?? "active", billingNotes ?? null,
        secondaryPeptide ?? null, secondarySkuId ?? null,
        durationWeeks ?? null, internalNotes ?? null,
      ]
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
    "SELECT peptide, protocol, dose_amount, dose_unit, frequency_days, coach_notes, assigned_at, sku_id, monthly_rate, billing_status, billing_notes, protocol_start_date, followup_sent FROM roc.client_protocols WHERE client_id = $1",
    [clientId]
  )
  return NextResponse.json({ protocol: result.rows[0] ?? null })
}
