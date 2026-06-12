"use client"
import { useEffect, useState } from "react"
import { Mail } from "lucide-react"

const PEPTIDES = ["BPC-157","Ipamorelin","Semaglutide","TB-500","Sermorelin","CJC-1295","Tirzepatide","PT-141","GHK-Cu","MK-677"]
const PROTOCOLS = ["Conservative","Moderate","Liberal","Custom"]

interface Client {
  id: string; first_name: string; last_name: string; email: string; status: string; submitted_at: string
}
interface CheckIn {
  id: string; submitted_at: string; urgent_flag: boolean
  data: { weight?: string; energyScore?: number; moodScore?: number; sideEffects?: string[]; notes?: string }
}
interface Assignment { peptide: string; protocol: string; coach_notes: string; assigned_at: string }

function Spark({ values, color = "var(--gold)" }: { values: number[], color?: string }) {
  if (values.length < 2) return <span style={{ color:"var(--text-mute)", fontSize:"0.75rem" }}>—</span>
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1
  const w = 72; const h = 26
  const pts = values.map((v,i) => `${(i/(values.length-1))*w},${h-((v-min)/range)*(h-4)-2}`).join(" ")
  const last = values[values.length-1]; const prev = values[values.length-2]
  const arr = last>prev?" ↑":last<prev?" ↓":""
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.35rem" }}>
      <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>
      <span style={{ fontSize:"0.8rem", fontWeight:700, color }}>{last}{arr}</span>
    </div>
  )
}

const statusColor = (s: string) => ({
  APPROVED:{ bg:"rgba(74,222,128,0.15)", color:"#4ade80" },
  FLAGGED: { bg:"rgba(248,113,113,0.15)", color:"#f87171" },
  PENDING: { bg:"rgba(201,168,76,0.15)",  color:"var(--gold)" },
}[s] ?? { bg:"transparent", color:"var(--text-mute)" })

