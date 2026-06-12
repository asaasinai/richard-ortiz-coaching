import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendCheckinConfirmation, sendAdminCheckinUrgent } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { urgentFlag = false, notes = "", clientEmail: bodyEmail = "" } = data
    // email from header (checkin page sends x-user-email) or from body
    const email = req.headers.get("x-user-email") || bodyEmail || ""
    const firstName = req.headers.get("x-user-name") || ""

    const result = await query(
      `INSERT INTO roc.checkins (data, urgent_flag, client_email) VALUES ($1, $2, $3) RETURNING id`,
      [JSON.stringify(data), urgentFlag ? "true" : "false", email]
    )
    const checkinId = (result.rows[0] as { id: string }).id

    if (email) {
      Promise.allSettled([
        sendCheckinConfirmation(email, firstName),
        urgentFlag ? sendAdminCheckinUrgent(email, email, notes) : Promise.resolve(),
      ]).catch(console.error)
    }

    await query(
      `INSERT INTO roc.activity_log (action, details) VALUES ('checkin_submitted', $1)`,
      [JSON.stringify({ checkinId, urgentFlag, email })]
    )

    return NextResponse.json({ ok: true, checkinId })
  } catch (err) {
    console.error("[checkin]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
