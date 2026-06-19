"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"

interface Client {
  id: string; first_name: string; last_name: string; email: string
  phone?: string; status: string; submitted_at: string; data?: Record<string, unknown>
  has_protocol?: boolean; protocol_peptide?: string | null
  protocol_billing_status?: string | null; protocol_monthly_rate?: string | null
}

const statusColor = (s: string) => ({
  APPROVED:{ bg:"rgba(74,222,128,0.15)", color:"#4ade80" },
  FLAGGED: { bg:"rgba(248,113,113,0.15)", color:"#f87171" },
  PENDING: { bg:"rgba(201,168,76,0.15)",  color:"var(--gold)" },
}[s] ?? { bg:"transparent", color:"var(--text-mute)" })

export default function AdminClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/intakes").then(r=>r.json()).then(d => {
      setClients(d.intakes ?? [])
      setLoading(false)
    })
    const st = new URLSearchParams(window.location.search).get("status")
    if (st === "APPROVED") setStatusFilter("Active")
    else if (st === "PENDING") setStatusFilter("Pending")
    else if (st === "FLAGGED") setStatusFilter("Flagged")
  }, [])

  const STATUS_FOR: Record<string,string|null> = { All:null, Active:"APPROVED", Pending:"PENDING", Flagged:"FLAGGED" }
  const filtered = clients.filter(c => {
    const matchSearch = `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const want = STATUS_FOR[statusFilter]
    return matchSearch && (!want || c.status === want)
  })

  const exportCsv = () => {
    const cols = ["Name","Email","Phone","Status","Protocol","Billing","Monthly Rate","Intake Date"]
    const lines = [cols.join(",")]
    for (const c of filtered) lines.push([
      `"${c.first_name} ${c.last_name}"`, `"${c.email}"`, `"${c.phone ?? ""}"`, c.status,
      `"${c.protocol_peptide ?? ""}"`, c.protocol_billing_status ?? "", c.protocol_monthly_rate ?? "",
      new Date(c.submitted_at).toISOString().slice(0,10),
    ].join(","))
    const blob = new Blob([lines.join("\n")], { type:"text/csv" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `roc-clients-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.5rem)" }}>Clients</h1>
        <button onClick={exportCsv} style={{ display:"flex", alignItems:"center", gap:"0.35rem", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-soft)", fontSize:"0.78rem", fontWeight:600, padding:"0.4rem 0.8rem", cursor:"pointer" }}><Download size={13}/> Export CSV</button>
      </div>
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.85rem", flexWrap:"wrap" }}>
        {Object.keys(STATUS_FOR).map(f => (
          <button key={f} onClick={()=>setStatusFilter(f)} style={{ padding:"0.35rem 0.85rem", borderRadius:"var(--radius)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", background: statusFilter===f?"var(--gold)":"var(--surface)", color: statusFilter===f?"#000":"var(--text-mute)", border:`1px solid ${statusFilter===f?"var(--gold)":"var(--border)"}` }}>{f}</button>
        ))}
      </div>
      <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ marginBottom:"1.25rem", maxWidth:"100%" }}/>

      {loading ? <p style={{color:"var(--text-mute)"}}>Loading…</p> : (
        <>
          {/* Desktop table */}
          <div className="clients-table-wrap card" style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.875rem"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
                  {["Name","Email","Status","Protocol","Intake Date","Action"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"0.75rem 1rem",color:"var(--text-mute)",fontWeight:600,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c,i)=>(
                  <tr key={c.id}
                    style={{borderBottom:"1px solid var(--border)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)",cursor:"pointer"}}
                    onClick={()=>router.push(`/admin/clients/${c.id}`)}>
                    <td style={{padding:"0.75rem 1rem",fontWeight:600}}>{c.first_name} {c.last_name}</td>
                    <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.82rem"}}>{c.email}</td>
                    <td style={{padding:"0.75rem 1rem"}}>
                      <span style={{padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,...statusColor(c.status)}}>{c.status}</span>
                    </td>
                    <td style={{padding:"0.75rem 1rem",fontSize:"0.8rem"}}>
                      {c.has_protocol ? (
                        <span style={{display:"inline-flex",alignItems:"center",gap:"0.35rem"}}>
                          <span style={{padding:"0.15rem 0.5rem",borderRadius:3,fontSize:"0.68rem",fontWeight:700,background:"rgba(74,222,128,0.15)",color:"#4ade80"}}>
                            {c.protocol_billing_status === "active" ? "● Active" : (c.protocol_billing_status ?? "Assigned")}
                          </span>
                          <span style={{color:"var(--text-mute)",fontSize:"0.78rem"}}>{c.protocol_peptide || "—"}</span>
                        </span>
                      ) : (
                        <span style={{color:"var(--text-mute)",fontSize:"0.75rem"}}>No protocol</span>
                      )}
                    </td>
                    <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.82rem"}}>{new Date(c.submitted_at).toLocaleDateString()}</td>
                    <td style={{padding:"0.75rem 1rem"}}>
                      <button onClick={e=>{e.stopPropagation();router.push(`/admin/clients/${c.id}`)}}
                        style={{fontSize:"0.8rem",color:"var(--gold)",background:"none",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:"0.25rem 0.75rem",cursor:"pointer",fontWeight:600}}>
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={6} style={{padding:"2rem",textAlign:"center",color:"var(--text-mute)"}}>No clients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="clients-card-list" style={{display:"none",flexDirection:"column",gap:"0.5rem"}}>
            {filtered.map(c=>(
              <div key={c.id} onClick={()=>router.push(`/admin/clients/${c.id}`)}
                style={{
                  background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius)", padding:"0.875rem 1rem", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem"
                }}>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.first_name} {c.last_name}</div>
                  <div style={{color:"var(--text-mute)",fontSize:"0.78rem",marginTop:"0.15rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--text-mute)",marginTop:"0.15rem"}}>{new Date(c.submitted_at).toLocaleDateString()}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem",flexShrink:0}}>
                  <span style={{padding:"0.2rem 0.55rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,...statusColor(c.status)}}>{c.status}</span>
                  {c.has_protocol && (
                    <span style={{padding:"0.15rem 0.5rem",borderRadius:3,fontSize:"0.65rem",fontWeight:700,background:"rgba(74,222,128,0.15)",color:"#4ade80"}}>
                      {c.protocol_billing_status === "active" ? "● Active" : "Assigned"}
                    </span>
                  )}
                  <span style={{fontSize:"0.75rem",color:"var(--gold)",fontWeight:600}}>Open →</span>
                </div>
              </div>
            ))}
            {filtered.length===0 && <p style={{color:"var(--text-mute)",textAlign:"center",padding:"2rem 0"}}>No clients found.</p>}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 767px) {
          .clients-table-wrap { display: none !important; }
          .clients-card-list  { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
