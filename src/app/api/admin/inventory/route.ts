import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET /api/admin/inventory — all SKUs with FIFO cost + burn rate
export async function GET(req: NextRequest) {
  // Support ?peptide=&strength= for single-SKU lookup (used by protocol form)
  const url = new URL(req.url)
  const peptideFilter = url.searchParams.get('peptide')
  const strengthFilter = url.searchParams.get('strength')
  if (peptideFilter && strengthFilter) {
    const result = await query(
      `SELECT id, peptide_name, strength, strength_unit, units_in_stock, notes, wholesale_cost, retail_price,
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
      units_in_stock: string; reorder_qty: string; reorder_point: string | null
      wholesale_cost: string | null; notes: string | null
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

    // Active client count + weekly VIAL consumption per SKU.
    // Converts dose (mcg->mg) and divides by vial strength so burn is in vials,
    // not raw dose units. IU/mL can't be vial-converted, so they fall back to
    // dose-per-vial as a rough proxy.
    const usage = await query<{ sku_id: string; active_clients: string; weekly_vials: string }>(`
      SELECT
        cp.sku_id,
        COUNT(*) AS active_clients,
        SUM(
          (CASE
             WHEN cp.frequency_days IS NOT NULL AND cp.frequency_days != '[]'
             THEN jsonb_array_length(cp.frequency_days::jsonb)::numeric
             ELSE 7
           END)
          * COALESCE(NULLIF(cp.dose_amount, '')::numeric, 0)
          * (CASE WHEN lower(cp.dose_unit) = 'mcg' THEN 0.001 ELSE 1 END)
          / NULLIF(s.strength::numeric, 0)
        ) AS weekly_vials
      FROM roc.client_protocols cp
      JOIN roc.inventory_skus s ON s.id = cp.sku_id
      WHERE cp.billing_status = 'active'
        AND cp.sku_id IS NOT NULL
      GROUP BY cp.sku_id
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
      const weeklyBurn = u ? Number(u.weekly_vials) : 0
      const stock = Number(sku.units_in_stock)
      const weeksOfStock = weeklyBurn > 0 ? stock / weeklyBurn : null
      // Auto reorder point: 5 weeks of stock (4 buffer + 1 lead)
      const reorderPoint = sku.reorder_point ? Number(sku.reorder_point) : weeklyBurn * 5

      // Out of stock is always critical. With an active burn rate, grade by
      // weeks of cover. Otherwise any positive stock is simply "in stock".
      let stockStatus: "ok" | "warning" | "critical" | "unknown" = "unknown"
      if (stock <= 0) {
        stockStatus = "critical"
      } else if (weeksOfStock !== null) {
        if (weeksOfStock < 2) stockStatus = "critical"
        else if (weeksOfStock < 5) stockStatus = "warning"
        else stockStatus = "ok"
      } else {
        stockStatus = "ok"
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
    const { id, reorder_qty, notes, units_in_stock, reorder_point, retail_price, wholesale_cost } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
    await query(
      `UPDATE roc.inventory_skus SET
        reorder_qty = COALESCE($1, reorder_qty),
        notes = COALESCE($2, notes),
        units_in_stock = COALESCE($3, units_in_stock),
        reorder_point = COALESCE($4, reorder_point),
        retail_price = COALESCE($5, retail_price),
        wholesale_cost = COALESCE($6, wholesale_cost),
        updated_at = NOW()
       WHERE id = $7`,
      [reorder_qty != null ? String(reorder_qty) : null, notes ?? null, units_in_stock != null ? String(units_in_stock) : null, reorder_point != null ? String(reorder_point) : null, retail_price != null ? String(retail_price) : null, wholesale_cost != null ? String(wholesale_cost) : null, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
