"use client"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Eye } from "lucide-react"

interface Intake {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  submitted_at: string
  data: Record<string, unknown>
}

export default function AdminIntakesPage() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [selected, setSelected] = useState<Intake | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/intakes").then(r => r.json()).then(d => {
      setIntakes(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/intakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    })
    setIntakes(p => p.map(i => i.id === id ? { ...i, status } : i))
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : p)
  }

  const statusColor = (s: string) => ({
    PENDING:  { bg:"rgba(201,168,76,0.15)",  color:"var(--gold)" },
    APPROVED: { bg:"rgba(74,222,128,0.15)",  color:"#4ade80" },
    FLAGGED:  { bg:"rgba(248,113,113,0.15)", color:"#f87171" },
  }[s] ?? { bg:"transparent", color:"var(--text-mute)" })

  return (
    <div style={{ display:"flex", gap:"1.5rem", height:"calc(100vh - 4rem)" }}>
      {/* List */}
      <div style={{ flex:1, overflow:"auto" }}>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.5rem",marginBottom:"1.5rem" }}>Client Intakes</h1>
        {loading ? <p style={{ color:"var(--text-mute)" }}>Loading...</p> : (
          <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
            {intakes.map(intake => (
              <div key={intake.id} onClick={() => setSelected(intake)}
                style={{
                  background: selected?.id === intake.id ? "var(--surface-2)" : "var(--surface)",
                  border:`1px solid ${selected?.id === intake.id ? "var(--gold)" : "var(--border)"}`,
                  borderRadius:"var(--radius)", padding:"0.875rem 1rem",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between"
                }}>
                <div>
                  <div style={{ fontWeight:600,fontSize:"0.9rem" }}>{intake.first_name} {intake.last_name}</div>
                  <div style={{ color:"var(--text-mute)",fontSize:"0.8rem",marginTop:"0.2rem" }}>{intake.email}</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
                  <span style={{ padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,...statusColor(intake.status) }}>
                    {intake.status}
                  </span>
                  <span style={{ color:"var(--text-mute)",fontSize:"0.75rem" }}>
                    {new Date(intake.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {intakes.length === 0 && <p style={{ color:"var(--text-mute)" }}>No intakes yet.</p>}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width:380,flexShrink:0,overflow:"auto" }}>
          <div className="card" style={{ position:"sticky",top:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem" }}>
              <div>
                <h2 style={{ fontWeight:700,fontSize:"1rem" }}>{selected.first_name} {selected.last_name}</h2>
                <p style={{ color:"var(--text-mute)",fontSize:"0.8rem" }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer",fontSize:"1.1rem" }}>✕</button>
            </div>

            <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1.25rem" }}>
              <button onClick={() => updateStatus(selected.id,"APPROVED")}
                style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",padding:"0.5rem",borderRadius:"var(--radius)",border:"1px solid #4ade80",background:"rgba(74,222,128,0.1)",color:"#4ade80",cursor:"pointer",fontWeight:600,fontSize:"0.8rem" }}>
                <CheckCircle size={13}/> Approve
              </button>
              <button onClick={() => updateStatus(selected.id,"FLAGGED")}
                style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",padding:"0.5rem",borderRadius:"var(--radius)",border:"1px solid #f87171",background:"rgba(248,113,113,0.1)",color:"#f87171",cursor:"pointer",fontWeight:600,fontSize:"0.8rem" }}>
                <XCircle size={13}/> Flag
              </button>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:"0.6rem",fontSize:"0.82rem" }}>
              {Object.entries(selected.data || {}).map(([k,v]) => (
                typeof v !== "object" && v !== "" && v !== false ? (
                  <div key={k} style={{ display:"flex",gap:"0.5rem",borderBottom:"1px solid var(--border)",paddingBottom:"0.4rem" }}>
                    <span style={{ color:"var(--text-mute)",width:120,flexShrink:0,textTransform:"capitalize" }}>{k.replace(/([A-Z])/g," $1")}</span>
                    <span style={{ color:"var(--text-soft)" }}>{String(v)}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
