"use client"
import { useEffect, useState } from "react"
import { Mail, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  submitted_at: string
  data?: Record<string, unknown>
}

interface CheckIn {
  id: string
  submitted_at: string
  urgent_flag: boolean
  data: {
    weight?: string
    energyScore?: number
    moodScore?: number
    progressScore?: number
    sideEffects?: string[]
    notes?: string
  }
}

function MiniSparkLine({ values, color = "var(--gold)" }: { values: number[], color?: string }) {
  if (values.length < 2) return <span style={{ color: "var(--text-mute)", fontSize: "0.75rem" }}>—</span>
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1
  const w = 80; const h = 28
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ")
  const last = values[values.length - 1]; const prev = values[values.length - 2]
  const trend = last > prev ? "up" : last < prev ? "down" : "flat"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>
      <span style={{ fontSize: "0.8rem", fontWeight: 700, color }}>
        {last}{trend === "up" ? " ↑" : trend === "down" ? " ↓" : ""}
      </span>
    </div>
  )
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/intakes").then(r => r.json()),
      fetch("/api/admin/checkins").then(r => r.json()),
    ]).then(([intakeData, checkinData]) => {
      setClients(intakeData.intakes ?? [])
      setCheckins(checkinData.checkins ?? [])
      setLoading(false)
    })
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/intakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    })
    setClients(p => p.map(c => c.id === id ? { ...c, status } : c))
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : p)
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const clientCheckins = (email: string) => checkins.filter(c => {
    // Match checkins by email stored in data or by a client_email field
    return (c as CheckIn & { client_email?: string }).client_email === email
  })

  const weightVals = (email: string) => clientCheckins(email)
    .filter(c => c.data.weight && !isNaN(Number(c.data.weight)))
    .map(c => Number(c.data.weight))
    .slice(-8)

  const scoreVals = (email: string, key: "energyScore" | "moodScore" | "progressScore") =>
    clientCheckins(email).filter(c => c.data[key] !== undefined).map(c => c.data[key]!).slice(-8)

  const statusColor = (s: string) => ({
    APPROVED: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    FLAGGED:  { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
    PENDING:  { bg: "rgba(201,168,76,0.15)", color: "var(--gold)" },
  }[s] ?? { bg: "transparent", color: "var(--text-mute)" })

  return (
    <div style={{ display: "flex", gap: "1.5rem", height: "calc(100vh - 4rem)" }}>
      <div style={{ flex: 1, overflow: "auto" }}>
        <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.5rem", marginBottom: "1.5rem" }}>Clients</h1>
        <input
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "1.25rem", maxWidth: 360 }}
        />
        {loading ? <p style={{ color: "var(--text-mute)" }}>Loading...</p> : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  {["Name", "Email", "Status", "Weight Trend", "Energy", "Date", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.75rem 1rem", color: "var(--text-mute)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                    style={{ borderBottom: "1px solid var(--border)", background: selected?.id === c.id ? "var(--surface-2)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", cursor: "pointer" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-mute)" }}>{c.email}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: 3, fontSize: "0.7rem", fontWeight: 700, ...statusColor(c.status) }}>{c.status}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}><MiniSparkLine values={weightVals(c.email)} color="var(--gold)" /></td>
                    <td style={{ padding: "0.75rem 1rem" }}><MiniSparkLine values={scoreVals(c.email, "energyScore")} color="#60a5fa" /></td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-mute)", fontSize: "0.8rem" }}>{new Date(c.submitted_at).toLocaleDateString()}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--gold)", fontSize: "0.8rem" }}>
                        <Mail size={12} /> Email
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-mute)" }}>No clients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ width: 380, flexShrink: 0, overflow: "auto" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>{selected.first_name} {selected.last_name}</h2>
                <p style={{ color: "var(--text-mute)", fontSize: "0.8rem" }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {["APPROVED", "PENDING", "FLAGGED"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)}
                  style={{ flex: 1, padding: "0.4rem", borderRadius: "var(--radius)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", ...statusColor(s), border: `1px solid ${statusColor(s).color}`, opacity: selected.status === s ? 1 : 0.5 }}>
                  {s}
                </button>
              ))}
            </div>

            {weightVals(selected.email).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-mute)", marginBottom: "0.5rem" }}>Weight History</div>
                <MiniSparkLine values={weightVals(selected.email)} color="var(--gold)" />
              </div>
            )}

            {scoreVals(selected.email, "energyScore").length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-mute)", marginBottom: "0.25rem" }}>Energy</div>
                <MiniSparkLine values={scoreVals(selected.email, "energyScore")} color="#60a5fa" />
              </div>
            )}

            {scoreVals(selected.email, "moodScore").length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-mute)", marginBottom: "0.25rem" }}>Mood</div>
                <MiniSparkLine values={scoreVals(selected.email, "moodScore")} color="#4ade80" />
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-mute)", marginBottom: "0.75rem" }}>Recent Check-Ins</div>
              {clientCheckins(selected.email).length === 0 && <p style={{ color: "var(--text-mute)", fontSize: "0.8rem" }}>No check-ins yet.</p>}
              {clientCheckins(selected.email).slice(-5).reverse().map(c => (
                <div key={c.id} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <span style={{ fontWeight: 600 }}>{new Date(c.submitted_at).toLocaleDateString()}</span>
                    {c.urgent_flag && <span style={{ color: "#f87171", fontWeight: 700 }}>⚠ Urgent</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginTop: "0.2rem" }}>
                    {c.data.weight && `${c.data.weight} lbs · `}
                    {c.data.energyScore && `Energy ${c.data.energyScore}/10 · `}
                    {c.data.moodScore && `Mood ${c.data.moodScore}/10`}
                  </div>
                  {c.data.notes && <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginTop: "0.3rem", lineHeight: 1.5 }}>{c.data.notes}</p>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <a href={`mailto:${selected.email}`} className="btn-gold"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", textDecoration: "none", fontSize: "0.85rem", padding: "0.6rem" }}>
                <Mail size={14} /> Send Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
