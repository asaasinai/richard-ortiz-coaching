"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, User, Calendar, Clock, Package, Zap, CheckCircle } from "lucide-react"

interface OpsData {
  noProtocol: { id: string; first_name: string; last_name: string; email: string; submitted_at: string }[]
  noStartDate: { client_id: string; first_name: string; last_name: string; email: string; peptide: string; assigned_at: string }[]
  pendingDayOne: { client_id: string; first_name: string; last_name: string; email: string; peptide: string; protocol_start_date: string }[]
  overdueCheckin: { client_id: string; first_name: string; last_name: string; email: string; last_checkin: string | null; days_since: number }[]
  urgentFlags: { id: string; client_email: string; submitted_at: string }[]
  inventoryAlerts: { id: string; peptide_name: string; strength: string; strength_unit: string; units_in_stock: string }[]
  counts: Record<string, number>
}

const SEV = {
  critical: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)", color: "#f87171", dot: "#f87171" },
  warning:  { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24", dot: "#fbbf24" },
  info:     { bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.3)",  color: "#60a5fa", dot: "#60a5fa" },
}

function Section({ title, icon: Icon, count, sev, children }: {
  title: string; icon: React.ElementType; count: number
  sev: keyof typeof SEV; children: React.ReactNode
}) {
  const s = SEV[sev]
  return (
    <div style={{ border: `1px solid ${s.border}`, borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "1.25rem" }}>
      <div style={{ background: s.bg, padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Icon size={16} style={{ color: s.color }} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: s.color }}>{title}</span>
        </div>
        <span style={{ background: s.color, color: "#000", borderRadius: "999px", padding: "0.1rem 0.6rem", fontSize: "0.75rem", fontWeight: 900 }}>{count}</span>
      </div>
      <div style={{ padding: count === 0 ? "1rem 1.25rem" : "0" }}>
        {count === 0
          ? <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}><CheckCircle size={14} style={{ color: "#4ade80" }}/> All clear</p>
          : children}
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
      {children}
    </div>
  )
}

export default function OpsPage() {
  const [data, setData] = useState<OpsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/ops").then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const totalActions = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div>
      <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,4vw,1.75rem)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
        Ops Queue
      </h1>
      <p style={{ color: "var(--text-mute)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {loading ? "Loading…" : totalActions === 0 ? "Everything is clear — no action items." : `${totalActions} action item${totalActions !== 1 ? "s" : ""} need attention`}
      </p>

      {loading && (
        <div style={{ color: "var(--text-mute)", padding: "2rem", textAlign: "center" }}>Loading…</div>
      )}

      {!loading && data && (
        <>
          {/* Urgent flags */}
          <Section title="Urgent Check-In Flags" icon={AlertTriangle} count={data.urgentFlags.length} sev="critical">
            {data.urgentFlags.map(f => (
              <Row key={f.id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{f.client_email}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{new Date(f.submitted_at).toLocaleDateString()}</p>
                </div>
                <Link href="/admin/checkins" style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>View →</Link>
              </Row>
            ))}
          </Section>

          {/* Inventory alerts */}
          <Section title="Inventory Reorder Alerts" icon={Package} count={data.inventoryAlerts.length} sev="critical">
            {data.inventoryAlerts.map(s => (
              <Row key={s.id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.peptide_name} {s.strength}{s.strength_unit}</p>
                  <p style={{ color: "#f87171", fontSize: "0.78rem", fontWeight: 700 }}>{Number(s.units_in_stock)} units remaining</p>
                </div>
                <Link href="/admin/inventory" style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>Inventory →</Link>
              </Row>
            ))}
          </Section>

          {/* Overdue check-ins */}
          <Section title="Overdue 2-Week Check-Ins" icon={Clock} count={data.overdueCheckin.length} sev="warning">
            {data.overdueCheckin.map(c => (
              <Row key={c.client_id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.first_name} {c.last_name}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>
                    {c.last_checkin ? `Last check-in ${c.days_since} days ago` : "No check-ins yet"}
                  </p>
                </div>
                <a href={`mailto:${c.email}`} style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>Email →</a>
              </Row>
            ))}
          </Section>

          {/* Day-1 trigger pending */}
          <Section title="Day-1 Check-In Not Sent" icon={Zap} count={data.pendingDayOne.length} sev="warning">
            {data.pendingDayOne.map(c => (
              <Row key={c.client_id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.first_name} {c.last_name}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{c.peptide} · Started {new Date(c.protocol_start_date).toLocaleDateString()}</p>
                </div>
                <Link href="/admin/clients" style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>Client →</Link>
              </Row>
            ))}
          </Section>

          {/* No start date */}
          <Section title="Protocol — No Start Date Set" icon={Calendar} count={data.noStartDate.length} sev="info">
            {data.noStartDate.map(c => (
              <Row key={c.client_id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.first_name} {c.last_name}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{c.peptide} · Assigned {new Date(c.assigned_at).toLocaleDateString()}</p>
                </div>
                <Link href="/admin/clients" style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>Set Date →</Link>
              </Row>
            ))}
          </Section>

          {/* No protocol */}
          <Section title="Approved — No Protocol Assigned" icon={User} count={data.noProtocol.length} sev="info">
            {data.noProtocol.map(c => (
              <Row key={c.id}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.first_name} {c.last_name}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{c.email} · Approved {new Date(c.submitted_at).toLocaleDateString()}</p>
                </div>
                <Link href="/admin/clients" style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>Assign →</Link>
              </Row>
            ))}
          </Section>
        </>
      )}
    </div>
  )
}
