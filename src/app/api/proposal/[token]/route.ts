import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  try {
    const result = await query(
      `SELECT p.id, p.status, p.protocol_snapshot, p.tos_text, p.created_at, p.sent_at,
              p.signed_at, p.signed_name, i.first_name, i.last_name, i.email
       FROM roc.proposals p
       LEFT JOIN roc.intakes i ON i.id = p.intake_id
       WHERE p.proposal_token = $1`,
      [token]
    )
    if (!result.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ proposal: result.rows[0] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
