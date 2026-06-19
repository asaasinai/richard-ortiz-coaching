"use client"
import { useEffect, useState, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, X, CheckCircle, Mail } from "lucide-react"

type Filter = "all" | "unread" | "urgent" | "resolved" | "thisweek"

interface CheckIn {
  id: string
  submitted_at: string
  urgent_flag: boolean
  client_email: string | null
  first_name?: string
  last_name?: string
  client_intake_id?: string
  read?: boolean
  resolved?: boolean
  follow_up_action?: string | null
  follow_up_notes?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  data: {
    weight?: string
    progressScore?: number
    energyScore?: number
    moodScore?: number
    sideEffects?: string[]
    missedDoses?: string
    notes?: string
  }
}

interface Counts { all?: string; unread?: string; urgent?: string; resolved?: string; thisweek?: string }

const FILTERS: { id: Filter; label: string; key: keyof Counts }[] = [
  { id: "all",      label: "All",       key: "all" },
  { id: "unread",   label: "Unread",    key: "unread" },
  { id: "urgent",   label: "Urgent",    key: "urgent" },
  { id: "resolved", label: "Resolved",  key: "resolved" },
  { id: "thisweek", label: "This Week", key: "thisweek" },
]

const FOLLOW_UP_OPTIONS = ["Client Contacted", "Protocol Adjusted", "Dosage Changed", "Referred Out", "No Action Needed"]

function initials(c: CheckIn) {
  const f = c.first_name?.[0] ?? c.client_email?.[0] ?? "?"
  const l = c.last_name?.[0] ?? ""
  return (f + l).toUpperCase()
}

