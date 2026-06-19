import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

const DEFAULT_TOS = `COACHING SERVICES AGREEMENT

This agreement is between Richard Ortiz Coaching ("Coach") and the client named above ("Client").

1. SERVICES
Coach will provide personalized peptide optimization coaching including protocol design using 
manufacturer peptide products, progress check-in review, and ongoing protocol adjustments based 
on Client's results.

2. PAYMENT
Client agrees to pay the monthly coaching fee listed in this agreement. Payment is due on 
the 1st of each month. Service continues month-to-month until either party cancels in writing.

3. CANCELLATION
Either party may cancel with 7 days written notice via email. No refunds for partial months 
already billed.

4. HEALTH DISCLAIMER
Coaching services are educational and informational in nature. They do not constitute medical 
advice, diagnosis, or treatment. Client should consult a licensed physician before beginning 
any peptide protocol. Richard Ortiz is not a licensed medical professional.

5. CLIENT RESPONSIBILITIES
Client agrees to: (a) follow the assigned protocol as instructed, (b) complete weekly 
check-ins honestly and on time, (c) notify Coach immediately of any adverse reactions, 
(d) disclose all relevant health conditions and medications, and (e) maintain communication 
for protocol adjustments.

6. PRODUCT SOURCE
All peptides are sourced exclusively from the manufacturer. Client acknowledges that peptide products 
are for research and personal optimization purposes.

7. CONFIDENTIALITY
Coach will keep all client health information confidential and will not share it with third 
parties without written consent, except as required by law.

8. LIMITATION OF LIABILITY
Coach's total liability is limited to the monthly coaching fee paid for the month in which 
any claim arises. Coach is not liable for outcomes resulting from Client's failure to follow 
the protocol, failure to disclose relevant health information, or misuse of products.

9. ENTIRE AGREEMENT
This agreement, together with the protocol summary above, constitutes the entire agreement 
between the parties and supersedes all prior discussions.`

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const result = await query(
    `SELECT id, status, created_at, sent_at, signed_at, signed_name, proposal_token,
            protocol_snapshot, tos_text
     FROM roc.proposals WHERE intake_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [id]
  )
  return NextResponse.json({ proposal: result.rows[0] ?? null })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const body = await req.json() as { tos_text?: string; proposal_id?: string }

    // Load protocol
    const protocolRes = await query(
      `SELECT cp.*, 
              s.peptide_name as sku_peptide, s.strength as sku_strength, s.strength_unit as sku_unit,
              s2.peptide_name as sku2_peptide, s2.strength as sku2_strength
       FROM roc.client_protocols cp
       LEFT JOIN roc.inventory_skus s ON s.id = cp.sku_id
       LEFT JOIN roc.inventory_skus s2 ON s2.id = cp.secondary_sku_id
       WHERE cp.client_id = $1`,
      [id]
    )
    if (!protocolRes.rows.length) {
      return NextResponse.json({ error: "No protocol found for this client" }, { status: 400 })
    }

    const intakeRes = await query(
      `SELECT first_name, last_name, email FROM roc.intakes WHERE id = $1`,
      [id]
    )
    if (!intakeRes.rows.length) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 })
    }

    const protocol = protocolRes.rows[0]
    const intake = intakeRes.rows[0] as { first_name: string; last_name: string; email: string }
    const tosText = body.tos_text ?? DEFAULT_TOS

    const protocolSnapshot = {
      ...protocol,
      client_first_name: intake.first_name,
      client_last_name: intake.last_name,
      client_email: intake.email,
    }

    // If updating existing proposal
    if (body.proposal_id) {
      await query(
        `UPDATE roc.proposals SET protocol_snapshot = $1, tos_text = $2 WHERE id = $3 AND status = 'draft'`,
        [JSON.stringify(protocolSnapshot), tosText, body.proposal_id]
      )
      return NextResponse.json({ ok: true, proposalId: body.proposal_id })
    }

    // Check for existing draft
    const existing = await query(
      `SELECT id, proposal_token FROM roc.proposals WHERE intake_id = $1 AND status = 'draft' ORDER BY created_at DESC LIMIT 1`,
      [id]
    )

    if (existing.rows.length) {
      const ex = existing.rows[0] as { id: string; proposal_token: string }
      await query(
        `UPDATE roc.proposals SET protocol_snapshot = $1, tos_text = $2 WHERE id = $3`,
        [JSON.stringify(protocolSnapshot), tosText, ex.id]
      )
      return NextResponse.json({
        ok: true,
        proposalId: ex.id,
        token: ex.proposal_token,
        previewUrl: `/proposal/${ex.proposal_token}`,
      })
    }

    // Create new
    const token = randomBytes(32).toString("hex")
    const insertRes = await query(
      `INSERT INTO roc.proposals (intake_id, protocol_snapshot, tos_text, status, proposal_token)
       VALUES ($1, $2, $3, 'draft', $4) RETURNING id`,
      [id, JSON.stringify(protocolSnapshot), tosText, token]
    )

    const proposalId = (insertRes.rows[0] as { id: string }).id
    return NextResponse.json({
      ok: true,
      proposalId,
      token,
      previewUrl: `/proposal/${token}`,
    })
  } catch (e) {
    console.error("[proposal POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
