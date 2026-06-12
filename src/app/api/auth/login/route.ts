import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password required." }, { status: 400 })
    }

    const result = await query<{
      id: string; first_name: string; last_name: string; status: string; password_hash: string | null
    }>(
      "SELECT id, first_name, last_name, status, password_hash FROM roc.intakes WHERE lower(email) = lower($1) LIMIT 1",
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "No account found with that email." })
    }

    const client = result.rows[0]
    const stored = client.password_hash ?? ""

    if (!stored || stored !== String(password)) {
      return NextResponse.json({ ok: false, error: "Incorrect password." })
    }

    return NextResponse.json({
      ok: true,
      name: `${client.first_name} ${client.last_name}`,
      clientId: client.id,
    })
  } catch (e) {
    console.error("[login]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
