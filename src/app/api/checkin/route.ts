import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const data = await req.json()
  // TODO: persist to DB, flag urgent if data.urgentFlag
  console.log("[checkin]", JSON.stringify(data).slice(0, 200))
  return NextResponse.json({ ok: true })
}