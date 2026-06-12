import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.ADMIN_PASSWORD ?? "12345"
  if (password !== correct) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/"
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("admin_auth")
  return res
}
