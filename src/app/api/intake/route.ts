import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendIntakeConfirmation, sendAdminIntakeNotify } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

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

    // Baseline progress photos (optional) — uploaded client-direct to Vercel
    // Blob before submit; we index the URLs here. Degrade-safe.
    const photos = (data.photos ?? {}) as Record<string, string | null>
    for (const kind of ["front", "side", "back"] as const) {
      const url = photos[kind]
      if (url && email) {
        await query(
          `INSERT INTO roc.client_photos (client_email, client_id, source, kind, url, marketing_consent)
           VALUES ($1, $2, 'intake', $3, $4, $5)`,
          [email, intakeId, kind, url, data.photoConsent ? "true" : "false"],
        ).catch(err => console.error("[intake] photo save", err))
      }
    }

    // In-app admin notification (degrade-safe; lights up bell + overview banner)
    await createNotification({
      type: "new_intake", refId: intakeId, refType: "intake",
      message: `New intake from ${[firstName, lastName].filter(Boolean).join(" ") || email || "a client"}`,
    })

    // Fire emails (non-blocking — don't fail the request if email fails)
    if (email) {
      // Await — on Vercel serverless the function freezes after the response
      // returns, so a fire-and-forget send often never completes.
      await Promise.allSettled([
        sendIntakeConfirmation(email, firstName),
        sendAdminIntakeNotify(intakeId, firstName, lastName, email, data),
      ])
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
