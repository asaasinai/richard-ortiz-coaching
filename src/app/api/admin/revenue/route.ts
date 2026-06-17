import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Active client billing rows
    const clients = await query<{
      client_id: string; first_name: string; last_name: string; email: string
      peptide: string; dose_amount: string; dose_unit: string
      monthly_rate: string; billing_status: string; billing_notes: string | null
      assigned_at: string; sku_id: string | null
      strength: string | null; strength_unit: string | null
    }>(`
      SELECT
        cp.client_id, cp.peptide, cp.dose_amount, cp.dose_unit,
        cp.monthly_rate, cp.billing_status, cp.billing_notes,
        cp.assigned_at, cp.sku_id,
        s.strength, s.strength_unit,
        i.first_name, i.last_name, i.email
      FROM roc.client_protocols cp
      LEFT JOIN roc.inventory_skus s ON s.id = cp.sku_id
      LEFT JOIN roc.intakes i ON i.id = cp.client_id
      ORDER BY cp.billing_status, i.last_name
    `)

    const rows = clients.rows

    // MRR = sum of active monthly_rate
    const mrr = rows
      .filter(r => r.billing_status === "active")
      .reduce((sum, r) => sum + Number(r.monthly_rate ?? 0), 0)

    const arr = mrr * 12

    // By status
    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.billing_status] = (acc[r.billing_status] ?? 0) + 1
      return acc
    }, {})

    // FIFO COGS for active clients: oldest batch per SKU × monthly dose consumption
    const batchRows = await query<{ sku_id: string; unit_cost: string; qty_remaining: string }>(`
      SELECT DISTINCT ON (sku_id) sku_id, unit_cost, qty_remaining
      FROM roc.inventory_batches
      WHERE qty_remaining > 0
      ORDER BY sku_id, received_at ASC, created_at ASC
    `)
    const fifoCost = Object.fromEntries(batchRows.rows.map(b => [b.sku_id, Number(b.unit_cost)]))

    // Monthly COGS per client: dose_amount × (freq_days/month) × unit_cost
    // Simplified: dose_amount × 30 / interval_days × unit_cost
    const clientRows = rows.map(r => {
      const rate = Number(r.monthly_rate ?? 0)
      const cogs = r.sku_id && fifoCost[r.sku_id]
        ? Number(r.dose_amount ?? 0) * (30 / 7) * fifoCost[r.sku_id]
        : 0
      const margin = rate > 0 ? ((rate - cogs) / rate) * 100 : null
      return {
        client_id: r.client_id,
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.client_id,
        email: r.email ?? "",
        peptide: r.peptide,
        strength: r.strength ? `${r.strength}${r.strength_unit ?? "mg"}` : null,
        monthly_rate: rate,
        billing_status: r.billing_status,
        billing_notes: r.billing_notes,
        assigned_at: r.assigned_at,
        fifo_cogs: Math.round(cogs * 100) / 100,
        gross_margin_pct: margin !== null ? Math.round(margin * 10) / 10 : null,
      }
    })

    // Monthly revenue trend — group by month from assigned_at (active only)
    const trend = await query<{ month: string; revenue: string }>(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', assigned_at), 'YYYY-MM') AS month,
        SUM(monthly_rate) AS revenue
      FROM roc.client_protocols
      WHERE billing_status = 'active' AND monthly_rate > 0
      GROUP BY DATE_TRUNC('month', assigned_at)
      ORDER BY month DESC
      LIMIT 12
    `)

    return NextResponse.json({
      ok: true,
      mrr,
      arr,
      byStatus,
      activeCount: byStatus["active"] ?? 0,
      clients: clientRows,
      trend: trend.rows.reverse(),
    })
  } catch (err) {
    console.error("[revenue GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
