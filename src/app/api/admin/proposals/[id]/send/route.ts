import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

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

    // Send email to client
    await sendEmail({
      to: proposal.client_email,
      subject: "Your Coaching Agreement — Please Review & Sign",
      html: `
<div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:8px">
  <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">Your Coaching Agreement is Ready</h1>
  <p style="color:#ccc;line-height:1.7">Hi ${proposal.first_name},</p>
  <p style="color:#ccc;line-height:1.7">Richard has prepared your personalized peptide protocol agreement. Please review and sign it to get started.</p>
  <div style="background:#111;border:1px solid #333;border-radius:6px;padding:1.25rem;margin:1.5rem 0">
    <p style="color:#C9A84C;font-weight:700;margin:0 0 0.75rem">Your Protocol Summary</p>
    <p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Primary:</strong> ${snapshot.peptide ?? ""} (${snapshot.sku_strength ?? ""}${snapshot.sku_unit ?? "mg"} vial)</p>
    ${snapshot.dose_amount ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Dose:</strong> ${snapshot.dose_amount} ${snapshot.dose_unit ?? ""}</p>` : ""}
    ${snapshot.duration_weeks ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Duration:</strong> ${snapshot.duration_weeks} weeks</p>` : ""}
    ${snapshot.monthly_rate ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Monthly:</strong> $${snapshot.monthly_rate}/month</p>` : ""}
  </div>
  <p style="margin:1.75rem 0;text-align:center">
    <a href="${proposalUrl}" style="background:#C9A84C;color:#000;padding:0.85rem 2rem;border-radius:4px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">Review & Sign Agreement →</a>
  </p>
  <p style="color:#666;font-size:0.8rem;margin-top:1.5rem">Questions? Reply to this email or contact richard@richardortizcoaching.com</p>
  <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
  <p style="color:#555;font-size:0.75rem">Richard Ortiz Coaching — for educational and coaching purposes only. Not medical advice.</p>
</div>`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal send]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
