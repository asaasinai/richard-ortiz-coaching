// Email via Resend (https://resend.com)
const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? "onboarding@richardortizcoaching.com"
const ADMIN = process.env.ADMIN_EMAIL ?? "richard@richardortizcoaching.com"

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function send(payload: EmailPayload) {
  if (!RESEND_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send")
    return
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Richard Ortiz Coaching <${FROM}>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error("[email] Resend error:", res.status, body)
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
        <hr style="border-color:rgba(201,168,76,0.2);margin:1.5rem 0"/>
        <p style="color:#888;font-size:0.8rem">Richard Ortiz Coaching — for educational and coaching purposes only. Not medical advice.</p>
      </div>`,
  })
}

// How many progress photos (front/side/back) came with a submission payload.
function countPhotos(data?: Record<string, unknown>): number {
  const photos = data?.photos
  if (!photos || typeof photos !== "object") return 0
  return Object.values(photos as Record<string, unknown>).filter(v => typeof v === "string" && v).length
}

function renderIntakeValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  if (Array.isArray(v)) return v.join(", ")
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

export async function sendAdminIntakeNotify(
  intakeId: string,
  firstName: string,
  lastName: string,
  email: string,
  data?: Record<string, unknown>,
) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://richardortizcoaching.com"
  const phone = renderIntakeValue(data?.phone)
  const photoCount = countPhotos(data)

  await send({
    to: ADMIN,
    subject: `New Intake: ${firstName} ${lastName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:1.5rem">
        <h2 style="color:#C9A84C">New Intake Submitted</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem">
          <tr><td style="padding:0.4rem 0.75rem 0.4rem 0;color:#888">Name</td><td style="font-weight:600">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:0.4rem 0.75rem 0.4rem 0;color:#888">Email</td><td><a href="mailto:${email}" style="color:#0a58ca">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:0.4rem 0.75rem 0.4rem 0;color:#888">Phone</td><td>${phone}</td></tr>` : ""}
          ${photoCount ? `<tr><td style="padding:0.4rem 0.75rem 0.4rem 0;color:#888">Photos</td><td>📸 ${photoCount} baseline photo${photoCount > 1 ? "s" : ""} — view in record</td></tr>` : ""}
        </table>
        <p style="margin-top:1.5rem"><a href="${SITE}/admin/clients/${intakeId}" style="background:#C9A84C;color:#000;padding:0.6rem 1.25rem;border-radius:4px;text-decoration:none;font-weight:700">View Client Record →</a></p>
        <p style="color:#aaa;font-size:0.72rem;margin-top:0.75rem">Opens the full record with all intake answers (sign in to admin if prompted).</p>
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

// Coach notification fired on EVERY 2-week check-in (urgent or not).
export async function sendAdminCheckin(
  clientName: string,
  clientEmail: string,
  data: Record<string, unknown>,
  isUrgent: boolean,
) {
  const fields: [string, unknown][] = [
    ["Weight", data.weight], ["Body Fat %", data.bodyFat], ["Muscle %", data.musclePct],
    ["Energy", data.energyScore != null ? `${data.energyScore}/10` : ""],
    ["Mood", data.moodScore != null ? `${data.moodScore}/10` : ""],
    ["Side effects", Array.isArray(data.sideEffects) ? (data.sideEffects as string[]).join(", ") : ""],
    ["Missed doses", data.missedDoses],
    ["Notes", data.notes],
  ]
  const photoCount = countPhotos(data)
  if (photoCount) fields.push(["Photos", `📸 ${photoCount} progress photo${photoCount > 1 ? "s" : ""} — view in record`])
  const rows = fields
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `<tr><td style="padding:0.35rem 0;color:#888">${k}</td><td style="font-weight:600">${String(v)}</td></tr>`)
    .join("")
  await send({
    to: ADMIN,
    subject: `${isUrgent ? "⚠️ " : ""}2-Week Check-In: ${clientName || clientEmail}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2 style="color:${isUrgent ? "red" : "#C9A84C"}">${isUrgent ? "Urgent " : ""}2-Week Check-In</h2>
        <p><strong>${clientName || "Client"}</strong> (${clientEmail || "no email"}) submitted a check-in.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:0.75rem">${rows}</table>
        <p style="margin-top:1.5rem"><a href="https://richardortizcoaching.com/admin/checkins" style="background:#C9A84C;color:#000;padding:0.6rem 1.25rem;border-radius:4px;text-decoration:none;font-weight:700">Review Check-In →</a></p>
      </div>`,
  })
}

export async function sendAdminCheckinUrgent(adminEmail: string, clientEmail: string, notes: string) {
  await send({
    to: ADMIN,
    subject: `⚠️ Urgent Check-In Flag — ${clientEmail}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2 style="color:red">Urgent Follow-Up Requested</h2>
        <p><strong>Client:</strong> ${clientEmail}</p>
        <p><strong>Notes:</strong> ${notes || "No notes provided"}</p>
        <p><a href="https://richardortizcoaching.com/admin" style="color:#C9A84C;font-weight:700">Review Check-In →</a></p>
      </div>`,
  })
}

export async function sendNextDayTrigger(to: string, firstName: string, checkinUrl: string) {
  await send({
    to,
    subject: "Day 1 Check-In — How Are You Feeling?",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0b0b0b;color:#fff;padding:2rem;border-radius:6px">
        <h1 style="color:#C9A84C;font-size:1.4rem;margin-bottom:0.5rem">Day 1 Check-In ✓</h1>
        <p style="color:#ccc;line-height:1.7">Hey ${firstName},</p>
        <p style="color:#ccc;line-height:1.7">It's Day 1 of your new protocol. Your feedback today helps Richard make sure the dosing is dialed in perfectly for you.</p>
        <p style="color:#ccc;line-height:1.7">Takes under 2 minutes — 10 quick questions.</p>
        <p style="margin:1.75rem 0">
          <a href="${checkinUrl}" style="background:#C9A84C;color:#000;padding:0.75rem 1.75rem;border-radius:4px;text-decoration:none;font-weight:700;font-size:1rem">Take Your Check-In →</a>
        </p>
        <p style="color:#666;font-size:0.8rem;margin-top:1.5rem">This link is unique to you and can only be used once.</p>
        <hr style="border-color:rgba(201,168,76,0.15);margin:1.5rem 0"/>
        <p style="color:#555;font-size:0.78rem">Richard Ortiz Coaching — for educational and coaching purposes only.</p>
      </div>`,
  })
}

export async function sendNextDayCheckinConfirmation(to: string, firstName: string) {
  await send({
    to,
    subject: "Check-In Received — Thanks!",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0b0b0b;color:#fff;padding:2rem;border-radius:6px">
        <h1 style="color:#C9A84C;font-size:1.4rem">Check-In Received ✓</h1>
        <p style="color:#ccc;line-height:1.7">Hey ${firstName},</p>
        <p style="color:#ccc;line-height:1.7">Your Day 1 check-in has been logged. Richard will review your responses and reach out if any adjustments to your protocol are needed.</p>
        <hr style="border-color:rgba(201,168,76,0.15);margin:1.5rem 0"/>
        <p style="color:#555;font-size:0.78rem">Richard Ortiz Coaching</p>
      </div>`,
  })
}

export async function sendAdminNextDayCheckin(
  clientId: string,
  firstName: string,
  lastName: string,
  email: string,
  scores: Record<string, number>
) {
  const rows = Object.entries(scores)
    .map(([k, v]) => `<tr><td style="padding:0.35rem 0;color:#888;text-transform:capitalize">${k.replace(/_/g," ")}</td><td style="font-weight:700;color:${v >= 8 ? "#C9A84C" : v <= 3 ? "#ff6b6b" : "#fff"}">${v}/10</td></tr>`)
    .join("")
  await send({
    to: ADMIN,
    subject: `Day-1 Check-In: ${firstName} ${lastName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem">
        <h2 style="color:#C9A84C">Next-Day Protocol Check-In</h2>
        <p><strong>${firstName} ${lastName}</strong> (${email}) submitted their Day-1 check-in.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem">${rows}</table>
        <p style="margin-top:1.5rem"><a href="https://richardortizcoaching.com/admin" style="background:#C9A84C;color:#000;padding:0.6rem 1.25rem;border-radius:4px;text-decoration:none;font-weight:700">View in Admin →</a></p>
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
        <blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#555;margin:1rem 0">${message}</blockquote>
        <p><a href="mailto:${email}" style="color:#C9A84C">Reply to ${name} →</a></p>
      </div>`,
  })
}

// Daily coaching-schedule digest — one email listing what's due today plus
// anything overdue (check-ins + payment renewals). Sent by the schedule cron.
export async function sendAdminScheduleDigest(
  to: string,
  dueToday: { type: string; client_name: string; detail: string; rate: number | null; days_overdue: number }[],
  overdue: { type: string; client_name: string; detail: string; rate: number | null; days_overdue: number }[],
) {
  const label = (t: string) => t === "renewal_due" ? "💰 Renewal" : t === "protocol_end" ? "🏁 Protocol ends" : "📋 Check-in"
  const row = (i: { type: string; client_name: string; detail: string; rate: number | null; days_overdue: number }, red = false) => `
    <tr>
      <td style="padding:0.4rem 0.75rem 0.4rem 0;white-space:nowrap;color:${red ? "#ef4444" : "#888"}">${label(i.type)}${red ? ` · ${i.days_overdue}d late` : ""}</td>
      <td style="font-weight:600">${i.client_name}</td>
      <td style="color:#888">${i.detail}${i.rate ? ` — <span style="color:#C9A84C;font-weight:700">$${i.rate}</span>` : ""}</td>
    </tr>`
  const section = (title: string, items: typeof dueToday, red = false) => items.length ? `
    <p style="font-weight:700;color:${red ? "#ef4444" : "#C9A84C"};margin:1.25rem 0 0.25rem">${title}</p>
    <table style="width:100%;border-collapse:collapse">${items.map(i => row(i, red)).join("")}</table>` : ""
  await send({
    to,
    subject: `Coaching Schedule — ${dueToday.length} due today${overdue.length ? `, ${overdue.length} overdue` : ""}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:1.5rem">
        <h2 style="color:#C9A84C">Today's Coaching Schedule</h2>
        ${section("⚠️ Overdue", overdue, true)}
        ${section("Due Today", dueToday)}
        <p style="margin-top:1.5rem"><a href="https://richardortizcoaching.com/admin/schedule" style="background:#C9A84C;color:#000;padding:0.6rem 1.25rem;border-radius:4px;text-decoration:none;font-weight:700">Open Schedule →</a></p>
      </div>`,
  })
}
