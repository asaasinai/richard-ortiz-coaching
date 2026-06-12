import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()
  // TODO: send email via SendGrid to admin
  console.log("[contact]", name, email, message.slice(0, 100))
  return NextResponse.json({ ok: true })
}