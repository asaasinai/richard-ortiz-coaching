import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendIntakeConfirmation, sendAdminIntakeNotify } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { firstName = "", lastName = "", email = "" } = data

    // Persist to DB
    const result = await query(
      `INSERT INTO roc.intakes (data, email, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id`,
      [JSON.stringify(data), email, firstName, lastName]
    )
    const intakeId = (result.rows[0] as { id: string }).id

    // Fire emails (non-blocking — don't fail the request if email fails)
    if (email) {
      Promise.allSettled([
        sendIntakeConfirmation(email, firstName),
        sendAdminIntakeNotify(intakeId, firstName, lastName, email),
      ]).catch(console.error)
    }

    // Activity log
    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('intake_submitted', $1)`,
      [JSON.stringify({ intakeId, email, firstName, lastName })]
    )

    return NextResponse.json({ ok: true, intakeId })
  } catch (err) {
    console.error("[intake]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