export default function AdminClientsPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [assign, setAssign]     = useState<Record<string,Assignment>>({})
  const [form, setForm]         = useState({ peptide:"", protocol:"Conservative", notes:"" })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/intakes").then(r=>r.json()),
      fetch("/api/admin/checkins").then(r=>r.json()),
    ]).then(([iD,cD]) => {
      setClients(iD.intakes??[])
      setCheckins(cD.checkins??[])
      setLoading(false)
    })
  }, [])

  // Load assignment when client selected
  useEffect(() => {
    if (!selected) return
    if (assign[selected.id]) {
      const a = assign[selected.id]
      setForm({ peptide: a.peptide, protocol: a.protocol, notes: a.coach_notes })
      return
    }
    fetch(`/api/admin/assign-protocol?clientId=${selected.id}`)
      .then(r=>r.json())
      .then(d => {
        if (d.protocol) {
          setAssign(p => ({ ...p, [selected.id]: d.protocol }))
          setForm({ peptide: d.protocol.peptide, protocol: d.protocol.protocol, notes: d.protocol.coach_notes })
        } else {
          setForm({ peptide:"", protocol:"Conservative", notes:"" })
        }
      })
  }, [selected])

  const saveAssignment = async () => {
    if (!selected || !form.peptide) return
    setSaving(true); setSaved(false)
    await fetch("/api/admin/assign-protocol", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ clientId: selected.id, peptide: form.peptide, protocol: form.protocol, notes: form.notes })
    })
    setAssign(p => ({ ...p, [selected.id]: { ...form, coach_notes: form.notes, assigned_at: new Date().toISOString() } }))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/intakes", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id,status}) })
    setClients(p => p.map(c => c.id===id ? {...c,status} : c))
    if (selected?.id===id) setSelected(p => p ? {...p,status} : p)
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const cCheckins = (id: string) => checkins.filter((c: CheckIn & { client_id?: string }) => c.client_id === id)
  const wVals = (id: string) => cCheckins(id).filter(c=>c.data.weight&&!isNaN(Number(c.data.weight))).map(c=>Number(c.data.weight)).slice(-8)
  const eVals = (id: string) => cCheckins(id).filter(c=>c.data.energyScore!==undefined).map(c=>c.data.energyScore!).slice(-8)

  return (
    <div style={{ display:"flex", gap:"1.5rem", height:"calc(100vh - 4rem)" }}>
      {/* List */}
      <div style={{ flex:1, overflow:"auto" }}>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.5rem", marginBottom:"1.5rem" }}>Clients</h1>
        <input placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ marginBottom:"1.25rem", maxWidth:360 }}/>
        {loading ? <p style={{color:"var(--text-mute)"}}>Loading...</p> : (
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.875rem"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>
                  {["Name","Email","Status","Peptide","Weight","Energy","Date"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"0.75rem 1rem",color:"var(--text-mute)",fontWeight:600,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c,i)=>(
                  <tr key={c.id} onClick={()=>setSelected(selected?.id===c.id?null:c)}
                    style={{borderBottom:"1px solid var(--border)",background:selected?.id===c.id?"var(--surface-2)":i%2===0?"transparent":"rgba(255,255,255,0.01)",cursor:"pointer"}}>
                    <td style={{padding:"0.75rem 1rem",fontWeight:600}}>{c.first_name} {c.last_name}</td>
                    <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.8rem"}}>{c.email}</td>
                    <td style={{padding:"0.75rem 1rem"}}>
                      <span style={{padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,...statusColor(c.status)}}>{c.status}</span>
                    </td>
                    <td style={{padding:"0.75rem 1rem",fontSize:"0.8rem",color:assign[c.id]?"var(--gold)":"var(--text-mute)"}}>
                      {assign[c.id]?.peptide || "—"}
                    </td>
                    <td style={{padding:"0.75rem 1rem"}}><Spark values={wVals(c.id)} color="var(--gold)"/></td>
                    <td style={{padding:"0.75rem 1rem"}}><Spark values={eVals(c.id)} color="#60a5fa"/></td>
                    <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.8rem"}}>{new Date(c.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={7} style={{padding:"2rem",textAlign:"center",color:"var(--text-mute)"}}>No clients found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{width:400,flexShrink:0,overflow:"auto"}}>
          <div className="card">
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"1rem"}}>
              <div>
                <h2 style={{fontWeight:700,fontSize:"1rem"}}>{selected.first_name} {selected.last_name}</h2>
                <p style={{color:"var(--text-mute)",fontSize:"0.8rem"}}>{selected.email}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"var(--text-mute)",cursor:"pointer"}}>✕</button>
            </div>

            {/* Status buttons */}
            <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
              {["APPROVED","PENDING","FLAGGED"].map(s=>(
                <button key={s} onClick={()=>updateStatus(selected.id,s)} style={{
                  flex:1,padding:"0.4rem",borderRadius:"var(--radius)",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",
                  ...statusColor(s),border:`1px solid ${statusColor(s).color}`,opacity:selected.status===s?1:0.45}}>
                  {s}
                </button>
              ))}
            </div>

            {/* ── Peptide Assignment ── */}
            <div style={{background:"var(--surface-2)",borderRadius:"var(--radius)",padding:"1rem",marginBottom:"1.25rem",border:"1px solid var(--border)"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gold)",marginBottom:"0.75rem"}}>
                Assign Protocol
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                <div>
                  <label style={{fontSize:"0.78rem"}}>Peptide</label>
                  <select value={form.peptide} onChange={e=>setForm(p=>({...p,peptide:e.target.value}))} style={{marginTop:"0.25rem"}}>
                    <option value="">— Select peptide —</option>
                    {PEPTIDES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"0.78rem"}}>Dosing Protocol</label>
                  <select value={form.protocol} onChange={e=>setForm(p=>({...p,protocol:e.target.value}))} style={{marginTop:"0.25rem"}}>
                    {PROTOCOLS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"0.78rem"}}>Coach Notes (optional)</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                    placeholder="Specific instructions, timing, reconstitution notes..."
                    style={{marginTop:"0.25rem",fontSize:"0.82rem"}}/>
                </div>
                <button onClick={saveAssignment} disabled={saving||!form.peptide}
                  className="btn-gold" style={{fontSize:"0.82rem",padding:"0.5rem"}}>
                  {saving ? "Saving..." : saved ? "✓ Saved" : "Save Assignment"}
                </button>
              </div>
            </div>

            {/* Progress graphs */}
            {wVals(selected.id).length>0&&(
              <div style={{marginBottom:"0.75rem"}}>
                <div style={{fontSize:"0.7rem",color:"var(--text-mute)",marginBottom:"0.25rem"}}>Weight</div>
                <Spark values={wVals(selected.id)} color="var(--gold)"/>
              </div>
            )}
            {eVals(selected.id).length>0&&(
              <div style={{marginBottom:"1rem"}}>
                <div style={{fontSize:"0.7rem",color:"var(--text-mute)",marginBottom:"0.25rem"}}>Energy</div>
                <Spark values={eVals(selected.id)} color="#60a5fa"/>
              </div>
            )}

            {/* Recent check-ins */}
            <div style={{borderTop:"1px solid var(--border)",paddingTop:"1rem"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--text-mute)",marginBottom:"0.75rem"}}>Recent Check-Ins</div>
              {cCheckins(selected.id).length===0&&<p style={{color:"var(--text-mute)",fontSize:"0.8rem"}}>No check-ins yet.</p>}
              {cCheckins(selected.id).slice(-5).reverse().map(c=>(
                <div key={c.id} style={{marginBottom:"0.65rem",paddingBottom:"0.65rem",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem"}}>
                    <span style={{fontWeight:600}}>{new Date(c.submitted_at).toLocaleDateString()}</span>
                    {c.urgent_flag&&<span style={{color:"#f87171",fontWeight:700}}>⚠ Urgent</span>}
                  </div>
                  <div style={{fontSize:"0.75rem",color:"var(--text-mute)",marginTop:"0.2rem"}}>
                    {c.data.weight&&`${c.data.weight} lbs · `}{c.data.energyScore&&`E ${c.data.energyScore}/10 · `}{c.data.moodScore&&`M ${c.data.moodScore}/10`}
                  </div>
                  {c.data.notes&&<p style={{fontSize:"0.75rem",color:"var(--text-soft)",marginTop:"0.25rem",lineHeight:1.5}}>{c.data.notes}</p>}
                </div>
              ))}
            </div>

            <a href={`mailto:${selected.email}`} className="btn-gold"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",textDecoration:"none",fontSize:"0.82rem",padding:"0.55rem",marginTop:"0.75rem"}}>
              <Mail size={14}/> Send Email
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
