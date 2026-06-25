import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// POST /api/admin/proposals/[id]/mark-paid   body: { paid?: boolean }
// Marks a signed proposal as paid (default) or clears the paid flag. Paid
// proposals count as collected revenue (see /api/admin/revenue + overview).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    let paid = true
    try { const b = await req.json(); if (b && typeof b.paid === "boolean") paid = b.paid } catch { /* default true */ }
    await query(
      paid
        ? `UPDATE roc.proposals SET paid_at = NOW() WHERE id = $1`
        : `UPDATE roc.proposals SET paid_at = NULL WHERE id = $1`,
      [id],
    )
    return NextResponse.json({ ok: true, paid })
  } catch (e) {
    console.error("[proposal mark-paid]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
