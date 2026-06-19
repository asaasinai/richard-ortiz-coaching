import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSetting } from "@/lib/settings"

export const dynamic = "force-dynamic"

// Gated by the auto_generate_ops_cards setting: when a protocol with a SKU is
// assigned and there's no open card for that client+sku, create a pending
// fulfillment card due on the configured billing_cycle_day. In-app only.
async function maybeAutoGenerateOpsCard(clientId: string, skuId: string | null | undefined, peptide: string) {
  try {
    if (!skuId) return
    if ((await getSetting("auto_generate_ops_cards")) !== "true") return

    const open = await query<{ n: string }>(
      `SELECT COUNT(*) n FROM roc.ops_cards
       WHERE client_id::text = $1::text AND status IN ('pending','packed') AND line_items::text ILIKE $2`,
      [clientId, `%"sku_id":"${skuId}"%`]
    )
    if (Number(open.rows[0]?.n ?? 0) > 0) return

    const c = await query<{ first_name: string; last_name: string; email: string }>(
      `SELECT first_name, last_name, email FROM roc.intakes WHERE id::text = $1::text`, [clientId])
    const cl = c.rows[0]
    const sku = (await query<{ peptide_name: string; strength: string; strength_unit: string; wholesale_cost: string | null }>(
      `SELECT peptide_name, strength, strength_unit, wholesale_cost FROM roc.inventory_skus WHERE id::text = $1::text`, [skuId])).rows[0]

    const billingDay = Math.min(Math.max(Number(await getSetting("billing_cycle_day")) || 1, 1), 28)
    const now = new Date()
    let due = new Date(now.getFullYear(), now.getMonth(), billingDay)
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, billingDay)

    const cost = Number(sku?.wholesale_cost ?? 0)
    const lineItems = [{
      sku_id: String(skuId), peptide: sku?.peptide_name ?? peptide, strength: sku?.strength, strength_unit: sku?.strength_unit,
      qty: 1, cost_per_unit: cost, line_total: cost,
    }]
    await query(
      `INSERT INTO roc.ops_cards (client_id, client_email, client_name, status, line_items, total_cogs, due_date)
       VALUES ($1,$2,$3,'pending',$4,$5,$6)`,
      [clientId, cl?.email ?? null, cl ? `${cl.first_name} ${cl.last_name}`.trim() : null,
       JSON.stringify(lineItems), String(cost), due.toISOString().slice(0, 10)]
    )
  } catch (e) {
    console.error("[auto-gen ops card]", e)  // never block protocol assignment
  }
}

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
    await maybeAutoGenerateOpsCard(clientId, skuId, peptide ?? "")
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
