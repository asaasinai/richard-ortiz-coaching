import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendCheckinConfirmation, sendAdminCheckinUrgent } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getSetting } from "@/lib/settings"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { urgentFlag = false, notes = "", clientEmail: bodyEmail = "" } = data
    // email from header (checkin page sends x-user-email) or from body
    const email = req.headers.get("x-user-email") || bodyEmail || ""
    const firstName = req.headers.get("x-user-name") || ""

    // Urgency = client-requested OR any score at/below the configurable threshold
    const threshold = Number(await getSetting("urgent_threshold")) || 5
    const scores = [data.progressScore, data.energyScore, data.moodScore].map(Number).filter(n => !Number.isNaN(n))
    const lowScore = scores.some(s => s <= threshold)
    const isUrgent = Boolean(urgentFlag) || lowScore

    const result = await query(
      `INSERT INTO roc.checkins (data, urgent_flag, client_email) VALUES ($1, $2, $3) RETURNING id`,
      [JSON.stringify(data), isUrgent ? "true" : "false", email]
    )
    const checkinId = (result.rows[0] as { id: string }).id

    // In-app admin notification feed (degrade-safe; pre-migration → no-op)
    const who = firstName || email || "A client"
    if (isUrgent) {
      await createNotification({
        type: "urgent_checkin", refId: checkinId, refType: "checkin",
        message: `Urgent check-in from ${who}${lowScore && !urgentFlag ? " (low score)" : ""}`,
      })
    } else {
      await createNotification({
        type: "checkin_submitted", refId: checkinId, refType: "checkin",
        message: `New check-in from ${who}`,
      })
    }

    if (email) {
      Promise.allSettled([
        sendCheckinConfirmation(email, firstName),
        isUrgent ? sendAdminCheckinUrgent(email, email, notes) : Promise.resolve(),
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
