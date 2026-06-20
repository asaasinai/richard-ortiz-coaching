"use client"
import { useEffect, useState, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, X, CheckCircle, Mail, ArrowUp, ArrowDown, Download, CheckCheck } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"

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

  // Deep-link from Overview: ?focus=<id> auto-opens that check-in's detail
  const focusId = searchParams.get("focus")
  useEffect(() => {
    if (!focusId || loading) return
    const c = checkins.find(x => x.id === focusId)
    if (c && selected?.id !== c.id) openCard(c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, loading, checkins])

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

  // Inline row actions — manage the queue without opening the detail
  const rowMarkSeen = (c: CheckIn) => {
    fetch(`/api/admin/checkins/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read", read: true }) })
      .then(() => { setCheckins(cs => cs.map(x => x.id === c.id ? { ...x, read: true } : x)); setCounts(p => ({ ...p, unread: String(Math.max(0, Number(p.unread ?? 0) - 1)) })) })
  }
  const rowResolve = (c: CheckIn) => {
    fetch(`/api/admin/checkins/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "follow_up", follow_up_action: "No Action Needed", resolved: true }) })
      .then(() => load(filter))
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
          {!selected.first_name && (
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem" }}>
              {selected.client_email || "Unlinked check-in"}
              {!selected.client_email && <span style={{ display: "block", fontWeight: 400, fontSize: "0.74rem", color: "var(--text-mute)", marginTop: "0.15rem" }}>No client record matched this submission (anonymous / email missing).</span>}
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

  // Per-client progress trend (vs that client's previous check-in in this list)
  const byClient: Record<string, CheckIn[]> = {}
  for (const c of [...checkins].sort((a, b) => +new Date(a.submitted_at) - +new Date(b.submitted_at))) {
    const k = c.client_email || c.id;(byClient[k] ??= []).push(c)
  }
  const trendFor = (c: CheckIn): "up" | "down" | null => {
    const arr = byClient[c.client_email || c.id]; const i = arr.indexOf(c)
    if (i <= 0) return null
    const cur = c.data.progressScore ?? c.data.energyScore
    const prev = arr[i - 1].data.progressScore ?? arr[i - 1].data.energyScore
    if (cur === undefined || prev === undefined) return null
    return cur > prev ? "up" : cur < prev ? "down" : null
  }

  return (
    <div>
      <PageHeader title="Check-Ins" subtitle="Weekly client updates. Read them, reply, and resolve anything urgent." backHref="/admin" backLabel="Overview"
        action={<>
          <button onClick={exportCsv} className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.5rem 0.9rem" }}><Download size={14} /> Export</button>
          <button onClick={markAllRead} className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.5rem 0.9rem" }}><CheckCheck size={14} /> Mark all read</button>
        </>} />

      {/* Filter pills with counts */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {FILTERS.map(f => {
          const n = counts[f.key]
          return (
            <button key={f.id} className="pill" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.id === "urgent" && <AlertTriangle size={12} />}{f.label}
              {n !== undefined && <span style={{ opacity: 0.6 }}>{n}</span>}
            </button>
          )
        })}
      </div>

      {/* List with inline-expanding detail (works on mobile) */}
      <div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 66 }} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {checkins.map(c => {
                const unread = !c.read
                const isOpen = selected?.id === c.id
                return (
                  <div key={c.id}>
                  <div onClick={() => isOpen ? setSelected(null) : openCard(c)}
                    style={{
                      background: c.urgent_flag && !c.resolved ? "rgba(248,113,113,0.07)" : isOpen ? "var(--surface-2)" : "var(--surface)",
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
                      <div style={{ fontWeight: unread ? 800 : 600, fontSize: "0.875rem", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span>{c.first_name ? `${c.first_name} ${c.last_name ?? ""}` : (c.client_email || "Unlinked check-in")}</span>
                        {c.first_name && c.client_email && <span style={{ color: "var(--text-mute)", fontWeight: 400, fontSize: "0.78rem" }}>{c.client_email}</span>}
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "var(--radius-pill)", background: unread ? "var(--gold-dim)" : "var(--surface-2)", color: unread ? "var(--gold-light)" : "var(--text-mute)" }}>{unread ? "NEW" : "SEEN"}</span>
                        {(() => { const t = trendFor(c); return t === "up" ? <ArrowUp size={13} style={{ color: "#34D399" }} /> : t === "down" ? <ArrowDown size={13} style={{ color: "#F87171" }} /> : null })()}
                      </div>
                      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", fontSize: "0.76rem", color: "var(--text-mute)" }}>
                        {c.data.progressScore !== undefined && <span>Progress <b style={scoreColor(c.data.progressScore)}>{c.data.progressScore}/10</b></span>}
                        {c.data.energyScore !== undefined && <span>Energy <b style={scoreColor(c.data.energyScore)}>{c.data.energyScore}/10</b></span>}
                        {c.data.moodScore !== undefined && <span>Mood <b style={scoreColor(c.data.moodScore)}>{c.data.moodScore}/10</b></span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0 }}>
                      <span style={{ color: "var(--text-mute)", fontSize: "0.74rem" }}>{new Date(c.submitted_at).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        {c.resolved && <span style={{ fontSize: "0.64rem", fontWeight: 700, color: "#22c55e" }}>RESOLVED</span>}
                        {c.urgent_flag && !c.resolved && <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.15)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>URGENT</span>}
                      </div>
                      {/* inline row actions — manage queue without opening */}
                      <div style={{ display: "flex", gap: "0.3rem" }} onClick={e => e.stopPropagation()}>
                        {unread && <button onClick={() => rowMarkSeen(c)} title="Mark seen" style={rowBtn}>✓ Seen</button>}
                        {c.urgent_flag && !c.resolved && <button onClick={() => rowResolve(c)} title="Resolve urgent" style={{ ...rowBtn, color: "#22c55e", borderColor: "#22c55e" }}>Resolve</button>}
                      </div>
                    </div>
                  </div>
                  {isOpen && <div style={{ marginTop: "0.6rem", animation: "ci-expand .18s ease" }}><DetailPanel /></div>}
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

      <style>{`@keyframes ci-expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function scoreColor(val: number): React.CSSProperties {
  return { color: val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171" }
}
const rowBtn: React.CSSProperties = { fontSize: "0.66rem", fontWeight: 700, padding: "0.12rem 0.45rem", borderRadius: 4, background: "transparent", border: "1px solid var(--border)", color: "var(--text-mute)", cursor: "pointer" }

export default function AdminCheckInsPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-mute)" }}>Loading…</p>}>
      <CheckInsInner />
    </Suspense>
  )
}
