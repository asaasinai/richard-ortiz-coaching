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

    // Coach notification
    await sendEmail({
      to: process.env.ADMIN_EMAIL ?? "richard@richardortizcoaching.com",
      subject: `✅ ${proposal.first_name} ${proposal.last_name} signed their agreement`,
      html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
  <h2 style="color:#C9A84C">Agreement Signed!</h2>
  <p><strong>${body.signed_name}</strong> (${proposal.client_email}) just signed their coaching agreement.</p>
  <p style="margin:1.5rem 0">
    <a href="${adminUrl}" style="background:#C9A84C;color:#000;padding:0.6rem 1.25rem;border-radius:4px;text-decoration:none;font-weight:700">View Intake →</a>
  </p>
</div>`,
    })

    // Client confirmation
    await sendEmail({
      to: proposal.client_email,
      subject: "Welcome! Your coaching agreement is confirmed ✓",
      html: `
<div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:8px">
  <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">You're In! 🎉</h1>
  <p style="color:#ccc;line-height:1.7">Hi ${proposal.first_name},</p>
  <p style="color:#ccc;line-height:1.7">Your coaching agreement is signed and confirmed. Richard will reach out within <strong style="color:#fff">24 hours</strong> to kick off your protocol.</p>
  <p style="color:#ccc;line-height:1.7">Get ready — your optimization journey starts now.</p>
  <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
  <p style="color:#555;font-size:0.75rem">Richard Ortiz Coaching — for educational and coaching purposes only. Not medical advice.</p>
</div>`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[proposal sign]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
