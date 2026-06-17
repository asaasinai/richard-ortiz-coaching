import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// POST — receive a new inventory batch (adds stock, logs FIFO entry)
export async function POST(req: NextRequest) {
  try {
    const { sku_id, qty_received, unit_cost, supplier, ordered_at, received_at, notes } = await req.json()
    if (!sku_id || !qty_received || !unit_cost) {
      return NextResponse.json({ ok: false, error: "sku_id, qty_received, unit_cost required" }, { status: 400 })
    }

    // Insert batch
    const result = await query<{ id: string }>(
      `INSERT INTO roc.inventory_batches (sku_id, qty_received, qty_remaining, unit_cost, supplier, ordered_at, received_at, notes)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        sku_id, String(qty_received), String(unit_cost),
        supplier ?? null,
        ordered_at ?? null,
        received_at ?? new Date().toISOString().slice(0, 10),
        notes ?? null,
      ]
    )

    // Update running stock total on SKU
    await query(
      `UPDATE roc.inventory_skus SET units_in_stock = units_in_stock + $1, updated_at = NOW() WHERE id = $2`,
      [String(qty_received), sku_id]
    )

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('inventory_batch_received', $1)`,
      [JSON.stringify({ sku_id, qty_received, unit_cost, supplier })]
    )

    return NextResponse.json({ ok: true, batchId: result.rows[0].id })
  } catch (err) {
    console.error("[inventory/batch POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
