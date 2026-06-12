import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Check if this email has an intake
    const result = await query(
      "SELECT id, first_name FROM roc.intakes WHERE email = $1 AND status = 'APPROVED' LIMIT 1",
      [email]
    )

    if (result.rows.length === 0) {
      // Return success anyway to avoid email enumeration
      return NextResponse.json({ ok: true })
    }

    // In a real implementation, generate a signed token and email it.
    // For now, just return success — the frontend handles session state.
    // TODO: integrate with email provider (Resend/SendGrid) to send actual magic link
    console.log(`Magic link requested for: ${email}`)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
