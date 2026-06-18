"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, X } from "lucide-react"

interface CheckIn {
  id: string
  submitted_at: string
  urgent_flag: boolean
  client_email: string
  first_name?: string
  last_name?: string
  client_intake_id?: string
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

function CheckInsInner() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [selected, setSelected] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all"|"urgent">("all")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlFilter = searchParams.get("filter")
    if (urlFilter === "urgent") setFilter("urgent")
  }, [searchParams])

  useEffect(() => {
    const url = filter === "urgent" ? "/api/admin/checkins?filter=urgent" : "/api/admin/checkins"
    fetch(url).then(r => r.json()).then(d => {
      setCheckins(d.checkins ?? [])
      setLoading(false)
    })
  }, [filter])

  const filtered = filter === "urgent" ? checkins.filter(c => c.urgent_flag) : checkins

  const scoreBar = (label: string, val: number | undefined) => val !== undefined ? (
    <div key={label} style={{ marginBottom:"0.6rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.25rem" }}>
        <span style={{ color:"var(--text-mute)" }}>{label}</span>
        <span style={{ fontWeight:700, color: val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171" }}>{val}/10</span>
      </div>
      <div style={{ height:4, background:"var(--surface-2)", borderRadius:2 }}>
        <div style={{ height:"100%", borderRadius:2, width:`${val*10}%`, background: val >= 7 ? "#4ade80" : val >= 4 ? "var(--gold)" : "#f87171", transition:"width 0.3s" }} />
      </div>
    </div>
  ) : null

  const DetailPanel = () => !selected ? null : (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.75rem" }}>
        <div>
          {selected.first_name && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.4rem" }}>
              <span style={{ fontWeight:700, fontSize:"0.95rem" }}>{selected.first_name} {selected.last_name}</span>
              {selected.client_intake_id && (
                <button
                  onClick={() => router.push(`/admin/clients/${selected.client_intake_id}`)}
                  style={{ fontSize:"0.72rem", color:"var(--gold)", background:"none", border:"1px solid var(--gold)", borderRadius:3, padding:"0.15rem 0.5rem", cursor:"pointer", fontWeight:600 }}>
                  View Client →
                </button>
              )}
            </div>
          )}
          <h2 style={{ fontWeight:600, fontSize:"0.85rem", color:"var(--text-mute)" }}>
            {new Date(selected.submitted_at).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
          </h2>
        </div>
        <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:"var(--text-mute)", cursor:"pointer", display:"flex", alignItems:"center", padding:"0.25rem" }}>
          <X size={18}/>
        </button>
      </div>
      {selected.urgent_flag && (
        <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid #f87171", borderRadius:"var(--radius)", padding:"0.6rem 0.75rem", marginBottom:"1rem", display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <AlertTriangle size={13} style={{ color:"#f87171" }} />
          <span style={{ color:"#f87171", fontSize:"0.8rem", fontWeight:700 }}>Urgent follow-up requested</span>
        </div>
      )}
      {scoreBar("Overall Progress", selected.data.progressScore)}
      {scoreBar("Energy Level", selected.data.energyScore)}
      {scoreBar("Mood & Wellbeing", selected.data.moodScore)}
      {selected.data.weight && <p style={{ fontSize:"0.82rem", marginTop:"0.75rem" }}><span style={{ color:"var(--text-mute)" }}>Weight: </span>{selected.data.weight} lbs</p>}
      {(selected.data.sideEffects?.length ?? 0) > 0 && (
        <div style={{ marginTop:"0.75rem" }}>
          <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>Side Effects</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem" }}>
            {selected.data.sideEffects?.map(s => (
              <span key={s} style={{ padding:"0.2rem 0.5rem", background:"var(--surface-2)", borderRadius:3, fontSize:"0.75rem", color:"var(--text-soft)" }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {selected.data.notes && (
        <div style={{ marginTop:"0.75rem" }}>
          <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>Notes</p>
          <p style={{ fontSize:"0.82rem", color:"var(--text-soft)", lineHeight:1.6 }}>{selected.data.notes}</p>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.5rem)" }}>Check-Ins</h1>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          {(["all","urgent"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"0.4rem 1rem", borderRadius:"var(--radius)", fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
              background: filter===f ? "var(--gold)" : "var(--surface)",
              color: filter===f ? "#000" : "var(--text-mute)",
              border:`1px solid ${filter===f ? "var(--gold)" : "var(--border)"}`
            }}>{f==="urgent" ? "⚠ Urgent" : "All"}</button>
          ))}
        </div>
      </div>

      {/* Mobile full-screen modal for detail */}
      {selected && (
        <div className="checkin-mobile-modal">
          <div style={{ padding:"1rem" }}>
            <DetailPanel />
          </div>
        </div>
      )}

      {/* Desktop: side-by-side layout */}
      <div className="checkin-desktop-layout">
        {/* List */}
        <div style={{ flex:1, overflow:"auto" }}>
          {loading ? <p style={{ color:"var(--text-mute)" }}>Loading...</p> : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)}
                  style={{
                    background: selected?.id === c.id ? "var(--surface-2)" : "var(--surface)",
                    border:`1px solid ${c.urgent_flag ? "rgba(248,113,113,0.4)" : selected?.id===c.id ? "var(--gold)" : "var(--border)"}`,
                    borderRadius:"var(--radius)", padding:"0.875rem 1rem", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem"
                  }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"0.6rem", flex:1, minWidth:0 }}>
                    {c.urgent_flag && <AlertTriangle size={14} style={{ color:"#f87171", flexShrink:0, marginTop:2 }} />}
                    <div style={{ minWidth:0 }}>
                      {c.first_name && (
                        <div style={{ fontWeight:700, fontSize:"0.875rem", marginBottom:"0.2rem" }}>
                          {c.first_name} {c.last_name}
                          <span style={{ color:"var(--text-mute)", fontWeight:400, fontSize:"0.78rem", marginLeft:"0.5rem" }}>{c.client_email}</span>
                        </div>
                      )}
                      {!c.first_name && (
                        <div style={{ fontWeight:600, fontSize:"0.85rem", marginBottom:"0.2rem", color:"var(--text-mute)" }}>{c.client_email}</div>
                      )}
                      <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", fontSize:"0.8rem", color:"var(--text-mute)" }}>
                        {c.data.progressScore !== undefined && <span>Progress: {c.data.progressScore}/10</span>}
                        {c.data.energyScore !== undefined && <span>Energy: {c.data.energyScore}/10</span>}
                        {c.data.moodScore !== undefined && <span>Mood: {c.data.moodScore}/10</span>}
                      </div>
                    </div>
                  </div>
                  <span style={{ color:"var(--text-mute)", fontSize:"0.75rem", flexShrink:0 }}>
                    {new Date(c.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ color:"var(--text-mute)" }}>No check-ins {filter==="urgent" ? "with urgent flags" : "yet"}.</p>}
            </div>
          )}
        </div>

        {/* Desktop detail panel */}
        {selected && (
          <div style={{ width:360, flexShrink:0, overflow:"auto" }}>
            <DetailPanel />
          </div>
        )}
      </div>

      <style>{`
        .checkin-desktop-layout {
          display: flex;
          gap: 1.5rem;
          min-height: calc(100vh - 10rem);
        }
        .checkin-mobile-modal {
          display: none;
        }
        @media (max-width: 767px) {
          .checkin-desktop-layout > *:last-child {
            display: none;
          }
          .checkin-mobile-modal {
            display: block;
            position: fixed;
            inset: 52px 0 0 0;
            background: var(--bg);
            z-index: 200;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default function AdminCheckInsPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-mute)" }}>Loading…</p>}>
      <CheckInsInner />
    </Suspense>
  )
}
