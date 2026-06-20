import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Active client billing rows
    const clients = await query<{
      client_id: string; first_name: string; last_name: string; email: string
      peptide: string; dose_amount: string; dose_unit: string; frequency_days: string | null
      monthly_rate: string; billing_status: string; billing_notes: string | null
      assigned_at: string; sku_id: string | null
      strength: string | null; strength_unit: string | null
    }>(`
      SELECT
        cp.client_id, cp.peptide, cp.dose_amount, cp.dose_unit, cp.frequency_days,
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

    // Monthly COGS per client = vials consumed per month × FIFO vial cost.
    //   monthly_vials = (doses/week × dose_per_dose) / vial_strength × 4.333 weeks
    // Dose and strength are unit-normalized to mg so mcg doses don't blow up the math.
    const toMg = (v: number, unit: string | null | undefined) => unit === "mcg" ? v / 1000 : v
    const clientRows = rows.map(r => {
      const rate = Number(r.monthly_rate ?? 0)
      let cogs = 0
      if (r.sku_id && fifoCost[r.sku_id]) {
        let dosesPerWeek = 0
        try { const f = JSON.parse(r.frequency_days || "[]"); dosesPerWeek = Array.isArray(f) ? f.length : 0 } catch { dosesPerWeek = 0 }
        if (!dosesPerWeek) dosesPerWeek = 3 // sane default when frequency unset
        const doseMg = toMg(Number(r.dose_amount ?? 0), r.dose_unit)
        const vialMg = toMg(Number(r.strength ?? 0), r.strength_unit)
        if (vialMg > 0 && doseMg > 0) {
          const monthlyVials = (dosesPerWeek * doseMg * 4.333) / vialMg
          cogs = monthlyVials * fifoCost[r.sku_id]
        }
      }
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

    // Orders this month per client (FIFO fulfillment volume) — degrade-safe
    let ordersByClient: Record<string, number> = {}
    try {
      const o = await query<{ client_id: string; n: string }>(`
        SELECT client_id, COUNT(*) n FROM roc.ops_cards
        WHERE created_at >= DATE_TRUNC('month', NOW()) AND status != 'cancelled'
        GROUP BY client_id`)
      ordersByClient = Object.fromEntries(o.rows.map(r => [String(r.client_id), Number(r.n)]))
    } catch { ordersByClient = {} }
    for (const c of clientRows) (c as Record<string, unknown>).orders_this_month = ordersByClient[String(c.client_id)] ?? 0

    // Revenue by protocol — avg gross margin % per peptide (active billing)
    const protoAgg: Record<string, { marginSum: number; cnt: number; mrr: number }> = {}
    for (const c of clientRows) {
      if (c.billing_status !== "active" || c.gross_margin_pct === null) continue
      const k = c.peptide || "—"
      if (!protoAgg[k]) protoAgg[k] = { marginSum: 0, cnt: 0, mrr: 0 }
      protoAgg[k].marginSum += c.gross_margin_pct
      protoAgg[k].cnt += 1
      protoAgg[k].mrr += c.monthly_rate
    }
    const byProtocol = Object.entries(protoAgg)
      .map(([peptide, v]) => ({ peptide, avg_margin: Math.round((v.marginSum / v.cnt) * 10) / 10, clients: v.cnt, mrr: Math.round(v.mrr * 100) / 100 }))
      .sort((a, b) => b.avg_margin - a.avg_margin)

    const avgMargin = clientRows.filter(c => c.billing_status === "active" && c.gross_margin_pct !== null)
      .reduce((s, c, _i, arr) => s + (c.gross_margin_pct as number) / arr.length, 0)

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
      avgMargin: Math.round(avgMargin * 10) / 10,
      clients: clientRows,
      byProtocol,
      trend: trend.rows.reverse(),
    })
  } catch (err) {
    console.error("[revenue GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
