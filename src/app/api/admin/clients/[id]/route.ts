import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { deleteClientPhotos } from "@/lib/photos"

export const dynamic = "force-dynamic"

// DELETE /api/admin/clients/[id] — fully remove a client (intake) and all
// related records. The "client" is the intake row in this schema.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const intake = await query<{ email: string }>(`SELECT email FROM roc.intakes WHERE id::text = $1::text`, [id])
    if (!intake.rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })
    const email = intake.rows[0].email

    // Remove dependents first (no hard FKs in roc schema; cast-safe).
    await query(`DELETE FROM roc.lot_transactions WHERE client_id::text = $1::text`, [id]).catch(() => {})
    await query(`DELETE FROM roc.ops_cards WHERE client_id::text = $1::text`, [id]).catch(() => {})
    await query(`DELETE FROM roc.proposals WHERE intake_id::text = $1::text`, [id]).catch(() => {})
    await query(`DELETE FROM roc.client_protocols WHERE client_id::text = $1::text`, [id]).catch(() => {})
    if (email) await query(`DELETE FROM roc.checkins WHERE lower(client_email) = lower($1)`, [email]).catch(() => {})
    if (email) await deleteClientPhotos(email).catch(() => {})
    await query(`DELETE FROM roc.notifications WHERE ref_id::text = $1::text`, [id]).catch(() => {})
    await query(`DELETE FROM roc.intakes WHERE id::text = $1::text`, [id])

    await query(`INSERT INTO roc.activity_log (action, details) VALUES ('client_deleted', $1)`, [JSON.stringify({ id, email })]).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
