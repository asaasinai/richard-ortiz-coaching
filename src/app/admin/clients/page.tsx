"use client"
import { useEffect, useState, useCallback } from "react"
import { Mail, X, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

const PEPTIDES = ["BPC-157","Ipamorelin","Semaglutide","TB-500","Sermorelin","CJC-1295","Tirzepatide","PT-141","GHK-Cu","MK-677","NAD+","Selank"]
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DOSE_UNITS = ["mg","mcg","IU","mL"]

interface Client {
  id: string; first_name: string; last_name: string; email: string
  status: string; submitted_at: string; data?: Record<string, unknown>
}
interface CheckIn {
  id: string; submitted_at: string; urgent_flag: boolean; client_email: string
  data: {
    weight?: string; bodyFat?: string; musclePct?: string
    energyScore?: number; moodScore?: number
    sideEffects?: string[]; sideEffectsOther?: string
    missedDoses?: string; reason?: string; notes?: string; urgentFlag?: boolean
  }
}
interface Protocol {
  peptide: string; dose_amount: string; dose_unit: string
  frequency_days: string; coach_notes: string; assigned_at: string
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────
function LineChart({ points, color, label, unit }: {
  points: { date: string; val: number }[]
  color: string; label: string; unit: string
}) {
  if (points.length < 2) return (
    <div style={{ padding:"1rem", color:"var(--text-mute)", fontSize:"0.8rem" }}>
      Not enough data yet ({points.length} point{points.length===1?"":"s"}).
    </div>
  )
  const vals = points.map(p => p.val)
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1
  const W = 320; const H = 80; const PAD = 8
  const pts = points.map((p,i) => {
    const x = PAD + (i/(points.length-1))*(W-PAD*2)
    const y = H - PAD - ((p.val-min)/range)*(H-PAD*2)
    return { x, y, ...p }
  })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ")
  const last = pts[pts.length-1]; const prev = pts[pts.length-2]
  const trend = last.val > prev.val ? "up" : last.val < prev.val ? "down" : "flat"
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"0.35rem" }}>
        <span style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)" }}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
          <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", color:"var(--text)" }}>
            {last.val}{unit}
          </span>
          <span style={{ fontSize:"0.7rem", color: trend==="up"?"#4ade80":trend==="down"?"#f87171":"var(--text-mute)" }}>
            {trend==="up"?"↑":trend==="down"?"↓":"="}
          </span>
        </div>
      </div>
      <svg width={W} height={H} style={{ overflow:"visible", display:"block" }}>
        <defs>
          <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* fill */}
        <polygon
          points={`${pts[0].x},${H} ${polyline} ${pts[pts.length-1].x},${H}`}
          fill={`url(#fill-${label})`}
        />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={color} opacity={i===pts.length-1?1:0.6}/>
        ))}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.65rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>
        <span>{new Date(pts[0].date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
        <span>{new Date(pts[pts.length-1].date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
      </div>
    </div>
  )
}

const statusColor = (s: string) => ({
  APPROVED:{ bg:"rgba(74,222,128,0.15)", color:"#4ade80" },
  FLAGGED: { bg:"rgba(248,113,113,0.15)", color:"#f87171" },
  PENDING: { bg:"rgba(201,168,76,0.15)",  color:"var(--gold)" },
}[s] ?? { bg:"transparent", color:"var(--text-mute)" })

// ── Full Client Modal ──────────────────────────────────────────────────────
function ClientModal({ client, onClose, onStatusChange }: {
  client: Client
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [protocol, setProtocol] = useState<Protocol|null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview"|"protocol"|"checkins"|"intake">("overview")

  // Protocol form
  const [pForm, setPForm] = useState({ peptide:"", doseAmount:"", doseUnit:"mg", frequencyDays:[] as string[], notes:"" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/checkins?clientEmail=${encodeURIComponent(client.email)}`).then(r=>r.json()),
      fetch(`/api/admin/assign-protocol?clientId=${client.id}`).then(r=>r.json()),
    ]).then(([cD, pD]) => {
      setCheckins(cD.checkins ?? [])
      if (pD.protocol) {
        setProtocol(pD.protocol)
        let days: string[] = []
        try { days = JSON.parse(pD.protocol.frequency_days) } catch { days = [] }
        setPForm({
          peptide: pD.protocol.peptide,
          doseAmount: pD.protocol.dose_amount,
          doseUnit: pD.protocol.dose_unit || "mg",
          frequencyDays: days,
          notes: pD.protocol.coach_notes,
        })
      }
      setLoading(false)
    })
  }, [client.id, client.email])

  const toggleDay = (d: string) =>
    setPForm(p => ({ ...p, frequencyDays: p.frequencyDays.includes(d) ? p.frequencyDays.filter(x=>x!==d) : [...p.frequencyDays, d] }))

  const saveProtocol = async () => {
    setSaving(true); setSaved(false)
    await fetch("/api/admin/assign-protocol", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        clientId: client.id, peptide: pForm.peptide,
        doseAmount: pForm.doseAmount, doseUnit: pForm.doseUnit,
        frequencyDays: pForm.frequencyDays, notes: pForm.notes
      })
    })
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false), 2500)
  }

  // Graph data
  const weightPts = checkins.filter(c=>c.data.weight&&!isNaN(Number(c.data.weight))).map(c=>({ date:c.submitted_at, val:Number(c.data.weight) }))
  const bfPts     = checkins.filter(c=>c.data.bodyFat&&!isNaN(Number(c.data.bodyFat))).map(c=>({ date:c.submitted_at, val:Number(c.data.bodyFat) }))
  const energyPts = checkins.filter(c=>c.data.energyScore!==undefined).map(c=>({ date:c.submitted_at, val:c.data.energyScore! }))
  const moodPts   = checkins.filter(c=>c.data.moodScore!==undefined).map(c=>({ date:c.submitted_at, val:c.data.moodScore! }))

  // Parse intake data
  const intake = client.data as Record<string,unknown> | undefined

  const TABS = [
    { id:"overview",  label:"Overview" },
    { id:"protocol",  label:"Protocol" },
    { id:"checkins",  label:`Check-Ins (${checkins.length})` },
    { id:"intake",    label:"Intake Form" },
  ] as const

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem 1rem", overflowY:"auto" }}>
      <div style={{ background:"var(--bg)", borderRadius:"var(--radius)", border:"1px solid var(--border)", width:"100%", maxWidth:860, position:"relative", minHeight:500 }}>

        {/* Header */}
        <div style={{ padding:"1.5rem 1.75rem 1rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h2 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.4rem" }}>
              {client.first_name} {client.last_name}
            </h2>
            <p style={{ color:"var(--text-mute)", fontSize:"0.85rem", marginTop:"0.2rem" }}>{client.email}</p>
            <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.6rem", flexWrap:"wrap" }}>
              {["APPROVED","PENDING","FLAGGED"].map(s=>(
                <button key={s} onClick={()=>onStatusChange(client.id,s)} style={{
                  padding:"0.2rem 0.7rem", borderRadius:3, fontSize:"0.7rem", fontWeight:700, cursor:"pointer",
                  ...statusColor(s), border:`1px solid ${statusColor(s).color}`,
                  opacity: client.status===s ? 1 : 0.4
                }}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-mute)", cursor:"pointer", padding:"0.25rem" }}>
            <X size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", padding:"0 1.75rem" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"0.75rem 1rem", fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
              background:"none", border:"none", borderBottom: tab===t.id ? "2px solid var(--gold)" : "2px solid transparent",
              color: tab===t.id ? "var(--gold)" : "var(--text-mute)", marginBottom:-1
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding:"1.5rem 1.75rem" }}>
          {loading && <p style={{color:"var(--text-mute)"}}>Loading...</p>}

          {/* ── OVERVIEW ── */}
          {!loading && tab==="overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
                {[
                  { label:"Check-Ins", val: checkins.length, color:"var(--gold)" },
                  { label:"Urgent Flags", val: checkins.filter(c=>c.urgent_flag).length, color:"#f87171" },
                  { label:"Latest Weight", val: weightPts.length ? `${weightPts[weightPts.length-1].val} lbs` : "—", color:"#60a5fa" },
                  { label:"Protocol", val: pForm.peptide || "None", color:"#4ade80" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.875rem 1rem" }}>
                    <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)", marginBottom:"0.35rem" }}>{s.label}</div>
                    <div style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              {(weightPts.length>=2 || bfPts.length>=2 || energyPts.length>=2 || moodPts.length>=2) ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>
                  {weightPts.length>=2 && (
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                      <LineChart points={weightPts} color="var(--gold)" label="Weight" unit=" lbs"/>
                    </div>
                  )}
                  {bfPts.length>=2 && (
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                      <LineChart points={bfPts} color="#f87171" label="Body Fat" unit="%"/>
                    </div>
                  )}
                  {energyPts.length>=2 && (
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                      <LineChart points={energyPts} color="#60a5fa" label="Energy" unit="/10"/>
                    </div>
                  )}
                  {moodPts.length>=2 && (
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                      <LineChart points={moodPts} color="#4ade80" label="Mood" unit="/10"/>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"2rem", textAlign:"center", color:"var(--text-mute)", fontSize:"0.875rem" }}>
                  No check-in data yet — charts will appear after the first submission.
                </div>
              )}
            </div>
          )}

          {/* ── PROTOCOL ── */}
          {!loading && tab==="protocol" && (
            <div style={{ maxWidth:500, display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              <div>
                <label>Peptide</label>
                <select value={pForm.peptide} onChange={e=>setPForm(p=>({...p,peptide:e.target.value}))} style={{marginTop:"0.35rem"}}>
                  <option value="">— Select peptide —</option>
                  {PEPTIDES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div>
                  <label>Dose Amount</label>
                  <input type="text" placeholder="e.g. 250" value={pForm.doseAmount}
                    onChange={e=>setPForm(p=>({...p,doseAmount:e.target.value}))} style={{marginTop:"0.35rem"}}/>
                </div>
                <div>
                  <label>Unit</label>
                  <select value={pForm.doseUnit} onChange={e=>setPForm(p=>({...p,doseUnit:e.target.value}))} style={{marginTop:"0.35rem"}}>
                    {DOSE_UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{display:"block",marginBottom:"0.5rem"}}>Frequency — select days</label>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {/* Quick presets */}
                  {[
                    { label:"Daily", days:DAYS },
                    { label:"3×/wk", days:["Mon","Wed","Fri"] },
                    { label:"2×/wk", days:["Mon","Thu"] },
                    { label:"Weekly", days:["Mon"] },
                  ].map(preset=>(
                    <button key={preset.label} type="button"
                      onClick={()=>setPForm(p=>({...p,frequencyDays:preset.days}))}
                      style={{
                        padding:"0.3rem 0.7rem", borderRadius:"var(--radius)", fontSize:"0.75rem", fontWeight:600, cursor:"pointer",
                        background: JSON.stringify([...pForm.frequencyDays].sort())===JSON.stringify([...preset.days].sort()) ? "var(--gold)" : "var(--surface-2)",
                        color: JSON.stringify([...pForm.frequencyDays].sort())===JSON.stringify([...preset.days].sort()) ? "#000" : "var(--text-mute)",
                        border:`1px solid var(--border)`
                      }}>{preset.label}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.6rem" }}>
                  {DAYS.map(d=>(
                    <button key={d} type="button" onClick={()=>toggleDay(d)} style={{
                      width:"2.5rem", height:"2.5rem", borderRadius:"var(--radius)", fontSize:"0.75rem", fontWeight:700, cursor:"pointer",
                      background: pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--surface-2)",
                      color: pForm.frequencyDays.includes(d) ? "#000" : "var(--text-mute)",
                      border:`1px solid ${pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--border)"}`
                    }}>{d}</button>
                  ))}
                </div>
                {pForm.frequencyDays.length > 0 && (
                  <p style={{ fontSize:"0.78rem", color:"var(--text-mute)", marginTop:"0.4rem" }}>
                    {pForm.frequencyDays.length === 7 ? "Daily" :
                     pForm.frequencyDays.length === 1 ? `Once a week (${pForm.frequencyDays[0]})` :
                     `${pForm.frequencyDays.length}× per week — ${pForm.frequencyDays.join(", ")}`}
                  </p>
                )}
              </div>

              <div>
                <label>Coach Notes</label>
                <textarea rows={3} value={pForm.notes} onChange={e=>setPForm(p=>({...p,notes:e.target.value}))}
                  placeholder="Reconstitution instructions, timing, special notes..."
                  style={{marginTop:"0.35rem"}}/>
              </div>

              <button onClick={saveProtocol} disabled={saving||!pForm.peptide} className="btn-gold"
                style={{alignSelf:"flex-start"}}>
                {saving?"Saving…":saved?"✓ Saved":"Save Protocol"}
              </button>

              {protocol && (
                <p style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>
                  Last saved: {new Date(protocol.assigned_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* ── CHECK-INS ── */}
          {!loading && tab==="checkins" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {checkins.length === 0 && (
                <p style={{color:"var(--text-mute)"}}>No check-ins yet.</p>
              )}
              {checkins.slice().reverse().map(c=>(
                <div key={c.id} style={{ background:"var(--surface)", border:`1px solid ${c.urgent_flag?"rgba(248,113,113,0.4)":"var(--border)"}`, borderRadius:"var(--radius)", padding:"1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                    <span style={{ fontWeight:700, fontSize:"0.875rem" }}>
                      {new Date(c.submitted_at).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
                    </span>
                    {c.urgent_flag && (
                      <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", color:"#f87171", fontSize:"0.78rem", fontWeight:700 }}>
                        <AlertTriangle size={12}/> Urgent
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", fontSize:"0.82rem", color:"var(--text-mute)" }}>
                    {c.data.weight      && <span>⚖ {c.data.weight} lbs</span>}
                    {c.data.bodyFat     && <span>Body Fat {c.data.bodyFat}%</span>}
                    {c.data.energyScore !== undefined && <span>Energy {c.data.energyScore}/10</span>}
                    {c.data.moodScore   !== undefined && <span>Mood {c.data.moodScore}/10</span>}
                    {c.data.missedDoses && c.data.missedDoses!=="0" && <span>Missed {c.data.missedDoses} dose(s)</span>}
                  </div>
                  {c.data.sideEffects && c.data.sideEffects.length>0 && c.data.sideEffects[0]!=="None" && (
                    <div style={{ marginTop:"0.35rem", fontSize:"0.78rem", color:"var(--text-mute)" }}>
                      Side effects: {c.data.sideEffects.join(", ")}
                      {c.data.sideEffectsOther && ` — ${c.data.sideEffectsOther}`}
                    </div>
                  )}
                  {c.data.reason && <p style={{ marginTop:"0.35rem", fontSize:"0.78rem", color:"var(--text-soft)" }}>Reason: {c.data.reason}</p>}
                  {c.data.notes  && <p style={{ marginTop:"0.35rem", fontSize:"0.82rem", color:"var(--text-soft)", lineHeight:1.55 }}>{c.data.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── INTAKE FORM DATA ── */}
          {!loading && tab==="intake" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {!intake || Object.keys(intake).length===0 ? (
                <p style={{color:"var(--text-mute)"}}>No intake form data stored.</p>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
                  {Object.entries(intake).map(([k,v]) => {
                    if (v===null || v===undefined || v==="") return null
                    const display = Array.isArray(v) ? v.join(", ") : typeof v==="boolean" ? (v?"Yes":"No") : String(v)
                    if (!display) return null
                    const label = k.replace(/([A-Z])/g," $1").replace(/^./, s=>s.toUpperCase())
                    return (
                      <div key={k} style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:"0.6rem 0.875rem", border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-mute)", marginBottom:"0.2rem" }}>{label}</div>
                        <div style={{ fontSize:"0.85rem", color:"var(--text)", fontWeight:500, wordBreak:"break-word" }}>{display}</div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ marginTop:"1rem" }}>
                <a href={`mailto:${client.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", textDecoration:"none" }}
                  className="btn-gold">
                  <Mail size={14}/> Email {client.first_name}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([])
  const [selected, setSelected] = useState<Client|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")

  useEffect(() => {
    fetch("/api/admin/intakes").then(r=>r.json()).then(d => {
      setClients(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  const updateStatus = useCallback((id: string, status: string) => {
    fetch("/api/admin/intakes", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id,status}) })
    setClients(p => p.map(c => c.id===id ? {...c,status} : c))
    setSelected(p => p && p.id===id ? {...p,status} : p)
  }, [])

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {selected && (
        <ClientModal
          client={selected}
          onClose={()=>setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}

      <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.5rem", marginBottom:"1.5rem" }}>Clients</h1>
      <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ marginBottom:"1.25rem", maxWidth:360 }}/>

      {loading ? <p style={{color:"var(--text-mute)"}}>Loading…</p> : (
        <div className="card" style={{padding:0,overflow:"hidden"}}>
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
                  onClick={()=>setSelected(c)}>
                  <td style={{padding:"0.75rem 1rem",fontWeight:600}}>{c.first_name} {c.last_name}</td>
                  <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.82rem"}}>{c.email}</td>
                  <td style={{padding:"0.75rem 1rem"}}>
                    <span style={{padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.7rem",fontWeight:700,...statusColor(c.status)}}>{c.status}</span>
                  </td>
                  <td style={{padding:"0.75rem 1rem",color:"var(--text-mute)",fontSize:"0.82rem"}}>{new Date(c.submitted_at).toLocaleDateString()}</td>
                  <td style={{padding:"0.75rem 1rem"}}>
                    <button onClick={e=>{e.stopPropagation();setSelected(c)}}
                      style={{fontSize:"0.8rem",color:"var(--gold)",background:"none",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:"0.25rem 0.75rem",cursor:"pointer",fontWeight:600}}>
                      Open Record
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
      )}
    </div>
  )
}
