import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSetting } from "@/lib/settings"
import { renderTemplate, protocolSummaryHtml } from "@/lib/email-templates"

async function sendEmail(payload: { to: string; subject: string; html: string }) {
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) { console.warn("[email] RESEND_API_KEY not set"); return }
  const FROM = process.env.RESEND_FROM ?? "noreply@richardortizcoaching.com"
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Richard Ortiz Coaching <${FROM}>`, to: [payload.to], subject: payload.subject, html: payload.html }),
  })
  if (!res.ok) console.error("[email] Resend error:", res.status, await res.text())
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  try {
    const body = await req.json() as { signed_name: string; agreed: boolean }

    if (!body.signed_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!body.agreed) {
      return NextResponse.json({ error: "Must agree to terms" }, { status: 400 })
    }

    // Load proposal
    const proposalRes = await query(
      `SELECT p.id, p.status, p.intake_id, p.protocol_snapshot,
              i.first_name, i.last_name, i.email as client_email
       FROM roc.proposals p
       LEFT JOIN roc.intakes i ON i.id = p.intake_id
       WHERE p.proposal_token = $1`,
      [token]
    )

    if (!proposalRes.rows.length) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const proposal = proposalRes.rows[0] as {
      id: string; status: string; intake_id: string; protocol_snapshot: Record<string, unknown>
      first_name: string; last_name: string; client_email: string
    }

    if (proposal.status === "signed") {
      return NextResponse.json({ error: "Already signed" }, { status: 400 })
    }

    // Get IP + UA
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown"
    const userAgent = req.headers.get("user-agent") ?? "unknown"

    // Sign
    await query(
      `UPDATE roc.proposals
       SET status = 'signed', signed_at = NOW(), signed_name = $1, signed_ip = $2, signed_user_agent = $3
       WHERE id = $4`,
      [body.signed_name.trim(), ip, userAgent, proposal.id]
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://richardortizcoaching.com"
    const adminUrl = `${siteUrl}/admin/intakes/${proposal.intake_id}`

    // Editable templates from Settings
    const [coachSubj, coachBody, welcomeSubj, welcomeBody, adminEmailSetting] = await Promise.all([
      getSetting("email_coach_notify_subject"),
      getSetting("email_coach_notify_body"),
      getSetting("email_welcome_subject"),
      getSetting("email_welcome_body"),
      getSetting("admin_email"),
    ])
    const snap = (proposal.protocol_snapshot ?? {}) as Record<string, unknown>
    const vars = {
      first_name: proposal.first_name, last_name: proposal.last_name,
      client_email: proposal.client_email, signed_name: body.signed_name.trim(),
      admin_url: adminUrl,
      // Full proposal contents for the coach email.
      protocol_summary: protocolSummaryHtml(snap),
      total_monthly: Number(snap.total_monthly ?? snap.monthly_rate ?? 0),
    }

    // Coach notification
    await sendEmail({
      to: adminEmailSetting || process.env.ADMIN_EMAIL || "richard@richardortizcoaching.com",
      subject: renderTemplate(coachSubj, vars),
      html: renderTemplate(coachBody, vars),
    })

    // Client confirmation
    await sendEmail({
      to: proposal.client_email,
      subject: renderTemplate(welcomeSubj, vars),
      html: renderTemplate(welcomeBody, vars),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal sign]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
