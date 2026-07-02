// Centralized, editable email + legal copy. Defaults live here; admins override
// them in Settings (stored in roc.admin_settings, merged over these defaults).
// Pure module (no DB import) so it's safe to import from client components too.

export const DEFAULT_TOS = `COACHING SERVICES AGREEMENT

This agreement is between Richard Ortiz Coaching ("Coach") and the client named above ("Client").

1. SERVICES
Coach will provide personalized peptide optimization coaching including protocol design using
manufacturer peptide products, progress check-in review, and ongoing protocol adjustments based
on Client's results.

2. PAYMENT
Client agrees to pay the monthly coaching fee listed in this agreement. Payment is due on
the 1st of each month. Service continues month-to-month until either party cancels in writing.

3. CANCELLATION
Either party may cancel with 7 days written notice via email. No refunds for partial months
already billed.

4. HEALTH DISCLAIMER
Coaching services are educational and informational in nature. They do not constitute medical
advice, diagnosis, or treatment. Client should consult a licensed physician before beginning
any peptide protocol. Richard Ortiz is not a licensed medical professional.

5. CLIENT RESPONSIBILITIES
Client agrees to: (a) follow the assigned protocol as instructed, (b) complete weekly
check-ins honestly and on time, (c) notify Coach immediately of any adverse reactions,
(d) disclose all relevant health conditions and medications, and (e) maintain communication
for protocol adjustments.

6. PRODUCT SOURCE
All peptides are sourced exclusively from the manufacturer. Client acknowledges that peptide products
are for research and personal optimization purposes.

7. CONFIDENTIALITY
Coach will keep all client health information confidential and will not share it with third
parties without written consent, except as required by law.

8. LIMITATION OF LIABILITY
Coach's total liability is limited to the monthly coaching fee paid for the month in which
any claim arises. Coach is not liable for outcomes resulting from Client's failure to follow
the protocol, failure to disclose relevant health information, or misuse of products.

9. ENTIRE AGREEMENT
This agreement, together with the protocol summary above, constitutes the entire agreement
between the parties and supersedes all prior discussions.`

// ── Proposal — sent to the client to review & sign ───────────────────────────
const PROPOSAL_SUBJECT = `Your Coaching Agreement — Please Review & Sign`
const PROPOSAL_BODY = `<div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:8px">
  <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">Your Coaching Agreement is Ready</h1>
  <p style="color:#ccc;line-height:1.7">Hi {{first_name}},</p>
  <p style="color:#ccc;line-height:1.7">Richard has prepared your personalized peptide protocol agreement. Please review and sign it to get started.</p>
  <div style="background:#111;border:1px solid #333;border-radius:6px;padding:1.25rem;margin:1.5rem 0">
    <p style="color:#C9A84C;font-weight:700;margin:0 0 0.75rem">Your Protocol Summary</p>
    {{protocol_summary}}
  </div>
  <div style="background:#111;border:1px solid #333;border-radius:6px;padding:1.25rem;margin:1.5rem 0">
    <p style="color:#C9A84C;font-weight:700;margin:0 0 0.75rem">Payment Instructions</p>
    <p style="color:#ccc;margin:0.3rem 0"><strong style="color:#fff">Venmo:</strong> <a href="https://venmo.com/u/Richard-Ortiz-78" style="color:#C9A84C;text-decoration:none">@Richard-Ortiz-78</a></p>
    <p style="color:#ccc;margin:0.3rem 0"><strong style="color:#fff">Zelle:</strong> Ricardo Ortiz &middot; 661-425-3534</p>
    <p style="color:#888;font-size:0.8rem;margin:0.75rem 0 0">Please include your full name in the payment note so we can match it to your protocol.</p>
  </div>
  <p style="margin:1.75rem 0;text-align:center">
    <a href="{{proposal_url}}" style="background:#C9A84C;color:#000;padding:0.85rem 2rem;border-radius:4px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">Review &amp; Sign Agreement &rarr;</a>
  </p>
  <p style="color:#666;font-size:0.8rem;margin-top:1.5rem">Questions? Reply to this email or contact {{admin_email}}</p>
  <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
  <p style="color:#555;font-size:0.75rem">Richard Ortiz Coaching — for educational and coaching purposes only. Not medical advice.</p>
</div>`

