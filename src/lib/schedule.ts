import { query } from "@/lib/db"

// Computed coaching agenda: 2-week check-ins due, monthly payment renewals,
// and protocol completion dates. Nothing is stored — everything derives from
// client_protocols + checkins + proposals, so it can't drift from reality.

export interface ScheduleItem {
  type: "checkin_due" | "renewal_due" | "protocol_end"
  client_id: string
  client_name: string
  client_email: string
  phone: string | null
  due_date: string // YYYY-MM-DD
  days_overdue: number
  detail: string
  rate: number | null
  key: string // client_id:type:due_date — dismissal + notification-dedup handle
}

export interface ScheduleData {
  overdue: ScheduleItem[]
  days: { date: string; items: ScheduleItem[] }[]
}

const DAY = 86_400_000
const ymd = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY)
const addMonth = (d: Date) => { const n = new Date(d); n.setUTCMonth(n.getUTCMonth() + 1); return n }
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

export async function computeSchedule(horizonDays = 30): Promise<ScheduleData> {
  const [clients, lastCheckins, proposalDates, dismissals] = await Promise.all([
    // Active coaching clients (approved or with a signed proposal) and their protocol
    query<{
      client_id: string; first_name: string; last_name: string; email: string; phone: string | null
      submitted_at: string; protocol_start_date: string | null; duration_weeks: number | null
      monthly_rate: string | null; peptide: string | null
    }>(
      `SELECT cp.client_id::text AS client_id, i.first_name, i.last_name, i.email,
              i.data->>'phone' AS phone, i.submitted_at,
              cp.protocol_start_date, cp.duration_weeks, cp.monthly_rate, cp.peptide
       FROM roc.client_protocols cp
       JOIN roc.intakes i ON i.id::text = cp.client_id::text
       WHERE COALESCE(cp.billing_status, 'active') = 'active'`,
    ),
    // Latest REAL 2-week check-in per client (day-1 check-ins share the table
    // but must not reset the 14-day clock)
    query<{ email: string; last: string }>(
      `SELECT lower(client_email) AS email, MAX(submitted_at) AS last
       FROM roc.checkins
       WHERE COALESCE(data->>'checkin_type', '') <> 'next_day'
       GROUP BY 1`,
    ),
    // Payment anchors per client: last paid proposal, falling back to last signed
    query<{ intake_id: string; last_paid: string | null; last_signed: string | null }>(
      `SELECT intake_id::text AS intake_id, MAX(paid_at) AS last_paid, MAX(signed_at) AS last_signed
       FROM roc.proposals
       GROUP BY 1`,
    ),
    // Manually-addressed items (one cycle each). Degrade-safe pre-migration.
    query<{ key: string }>(`SELECT key FROM roc.schedule_dismissals`)
      .catch(() => ({ rows: [] as { key: string }[] })),
  ])

  const dismissed = new Set(dismissals.rows.map(r => r.key))

  const checkinByEmail = new Map(lastCheckins.rows.map(r => [r.email, new Date(r.last)]))
  const payByClient = new Map(proposalDates.rows.map(r => [r.intake_id, r]))

  const today = new Date(ymd(new Date()) + "T00:00:00Z")
  const horizon = addDays(today, horizonDays)
  const items: ScheduleItem[] = []

  for (const c of clients.rows) {
    const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email
    const base = {
      client_id: c.client_id, client_name: name,
      client_email: c.email, phone: c.phone ?? null,
    }
    const start = c.protocol_start_date ? new Date(c.protocol_start_date) : null
    const end = start && c.duration_weeks ? addDays(start, c.duration_weeks * 7) : null
    const pay = payByClient.get(c.client_id)
    const lastPaid = pay?.last_paid ? new Date(pay.last_paid) : null
    const lastSigned = pay?.last_signed ? new Date(pay.last_signed) : null
    const lastCheckin = checkinByEmail.get(c.email.toLowerCase()) ?? null

    const push = (item: Omit<ScheduleItem, "key">, due: Date) => {
      const key = `${item.client_id}:${item.type}:${item.due_date}`
      if (dismissed.has(key)) return // coach already addressed this cycle
      const full: ScheduleItem = { ...item, key }
      if (due < today) items.push({ ...full, days_overdue: Math.round((today.getTime() - due.getTime()) / DAY) })
      else if (due <= horizon) items.push(full)
    }

    // ── 2-week check-in due ───────────────────────────────────────────────
    // Anchor = the most recent of: last real check-in, protocol start,
    // signed proposal, intake — whichever the client's journey actually has.
    const anchor = [lastCheckin, start, lastSigned, new Date(c.submitted_at)]
      .filter((d): d is Date => d != null && !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]
    if (anchor) {
      const due = addDays(new Date(ymd(anchor) + "T00:00:00Z"), 14)
      // Once the protocol run is over, the re-up conversation (protocol_end /
      // renewal) takes over — stop nagging for check-ins.
      if (!(end && due > end)) {
        const detail = lastCheckin
          ? `Last check-in ${fmt(lastCheckin)}`
          : `No check-ins yet — started ${fmt(anchor)}`
        push({ ...base, type: "checkin_due", due_date: ymd(due), days_overdue: 0, detail, rate: null }, due)
      }
    }

    // ── Monthly payment renewal ───────────────────────────────────────────
    const payAnchor = lastPaid ?? lastSigned
    if (payAnchor) {
      const due = addMonth(new Date(ymd(payAnchor) + "T00:00:00Z"))
      const rate = c.monthly_rate != null ? Number(c.monthly_rate) : null
      const detail = lastPaid
        ? `Last paid ${fmt(lastPaid)}`
        : `Never marked paid — signed ${fmt(lastSigned!)}`
      push({ ...base, type: "renewal_due", due_date: ymd(due), days_overdue: 0, detail, rate }, due)
    }

    // ── Protocol completion (re-up marker, upcoming only) ─────────────────
    if (end && end >= today && end <= horizon) {
      push({
        ...base, type: "protocol_end", due_date: ymd(end), days_overdue: 0,
        detail: `${c.peptide ?? "Protocol"} completes (${c.duration_weeks} wks)`, rate: null,
      }, end)
    }
  }

  const overdue = items
    .filter(i => i.days_overdue > 0)
    .sort((a, b) => b.days_overdue - a.days_overdue)

  const byDay = new Map<string, ScheduleItem[]>()
  for (const i of items.filter(i => i.days_overdue === 0)) {
    byDay.set(i.due_date, [...(byDay.get(i.due_date) ?? []), i])
  }
  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayItems]) => ({ date, items: dayItems }))

  return { overdue, days }
}
