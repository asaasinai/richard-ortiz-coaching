"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/intakes").then(r => r.json()).then(d => {
      setIntakes(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  const statusColor = (s: string) => ({
    PENDING:  { bg:"rgba(201,168,76,0.15)",  color:"var(--gold)" },
    APPROVED: { bg:"rgba(74,222,128,0.15)",  color:"#4ade80" },
    FLAGGED:  { bg:"rgba(248,113,113,0.15)", color:"#f87171" },
  }[s] ?? { bg:"transparent", color:"var(--text-mute)" })

  const filtered = filter === "all" ? intakes : intakes.filter(i => i.status === filter)

  return (
    <div>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.5rem)", marginBottom:"1.25rem" }}>Client Intakes</h1>

      {/* Filter bar */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {[["all","All"],["PENDING","Pending"],["APPROVED","Approved"],["FLAGGED","Flagged"]].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:"0.35rem 0.875rem", borderRadius:"var(--radius)", fontSize:"0.8rem", fontWeight:600, cursor:"pointer",
            background: filter === val ? "var(--gold)" : "var(--surface-2)",
            color: filter === val ? "#000" : "var(--text-mute)",
            border:`1px solid ${filter === val ? "var(--gold)" : "var(--border)"}`,
          }}>{label} {val !== "all" ? `(${intakes.filter(i => i.status === val).length})` : `(${intakes.length})`}</button>
        ))}
      </div>

      {loading ? <p style={{ color:"var(--text-mute)" }}>Loading...</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {filtered.map(intake => (
            <div key={intake.id}
              onClick={() => router.push(`/admin/intakes/${intake.id}`)}
              style={{
                background:"var(--surface)",
                border:"1px solid var(--border)",
                borderRadius:"var(--radius)", padding:"0.875rem 1rem",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem",
                transition:"border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--gold)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:"0.9rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{intake.first_name} {intake.last_name}</div>
                <div style={{ color:"var(--text-mute)", fontSize:"0.8rem", marginTop:"0.2rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{intake.email}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
                <span style={{ padding:"0.2rem 0.6rem", borderRadius:3, fontSize:"0.7rem", fontWeight:700, ...statusColor(intake.status) }}>
                  {intake.status}
                </span>
                <span style={{ color:"var(--text-mute)", fontSize:"0.75rem", whiteSpace:"nowrap" }}>
                  {new Date(intake.submitted_at).toLocaleDateString()}
                </span>
                <span style={{ color:"var(--gold)", fontSize:"0.75rem", fontWeight:700 }}>→</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color:"var(--text-mute)" }}>No intakes found.</p>}
        </div>
      )}
    </div>
  )
}
