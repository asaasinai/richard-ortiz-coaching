import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// DELETE /api/admin/proposals/[id] — remove an old or duplicate proposal.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    await query(`DELETE FROM roc.proposals WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal delete]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
