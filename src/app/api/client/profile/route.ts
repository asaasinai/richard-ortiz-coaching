import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ client: null })

  const [intakeRes, protocolRes, checkinRes] = await Promise.all([
    query(
      "SELECT id, first_name, last_name, email, status, data FROM roc.intakes WHERE lower(email) = lower($1) LIMIT 1",
      [email]
    ),
    query(
      `SELECT cp.peptide, cp.protocol, cp.coach_notes, cp.assigned_at
       FROM roc.client_protocols cp
       JOIN roc.intakes i ON i.id = cp.client_id
       WHERE lower(i.email) = lower($1)`,
      [email]
    ),
    query(
      `SELECT id, submitted_at, urgent_flag, data
       FROM roc.checkins
       WHERE client_email = $1
       ORDER BY submitted_at ASC`,
      [email]
    ),
  ])

  if (intakeRes.rows.length === 0) return NextResponse.json({ client: null })

  return NextResponse.json({
    client: intakeRes.rows[0],
    protocol: protocolRes.rows[0] ?? null,
    checkins: checkinRes.rows,
  })
}
