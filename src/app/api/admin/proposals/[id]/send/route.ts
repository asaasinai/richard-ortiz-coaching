import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSetting } from "@/lib/settings"
import { renderTemplate, protocolSummaryHtml } from "@/lib/email-templates"

export const dynamic = "force-dynamic"

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
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const proposalRes = await query(
      `SELECT p.*, i.first_name, i.last_name, i.email as client_email
       FROM roc.proposals p
       LEFT JOIN roc.intakes i ON i.id = p.intake_id
       WHERE p.id = $1`,
      [id]
    )

    if (!proposalRes.rows.length) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const proposal = proposalRes.rows[0] as {
      id: string; proposal_token: string; status: string
      first_name: string; last_name: string; client_email: string
      protocol_snapshot: Record<string, unknown>
    }

    if (proposal.status === "signed") {
      return NextResponse.json({ error: "Already signed" }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://richardortizcoaching.com"
    const proposalUrl = `${siteUrl}/proposal/${proposal.proposal_token}`
    const snapshot = proposal.protocol_snapshot

    // Update status
    await query(
      `UPDATE roc.proposals SET status = 'sent', sent_at = NOW() WHERE id = $1`,
      [id]
    )

    // Render the editable template from Settings and send to the client
    const [subjTpl, bodyTpl, adminEmail] = await Promise.all([
      getSetting("email_proposal_subject"),
      getSetting("email_proposal_body"),
      getSetting("admin_email"),
    ])
    const vars = {
      first_name: proposal.first_name, last_name: proposal.last_name,
      client_email: proposal.client_email, proposal_url: proposalUrl,
      protocol_summary: protocolSummaryHtml(snapshot),
      total_monthly: Number((snapshot as Record<string, unknown>).total_monthly ?? 0),
      admin_email: adminEmail || "richard@richardortizcoaching.com",
    }
    await sendEmail({
      to: proposal.client_email,
      subject: renderTemplate(subjTpl, vars),
      html: renderTemplate(bodyTpl, vars),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal send]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
