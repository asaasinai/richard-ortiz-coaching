"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle, Check } from "lucide-react"
import { AreaChart } from "@/components/admin/Charts"

interface CheckIn {
  id: string; client_email: string | null; submitted_at: string; urgent_flag: boolean
  read?: boolean; resolved?: boolean; first_name?: string; last_name?: string
  data: { progressScore?: number; energyScore?: number; moodScore?: number }
}
interface Intake { id: string; first_name: string; last_name: string; email: string; status: string; submitted_at: string }

const sc = (v?: number): React.CSSProperties => ({ color: v === undefined ? "var(--text-mute)" : v >= 7 ? "#22c55e" : v >= 4 ? "var(--gold)" : "#ef4444", fontWeight: 700 })
const name = (c: CheckIn) => c.first_name ? `${c.first_name} ${c.last_name ?? ""}`.trim() : (c.client_email || "Unlinked check-in")

// Modern area chart: count per week for the last `weeks` weeks
function WeeklyChart({ dates, label, color = "var(--gold)" }: { dates: string[]; label: string; color?: string }) {
  const weeks = 8
  const now = Date.now(), wk = 7 * 864e5
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * wk
    return { end, value: 0 }
  })
  for (const d of dates) {
    const t = new Date(d).getTime()
    const idx = Math.floor((now - t) / wk)
    if (idx >= 0 && idx < weeks) buckets[weeks - 1 - idx].value++
  }
  const total = buckets.reduce((s, b) => s + b.value, 0)
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.85rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.92rem" }}>{label}</p>
        <span style={{ color: "var(--text-mute)", fontSize: "0.74rem" }}>{total} in 8 weeks</span>
      </div>
      <AreaChart data={buckets.map(b => ({ value: b.value }))} color={color} height={110} label={label} />
    </div>
  )
}

