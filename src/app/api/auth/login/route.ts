import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Demo credentials — in production these would be hashed in DB
// Jessica Morris: jessicamariemorris@gmail.com / 12345
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password required." }, { status: 400 })
    }

    // Look up client by email in intakes
    const result = await query<{ id: string; first_name: string; last_name: string; status: string; password_hash: string | null }>(
      "SELECT id, first_name, last_name, status, password_hash FROM roc.intakes WHERE lower(email) = lower($1) LIMIT 1",
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "No account found with that email." })
    }

    const client = result.rows[0]

    // Check password — stored as plain text for demo (Jessica: 12345)
    // If password_hash is null, fall back to checking against demo password
    const passwordOk = client.password_hash
      ? client.password_hash === password  // plain comparison for demo; use bcrypt in prod
      : (email.toLowerCase() === "jessicamariemorris@gmail.com" && password === "12345")

    if (!passwordOk) {
      return NextResponse.json({ ok: false, error: "Incorrect password." })
    }

    return NextResponse.json({
      ok: true,
      name: `${client.first_name} ${client.last_name}`,
      clientId: client.id,
    })
  } catch (e) {
    console.error("[login]", e)
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 })
  }
}
