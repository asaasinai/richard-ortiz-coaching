import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// POST — receive a new inventory batch / lot (adds stock, creates a FIFO lot)
export async function POST(req: NextRequest) {
  try {
    const { sku_id, qty_received, unit_cost, supplier, ordered_at, received_at, notes, lot_identifier, received_by } = await req.json()
    if (!sku_id || !qty_received || !unit_cost) {
      return NextResponse.json({ ok: false, error: "sku_id, qty_received, unit_cost required" }, { status: 400 })
    }

    const recvDate = received_at ?? new Date().toISOString().slice(0, 10)
    // Auto-generate a lot identifier when none supplied: LOT-YYYYMMDD-XXXX
    const lot = (lot_identifier && String(lot_identifier).trim())
      || `LOT-${recvDate.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Insert batch / lot
    const result = await query<{ id: string }>(
      `INSERT INTO roc.inventory_batches (sku_id, qty_received, qty_remaining, unit_cost, supplier, ordered_at, received_at, notes, lot_identifier, received_by)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        sku_id, String(qty_received), String(unit_cost),
        supplier ?? null,
        ordered_at ?? null,
        recvDate,
        notes ?? null,
        lot,
        received_by ?? null,
      ]
    )

    // Update running stock total on SKU
    await query(
      `UPDATE roc.inventory_skus SET units_in_stock = units_in_stock + $1, updated_at = NOW() WHERE id = $2`,
      [String(qty_received), sku_id]
    )

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('inventory_batch_received', $1)`,
      [JSON.stringify({ sku_id, qty_received, unit_cost, supplier, lot_identifier: lot })]
    )

    return NextResponse.json({ ok: true, batchId: result.rows[0].id, lot_identifier: lot })
  } catch (err) {
    console.error("[inventory/batch POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
