"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, MessageSquare, AlertTriangle, Trash2 } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"

interface ScheduleItem {
  type: "checkin_due" | "renewal_due" | "protocol_end"
  client_id: string
  client_name: string
  client_email: string
  phone: string | null
  due_date: string
  days_overdue: number
  detail: string
  rate: number | null
  key: string
}

interface ScheduleDay {
  date: string
  items: ScheduleItem[]
}

interface ScheduleResponse {
  ok: boolean
  overdue: ScheduleItem[]
  days: ScheduleDay[]
}

const TYPE_META: Record<ScheduleItem["type"], { label: string; color: string; bg: string }> = {
  checkin_due: { label: "Check-in", color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
  renewal_due: { label: "Renewal", color: "var(--gold)", bg: "rgba(201,168,76,0.15)" },
  protocol_end: { label: "Protocol ends", color: "#A78BFA", bg: "rgba(167,139,250,0.15)" },
}

/** Local date as "YYYY-MM-DD" (client timezone). */
function localYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function dayLabel(date: string): string {
  const now = new Date()
  const today = localYMD(now)
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(now.getDate() + 1)
  const tomorrow = localYMD(tomorrowDate)
  if (date === today) return "Today"
  if (date === tomorrow) return "Tomorrow"
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y ?? now.getFullYear(), (m ?? 1) - 1, d ?? 1)
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function smsHref(item: ScheduleItem): string {
  const firstName = item.client_name.split(" ")[0] ?? item.client_name
  const body = encodeURIComponent(
    "Hey " + firstName + "! Just a reminder your 2-week check-in is due — takes 2 minutes: https://richardortizcoaching.com/checkin"
  )
  return `sms:${item.phone}?&body=${body}`
}

function TypeChip({ type }: { type: ScheduleItem["type"] }) {
  const meta = TYPE_META[type]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.62rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: meta.color,
        background: meta.bg,
        borderRadius: "var(--radius-pill)",
        padding: "0.2rem 0.55rem",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  )
}

function ItemCard({ item, overdue, onDismiss }: { item: ScheduleItem; overdue: boolean; onDismiss: (key: string) => void }) {
  const clientHref =
    item.type === "renewal_due"
      ? `/admin/clients/${item.client_id}?tab=billing`
      : `/admin/clients/${item.client_id}`

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1rem",
        ...(overdue ? { borderLeft: "3px solid #F87171" } : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <TypeChip type={item.type} />
            <Link
              href={clientHref}
              style={{ fontWeight: 700, color: "var(--text)", textDecoration: "none", fontSize: "0.95rem" }}
            >
              {item.client_name}
            </Link>
            {overdue && (
              <span style={{ color: "#F87171", fontWeight: 700, fontSize: "0.78rem" }}>
                {item.days_overdue} day{item.days_overdue === 1 ? "" : "s"} overdue
              </span>
            )}
          </div>
          <div style={{ color: "var(--text-mute)", fontSize: "0.78rem", marginTop: "0.2rem", wordBreak: "break-word" }}>
            {item.client_email}
          </div>
          <div style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.4rem" }}>{item.detail}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
          {item.type === "renewal_due" && item.rate !== null && (
            <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: "1rem", textAlign: "right" }}>
              ${item.rate}
            </div>
          )}
          <button
            type="button"
            title="Delete — hides this until the next cycle"
            onClick={() => onDismiss(item.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: "var(--radius-pill)", color: "#F87171", fontSize: "0.72rem",
              fontWeight: 700, padding: "0.3rem 0.7rem", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
      {overdue && item.type === "checkin_due" && item.phone && (
        <div style={{ marginTop: "0.7rem" }}>
          <a
            className="btn-outline"
            href={smsHref(item)}
            style={{
              textDecoration: "none",
              fontSize: "0.75rem",
              padding: "0.35rem 0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <MessageSquare size={14} /> Text reminder
          </a>
        </div>
      )}
    </div>
  )
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-mute)",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  marginBottom: "0.6rem",
}

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/schedule")
      .then((r) => r.json())
      .then((json: ScheduleResponse) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = (key: string) => {
    // Optimistic: drop it locally, persist in the background.
    setData(prev => prev ? {
      ...prev,
      overdue: prev.overdue.filter(i => i.key !== key),
      days: prev.days
        .map(d => ({ ...d, items: d.items.filter(i => i.key !== key) }))
        .filter(d => d.items.length > 0),
    } : prev)
    fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => {})
  }

  const overdue = data?.overdue ?? []
  const days = data?.days ?? []
  const isEmpty = !loading && overdue.length === 0 && days.length === 0

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <PageHeader
        title="Schedule"
        subtitle="Check-ins due, payment renewals, and protocol completions — next 30 days."
        backHref="/admin"
      />

      {loading && (
        <div style={{ color: "var(--text-mute)", fontSize: "0.9rem", padding: "1rem 0" }}>Loading…</div>
      )}

      {isEmpty && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            color: "var(--text-mute)",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CalendarDays size={16} /> Nothing due in the next 30 days.
        </div>
      )}

      {!loading && overdue.length > 0 && (
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ ...sectionHeadingStyle, color: "#F87171" }}>
            <AlertTriangle size={13} /> Needs attention
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {overdue.map(item => (
              <ItemCard key={item.key} item={item} overdue onDismiss={dismiss} />
            ))}
          </div>
        </div>
      )}

      {!loading &&
        days.map((day) => (
          <div key={day.date} style={{ marginBottom: "1.5rem" }}>
            <div style={sectionHeadingStyle}>
              <CalendarDays size={13} /> {dayLabel(day.date)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {day.items.map(item => (
                <ItemCard key={item.key} item={item} overdue={false} onDismiss={dismiss} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
