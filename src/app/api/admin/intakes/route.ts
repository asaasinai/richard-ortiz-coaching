import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  // LEFT JOIN the assigned protocol so the client list can show who has an
  // active protocol vs. who is still just an intake.
  const result = await query(
    `SELECT i.id, i.first_name, i.last_name, i.email, (i.data->>'phone') as phone,
            i.status, i.submitted_at, i.data,
            cp.peptide        AS protocol_peptide,
            cp.billing_status AS protocol_billing_status,
            cp.monthly_rate   AS protocol_monthly_rate,
            (cp.client_id IS NOT NULL) AS has_protocol
     FROM roc.intakes i
     LEFT JOIN roc.client_protocols cp ON cp.client_id = i.id
     ORDER BY i.submitted_at DESC LIMIT 100`
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
