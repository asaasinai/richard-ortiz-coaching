import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const clientEmail = new URL(req.url).searchParams.get("clientEmail")
  let sql = "SELECT id, submitted_at, urgent_flag, client_email, data FROM roc.checkins"
  const params: string[] = []
  if (clientEmail) {
    sql += " WHERE lower(client_email) = lower($1)"
    params.push(clientEmail)
  }
  sql += " ORDER BY submitted_at ASC LIMIT 500"
  const result = await query(sql, params.length ? params : undefined)
  return NextResponse.json({ checkins: result.rows })
}
