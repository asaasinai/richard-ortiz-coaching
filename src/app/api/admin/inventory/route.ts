import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/admin/inventory — all SKUs with FIFO cost + burn rate
export async function GET(req: NextRequest) {
  // Support ?peptide=&strength= for single-SKU lookup (used by protocol form)
  const url = new URL(req.url)
  const peptideFilter = url.searchParams.get('peptide')
  const strengthFilter = url.searchParams.get('strength')
  if (peptideFilter && strengthFilter) {
    const result = await query(
      `SELECT id, peptide_name, strength, strength_unit, units_in_stock, notes,
              (SELECT unit_cost FROM roc.inventory_batches WHERE sku_id = s.id AND qty_remaining > 0 ORDER BY received_at ASC LIMIT 1) as fifo_cost
       FROM roc.inventory_skus s
       WHERE peptide_name = $1 AND strength = $2::numeric`,
      [peptideFilter, strengthFilter]
    )
    return NextResponse.json({ ok: true, skus: result.rows })
  }
  try {
    // SKUs with stock summary
    const skus = await query<{
      id: string; peptide_name: string; strength: string; strength_unit: string
      units_in_stock: string; reorder_qty: string; reorder_point: string | null; notes: string | null
    }>(`SELECT * FROM roc.inventory_skus ORDER BY peptide_name, strength`)

    // Oldest unexhausted batch per SKU (FIFO current cost)
    const batches = await query<{
      sku_id: string; unit_cost: string; qty_remaining: string
      supplier: string | null; received_at: string | null
    }>(`SELECT DISTINCT ON (sku_id) sku_id, unit_cost, qty_remaining, supplier, received_at
        FROM roc.inventory_batches
        WHERE qty_remaining > 0
        ORDER BY sku_id, received_at ASC, created_at ASC`)

    // All batches per SKU for detail view
    const allBatches = await query<{
      id: string; sku_id: string; qty_received: string; qty_remaining: string
      unit_cost: string; supplier: string | null; ordered_at: string | null
      received_at: string | null; notes: string | null; created_at: string
    }>(`SELECT * FROM roc.inventory_batches ORDER BY sku_id, received_at ASC, created_at ASC`)

    // Active client count + weekly consumption per SKU
    const usage = await query<{ sku_id: string; active_clients: string; weekly_units: string }>(`
      SELECT
        sku_id,
        COUNT(*) AS active_clients,
        SUM(dose_amount::numeric *
          CASE
            WHEN frequency_days IS NOT NULL AND frequency_days != '[]'
            THEN jsonb_array_length(frequency_days::jsonb)::numeric / 7.0
            ELSE 1.0
          END
        ) AS weekly_units
      FROM roc.client_protocols
      WHERE billing_status = 'active'
        AND sku_id IS NOT NULL
      GROUP BY sku_id
    `)

    const batchMap = Object.fromEntries(batches.rows.map(b => [b.sku_id, b]))
    const usageMap = Object.fromEntries(usage.rows.map(u => [u.sku_id, u]))
    const allBatchMap: Record<string, typeof allBatches.rows> = {}
    for (const b of allBatches.rows) {
      if (!allBatchMap[b.sku_id]) allBatchMap[b.sku_id] = []
      allBatchMap[b.sku_id].push(b)
    }

    const result = skus.rows.map(sku => {
      const fifo = batchMap[sku.id]
      const u = usageMap[sku.id]
      const weeklyBurn = u ? Number(u.weekly_units) : 0
      const stock = Number(sku.units_in_stock)
      const weeksOfStock = weeklyBurn > 0 ? stock / weeklyBurn : null
      // Auto reorder point: 5 weeks of stock (4 buffer + 1 lead)
      const reorderPoint = sku.reorder_point ? Number(sku.reorder_point) : weeklyBurn * 5

      let stockStatus: "ok" | "warning" | "critical" | "unknown" = "unknown"
      if (weeksOfStock !== null) {
        if (weeksOfStock < 2) stockStatus = "critical"
        else if (weeksOfStock < 5) stockStatus = "warning"
        else stockStatus = "ok"
      }

      return {
        ...sku,
        fifo_cost: fifo ? Number(fifo.unit_cost) : null,
        fifo_supplier: fifo?.supplier ?? null,
        fifo_received_at: fifo?.received_at ?? null,
        weekly_burn: weeklyBurn,
        active_clients: u ? Number(u.active_clients) : 0,
        weeks_of_stock: weeksOfStock,
        reorder_point: reorderPoint,
        stock_status: stockStatus,
        batches: allBatchMap[sku.id] ?? [],
      }
    })

    return NextResponse.json({ ok: true, skus: result })
  } catch (err) {
    console.error("[inventory GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// POST — create new SKU
export async function POST(req: NextRequest) {
  try {
    const { peptide_name, strength, strength_unit, reorder_qty, notes } = await req.json()
    if (!peptide_name || !strength) {
      return NextResponse.json({ ok: false, error: "peptide_name and strength required" }, { status: 400 })
    }
    const result = await query<{ id: string }>(
      `INSERT INTO roc.inventory_skus (peptide_name, strength, strength_unit, reorder_qty, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [peptide_name, String(strength), strength_unit ?? "mg", String(reorder_qty ?? 10), notes ?? ""]
    )
    return NextResponse.json({ ok: true, id: result.rows[0].id })
  } catch (err) {
    console.error("[inventory POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// PATCH — update SKU fields
export async function PATCH(req: NextRequest) {
  try {
    const { id, reorder_qty, notes, units_in_stock } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
    await query(
      `UPDATE roc.inventory_skus SET
        reorder_qty = COALESCE($1, reorder_qty),
        notes = COALESCE($2, notes),
        units_in_stock = COALESCE($3, units_in_stock),
        updated_at = NOW()
       WHERE id = $4`,
      [reorder_qty != null ? String(reorder_qty) : null, notes ?? null, units_in_stock != null ? String(units_in_stock) : null, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
