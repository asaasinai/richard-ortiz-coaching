import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const data = await req.json()
  // TODO: persist to DB via Prisma
  // TODO: send confirmation email via SendGrid
  console.log("[intake]", JSON.stringify(data).slice(0, 200))
  return NextResponse.json({ ok: true })
}