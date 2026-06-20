import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// POST /api/admin/inventory/pricing
// Bulk-set retail price (and optionally wholesale cost) across many SKUs at once.
// Body: { updates: [{ id, retail_price?, wholesale_cost? }] }
// A null value clears the field; undefined leaves it unchanged.
export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json() as {
      updates: { id: string; retail_price?: number | string | null; wholesale_cost?: number | string | null }[]
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ ok: false, error: "updates array required" }, { status: 400 })
    }

    const norm = (v: number | string | null | undefined) =>
      v === undefined ? null : v === null || v === "" ? null : String(v)

    let saved = 0
    for (const u of updates) {
      if (!u.id) continue
      // Only touch columns the caller actually sent so we never clobber an
      // unrelated field. retail/wholesale are independently optional.
      if (u.retail_price === undefined && u.wholesale_cost === undefined) continue
      await query(
        `UPDATE roc.inventory_skus SET
           retail_price   = CASE WHEN $2 THEN $3::numeric ELSE retail_price END,
           wholesale_cost = CASE WHEN $4 THEN $5::numeric ELSE wholesale_cost END,
           updated_at = NOW()
         WHERE id = $1`,
        [
          u.id,
          u.retail_price !== undefined, norm(u.retail_price),
          u.wholesale_cost !== undefined, norm(u.wholesale_cost),
        ]
      )
      saved++
    }
    return NextResponse.json({ ok: true, saved })
  } catch (err) {
    console.error("[inventory pricing POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
