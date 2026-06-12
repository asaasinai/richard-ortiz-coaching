import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendContactNotification } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('contact_form', $1)`,
      [JSON.stringify({ name, email, message: message.slice(0, 500) })]
    )

    await sendContactNotification(name, email, message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[contact]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
