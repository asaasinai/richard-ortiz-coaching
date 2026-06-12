import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function DELETE(req: NextRequest) {
  try {
    const { email, confirmation } = await req.json()
    if (!email) return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 })
    if (confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json({ ok: false, error: "Confirmation text did not match." }, { status: 400 })
    }

    // Find client
    const found = await query("SELECT id FROM roc.intakes WHERE lower(email) = lower($1) LIMIT 1", [email])
    if (found.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 })
    }
    const clientId = (found.rows[0] as { id: string }).id

    // Delete in order: checkins, protocols, intake
    await query("DELETE FROM roc.checkins WHERE client_email = $1", [email])
    await query("DELETE FROM roc.client_protocols WHERE client_id = $1", [clientId])
    await query("DELETE FROM roc.intakes WHERE id = $1", [clientId])
    await query(
      "INSERT INTO roc.activity_log (action, details) VALUES ('account_deleted', $1)",
      [JSON.stringify({ email, clientId, deletedAt: new Date().toISOString() })]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[delete-account]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