export default function OverviewActivity() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [intakes, setIntakes] = useState<Intake[]>([])
  const router = useRouter()

  const load = useCallback(() => {
    fetch("/api/admin/checkins").then(r => r.json()).then(d => setCheckins(d.checkins ?? [])).catch(() => {})
    fetch("/api/admin/intakes").then(r => r.json()).then(d => setIntakes(d.intakes ?? [])).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const markSeen = (id: string) => {
    fetch(`/api/admin/checkins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read", read: true }) })
      .then(() => setCheckins(cs => cs.map(c => c.id === id ? { ...c, read: true } : c)))
  }
  const resolve = (id: string) => {
    fetch(`/api/admin/checkins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "follow_up", follow_up_action: "No Action Needed", resolved: true }) })
      .then(() => setCheckins(cs => cs.map(c => c.id === id ? { ...c, resolved: true, urgent_flag: false, read: true } : c)))
  }
  const reviewIntake = (id: string, status: string) => {
    fetch("/api/admin/intakes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
      .then(() => setIntakes(xs => xs.map(i => i.id === id ? { ...i, status } : i)))
  }

  const urgent = checkins.filter(c => c.urgent_flag && !c.resolved)
  const recentCheckins = [...checkins].sort((a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at)).slice(0, 6)
  const recentIntakes = [...intakes].sort((a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at)).slice(0, 6)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="ov-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <WeeklyChart dates={checkins.map(c => c.submitted_at)} label="Check-ins per week" color="#34D399" />
        <WeeklyChart dates={intakes.map(i => i.submitted_at)} label="New applicants per week" color="var(--gold)" />
      </div>

      {/* Urgent check-ins — clickable to the exact record + resolve */}
      {urgent.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(239,68,68,0.4)" }}>
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", background: "#2d1111" }}>
            <AlertTriangle size={15} style={{ color: "#ef4444" }} />
            <h2 style={{ fontWeight: 700, fontSize: "0.92rem", color: "#ef4444" }}>Urgent Check-Ins ({urgent.length})</h2>
          </div>
          {urgent.map(c => (
            <div key={c.id} style={rowS}>
              <div onClick={() => router.push(`/admin/checkins?filter=urgent&focus=${c.id}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>{name(c)}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-mute)" }}>Progress <b style={sc(c.data?.progressScore)}>{c.data?.progressScore ?? "—"}</b> · Energy <b style={sc(c.data?.energyScore)}>{c.data?.energyScore ?? "—"}</b> · Mood <b style={sc(c.data?.moodScore)}>{c.data?.moodScore ?? "—"}</b></div>
              </div>
              <button onClick={() => router.push(`/admin/checkins?filter=urgent&focus=${c.id}`)} style={btn}>Open</button>
              <button onClick={() => resolve(c.id)} style={{ ...btn, color: "#22c55e", borderColor: "#22c55e" }}>Resolve</button>
            </div>
          ))}
        </div>
      )}

      <div className="ov-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Recent check-ins */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <Head title="Recent Check-Ins" href="/admin/checkins" />
          {recentCheckins.length === 0 ? <Empty text="No check-ins yet" /> : recentCheckins.map(c => (
            <div key={c.id} style={rowS}>
              <div onClick={() => router.push(`/admin/checkins?focus=${c.id}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontWeight: c.read ? 500 : 800, fontSize: "0.83rem" }}>{name(c)} {!c.read && <span style={tag("var(--gold)")}>NEW</span>}{c.resolved && <span style={tag("#22c55e")}>RESOLVED</span>}</div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-mute)" }}>P <b style={sc(c.data?.progressScore)}>{c.data?.progressScore ?? "—"}</b> · E <b style={sc(c.data?.energyScore)}>{c.data?.energyScore ?? "—"}</b> · M <b style={sc(c.data?.moodScore)}>{c.data?.moodScore ?? "—"}</b></div>
              </div>
              {!c.read && <button onClick={() => markSeen(c.id)} title="Mark seen" style={btn}><Check size={12} /> Seen</button>}
            </div>
          ))}
        </div>

        {/* Recent intakes */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <Head title="Recent Applicants" href="/admin/intakes" />
          {recentIntakes.length === 0 ? <Empty text="No intakes yet" /> : recentIntakes.map(i => (
            <div key={i.id} style={rowS}>
              <Link href={`/admin/intakes/${i.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                <div style={{ fontWeight: 600, fontSize: "0.83rem" }}>{i.first_name} {i.last_name} <span style={tag(statusColor(i.status))}>{i.status}</span></div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-mute)" }}>{i.email}</div>
              </Link>
              {i.status === "PENDING" && <>
                <button onClick={() => reviewIntake(i.id, "APPROVED")} style={{ ...btn, color: "#22c55e", borderColor: "#22c55e" }}>Approve</button>
                <button onClick={() => reviewIntake(i.id, "FLAGGED")} style={{ ...btn, color: "#ef4444", borderColor: "#ef4444" }}>Flag</button>
              </>}
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 900px){ .ov-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

const rowS: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--border)" }
const btn: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.65rem", borderRadius: "var(--radius-pill)", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-soft)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }
const tag = (color: string): React.CSSProperties => ({ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "var(--radius-pill)", color, background: "var(--surface-2)", marginLeft: "0.4rem", textTransform: "uppercase", letterSpacing: "0.03em" })
const statusColor = (s: string) => s === "APPROVED" ? "#34D399" : s === "FLAGGED" ? "#F87171" : "var(--gold)"

function Head({ title, href }: { title: string; href: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" }}>
    <h2 style={{ fontWeight: 700, fontSize: "0.9rem" }}>{title}</h2>
    <Link href={href} style={{ color: "var(--gold)", fontSize: "0.74rem", textDecoration: "none" }}>View all →</Link>
  </div>
}
function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: "center", padding: "1.75rem 1rem", color: "var(--text-mute)" }}><CheckCircle size={22} style={{ opacity: 0.4, marginBottom: "0.4rem" }} /><p style={{ fontSize: "0.8rem" }}>{text}</p></div>
}
