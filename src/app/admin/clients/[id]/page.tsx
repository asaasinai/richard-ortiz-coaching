"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, Mail } from "lucide-react"
import { PEPTIDE_NAMES } from "@/lib/peptides-data"

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DOSE_UNITS = ["mg","mcg","IU","mL"]

interface Client {
  id: string; first_name: string; last_name: string; email: string
  phone?: string; status: string; submitted_at: string; data?: Record<string, unknown>
}
interface CheckIn {
  id: string; submitted_at: string; urgent_flag: boolean; client_email: string
  data: { weight?: string; bodyFat?: string; musclePct?: string; energyScore?: number; moodScore?: number; sideEffects?: string[]; sideEffectsOther?: string; missedDoses?: string; reason?: string; notes?: string }
}
interface Protocol {
  peptide: string; dose_amount: string; dose_unit: string; frequency_days: string
  coach_notes: string; assigned_at: string; protocol_start_date?: string; followup_sent?: boolean
  monthly_rate?: string; billing_status?: string; secondary_peptide?: string; duration_weeks?: number
}
interface Proposal {
  id: string; status: string; created_at: string; sent_at?: string; signed_at?: string; signed_name?: string; proposal_token: string
}
interface OpsCardLite {
  id: string; status: string; total_cogs: string; due_date: string | null; shipped_at: string | null
  created_at: string; tracking_number: string | null
  line_items: { peptide: string; strength?: string; strength_unit?: string; qty: number; lot_ids?: string[] }[]
}

function LineChart({ points, color, label, unit }: { points: { date: string; val: number }[]; color: string; label: string; unit: string }) {
  if (points.length < 2) return <div style={{ padding:"1rem", color:"var(--text-mute)", fontSize:"0.8rem" }}>Not enough data ({points.length} point{points.length===1?"":"s"}).</div>
  const vals = points.map(p => p.val)
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1
  const W = 300; const H = 80; const PAD = 8
  const pts = points.map((p, i) => { const x = PAD + (i/(points.length-1))*(W-PAD*2); const y = H - PAD - ((p.val-min)/range)*(H-PAD*2); return { x, y, ...p } })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ")
  const last = pts[pts.length-1]; const prev = pts[pts.length-2]; const trend = last.val > prev.val ? "up" : last.val < prev.val ? "down" : "flat"
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"0.35rem" }}>
        <span style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)" }}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
          <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem" }}>{last.val}{unit}</span>
          <span style={{ fontSize:"0.7rem", color: trend==="up"?"#4ade80":trend==="down"?"#f87171":"var(--text-mute)" }}>{trend==="up"?"↑":trend==="down"?"↓":"="}</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible", display:"block" }}>
        <defs><linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polygon points={`${pts[0].x},${H} ${polyline} ${pts[pts.length-1].x},${H}`} fill={`url(#fill-${label})`}/>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={color} opacity={i===pts.length-1?1:0.6}/>)}
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

