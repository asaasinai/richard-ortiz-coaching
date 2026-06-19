import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { previewFifo, commitFifo, type FifoResult } from "@/lib/fifo"
import { resolveNotifications } from "@/lib/notifications"
import type { OpsLineItem } from "../route"

export const dynamic = "force-dynamic"

const NEXT: Record<string, string> = { pending: "packed", packed: "shipped", shipped: "delivered" }

interface CardRow {
  id: string; status: string; line_items: OpsLineItem[]; client_id: string | null
  total_cogs: string; tracking_number: string | null; notes: string | null
}

async function getCard(id: string): Promise<CardRow | null> {
  const r = await query<CardRow>(`SELECT * FROM roc.ops_cards WHERE id = $1`, [id])
  return r.rows[0] ?? null
}

// GET — card + FIFO deduction preview for each line item
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const card = await getCard(id)
    if (!card) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })
    const previews: Record<string, FifoResult> = {}
    for (const li of card.line_items ?? []) {
      if (li.sku_id) previews[li.sku_id] = await previewFifo(String(li.sku_id), Number(li.qty) || 0)
    }
    return NextResponse.json({ ok: true, card, previews })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// PATCH — { action: "advance" | "update" | "cancel", tracking_number?, notes? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const b = await req.json()
    const action = b.action as string
    const card = await getCard(id)
    if (!card) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })

    if (action === "update") {
      await query(`UPDATE roc.ops_cards SET tracking_number = COALESCE($1, tracking_number), notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3`,
        [b.tracking_number ?? null, b.notes ?? null, id])
      return NextResponse.json({ ok: true })
    }

    if (action === "cancel") {
      await query(`UPDATE roc.ops_cards SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id])
      await resolveNotifications("ops_overdue", id)
      return NextResponse.json({ ok: true })
    }

    // advance = move to the next stage; set_status = jump directly to any stage
    if (action === "advance" || action === "set_status") {
      const target = action === "advance" ? NEXT[card.status] : (b.status as string)
      if (!target || !["pending", "packed", "shipped", "delivered", "cancelled"].includes(target)) {
        return NextResponse.json({ ok: false, error: `invalid target status` }, { status: 400 })
      }

      // FIFO deduction happens the first time a card reaches "packed" (only if
      // it hasn't already deducted). Best-effort: deduct what's available, never
      // block the status change — short stock is surfaced as a warning.
      const alreadyPacked = (card.line_items ?? []).some(li => (li.lot_ids?.length ?? 0) > 0)
      const warnings: string[] = []
      if (target === "packed" && card.status === "pending" && !alreadyPacked) {
        let total = 0
        const items = card.line_items ?? []
        for (const li of items) {
          if (!li.sku_id) continue
          const p = await previewFifo(String(li.sku_id), Number(li.qty) || 0)
          if (!p.sufficient) warnings.push(`${li.peptide}: only ${p.available} of ${li.qty} in stock`)
          // deduct whatever is available (qty capped to available)
          const take = Math.min(Number(li.qty) || 0, p.available)
          if (take > 0) {
            const res = await commitFifo(String(li.sku_id), take, { opsCardId: id, clientId: card.client_id })
            li.lot_ids = res.allocations.map(a => a.lot_id)
            li.cost_per_unit = res.allocations[0]?.unit_cost ?? li.cost_per_unit
            li.line_total = res.total_cost
            total += res.total_cost
          }
        }
        await query(`UPDATE roc.ops_cards SET status = 'packed', line_items = $1, total_cogs = $2, updated_at = NOW() WHERE id = $3`,
          [JSON.stringify(items), String(+total.toFixed(2)), id])
        return NextResponse.json({ ok: true, status: "packed", warnings })
      }

      // All other transitions are pure status changes (incl. manual Mark Delivered)
      const setShipped = target === "shipped" ? ", shipped_at = COALESCE(shipped_at, NOW())" : ""
      const setDelivered = target === "delivered" ? ", delivered_at = COALESCE(delivered_at, NOW())" : ""
      await query(
        `UPDATE roc.ops_cards SET status = $1, tracking_number = COALESCE($2, tracking_number)${setShipped}${setDelivered}, updated_at = NOW() WHERE id = $3`,
        [target, b.tracking_number ?? null, id])
      if (target === "delivered") await resolveNotifications("ops_overdue", id)
      return NextResponse.json({ ok: true, status: target })
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
