import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Keep the single-row client_protocols in sync with the protocol_lines cart so
// Revenue (MRR) and Ops (fulfillment) keep working. monthly_rate = SUM of lines;
// the first line drives the primary peptide/sku/dose used for COGS + ops cards.
async function syncPrimaryProtocol(clientId: string) {
  const lines = (await query<{
    peptide: string; sku_id: string | null; dose_amount: string | null; dose_unit: string | null
    frequency_days: string | null; duration_weeks: number | null; monthly_rate: string | null
    coach_notes: string | null; secondary_peptide: string | null
  }>(
    `SELECT peptide, sku_id, dose_amount, dose_unit, frequency_days, duration_weeks,
            monthly_rate, coach_notes, secondary_peptide
     FROM roc.protocol_lines WHERE client_id = $1 ORDER BY sort_order, created_at`,
    [clientId]
  )).rows

  if (!lines.length) {
    // No lines left — zero out billing so this person drops off MRR, but keep the
    // row (history). Revenue only counts billing_status='active' with rate > 0.
    await query(
      `UPDATE roc.client_protocols SET monthly_rate = 0 WHERE client_id = $1`,
      [clientId]
    )
    return
  }

  const total = lines.reduce((s, l) => s + Number(l.monthly_rate ?? 0), 0)
  const primary = lines[0]
  const secondaryFromLines = lines[1]?.peptide ?? primary.secondary_peptide ?? null

  await query(
    `INSERT INTO roc.client_protocols
       (client_id, peptide, protocol, dose_amount, dose_unit, frequency_days, coach_notes,
        assigned_at, sku_id, monthly_rate, billing_status, secondary_peptide, duration_weeks)
     VALUES ($1,$2,'custom',$3,$4,$5,$6,NOW(),$7,$8,'active',$9,$10)
     ON CONFLICT (client_id) DO UPDATE SET
       peptide        = EXCLUDED.peptide,
       dose_amount    = EXCLUDED.dose_amount,
       dose_unit      = EXCLUDED.dose_unit,
       frequency_days = EXCLUDED.frequency_days,
       coach_notes    = EXCLUDED.coach_notes,
       sku_id         = EXCLUDED.sku_id,
       monthly_rate   = EXCLUDED.monthly_rate,
       secondary_peptide = EXCLUDED.secondary_peptide,
       duration_weeks = EXCLUDED.duration_weeks,
       assigned_at    = COALESCE(roc.client_protocols.assigned_at, NOW())`,
    [
      clientId, primary.peptide, primary.dose_amount ?? "", primary.dose_unit ?? "mg",
      primary.frequency_days ?? "[]", primary.coach_notes ?? "", primary.sku_id ?? null,
      String(total), secondaryFromLines, primary.duration_weeks ?? null,
    ]
  )
}

// GET /api/admin/protocol-lines?clientId=...
export async function GET(req: NextRequest) {
  const clientId = new URL(req.url).searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ lines: [] })
  const result = await query(
    `SELECT id, client_id, peptide, sku_id, strength, strength_unit, dose_amount, dose_unit,
            frequency_days, duration_weeks, monthly_rate, coach_notes, secondary_peptide, sort_order, created_at
     FROM roc.protocol_lines WHERE client_id = $1 ORDER BY sort_order, created_at`,
    [clientId]
  )
  return NextResponse.json({ lines: result.rows })
}

// POST /api/admin/protocol-lines — append a saved protocol line for a client.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.clientId || !b.peptide) {
      return NextResponse.json({ ok: false, error: "clientId and peptide required" }, { status: 400 })
    }
    const next = (await query<{ n: string }>(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM roc.protocol_lines WHERE client_id = $1`, [b.clientId]
    )).rows[0]?.n ?? 0

    const res = await query<{ id: string }>(
      `INSERT INTO roc.protocol_lines
         (client_id, peptide, sku_id, strength, strength_unit, dose_amount, dose_unit,
          frequency_days, duration_weeks, monthly_rate, coach_notes, secondary_peptide, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13) RETURNING id`,
      [
        b.clientId, b.peptide, b.skuId ?? null,
        b.strength != null ? String(b.strength) : null, b.strengthUnit ?? null,
        b.doseAmount ?? "", b.doseUnit ?? "mg",
        JSON.stringify(b.frequencyDays ?? []), b.durationWeeks ?? null,
        b.monthlyRate != null ? String(b.monthlyRate) : null,
        b.coachNotes ?? null, b.secondaryPeptide ?? null, Number(next),
      ]
    )
    await syncPrimaryProtocol(b.clientId)
    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch (e) {
    console.error("[protocol-lines POST]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// DELETE /api/admin/protocol-lines?id=...&clientId=...
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const clientId = url.searchParams.get("clientId")
    if (!id || !clientId) return NextResponse.json({ ok: false, error: "id and clientId required" }, { status: 400 })
    await query(`DELETE FROM roc.protocol_lines WHERE id = $1 AND client_id = $2`, [id, clientId])
    await syncPrimaryProtocol(clientId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[protocol-lines DELETE]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
