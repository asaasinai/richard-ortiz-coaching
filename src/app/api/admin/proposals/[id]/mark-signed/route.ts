import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// POST /api/admin/proposals/[id]/mark-signed
// Admin manually marks a proposal as signed (e.g. the client signed offline).
// Body: { signed_name?: string }. This is what moves the person from the
// Applicants list to Clients (is_client keys off proposals.signed_at).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await req.json().catch(() => ({})) as { signed_name?: string }
    const res = await query<{ status: string; first_name: string; last_name: string }>(
      `SELECT p.status, i.first_name, i.last_name
       FROM roc.proposals p LEFT JOIN roc.intakes i ON i.id = p.intake_id
       WHERE p.id = $1`,
      [id]
    )
    if (!res.rows.length) return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    if (res.rows[0].status === "signed") return NextResponse.json({ ok: true, alreadySigned: true })

    const name = body.signed_name?.trim()
      || `${res.rows[0].first_name ?? ""} ${res.rows[0].last_name ?? ""}`.trim()
      || "Client"

    await query(
      `UPDATE roc.proposals
       SET status = 'signed', signed_at = NOW(), signed_name = $1, signed_user_agent = 'admin-marked'
       WHERE id = $2`,
      [name, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal mark-signed]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
