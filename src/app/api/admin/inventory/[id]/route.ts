import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET /api/admin/inventory/[id] — SKU + lot ledger + usage history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const skuRes = await query(`SELECT * FROM roc.inventory_skus WHERE id::text = $1::text`, [id])
    const sku = skuRes.rows[0]
    if (!sku) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })

    const lots = (await query(
      `SELECT id, lot_identifier, qty_received, qty_remaining, unit_cost, supplier,
              ordered_at, received_at, received_by, notes, created_at
       FROM roc.inventory_batches WHERE sku_id::text = $1::text
       ORDER BY received_at ASC NULLS LAST, created_at ASC`,
      [id]
    )).rows

    let usage: Record<string, unknown>[] = []
    try {
      usage = (await query(
        `SELECT lt.id, lt.qty_deducted, lt.transaction_type, lt.created_at, lt.ops_card_id, lt.client_id,
                b.lot_identifier, b.unit_cost, oc.client_name
         FROM roc.lot_transactions lt
         LEFT JOIN roc.inventory_batches b ON b.id::text = lt.lot_id::text
         LEFT JOIN roc.ops_cards oc ON oc.id::text = lt.ops_card_id::text
         WHERE lt.sku_id::text = $1::text
         ORDER BY lt.created_at DESC LIMIT 200`,
        [id]
      )).rows
    } catch { usage = [] }

    return NextResponse.json({ ok: true, sku, lots, usage })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
