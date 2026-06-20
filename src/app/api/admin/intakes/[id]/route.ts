import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

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

// PATCH /api/admin/intakes/[id] — admin edits an applicant/client's details.
// Body: { first_name?, last_name?, email?, data?: { <scalar fields to merge> } }
// `data` is shallow-merged into the existing JSONB so we never drop fields the
// editor didn't touch (e.g. rawAnswers). first_name/last_name/email are also
// mirrored into data so the two stay consistent.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const body = await req.json() as {
      first_name?: string; last_name?: string; email?: string
      data?: Record<string, string | number | null>
    }

    // Build the JSONB merge payload: any data fields sent, plus mirrored contact.
    const merge: Record<string, string | number | null> = { ...(body.data ?? {}) }
    if (body.first_name !== undefined) merge.firstName = body.first_name
    if (body.last_name !== undefined) merge.lastName = body.last_name
    if (body.email !== undefined) merge.email = body.email

    await query(
      `UPDATE roc.intakes SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         email      = COALESCE($3, email),
         data       = COALESCE(data, '{}'::jsonb) || $4::jsonb
       WHERE id = $5`,
      [
        body.first_name ?? null,
        body.last_name ?? null,
        body.email ?? null,
        JSON.stringify(merge),
        id,
      ]
    )

    await query(
      "INSERT INTO roc.activity_log (action, details) VALUES ('intake_edited', $1)",
      [JSON.stringify({ id, fields: Object.keys({ ...(body.data ?? {}), ...(body.first_name !== undefined ? { first_name: 1 } : {}), ...(body.last_name !== undefined ? { last_name: 1 } : {}), ...(body.email !== undefined ? { email: 1 } : {}) }) })]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/admin/intakes/[id]]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
