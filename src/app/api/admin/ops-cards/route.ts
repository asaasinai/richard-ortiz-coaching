import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { previewFifo } from "@/lib/fifo"

export const dynamic = "force-dynamic"

export interface OpsLineItem {
  sku_id: string
  peptide: string
  strength?: string
  strength_unit?: string
  dosage?: string
  qty: number
  cost_per_unit?: number
  line_total?: number
  lot_ids?: string[]
}

// GET ?status=&search=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")?.trim()
    const client = url.searchParams.get("client")?.trim()

    const clauses: string[] = []
    const params: string[] = []
    if (client) { params.push(client); clauses.push(`client_id::text = $${params.length}::text`) }
    if (status && status !== "all") {
      if (status === "overdue") {
        clauses.push(`status IN ('pending','packed') AND due_date < CURRENT_DATE`)
      } else {
        params.push(status); clauses.push(`status = $${params.length}`)
      }
    }
    if (search) {
      params.push(`%${search}%`)
      clauses.push(`(client_name ILIKE $${params.length} OR client_email ILIKE $${params.length} OR line_items::text ILIKE $${params.length})`)
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""
    const rows = (await query(
      `SELECT id, client_id, client_email, client_name, protocol_id, status, line_items,
              total_cogs, tracking_number, notes, due_date, shipped_at, delivered_at, created_at
       FROM roc.ops_cards ${where}
       ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'packed' THEN 1 WHEN 'shipped' THEN 2 WHEN 'delivered' THEN 3 ELSE 4 END,
                due_date ASC NULLS LAST, created_at DESC`,
      params.length ? params : undefined
    )).rows
    return NextResponse.json({ ok: true, cards: rows })
  } catch (err) {
    // pre-migration / table absent
    return NextResponse.json({ ok: true, cards: [], note: String(err) })
  }
}

// POST — create card { client_id, client_email, client_name, protocol_id, line_items[], due_date, notes }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const items: OpsLineItem[] = Array.isArray(b.line_items) ? b.line_items : []

    // Cost each line by current FIFO cost; fall back to provided cost_per_unit.
    let total = 0
    for (const li of items) {
      let unit = Number(li.cost_per_unit) || 0
      if (!unit && li.sku_id) {
        const p = await previewFifo(String(li.sku_id), Number(li.qty) || 0)
        unit = p.allocations[0]?.unit_cost ?? 0
      }
      li.cost_per_unit = unit
      li.line_total = +(unit * (Number(li.qty) || 0)).toFixed(2)
      total += li.line_total
    }

    const res = await query<{ id: string }>(
      `INSERT INTO roc.ops_cards (client_id, client_email, client_name, protocol_id, status, line_items, total_cogs, notes, due_date)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8) RETURNING id`,
      [b.client_id ?? null, b.client_email ?? null, b.client_name ?? null, b.protocol_id ?? null,
       JSON.stringify(items), String(+total.toFixed(2)), b.notes ?? null, b.due_date ?? null]
    )
    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