function CheckInsInner() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [counts, setCounts] = useState<Counts>({})
  const [selected, setSelected] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [fuAction, setFuAction] = useState(FOLLOW_UP_OPTIONS[0])
  const [fuNotes, setFuNotes] = useState("")
  const [fuResolved, setFuResolved] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const load = useCallback((f: Filter) => {
    setLoading(true)
    const url = f === "all" ? "/api/admin/checkins" : `/api/admin/checkins?filter=${f}`
    fetch(url).then(r => r.json()).then(d => {
      setCheckins(d.checkins ?? [])
      setCounts(d.counts ?? {})
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const urlFilter = searchParams.get("filter") as Filter | null
    if (urlFilter && FILTERS.some(f => f.id === urlFilter)) setFilter(urlFilter)
  }, [searchParams])

  useEffect(() => { load(filter) }, [filter, load])

  const openCard = (c: CheckIn) => {
    setSelected(c)
    setShowFollowUp(c.urgent_flag && !c.resolved)
    setFuAction(c.follow_up_action || FOLLOW_UP_OPTIONS[0])
    setFuNotes(c.follow_up_notes || "")
    setFuResolved(!!c.resolved)
    if (!c.read) {
      fetch(`/api/admin/checkins/${c.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", read: true }),
      }).then(() => {
        setCheckins(cs => cs.map(x => x.id === c.id ? { ...x, read: true } : x))
        setCounts(p => ({ ...p, unread: String(Math.max(0, Number(p.unread ?? 0) - 1)) }))
      })
    }
  }

  const exportCsv = () => {
    const cols = ["Date", "Client", "Email", "Progress", "Energy", "Mood", "Urgent", "Resolved", "Notes"]
    const lines = [cols.join(",")]
    for (const c of checkins) lines.push([
      new Date(c.submitted_at).toISOString().slice(0, 10),
      `"${c.first_name ? `${c.first_name} ${c.last_name ?? ""}` : ""}"`, `"${c.client_email}"`,
      c.data.progressScore ?? "", c.data.energyScore ?? "", c.data.moodScore ?? "",
      c.urgent_flag ? "yes" : "no", c.resolved ? "yes" : "no", `"${(c.data.notes ?? "").replace(/"/g, "'")}"`,
    ].join(","))
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `roc-checkins-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const markAllRead = () => {
    fetch("/api/admin/checkins", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    }).then(() => { setCheckins(cs => cs.map(x => ({ ...x, read: true }))); setCounts(p => ({ ...p, unread: "0" })) })
  }

  const submitFollowUp = () => {
    if (!selected) return
    setSaving(true)
    fetch(`/api/admin/checkins/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "follow_up", follow_up_action: fuAction, follow_up_notes: fuNotes, resolved: fuResolved }),
    }).then(r => r.json()).then(() => {
      setSaving(false)
      load(filter)
      setSelected(s => s ? { ...s, follow_up_action: fuAction, follow_up_notes: fuNotes, resolved: fuResolved, urgent_flag: fuResolved ? false : s.urgent_flag } : s)
    })
  }

  const scoreBar = (label: string, val: number | undefined) => val !== undefined ? (
    <div key={label} style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
        <span style={{ color: "var(--text-mute)" }}>{label}</span>
        <span style={{ fontWeight: 700, color: val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171" }}>{val}/10</span>
      </div>
      <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${val * 10}%`, background: val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171", transition: "width 0.3s" }} />
      </div>
    </div>
  ) : null

  const DetailPanel = () => !selected ? null : (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div>
          {selected.first_name && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selected.first_name} {selected.last_name}</span>
              {selected.client_intake_id && (
                <button onClick={() => router.push(`/admin/clients/${selected.client_intake_id}`)}
                  style={{ fontSize: "0.72rem", color: "var(--gold)", background: "none", border: "1px solid var(--gold)", borderRadius: 3, padding: "0.15rem 0.5rem", cursor: "pointer", fontWeight: 600 }}>
                  View Client →
                </button>
              )}
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-mute)" }}>
            {new Date(selected.submitted_at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {new Date(selected.submitted_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </div>
        </div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem" }}>
          <X size={18} />
        </button>
      </div>

      {selected.resolved && (
        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: "var(--radius)", padding: "0.6rem 0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <CheckCircle size={13} style={{ color: "#4ade80" }} />
          <span style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 700 }}>Resolved{selected.resolved_by ? ` by ${selected.resolved_by}` : ""}{selected.follow_up_action ? ` — ${selected.follow_up_action}` : ""}</span>
        </div>
      )}
      {selected.urgent_flag && !selected.resolved && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: "var(--radius)", padding: "0.6rem 0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={13} style={{ color: "#f87171" }} />
          <span style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 700 }}>Urgent follow-up requested</span>
        </div>
      )}

      {scoreBar("Overall Progress", selected.data.progressScore)}
      {scoreBar("Energy Level", selected.data.energyScore)}
      {scoreBar("Mood & Wellbeing", selected.data.moodScore)}
      {selected.data.weight && <p style={{ fontSize: "0.82rem", marginTop: "0.75rem" }}><span style={{ color: "var(--text-mute)" }}>Weight: </span>{selected.data.weight} lbs</p>}
      {(selected.data.sideEffects?.length ?? 0) > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Side Effects</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {selected.data.sideEffects?.map(s => (
              <span key={s} style={{ padding: "0.2rem 0.5rem", background: "var(--surface-2)", borderRadius: 3, fontSize: "0.75rem", color: "var(--text-soft)" }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {selected.data.notes && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Client Notes</p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", lineHeight: 1.6 }}>{selected.data.notes}</p>
        </div>
      )}

      {/* Follow-up action panel */}
      {showFollowUp ? (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>Follow-Up</p>
          <label style={{ fontSize: "0.75rem", color: "var(--text-mute)", display: "block", marginBottom: "0.25rem" }}>Action taken</label>
          <select value={fuAction} onChange={e => setFuAction(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.82rem", marginBottom: "0.6rem" }}>
            {FOLLOW_UP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <label style={{ fontSize: "0.75rem", color: "var(--text-mute)", display: "block", marginBottom: "0.25rem" }}>Admin notes</label>
          <textarea value={fuNotes} onChange={e => setFuNotes(e.target.value)} rows={3}
            style={{ width: "100%", padding: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.82rem", marginBottom: "0.6rem", resize: "vertical" }} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", marginBottom: "0.75rem", cursor: "pointer" }}>
            <input type="checkbox" checked={fuResolved} onChange={e => setFuResolved(e.target.checked)} />
            Mark as Resolved (clears urgent flag)
          </label>
          <button onClick={submitFollowUp} disabled={saving}
            style={{ width: "100%", padding: "0.6rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: "0.85rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save Follow-Up"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setShowFollowUp(true)}
            style={{ flex: 1, padding: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            + Add Follow-Up
          </button>
          {selected.client_email && (
            <button onClick={() => router.push(`/admin/sms?to=${encodeURIComponent(selected.client_email!)}`)}
              style={{ flex: 1, padding: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
              <Mail size={13} /> SMS Client
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,4vw,1.5rem)" }}>Check-Ins</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCsv}
            style={{ padding: "0.4rem 0.9rem", borderRadius: "var(--radius)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: "var(--surface)", color: "var(--text-mute)", border: "1px solid var(--border)" }}>
            Export CSV
          </button>
          <button onClick={markAllRead}
            style={{ padding: "0.4rem 0.9rem", borderRadius: "var(--radius)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: "var(--surface)", color: "var(--text-mute)", border: "1px solid var(--border)" }}>
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter pill tabs with counts */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {FILTERS.map(f => {
          const n = counts[f.key]
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "0.4rem 0.9rem", borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
              background: filter === f.id ? "var(--gold)" : "var(--surface)",
              color: filter === f.id ? "#000" : "var(--text-mute)",
              border: `1px solid ${filter === f.id ? "var(--gold)" : "var(--border)"}`,
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              {f.id === "urgent" && "⚠ "}{f.label}
              {n !== undefined && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>{n}</span>}
            </button>
          )
        })}
      </div>

      {/* Mobile full-screen modal for detail */}
      {selected && (
        <div className="checkin-mobile-modal">
          <div style={{ padding: "1rem" }}><DetailPanel /></div>
        </div>
      )}

      {/* Desktop: side-by-side layout */}
      <div className="checkin-desktop-layout">
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? <p style={{ color: "var(--text-mute)" }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {checkins.map(c => {
                const unread = !c.read
                return (
                  <div key={c.id} onClick={() => openCard(c)}
                    style={{
                      background: c.urgent_flag && !c.resolved ? "rgba(248,113,113,0.07)" : selected?.id === c.id ? "var(--surface-2)" : "var(--surface)",
                      borderRadius: "var(--radius)", padding: "0.875rem 1rem", cursor: "pointer",
                      borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
                      borderLeft: c.urgent_flag && !c.resolved ? "3px solid #f87171" : unread ? "3px solid var(--gold)" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", gap: "0.75rem",
                    }}>
                    {/* initials circle */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-2)", color: "var(--gold)", fontWeight: 700, fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {initials(c)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: unread ? 800 : 600, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                        {c.first_name ? `${c.first_name} ${c.last_name ?? ""}` : c.client_email}
                        {c.first_name && <span style={{ color: "var(--text-mute)", fontWeight: 400, fontSize: "0.78rem", marginLeft: "0.5rem" }}>{c.client_email}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.76rem" }}>
                        {c.data.progressScore !== undefined && <span style={chip(c.data.progressScore)}>P {c.data.progressScore}</span>}
                        {c.data.energyScore !== undefined && <span style={chip(c.data.energyScore)}>E {c.data.energyScore}</span>}
                        {c.data.moodScore !== undefined && <span style={chip(c.data.moodScore)}>M {c.data.moodScore}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                      <span style={{ color: "var(--text-mute)", fontSize: "0.74rem" }}>{new Date(c.submitted_at).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        {c.resolved && <CheckCircle size={13} style={{ color: "#4ade80" }} />}
                        {c.urgent_flag && !c.resolved && <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.15)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>URGENT</span>}
                        {unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />}
                      </div>
                    </div>
                  </div>
                )
              })}
              {checkins.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-mute)" }}>
                  <CheckCircle size={32} style={{ opacity: 0.4, marginBottom: "0.75rem" }} />
                  <p style={{ fontWeight: 700, color: "var(--text)" }}>All clear</p>
                  <p style={{ fontSize: "0.85rem" }}>No check-ins {filter !== "all" ? `in “${filter}”` : "yet"}.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {selected && (
          <div style={{ width: 380, flexShrink: 0, overflow: "auto" }}><DetailPanel /></div>
        )}
      </div>

      <style>{`
        .checkin-desktop-layout { display: flex; gap: 1.5rem; min-height: calc(100vh - 12rem); }
        .checkin-mobile-modal { display: none; }
        @media (max-width: 767px) {
          .checkin-desktop-layout > *:last-child { display: none; }
          .checkin-mobile-modal { display: block; position: fixed; inset: 52px 0 0 0; background: var(--bg); z-index: 200; overflow-y: auto; }
        }
      `}</style>
    </div>
  )
}

function chip(val: number): React.CSSProperties {
  const color = val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171"
  return { color, background: "var(--surface-2)", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 700 }
}

export default function AdminCheckInsPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-mute)" }}>Loading…</p>}>
      <CheckInsInner />
    </Suspense>
  )
}
