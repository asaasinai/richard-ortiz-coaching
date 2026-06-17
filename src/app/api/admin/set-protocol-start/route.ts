/**
 * POST /api/admin/set-protocol-start
 *
 * Body: { clientId: string, startDate: string (YYYY-MM-DD) }
 *
 * - Sets protocol_start_date on client_protocols
 * - Generates a unique followup_token
 * - Resets followup_sent = FALSE (new protocol = new follow-up)
 * - Schedules or immediately queues the Day+1 email trigger
 *   (the trigger cron at /api/cron/nextday-trigger handles sending)
 *
 * Can also be called by the client via PATCH (reset start date only — not admin-only).
 */
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import crypto from "crypto"

function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, startDate } = await req.json()
    if (!clientId || !startDate) {
      return NextResponse.json({ ok: false, error: "clientId and startDate required" }, { status: 400 })
    }

    const token = generateToken()

    await query(
      `UPDATE roc.client_protocols
       SET protocol_start_date = $1,
           followup_token = $2,
           followup_sent = FALSE
       WHERE client_id = $3`,
      [startDate, token, clientId]
    )

    await query(
      `INSERT INTO roc.activity_log (action, details)
       VALUES ('protocol_start_set', $1)`,
      [JSON.stringify({ clientId, startDate, token: token.slice(0, 8) + "…" })]
    )

    return NextResponse.json({ ok: true, token })
  } catch (err) {
    console.error("[set-protocol-start]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// PATCH — client resets their own start date (authenticated via x-user-id header set by middleware)
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")
    const { startDate } = await req.json()
    if (!userId || !startDate) {
      return NextResponse.json({ ok: false, error: "auth + startDate required" }, { status: 400 })
    }

    const token = generateToken()

    await query(
      `UPDATE roc.client_protocols
       SET protocol_start_date = $1,
           followup_token = $2,
           followup_sent = FALSE
       WHERE client_id = $3`,
      [startDate, token, userId]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[set-protocol-start PATCH]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
