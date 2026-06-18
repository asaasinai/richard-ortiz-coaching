import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const clientEmail = url.searchParams.get("clientEmail")
  const filterUrgent = url.searchParams.get("filter") === "urgent"

  let sql: string
  const params: string[] = []

  if (clientEmail && clientEmail !== "all") {
    sql = `SELECT ci.id, ci.submitted_at, ci.urgent_flag, ci.client_email, ci.data,
                  i.first_name, i.last_name, i.id as client_intake_id
           FROM roc.checkins ci
           LEFT JOIN roc.intakes i ON lower(i.email) = lower(ci.client_email)
           WHERE lower(ci.client_email) = lower($1)
           ORDER BY ci.submitted_at ASC LIMIT 500`
    params.push(clientEmail)
  } else {
    sql = `SELECT ci.id, ci.submitted_at, ci.urgent_flag, ci.client_email, ci.data,
                  i.first_name, i.last_name, i.id as client_intake_id
           FROM roc.checkins ci
           LEFT JOIN roc.intakes i ON lower(i.email) = lower(ci.client_email)
           ${filterUrgent ? "WHERE ci.urgent_flag = true" : ""}
           ORDER BY ci.submitted_at DESC LIMIT 200`
  }

  const result = await query(sql, params.length ? params : undefined)
  return NextResponse.json({ checkins: result.rows })
}
