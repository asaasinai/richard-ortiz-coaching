import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { resolveNotifications } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // LEFT JOIN the assigned protocol so the client list can show who has an
  // active protocol vs. who is still just an intake.
  const status = new URL(req.url).searchParams.get("status")
  const params: string[] = []
  let where = ""
  if (status && status !== "all") { params.push(status); where = `WHERE i.status = $1` }
  const result = await query(
    `SELECT i.id, i.first_name, i.last_name, i.email, (i.data->>'phone') as phone,
            i.status, i.submitted_at, i.data,
            cp.peptide        AS protocol_peptide,
            cp.billing_status AS protocol_billing_status,
            cp.monthly_rate   AS protocol_monthly_rate,
            (cp.client_id IS NOT NULL) AS has_protocol,
            -- A person becomes a client the moment the coach APPROVES them
            -- (or they sign a proposal). Approved/signed records leave the
            -- Applicants pipeline and show under Clients.
            (i.status = 'APPROVED'
             OR EXISTS (SELECT 1 FROM roc.proposals p WHERE p.intake_id = i.id AND p.signed_at IS NOT NULL)
            ) AS is_client
     FROM roc.intakes i
     LEFT JOIN roc.client_protocols cp ON cp.client_id = i.id
     ${where}
     ORDER BY i.submitted_at DESC LIMIT 100`,
    params.length ? params : undefined
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
  // Reviewed (approved/flagged) → clear the pending-intake notification
  if (status === "APPROVED" || status === "FLAGGED") await resolveNotifications("new_intake", id)
  return NextResponse.json({ ok: true })
}
