import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomBytes } from "crypto"
import { getSetting } from "@/lib/settings"
import { DEFAULT_TOS } from "@/lib/email-templates"

export const dynamic = "force-dynamic"

interface Line {
  sku_id?: string | null
  peptide: string
  strength?: string | number | null
  strength_unit?: string | null
  dose_amount?: string | null
  dose_unit?: string | null
  frequency?: string | null
  duration_weeks?: number | null
  rate?: number | null
  coach_notes?: string | null
}

// POST /api/admin/quick-proposal
// Coach-built proposal from scratch: matches/creates the client record, saves
// the protocol lines, and returns a textable /proposal/<token> link. When the
// client signs, the existing sign route notifies the coach.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      first_name?: string; last_name?: string; email?: string
      lines?: Line[]; tos_text?: string
    }
    const first_name = (body.first_name ?? "").trim()
    const last_name = (body.last_name ?? "").trim()
    const email = (body.email ?? "").trim()
    const lines = (body.lines ?? []).filter(l => l && l.peptide)

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid client email required" }, { status: 400 })
    }
    if (!lines.length) {
      return NextResponse.json({ ok: false, error: "Add at least one protocol line" }, { status: 400 })
    }

    // 1) Match an existing client record by email, else create a lead intake so
    //    the proposal has an intake_id and the person shows in Applicants → Clients.
    const existing = await query<{ id: string }>(
      `SELECT id FROM roc.intakes WHERE lower(email) = lower($1) ORDER BY submitted_at DESC LIMIT 1`,
      [email],
    ).catch(() => ({ rows: [] as { id: string }[] }))

    let clientId: string
    if (existing.rows[0]) {
      clientId = existing.rows[0].id
      // keep the name fresh if the coach typed one
      if (first_name || last_name) {
        await query(
          `UPDATE roc.intakes SET first_name = COALESCE(NULLIF($2,''), first_name),
                                  last_name  = COALESCE(NULLIF($3,''), last_name)
           WHERE id = $1`,
          [clientId, first_name, last_name],
        )
      }
    } else {
      const ins = await query<{ id: string }>(
        `INSERT INTO roc.intakes (data, email, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id`,
        [JSON.stringify({ first_name, last_name, email, source: "quick_proposal" }), email, first_name, last_name],
      )
      clientId = ins.rows[0].id
    }

    // 2) Replace protocol lines for this client with the freshly built set.
    await query(`DELETE FROM roc.protocol_lines WHERE client_id = $1`, [clientId]).catch(() => {})
    let sortOrder = 0
    for (const l of lines) {
      await query(
        `INSERT INTO roc.protocol_lines
           (client_id, peptide, sku_id, strength, strength_unit, dose_amount, dose_unit,
            frequency_days, duration_weeks, monthly_rate, coach_notes, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          clientId, l.peptide, l.sku_id || null,
          l.strength != null && l.strength !== "" ? Number(l.strength) : null,
          l.strength_unit || null, l.dose_amount || null, l.dose_unit || null,
          JSON.stringify(l.frequency ? [l.frequency] : []),
          l.duration_weeks != null ? Number(l.duration_weeks) : null,
          l.rate != null ? Number(l.rate) : 0,
          l.coach_notes || null, sortOrder++,
        ],
      )
    }

    const totalRate = lines.reduce((s, l) => s + Number(l.rate ?? 0), 0)
    const primary = lines[0]

    // 3) Keep the aggregate client_protocols row in sync (drives Revenue/Ops + the
    //    "Active" client badge). PK is client_id, so upsert on conflict.
    await query(
      `INSERT INTO roc.client_protocols
         (client_id, peptide, protocol, coach_notes, dose_amount, dose_unit, frequency_days,
          sku_id, monthly_rate, billing_status, duration_weeks)
       VALUES ($1,$2,'Custom',$3,$4,$5,$6,$7,$8,'active',$9)
       ON CONFLICT (client_id) DO UPDATE SET
         peptide = EXCLUDED.peptide, coach_notes = EXCLUDED.coach_notes,
         dose_amount = EXCLUDED.dose_amount, dose_unit = EXCLUDED.dose_unit,
         frequency_days = EXCLUDED.frequency_days, sku_id = EXCLUDED.sku_id,
         monthly_rate = EXCLUDED.monthly_rate, billing_status = 'active',
         duration_weeks = EXCLUDED.duration_weeks`,
      [
        clientId, primary.peptide, primary.coach_notes || "",
        primary.dose_amount || "", primary.dose_unit || "mg",
        JSON.stringify(primary.frequency ? [primary.frequency] : []),
        primary.sku_id || null,
        totalRate, primary.duration_weeks != null ? Number(primary.duration_weeks) : null,
      ],
    ).catch(e => console.error("[quick-proposal] client_protocols sync", e))

    // 4) Build the proposal snapshot in the shape the public proposal page renders.
    const snapshot = {
      lines: lines.map(l => ({
        peptide: l.peptide,
        strength: l.strength ?? null,
        strength_unit: l.strength_unit ?? "mg",
        dose_amount: l.dose_amount ?? "",
        dose_unit: l.dose_unit ?? "",
        frequency_days: l.frequency ?? "",
        duration_weeks: l.duration_weeks ?? null,
        monthly_rate: l.rate ?? 0,
        coach_notes: l.coach_notes ?? "",
      })),
      total_monthly: totalRate,
      monthly_rate: totalRate,
      client_first_name: first_name,
      client_last_name: last_name,
      client_email: email,
    }

    const tosText = body.tos_text && body.tos_text.trim().length >= 50
      ? body.tos_text
      : (await getSetting("tos_text")) || DEFAULT_TOS

    // 5) Create the proposal (status 'sent' — the coach is texting the link directly).
    const token = randomBytes(32).toString("hex")
    const propIns = await query<{ id: string }>(
      `INSERT INTO roc.proposals (intake_id, protocol_snapshot, tos_text, status, proposal_token, sent_at)
       VALUES ($1, $2, $3, 'sent', $4, NOW()) RETURNING id`,
      [clientId, JSON.stringify(snapshot), tosText, token],
    )

    return NextResponse.json({ ok: true, id: propIns.rows[0]?.id, token, url: `/proposal/${token}` })
  } catch (err) {
    console.error("[quick-proposal]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
