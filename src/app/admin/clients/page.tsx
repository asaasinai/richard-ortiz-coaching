"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Client {
  id: string; first_name: string; last_name: string; email: string
  phone?: string; status: string; submitted_at: string; data?: Record<string, unknown>
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
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/intakes").then(r=>r.json()).then(d => {
      setClients(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.5rem)", marginBottom:"1.25rem" }}>Clients</h1>
      <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ marginBottom:"1.25rem", maxWidth:"100%" }}/>

      {loading ? <p style={{color:"var(--text-mute)"}}>Loading…</p> : (
        <>
          {/* Desktop table */}
          <div className="clients-table-wrap card" style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.875rem"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
                  {["Name","Email","Status","Intake Date","Action"].map(h=>(
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
                  <tr><td colSpan={5} style={{padding:"2rem",textAlign:"center",color:"var(--text-mute)"}}>No clients found.</td></tr>
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