const proposalStatusColor = (s: string) => ({
  draft:  { bg:"rgba(255,255,255,0.08)", color:"var(--text-mute)" },
  sent:   { bg:"rgba(201,168,76,0.15)", color:"var(--gold)" },
  signed: { bg:"rgba(74,222,128,0.15)", color:"#4ade80" },
}[s] ?? { bg:"transparent", color:"var(--text-mute)" })

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [orders, setOrders] = useState<OpsCardLite[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview"|"protocol"|"checkins"|"intake"|"proposals"|"orders"|"billing">("overview")

  // Deep-link support: ?tab=billing (from revenue page)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab")
    if (t && ["overview","protocol","checkins","intake","proposals","orders","billing"].includes(t)) setTab(t as typeof tab)
  }, [])

  const [pForm, setPForm] = useState({ peptide:"", doseAmount:"", doseUnit:"mg", frequencyDays:[] as string[], notes:"", monthlyRate:"", billingStatus:"active" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [smsLink, setSmsLink] = useState("")
  const [smsDraft, setSmsDraft] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const [intakeRes, checkinRes, protoRes, proposalsRes, ordersRes] = await Promise.all([
      fetch(`/api/admin/intakes/${id}`).then(r => r.json()),
      fetch(`/api/admin/checkins?clientEmail=all`).then(r => r.json()),
      fetch(`/api/admin/assign-protocol?clientId=${id}`).then(r => r.json()),
      fetch(`/api/admin/intakes/${id}/proposal`).then(r => r.json()),
      fetch(`/api/admin/ops-cards?client=${id}`).then(r => r.json()).catch(() => ({ cards: [] })),
    ])

    setClient(intakeRes.intake ?? null)
    setOrders(ordersRes.cards ?? [])

    // Filter checkins for this client
    if (intakeRes.intake?.email) {
      const allCheckins = checkinRes.checkins ?? []
      setCheckins(allCheckins.filter((c: CheckIn) => c.client_email === intakeRes.intake.email))
    }

    if (protoRes.protocol) {
      setProtocol(protoRes.protocol)
      let days: string[] = []
      try { days = JSON.parse(protoRes.protocol.frequency_days) } catch { days = [] }
      setPForm({ peptide: protoRes.protocol.peptide ?? "", doseAmount: protoRes.protocol.dose_amount ?? "", doseUnit: protoRes.protocol.dose_unit ?? "mg", frequencyDays: days, notes: protoRes.protocol.coach_notes ?? "", monthlyRate: protoRes.protocol.monthly_rate ?? "", billingStatus: protoRes.protocol.billing_status ?? "active" })
      if (protoRes.protocol.protocol_start_date) setStartDate(protoRes.protocol.protocol_start_date.slice(0,10))
    }

    // Load all proposals
    const proposalsData = intakeRes.proposals ?? []
    setProposals(proposalsData)
    if (proposalsRes.proposal) {
      setProposals(prev => {
        const exists = prev.find(p => p.id === proposalsRes.proposal.id)
        return exists ? prev : [proposalsRes.proposal, ...prev]
      })
    }

    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const toggleDay = (d: string) =>
    setPForm(p => ({ ...p, frequencyDays: p.frequencyDays.includes(d) ? p.frequencyDays.filter(x=>x!==d) : [...p.frequencyDays, d] }))

  const saveProtocol = async () => {
    setSaving(true); setSaved(false)
    await fetch("/api/admin/assign-protocol", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ clientId:id, peptide:pForm.peptide, doseAmount:pForm.doseAmount, doseUnit:pForm.doseUnit, frequencyDays:pForm.frequencyDays, notes:pForm.notes, monthlyRate: pForm.monthlyRate ? Number(pForm.monthlyRate) : null, billingStatus: pForm.billingStatus }),
    })
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false), 2500)
    await load()
  }

  const updateStatus = async (status: string) => {
    await fetch("/api/admin/intakes", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, status }) })
    setClient(p => p ? {...p,status} : p)
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}><p style={{color:"var(--text-mute)"}}>Loading…</p></div>
  if (!client) return <div><p style={{color:"#f87171"}}>Client not found.</p><button onClick={()=>router.push("/admin/clients")} className="btn-outline" style={{marginTop:"1rem"}}>← Back</button></div>

  const weightPts = checkins.filter(c=>c.data.weight&&!isNaN(Number(c.data.weight))).map(c=>({ date:c.submitted_at, val:Number(c.data.weight) }))
  const bfPts     = checkins.filter(c=>c.data.bodyFat&&!isNaN(Number(c.data.bodyFat))).map(c=>({ date:c.submitted_at, val:Number(c.data.bodyFat) }))
  const energyPts = checkins.filter(c=>c.data.energyScore!==undefined).map(c=>({ date:c.submitted_at, val:c.data.energyScore! }))
  const moodPts   = checkins.filter(c=>c.data.moodScore!==undefined).map(c=>({ date:c.submitted_at, val:c.data.moodScore! }))
  const intake    = client.data as Record<string,unknown> | undefined

  const TABS = [
    { id:"overview",   label:"Overview" },
    { id:"protocol",   label:"Protocol" },
    { id:"checkins",   label:`Check-Ins (${checkins.length})` },
    { id:"intake",     label:"Intake" },
    { id:"orders",     label:`Orders (${orders.length})` },
    { id:"billing",    label:"Billing" },
    { id:"proposals",  label:`Proposals (${proposals.length})` },
  ] as const

  const orderCogs = orders.reduce((s,o)=>s+Number(o.total_cogs??0),0)
  const monthlyRate = Number(pForm.monthlyRate||0)

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <button onClick={() => router.push("/admin/clients")} style={{ background:"none", border:"none", color:"var(--text-mute)", cursor:"pointer", padding:"0.25rem", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.85rem", marginBottom:"1rem" }}>
        <ArrowLeft size={16}/> Back to Clients
      </button>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", marginBottom:"1.5rem" }}>
        <div style={{ padding:"1.25rem 1.25rem 0.875rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.75rem" }}>
          <div style={{ minWidth:0 }}>
            <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.1rem,4vw,1.4rem)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {client.first_name} {client.last_name}
            </h1>
            <p style={{ color:"var(--text-mute)", fontSize:"0.82rem", marginTop:"0.2rem" }}>{client.email}</p>
            <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.6rem", flexWrap:"wrap" }}>
              {["APPROVED","PENDING","FLAGGED"].map(s=>(
                <button key={s} onClick={()=>updateStatus(s)} style={{
                  padding:"0.2rem 0.65rem", borderRadius:3, fontSize:"0.7rem", fontWeight:700, cursor:"pointer",
                  ...statusColor(s), border:`1px solid ${statusColor(s).color}`,
                  opacity: client.status===s ? 1 : 0.4
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", overflowX:"auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id as typeof tab)} style={{
              padding:"0.75rem 1rem", fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
              background:"none", border:"none", borderBottom: tab===t.id ? "2px solid var(--gold)" : "2px solid transparent",
              color: tab===t.id ? "var(--gold)" : "var(--text-mute)", marginBottom:-1, whiteSpace:"nowrap", flexShrink:0
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding:"1.25rem" }}>
          {/* OVERVIEW */}
          {tab==="overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              <div className="client-stats-grid">
                {[
                  { label:"Check-Ins", val: checkins.length, color:"var(--gold)" },
                  { label:"Urgent Flags", val: checkins.filter(c=>c.urgent_flag).length, color:"#f87171" },
                  { label:"Latest Weight", val: weightPts.length ? `${weightPts[weightPts.length-1].val} lbs` : "—", color:"#60a5fa" },
                  { label:"Protocol", val: pForm.peptide || "None", color:"#4ade80" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.875rem 1rem" }}>
                    <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)", marginBottom:"0.35rem" }}>{s.label}</div>
                    <div style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", color:s.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {(weightPts.length>=2 || bfPts.length>=2 || energyPts.length>=2 || moodPts.length>=2) ? (
                <div className="client-charts-grid">
                  {weightPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={weightPts} color="var(--gold)" label="Weight" unit=" lbs"/></div>}
                  {bfPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={bfPts} color="#f87171" label="Body Fat" unit="%"/></div>}
                  {energyPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={energyPts} color="#60a5fa" label="Energy" unit="/10"/></div>}
                  {moodPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={moodPts} color="#4ade80" label="Mood" unit="/10"/></div>}
                </div>
              ) : (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"2rem", textAlign:"center", color:"var(--text-mute)", fontSize:"0.875rem" }}>
                  No check-in data yet.
                </div>
              )}
            </div>
          )}

          {/* PROTOCOL */}
          {tab==="protocol" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              <div>
                <label>Peptide</label>
                <select value={pForm.peptide} onChange={e=>setPForm(p=>({...p,peptide:e.target.value}))} style={{marginTop:"0.35rem"}}>
                  <option value="">— Select peptide —</option>
                  {PEPTIDE_NAMES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div><label>Dose Amount</label><input type="text" placeholder="e.g. 250" value={pForm.doseAmount} onChange={e=>setPForm(p=>({...p,doseAmount:e.target.value}))} style={{marginTop:"0.35rem"}}/></div>
                <div><label>Unit</label><select value={pForm.doseUnit} onChange={e=>setPForm(p=>({...p,doseUnit:e.target.value}))} style={{marginTop:"0.35rem"}}>{DOSE_UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
              </div>
              <div>
                <label style={{display:"block",marginBottom:"0.5rem"}}>Frequency</label>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"0.6rem" }}>
                  {[{label:"Daily",days:DAYS},{label:"3×/wk",days:["Mon","Wed","Fri"]},{label:"2×/wk",days:["Mon","Thu"]},{label:"Weekly",days:["Mon"]}].map(preset=>(
                    <button key={preset.label} type="button" onClick={()=>setPForm(p=>({...p,frequencyDays:preset.days}))} style={{ padding:"0.35rem 0.75rem", borderRadius:"var(--radius)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", background: JSON.stringify([...pForm.frequencyDays].sort())===JSON.stringify([...preset.days].sort()) ? "var(--gold)" : "var(--surface-2)", color: JSON.stringify([...pForm.frequencyDays].sort())===JSON.stringify([...preset.days].sort()) ? "#000" : "var(--text-mute)", border:"1px solid var(--border)" }}>{preset.label}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {DAYS.map(d=>(
                    <button key={d} type="button" onClick={()=>toggleDay(d)} style={{ width:"2.5rem", height:"2.5rem", borderRadius:"var(--radius)", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", background: pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--surface-2)", color: pForm.frequencyDays.includes(d) ? "#000" : "var(--text-mute)", border:`1px solid ${pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--border)"}` }}>{d}</button>
                  ))}
                </div>
              </div>
              <div><label>Coach Notes</label><textarea rows={3} value={pForm.notes} onChange={e=>setPForm(p=>({...p,notes:e.target.value}))} placeholder="Reconstitution instructions, timing, special notes..." style={{marginTop:"0.35rem"}}/></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div><label>Monthly Rate ($)</label><input type="number" placeholder="299" value={pForm.monthlyRate} onChange={e=>setPForm(p=>({...p,monthlyRate:e.target.value}))} style={{marginTop:"0.35rem"}}/></div>
                <div><label>Billing Status</label><select value={pForm.billingStatus} onChange={e=>setPForm(p=>({...p,billingStatus:e.target.value}))} style={{marginTop:"0.35rem"}}>{["active","paused","complimentary"].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <button onClick={saveProtocol} disabled={saving||!pForm.peptide} className="btn-gold" style={{alignSelf:"flex-start"}}>
                {saving?"Saving…":saved?"✓ Saved":"Save Protocol"}
              </button>
              {protocol && <p style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>Last saved: {new Date(protocol.assigned_at).toLocaleString()}</p>}
              <div style={{ marginTop:"0.5rem" }}>
                <a href={`/admin/intakes/${id}`} style={{ color:"var(--gold)", fontSize:"0.85rem" }}>View Full Intake + AI Rec + Proposal Builder →</a>
              </div>
            </div>
          )}

          {/* CHECK-INS */}
          {tab==="checkins" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {checkins.length === 0 && <p style={{color:"var(--text-mute)"}}>No check-ins yet.</p>}
              {checkins.slice().reverse().map(c=>(
                <div key={c.id} style={{ background:"var(--surface)", border:`1px solid ${c.urgent_flag?"rgba(248,113,113,0.4)":"var(--border)"}`, borderRadius:"var(--radius)", padding:"1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem", flexWrap:"wrap", gap:"0.3rem" }}>
                    <span style={{ fontWeight:700, fontSize:"0.875rem" }}>{new Date(c.submitted_at).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</span>
                    {c.urgent_flag && <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", color:"#f87171", fontSize:"0.78rem", fontWeight:700 }}><AlertTriangle size={12}/> Urgent</span>}
                  </div>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", fontSize:"0.82rem", color:"var(--text-mute)" }}>
                    {c.data.weight && <span>⚖ {c.data.weight} lbs</span>}
                    {c.data.bodyFat && <span>Body Fat {c.data.bodyFat}%</span>}
                    {c.data.energyScore !== undefined && <span>Energy {c.data.energyScore}/10</span>}
                    {c.data.moodScore !== undefined && <span>Mood {c.data.moodScore}/10</span>}
                    {c.data.missedDoses && c.data.missedDoses!=="0" && <span>Missed {c.data.missedDoses} dose(s)</span>}
                  </div>
                  {c.data.notes && <p style={{ marginTop:"0.35rem", fontSize:"0.82rem", color:"var(--text-soft)", lineHeight:1.55 }}>{c.data.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* INTAKE */}
          {tab==="intake" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {!intake || Object.keys(intake).length===0 ? (
                <p style={{color:"var(--text-mute)"}}>No intake form data stored.</p>
              ) : (
                <div className="client-intake-grid">
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
              <div style={{ marginTop:"0.75rem", display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
                <a href={`mailto:${client.email}`} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", textDecoration:"none" }} className="btn-gold">
                  <Mail size={14}/> Email {client.first_name}
                </a>
                <a href={`/admin/intakes/${id}`} className="btn-outline" style={{ display:"inline-flex", textDecoration:"none", fontSize:"0.875rem", padding:"0.55rem 1rem" }}>
                  View Full Intake →
                </a>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {tab==="orders" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {orders.length===0 ? (
                <div style={{ textAlign:"center", padding:"2rem 0", color:"var(--text-mute)" }}>
                  <p style={{ marginBottom:"1rem" }}>No fulfillment orders yet.</p>
                  <a href="/admin/ops-queue" className="btn-gold" style={{ textDecoration:"none", display:"inline-block" }}>Open Ops Queue →</a>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", gap:"1rem", marginBottom:"0.25rem" }}>
                    <span style={{ fontSize:"0.8rem", color:"var(--text-mute)" }}>{orders.length} order(s)</span>
                    <span style={{ fontSize:"0.8rem", color:"var(--text-mute)" }}>Total COGS: <strong style={{ color:"var(--gold)" }}>${orderCogs.toFixed(2)}</strong></span>
                  </div>
                  {orders.map(o => (
                    <a key={o.id} href={`/admin/ops-queue/${o.id}`} style={{ textDecoration:"none", color:"inherit" }}>
                      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.85rem 1rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.35rem" }}>
                          <span style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", color:"var(--text-mute)" }}>{o.status}</span>
                          <span style={{ fontWeight:700, color:"var(--gold)", fontSize:"0.82rem" }}>${Number(o.total_cogs).toFixed(2)} COGS</span>
                        </div>
                        <div style={{ fontSize:"0.82rem", color:"var(--text-soft)" }}>{(o.line_items??[]).map(li=>`${li.peptide}${li.strength?` ${li.strength}${li.strength_unit??""}`:""} ×${li.qty}`).join(", ")}</div>
                        <div style={{ display:"flex", gap:"1rem", marginTop:"0.35rem", fontSize:"0.72rem", color:"var(--text-mute)" }}>
                          <span>Created {new Date(o.created_at).toLocaleDateString()}</span>
                          {o.shipped_at && <span>Shipped {new Date(o.shipped_at).toLocaleDateString()}</span>}
                          {o.tracking_number && <span>Tracking {o.tracking_number}</span>}
                          {(o.line_items??[]).some(li=>li.lot_ids?.length) && <span>Lots: {(o.line_items??[]).flatMap(li=>li.lot_ids??[]).map(l=>l.slice(0,8)).join(", ")}</span>}
                        </div>
                      </div>
                    </a>
                  ))}
                </>
              )}
            </div>
          )}

          {/* BILLING */}
          {tab==="billing" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div className="client-stats-grid">
                {[
                  { label:"Rate / month", val: monthlyRate ? `$${monthlyRate.toFixed(0)}` : "—", color:"var(--gold)" },
                  { label:"Billing Status", val: pForm.billingStatus || "—", color:"#4ade80" },
                  { label:"Lifetime Order COGS", val: `$${orderCogs.toFixed(2)}`, color:"#60a5fa" },
                  { label:"Est. Gross Margin", val: monthlyRate>0 && orders.length ? `${Math.round(((monthlyRate-(orderCogs/orders.length))/monthlyRate)*100)}%` : "—", color:"#c084fc" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.875rem 1rem" }}>
                    <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)", marginBottom:"0.35rem" }}>{s.label}</div>
                    <div style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"0.75rem" }}>
                  <div><label>Monthly Rate ($)</label><input type="number" value={pForm.monthlyRate} onChange={e=>setPForm(p=>({...p,monthlyRate:e.target.value}))} style={{marginTop:"0.35rem"}}/></div>
                  <div><label>Billing Status</label><select value={pForm.billingStatus} onChange={e=>setPForm(p=>({...p,billingStatus:e.target.value}))} style={{marginTop:"0.35rem"}}>{["active","paused","complimentary","churned"].map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <button onClick={saveProtocol} disabled={saving||!pForm.peptide} className="btn-gold">{saving?"Saving…":saved?"✓ Saved":"Save Billing"}</button>
                {!pForm.peptide && <p style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginTop:"0.5rem" }}>Assign a protocol first (Protocol tab) to enable billing.</p>}
              </div>
              <p style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>Per-month FIFO COGS &amp; margin breakdown on the <a href="/admin/revenue" style={{ color:"var(--gold)" }}>Revenue</a> page.</p>
            </div>
          )}

          {/* PROPOSALS */}
          {tab==="proposals" && (
            <div>
              {proposals.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem 0", color:"var(--text-mute)" }}>
                  <p style={{ marginBottom:"1rem" }}>No proposals yet. Go to the intake page to create one.</p>
                  <a href={`/admin/intakes/${id}`} className="btn-gold" style={{ textDecoration:"none", display:"inline-block" }}>Open Intake + Proposal Builder →</a>
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--border)" }}>
                      {["Created","Status","Signed","Actions"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"0.5rem 0.75rem", color:"var(--text-mute)", fontWeight:600, fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map(p => (
                      <tr key={p.id} style={{ borderBottom:"1px solid var(--border)" }}>
                        <td style={{ padding:"0.75rem" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td style={{ padding:"0.75rem" }}>
                          <span style={{ padding:"0.2rem 0.6rem", borderRadius:3, fontSize:"0.7rem", fontWeight:700, ...proposalStatusColor(p.status) }}>{p.status}</span>
                        </td>
                        <td style={{ padding:"0.75rem", color:"var(--text-mute)", fontSize:"0.82rem" }}>
                          {p.signed_at ? `${p.signed_name} · ${new Date(p.signed_at).toLocaleDateString()}` : "—"}
                        </td>
                        <td style={{ padding:"0.75rem" }}>
                          <a href={`/proposal/${p.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--gold)", fontSize:"0.82rem" }}>View →</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .client-stats-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
        .client-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .client-intake-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        @media (max-width: 600px) {
          .client-stats-grid   { grid-template-columns: repeat(2,1fr); }
          .client-charts-grid  { grid-template-columns: 1fr; }
          .client-intake-grid  { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
