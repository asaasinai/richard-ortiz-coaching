const SG_KEY = process.env.SENDGRID_API_KEY
const FROM = process.env.SENDGRID_FROM ?? "noreply@richardortizcoaching.com"
const ADMIN = process.env.ADMIN_EMAIL ?? "richard@richardortizcoaching.com"

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function send(payload: EmailPayload) {
  if (!SG_KEY) {
    console.warn("[email] SENDGRID_API_KEY not set — skipping send")
    return
  }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SG_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: FROM, name: "Richard Ortiz Coaching" },
      subject: payload.subject,
      content: [{ type: "text/html", value: payload.html }],
    }),
  })
  if (!res.ok) {
    console.error("[email] SendGrid error:", res.status, await res.text())
  }
}

export async function sendIntakeConfirmation(to: string, firstName: string) {
  await send({
    to,
    subject: "Intake Received — Richard Ortiz Coaching",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:6px">
        <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">Intake Received ✓</h1>
        <p style="color:#ccc;line-height:1.7">Hi ${firstName},</p>
        <p style="color:#ccc;line-height:1.7">Your intake form has been received. Richard will review it and reach out within <strong style="color:#fff">48 hours</strong> to schedule your initial consult.</p>
        <p style="color:#ccc;line-height:1.7">In the meantime, feel free to browse the <a href="https://richardortizcoaching.com/peptides" style="color:#C9A84C">Peptide Library</a> or the <a href="https://richardortizcoaching.com/protocols" style="color:#C9A84C">Dosage Protocols</a>.</p>
        <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
        <p style="color:#888;font-size:0.8rem">Richard Ortiz Coaching — wellness coaching for educational purposes only. Not medical advice.</p>
      </div>`,
  })
}

export async function sendAdminIntakeNotify(intakeId: string, firstName: string, lastName: string, email: string) {
  await send({
    to: ADMIN,
    subject: `New Intake: ${firstName} ${lastName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2 style="color:#C9A84C">New Intake Submitted</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Intake ID:</strong> ${intakeId}</p>
        <p><a href="https://richardortizcoaching.com/admin" style="color:#C9A84C">Review in Admin Dashboard →</a></p>
      </div>`,
  })
}

export async function sendCheckinConfirmation(to: string, firstName: string) {
  await send({
    to,
    subject: "2-Week Check-In Received — Richard Ortiz Coaching",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#000;color:#fff;padding:2rem;border-radius:6px">
        <h1 style="color:#C9A84C;font-size:1.4rem">Check-In Received ✓</h1>
        <p style="color:#ccc;line-height:1.7">Hi ${firstName},</p>
        <p style="color:#ccc;line-height:1.7">Your 2-week check-in has been logged. Richard will review your progress and follow up within <strong style="color:#fff">24 hours</strong>.</p>
        <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
        <p style="color:#888;font-size:0.8rem">Richard Ortiz Coaching</p>
      </div>`,
  })
}

export async function sendAdminCheckinUrgent(to: string, clientEmail: string, notes: string) {
  await send({
    to: ADMIN,
    subject: `⚠️ Urgent Check-In Flag — ${clientEmail}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2 style="color:red">Urgent Follow-Up Requested</h2>
        <p><strong>Client:</strong> ${clientEmail}</p>
        <p><strong>Notes:</strong> ${notes || "No notes provided"}</p>
        <p><a href="https://richardortizcoaching.com/admin" style="color:#C9A84C">Review Check-In →</a></p>
      </div>`,
  })
}

export async function sendContactNotification(name: string, email: string, message: string) {
  await send({
    to: ADMIN,
    subject: `Contact Form: ${name}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#555">${message}</blockquote>
      </div>`,
  })
}
