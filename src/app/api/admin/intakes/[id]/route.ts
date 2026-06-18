import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const [intakeRes, protocolRes, proposalsRes] = await Promise.all([
      query(
        `SELECT id, first_name, last_name, email, (data->>'phone') as phone,
                status, submitted_at, data, ai_recommendation, ai_rec_generated_at
         FROM roc.intakes WHERE id = $1`,
        [id]
      ),
      query(
        `SELECT peptide, dose_amount, dose_unit, frequency_days, coach_notes,
                assigned_at, sku_id, monthly_rate, billing_status, billing_notes,
                protocol_start_date, followup_sent, secondary_peptide, secondary_sku_id,
                duration_weeks, internal_notes
         FROM roc.client_protocols WHERE client_id = $1`,
        [id]
      ),
      query(
        `SELECT id, status, created_at, sent_at, signed_at, signed_name, proposal_token
         FROM roc.proposals WHERE intake_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [id]
      ),
    ])

    if (!intakeRes.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      intake: intakeRes.rows[0],
      protocol: protocolRes.rows[0] ?? null,
      proposals: proposalsRes.rows,
    })
  } catch (e) {
    console.error("[GET /api/admin/intakes/[id]]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
