"use client"
import { useEffect, useState } from "react"
import { Mail } from "lucide-react"

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  submitted_at: string
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/intakes").then(r => r.json()).then(d => {
      setClients(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth:900 }}>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.5rem",marginBottom:"1.5rem" }}>Clients</h1>
      <input
        placeholder="Search name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom:"1.25rem",maxWidth:360 }}
      />
      {loading ? <p style={{ color:"var(--text-mute)" }}>Loading...</p> : (
        <div className="card" style={{ padding:0,overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.875rem" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)",background:"var(--surface-2)" }}>
                {["Name","Email","Status","Date","Action"].map(h => (
                  <th key={h} style={{ textAlign:"left",padding:"0.75rem 1rem",color:"var(--text-mute)",fontWeight:600,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i) => (
                <tr key={c.id} style={{ borderBottom:"1px solid var(--border)",background: i%2===0 ? "transparent" : "var(--surface-2)" }}>
                  <td style={{ padding:"0.75rem 1rem",fontWeight:600 }}>{c.first_name} {c.last_name}</td>
                  <td style={{ padding:"0.75rem 1rem",color:"var(--text-mute)" }}>{c.email}</td>
                  <td style={{ padding:"0.75rem 1rem" }}>
                    <span style={{
                      padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,
                      background: c.status==="APPROVED" ? "rgba(74,222,128,0.15)" : c.status==="FLAGGED" ? "rgba(248,113,113,0.15)" : "rgba(201,168,76,0.15)",
                      color: c.status==="APPROVED" ? "#4ade80" : c.status==="FLAGGED" ? "#f87171" : "var(--gold)"
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.8rem" }}>{new Date(c.submitted_at).toLocaleDateString()}</td>
                  <td style={{ padding:"0.75rem 1rem" }}>
                    <a href={`mailto:${c.email}`} style={{ display:"inline-flex",alignItems:"center",gap:"0.3rem",color:"var(--gold)",fontSize:"0.8rem" }}>
                      <Mail size={12}/> Email
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding:"2rem",textAlign:"center",color:"var(--text-mute)" }}>No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