// ── Welcome — sent to the client after they sign ─────────────────────────────
const WELCOME_SUBJECT = `Welcome! Your coaching agreement is confirmed ✓`
const WELCOME_BODY = `<div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:8px">
  <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">You're In! 🎉</h1>
  <p style="color:#ccc;line-height:1.7">Hi {{first_name}},</p>
  <p style="color:#ccc;line-height:1.7">Your coaching agreement is signed and confirmed. Richard will reach out within <strong style="color:#fff">24 hours</strong> to kick off your protocol.</p>
  <p style="color:#ccc;line-height:1.7">Get ready — your optimization journey starts now.</p>
  <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
  <p style="color:#555;font-size:0.75rem">Richard Ortiz Coaching — for educational and coaching purposes only. Not medical advice.</p>
</div>`

// ── Coach notification — sent to the admin when a client signs ───────────────
const COACH_NOTIFY_SUBJECT = `✅ Proposal Signed — {{first_name}} {{last_name}}`
const COACH_NOTIFY_BODY = `<div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:8px">
  <h2 style="color:#C9A84C;margin-top:0">Proposal Signed ✅</h2>
  <p style="color:#ccc;line-height:1.7"><strong style="color:#fff">{{signed_name}}</strong> ({{client_email}}) just signed their proposal.</p>
  <p style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C9A84C;margin:1.5rem 0 0.5rem">Signed Proposal</p>
  <div style="background:#0b0b0b;border:1px solid #222;border-radius:6px;padding:1rem">{{protocol_summary}}</div>
  <p style="margin:1.5rem 0 0">
    <a href="{{admin_url}}" style="background:#C9A84C;color:#000;padding:0.75rem 1.5rem;border-radius:4px;text-decoration:none;font-weight:700;display:inline-block">View Full Intake &amp; Record &rarr;</a>
  </p>
  <p style="color:#666;font-size:0.72rem;margin-top:0.75rem">Opens {{first_name}}'s record directly (sign in to admin if prompted).</p>
  <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
  <p style="color:#555;font-size:0.75rem">Richard Ortiz Coaching</p>
</div>`

// Keys merged into the settings DEFAULTS so they're editable in Settings.
export const EMAIL_TEMPLATE_DEFAULTS: Record<string, string> = {
  tos_text: DEFAULT_TOS,
  email_proposal_subject: PROPOSAL_SUBJECT,
  email_proposal_body: PROPOSAL_BODY,
  email_welcome_subject: WELCOME_SUBJECT,
  email_welcome_body: WELCOME_BODY,
  email_coach_notify_subject: COACH_NOTIFY_SUBJECT,
  email_coach_notify_body: COACH_NOTIFY_BODY,
}

// Replace {{placeholder}} tokens. Unknown tokens render as empty string.
export function renderTemplate(tpl: string, vars: Record<string, string | number | null | undefined>): string {
  return (tpl ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key]
    return v == null ? "" : String(v)
  })
}

// Protocol summary block (HTML) for the proposal email — lists every saved line
// with a total, or falls back to the legacy single-protocol snapshot fields.
export function protocolSummaryHtml(snap: Record<string, unknown>): string {
  const lines = Array.isArray(snap.lines) ? snap.lines as Record<string, unknown>[] : []
  if (lines.length) {
    const rows = lines.map(l => {
      const dose = l.dose_amount ? ` — ${l.dose_amount} ${l.dose_unit ?? ""}` : ""
      const rate = l.monthly_rate ? ` <span style="color:#C9A84C">$${Number(l.monthly_rate)}</span>` : ""
      return `<p style="color:#ccc;margin:0.3rem 0"><strong style="color:#fff">${l.peptide ?? ""}</strong>${dose}${rate}</p>`
    }).join("")
    const total = Number(snap.total_monthly ?? 0)
    return `${rows}${total > 0 ? `<p style="color:#C9A84C;font-weight:700;margin:0.75rem 0 0;border-top:1px solid #333;padding-top:0.6rem">Total: $${total}</p>` : ""}`
  }
  return `
    <p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Primary:</strong> ${snap.peptide ?? ""} (${snap.sku_strength ?? ""}${snap.sku_unit ?? "mg"} vial)</p>
    ${snap.dose_amount ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Dose:</strong> ${snap.dose_amount} ${snap.dose_unit ?? ""}</p>` : ""}
    ${snap.duration_weeks ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Duration:</strong> ${snap.duration_weeks} weeks</p>` : ""}
    ${snap.monthly_rate ? `<p style="color:#ccc;margin:0.25rem 0"><strong style="color:#fff">Rate:</strong> $${snap.monthly_rate}</p>` : ""}`
}
