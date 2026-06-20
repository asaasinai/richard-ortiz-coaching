"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { DollarSign, TrendingUp, Users, Percent, Download } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"
import { AreaChart, Donut } from "@/components/admin/Charts"

interface ClientRevRow {
  client_id: string; name: string; email: string
  peptide: string; strength: string | null
  monthly_rate: number; billing_status: string; billing_notes: string | null
  assigned_at: string; fifo_cogs: number; gross_margin_pct: number | null
  orders_this_month?: number
}

interface RevenueData {
  mrr: number; arr: number; activeCount: number; avgMargin?: number
  byStatus: Record<string, number>
  clients: ClientRevRow[]
  byProtocol?: { peptide: string; avg_margin: number; clients: number; mrr: number }[]
  trend: { month: string; revenue: string }[]
}

const TREND_RANGES = [
  { label: "Last 3 Months", n: 3 }, { label: "Last 6 Months", n: 6 }, { label: "Last 12 Months", n: 12 },
]

function ProtocolChart({ rows }: { rows: { peptide: string; avg_margin: number; clients: number }[] }) {
  if (!rows.length) return <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No active protocols yet.</p>
  const max = Math.max(...rows.map(r => r.avg_margin), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {rows.slice(0, 8).map(r => (
        <div key={r.peptide} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ width: 110, fontSize: "0.74rem", color: "var(--text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{r.peptide}</span>
          <div style={{ flex: 1, height: 16, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${Math.max((r.avg_margin / max) * 100, 2)}%`, height: "100%", background: "var(--gold)", borderRadius: 4 }} />
          </div>
          <span style={{ width: 48, textAlign: "right", fontSize: "0.76rem", fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{r.avg_margin.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  active:        { bg: "rgba(52,211,153,0.15)",  color: "#34D399" },
  paused:        { bg: "rgba(251,191,36,0.12)",  color: "#FBBF24" },
  churned:       { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  complimentary: { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
}

// Smooth area chart for monthly revenue trend
function TrendChart({ trend }: { trend: { month: string; revenue: string }[] }) {
  if (!trend.length) return <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No trend data yet.</p>
  return (
    <>
      <AreaChart data={trend.map(t => ({ value: Number(t.revenue) }))} color="var(--gold)" height={90} label="revenue" />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem", fontSize: "0.6rem", color: "var(--text-mute)" }}>
        <span>{trend[0]?.month.slice(5)}</span>
        <span>{trend[trend.length - 1]?.month.slice(5)}</span>
      </div>
    </>
  )
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editRate, setEditRate] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [trendN, setTrendN] = useState(6)

  useEffect(() => {
    fetch("/api/admin/revenue").then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const exportCsv = () => {
    if (!data) return
    const cols = ["Client", "Email", "Protocol", "Rate/mo", "Status", "FIFO COGS/mo", "Margin %", "Orders This Month", "Since"]
    const lines = [cols.join(",")]
    for (const c of data.clients) {
      lines.push([
        `"${c.name}"`, `"${c.email}"`, `"${c.peptide}${c.strength ? " " + c.strength : ""}"`,
        c.monthly_rate, c.billing_status, c.fifo_cogs, c.gross_margin_pct ?? "",
        c.orders_this_month ?? 0, new Date(c.assigned_at).toISOString().slice(0, 10),
      ].join(","))
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `roc-revenue-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const startEdit = (c: ClientRevRow) => {
    setEditing(c.client_id)
    setEditRate(String(c.monthly_rate))
    setEditStatus(c.billing_status)
    setEditNotes(c.billing_notes ?? "")
  }

  const saveEdit = async (clientId: string) => {
    setSaving(true)
    await fetch("/api/admin/assign-protocol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, monthly_rate: Number(editRate), billing_status: editStatus, billing_notes: editNotes }),
    })
    setSaving(false)
    setEditing(null)
    // Refresh
    const d = await fetch("/api/admin/revenue").then(r => r.json())
    setData(d)
  }

  if (loading) return (
    <div>
      <PageHeader title="Revenue" subtitle="Your recurring income, client billing, and margin after product cost." backHref="/admin" backLabel="Overview" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
      </div>
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  )
  if (!data) return null

  const marginAvg = data.avgMargin ?? null
  const trendSlice = data.trend.slice(-trendN)
  const STATUS_HEX: Record<string, string> = { active: "#34D399", paused: "#FBBF24", churned: "#F87171", complimentary: "#60A5FA" }
  const statusSegments = Object.entries(data.byStatus).map(([s, n]) => ({ label: s, value: Number(n), color: STATUS_HEX[s] ?? "var(--text-mute)" }))

  return (
    <div>
      <PageHeader title="Revenue" subtitle="Your recurring income, client billing, and margin after product cost." backHref="/admin" backLabel="Overview" />

      {/* Top KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { icon: DollarSign, label: "MRR",           value: fmt(data.mrr),              color: "var(--gold)", href: "#billing" },
          { icon: TrendingUp, label: "ARR",            value: fmt(data.arr),              color: "#4ade80",     href: "#billing" },
          { icon: Users,      label: "Active Clients", value: String(data.activeCount),   color: "#60a5fa",     href: "/admin/clients?status=APPROVED" },
          { icon: Percent,    label: "Avg Margin",     value: marginAvg !== null ? `${marginAvg.toFixed(1)}%` : "—", color: "#c084fc", href: "#by-protocol" },
        ].map(card => (
          <Link key={card.label} href={card.href} className="stat-card-link" style={{ textDecoration: "none" }}>
            <div className="card stat-card" style={{ padding: "1.1rem 1.25rem", cursor: "pointer" }}>
              <card.icon size={16} style={{ color: card.color, marginBottom: "0.5rem" }} />
              <div style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.5rem", color: "var(--text)", lineHeight: 1 }}>{card.value}</div>
              <div style={{ color: "var(--text-mute)", fontSize: "0.78rem", marginTop: "0.35rem", fontWeight: 600 }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Status breakdown + Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>Clients by billing</p>
          {statusSegments.length ? <Donut segments={statusSegments} size={120} thickness={18} /> : <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No clients yet.</p>}
        </div>
        <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>Monthly Revenue Trend</p>
            <select value={trendN} onChange={e => setTrendN(Number(e.target.value))} style={{ fontSize: "0.74rem", padding: "0.2rem 0.4rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-soft)" }}>
              {TREND_RANGES.map(r => <option key={r.n} value={r.n}>{r.label}</option>)}
            </select>
          </div>
          <TrendChart trend={trendSlice} />
        </div>
      </div>

      {/* Revenue by Protocol */}
      <div id="by-protocol" className="card" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Margin by protocol</p>
        <p style={{ color: "var(--text-mute)", fontSize: "0.78rem", marginBottom: "0.85rem" }}>Average profit kept after product cost, per peptide.</p>
        <ProtocolChart rows={data.byProtocol ?? []} />
      </div>

      {/* Client billing table */}
      <div id="billing" className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ fontWeight: 700, fontSize: "0.95rem" }}>Client Billing</h2>
          <button onClick={exportCsv} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-soft)", fontSize: "0.76rem", fontWeight: 600, padding: "0.35rem 0.7rem", cursor: "pointer" }}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        {/* Desktop table */}
        <div className="rev-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                {["Client", "Protocol", "Rate/mo", "Status", "Product cost/mo", "Margin", "Since", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0.6rem 0.875rem", color: "var(--text-mute)", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c, i) => (
                <tr key={c.client_id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "0.7rem 0.875rem" }}>
                    <Link href={`/admin/clients/${c.client_id}?tab=billing`} style={{ textDecoration: "none" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{c.name || "—"}</p>
                      <p style={{ color: "var(--text-mute)", fontSize: "0.75rem" }}>{c.email}</p>
                    </Link>
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem", color: "var(--text-soft)" }}>
                    {c.peptide}{c.strength ? ` ${c.strength}` : ""}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem" }}>
                    {editing === c.client_id ? (
                      <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)}
                        style={{ width: 80, padding: "0.25rem 0.4rem", fontSize: "0.85rem" }}/>
                    ) : (
                      <button onClick={() => startEdit(c)} style={{ background: "none", border: "none", color: c.monthly_rate ? "var(--gold)" : "var(--text-mute)", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", padding: 0 }}>
                        {c.monthly_rate ? fmt(c.monthly_rate) : "Set rate"}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem" }}>
                    {editing === c.client_id ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.3rem" }}>
                        {["active","paused","churned","complimentary"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={{ ...(STATUS_COLOR[c.billing_status] ?? {}), padding: "0.2rem 0.55rem", borderRadius: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                        {c.billing_status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem", color: "var(--text-mute)", fontSize: "0.82rem" }}>
                    {c.fifo_cogs ? fmt(c.fifo_cogs) : "—"}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem" }}>
                    {c.gross_margin_pct !== null ? (
                      <span style={{ color: c.gross_margin_pct > 50 ? "#4ade80" : c.gross_margin_pct > 20 ? "var(--gold)" : "#f87171", fontWeight: 700, fontSize: "0.85rem" }}>
                        {c.gross_margin_pct.toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem", color: "var(--text-mute)", fontSize: "0.78rem" }}>
                    {new Date(c.assigned_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.7rem 0.875rem" }}>
                    {editing === c.client_id ? (
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button onClick={() => saveEdit(c.client_id)} disabled={saving}
                          style={{ background: "var(--gold)", color: "#000", border: "none", borderRadius: "var(--radius)", padding: "0.3rem 0.65rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                          {saving ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ background: "var(--surface-2)", color: "var(--text-mute)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.3rem 0.65rem", fontSize: "0.78rem", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(c)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-mute)", fontSize: "0.75rem", padding: "0.25rem 0.6rem", cursor: "pointer" }}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!data.clients.length && (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-mute)" }}>No client protocols yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="rev-card-list" style={{ display: "none", flexDirection: "column" }}>
          {data.clients.map(c => (
            <div key={c.client_id} style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name || "—"}</span>
                <span style={{ ...(STATUS_COLOR[c.billing_status] ?? {}), padding: "0.15rem 0.5rem", borderRadius: 3, fontSize: "0.7rem", fontWeight: 700 }}>{c.billing_status}</span>
              </div>
              <p style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{c.peptide}{c.strength ? ` ${c.strength}` : ""}</p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem" }}>
                <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.875rem" }}>{c.monthly_rate ? fmt(c.monthly_rate) : "—"}/mo</span>
                {c.gross_margin_pct !== null && <span style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>Margin: {c.gross_margin_pct.toFixed(1)}%</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .rev-table-wrap { overflow-x: auto; }
        @media (max-width: 767px) {
          .rev-table-wrap { display: none; }
          .rev-card-list  { display: flex !important; }
        }
        @media (max-width: 900px) {
          .rev-table-wrap table th:nth-child(5),
          .rev-table-wrap table td:nth-child(5) { display: none; }
        }
      `}</style>
    </div>
  )
}
