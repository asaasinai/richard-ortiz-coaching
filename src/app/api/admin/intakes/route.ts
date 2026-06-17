import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const result = await query(
    "SELECT id, first_name, last_name, email, (data->>'phone') as phone, status, submitted_at, data FROM roc.intakes ORDER BY submitted_at DESC LIMIT 100"
  )
  return NextResponse.json({ intakes: result.rows })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  await query(
    "UPDATE roc.intakes SET status=$1, reviewed_at=NOW() WHERE id=$2",
    [status, id]
  )
  await query(
    "INSERT INTO roc.activity_log (action, details) VALUES ('intake_status_updated', $1)",
    [JSON.stringify({ id, status })]
  )
  return NextResponse.json({ ok: true })
}
