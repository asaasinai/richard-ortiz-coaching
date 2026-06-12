import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const result = await query(
    "SELECT id, submitted_at, urgent_flag, data FROM roc.checkins ORDER BY submitted_at DESC LIMIT 100"
  )
  return NextResponse.json({ checkins: result.rows })
}
