import { query } from "@/lib/db"

export interface Allocation {
  lot_id: string
  lot_identifier: string | null
  qty: number
  unit_cost: number
  line_cost: number
}
export interface FifoResult {
  sku_id: string
  requested: number
  available: number
  sufficient: boolean
  allocations: Allocation[]
  total_cost: number
}

interface BatchRow {
  id: string
  lot_identifier: string | null
  qty_remaining: string
  unit_cost: string
  received_at: string | null
  created_at: string
}

// Compute the FIFO allocation plan for `qty` units of a SKU — oldest lot first.
// Does NOT write. Used for the deduction-preview UI and as the basis for commit.
export async function previewFifo(skuId: string, qty: number): Promise<FifoResult> {
  const batches = await query<BatchRow>(
    `SELECT id, lot_identifier, qty_remaining, unit_cost, received_at, created_at
     FROM roc.inventory_batches
     WHERE sku_id::text = $1::text AND qty_remaining > 0
     ORDER BY received_at ASC NULLS LAST, created_at ASC`,
    [skuId]
  )

  const allocations: Allocation[] = []
  let need = qty
  let available = 0
  for (const b of batches.rows) {
    const rem = Number(b.qty_remaining)
    available += rem
    if (need <= 0) continue
    const take = Math.min(need, rem)
    const unit = Number(b.unit_cost) || 0
    allocations.push({ lot_id: b.id, lot_identifier: b.lot_identifier, qty: take, unit_cost: unit, line_cost: +(take * unit).toFixed(2) })
    need -= take
  }
  const total = +allocations.reduce((s, a) => s + a.line_cost, 0).toFixed(2)
  return { sku_id: skuId, requested: qty, available, sufficient: need <= 0, allocations, total_cost: total }
}

// Commit a FIFO deduction: decrement batch qty_remaining + SKU stock, log
// lot_transactions. Throws if insufficient stock (caller should block the
// status advance). NOTE: Neon HTTP has no cross-call txn; availability is
// checked first and this tool is single-admin, so partial-write risk is minimal.
export async function commitFifo(
  skuId: string,
  qty: number,
  ctx: { opsCardId?: string | null; clientId?: string | null; transactionType?: "fulfillment" | "adjustment" | "return" }
): Promise<FifoResult> {
  const plan = await previewFifo(skuId, qty)
  if (!plan.sufficient) {
    throw new Error(`Insufficient inventory: need ${qty}, have ${plan.available}`)
  }
  const type = ctx.transactionType ?? "fulfillment"
  for (const a of plan.allocations) {
    await query(`UPDATE roc.inventory_batches SET qty_remaining = qty_remaining - $1 WHERE id::text = $2::text`, [String(a.qty), a.lot_id])
    await query(
      `INSERT INTO roc.lot_transactions (lot_id, sku_id, ops_card_id, client_id, qty_deducted, transaction_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [a.lot_id, skuId, ctx.opsCardId ?? null, ctx.clientId ?? null, String(a.qty), type]
    )
  }
  await query(`UPDATE roc.inventory_skus SET units_in_stock = GREATEST(0, units_in_stock - $1), updated_at = NOW() WHERE id::text = $2::text`, [String(qty), skuId])
  return plan
}
