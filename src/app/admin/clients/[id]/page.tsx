"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, AlertTriangle, Mail, Trash2, Pencil } from "lucide-react"
import EditDetailsModal from "@/components/admin/EditDetailsModal"
import ProtocolWorkspace from "@/components/admin/ProtocolWorkspace"
import { Ring } from "@/components/admin/Charts"

const initials = (f: string, l: string) => `${(f||"?")[0] ?? ""}${(l||"")[0] ?? ""}`.toUpperCase()
const AV = ["#60A5FA","#34D399","#F472B6","#FBBF24","#A78BFA","#C9A84C"]
const avColor = (s: string) => AV[[...(s||"x")].reduce((a,c)=>a+c.charCodeAt(0),0)%AV.length]
const prettyGoal = (g: string) => g.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())

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

// kind="delta": headline result is the change first→last (weight, body fat —
// lower is better). kind="avg": headline result is the average (energy, mood).
function LineChart({ points, color, label, unit, kind="delta" }: { points: { date: string; val: number }[]; color: string; label: string; unit: string; kind?: "delta"|"avg" }) {
  if (points.length < 2) return <div style={{ padding:"1rem", color:"var(--text-mute)", fontSize:"0.8rem" }}>Not enough data ({points.length} point{points.length===1?"":"s"}).</div>
  const vals = points.map(p => p.val)
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1
  const W = 300; const H = 80; const PAD = 8
  const pts = points.map((p, i) => { const x = PAD + (i/(points.length-1))*(W-PAD*2); const y = H - PAD - ((p.val-min)/range)*(H-PAD*2); return { x, y, ...p } })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ")
  const last = pts[pts.length-1]; const first = pts[0]
  const u = unit.trim()
  const avg = vals.reduce((a,b)=>a+b,0)/vals.length
  const delta = last.val - first.val
  // Headline result + colour
  let result: string, rColor: string
  if (kind === "avg") {
    result = `avg ${avg.toFixed(1)}${unit}`
    rColor = "var(--gold)"
  } else {
    result = delta === 0 ? "no change" : `${delta < 0 ? "down" : "up"} ${Math.abs(delta).toFixed(1)} ${u}`
    rColor = delta < 0 ? "#4ade80" : delta > 0 ? "#f87171" : "var(--text-mute)"
  }
  const showLabels = pts.length <= 14
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
        <div>
          <div style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)" }}>{label}</div>
          <div style={{ fontSize:"0.66rem", color:"var(--text-mute)", marginTop:"0.15rem" }}>{points.length} check-ins · latest {last.val}{unit}</div>
        </div>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.05rem", color:rColor, whiteSpace:"nowrap" }}>{result}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+12}`} style={{ overflow:"visible", display:"block" }}>
        <defs><linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polygon points={`${pts[0].x},${H} ${polyline} ${pts[pts.length-1].x},${H}`} fill={`url(#fill-${label})`}/>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={color} opacity={i===pts.length-1?1:0.6}/>)}
        {showLabels && pts.map((p, i) => (
          <text key={`t${i}`} x={p.x} y={p.y - 6} textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--text-soft)">{p.val}</text>
        ))}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.65rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>
        <span>{new Date(pts[0].date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
        <span>{new Date(pts[pts.length-1].date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
      </div>
    </div>
  )
}

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

  const [pForm, setPForm] = useState({ peptide:"", doseAmount:"", doseUnit:"mg", frequencyDays:[] as string[], notes:"", monthlyRate:"", billingStatus:"active", durationWeeks:"" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
      setPForm({ peptide: protoRes.protocol.peptide ?? "", doseAmount: protoRes.protocol.dose_amount ?? "", doseUnit: protoRes.protocol.dose_unit ?? "mg", frequencyDays: days, notes: protoRes.protocol.coach_notes ?? "", monthlyRate: protoRes.protocol.monthly_rate ?? "", billingStatus: protoRes.protocol.billing_status ?? "active", durationWeeks: protoRes.protocol.duration_weeks != null ? String(protoRes.protocol.duration_weeks) : "" })
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


  const saveProtocol = async () => {
    setSaving(true); setSaved(false)
    await fetch("/api/admin/assign-protocol", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ clientId:id, peptide:pForm.peptide, doseAmount:pForm.doseAmount, doseUnit:pForm.doseUnit, frequencyDays:pForm.frequencyDays, notes:pForm.notes, monthlyRate: pForm.monthlyRate ? Number(pForm.monthlyRate) : null, billingStatus: pForm.billingStatus, durationWeeks: pForm.durationWeeks ? Number(pForm.durationWeeks) : null }),
    })
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false), 2500)
    await load()
  }

  const updateStatus = async (status: string) => {
    await fetch("/api/admin/intakes", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, status }) })
    setClient(p => p ? {...p,status} : p)
  }

  const deleteClient = async () => {
    setDeleting(true)
    const r = await fetch(`/api/admin/clients/${id}`, { method:"DELETE" }).then(r=>r.json()).catch(()=>({ok:false}))
    setDeleting(false)
    if (r.ok) router.push("/admin/clients")
    else alert("Delete failed: " + (r.error || "unknown"))
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
      {/* Back */}
      <button onClick={() => router.push("/admin/clients")} style={{ display:"inline-flex", alignItems:"center", gap:"0.2rem", background:"transparent", border:"1px solid var(--border)", borderRadius:"var(--radius-pill)", color:"var(--text-mute)", fontSize:"0.82rem", fontWeight:600, padding:"0.35rem 0.85rem 0.35rem 0.6rem", cursor:"pointer", marginBottom:"1rem" }}>
        <ChevronLeft size={16}/> Clients
      </button>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", marginBottom:"1.5rem", boxShadow:"var(--shadow-card)" }}>
        <div style={{ padding:"1.5rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:"1rem", minWidth:0, flex:1 }}>
            {/* Avatar */}
            <div style={{ width:56, height:56, borderRadius:"50%", flexShrink:0, background:avColor(client.email||client.id), color:"#0A0A0B", fontWeight:800, fontSize:"1.3rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {initials(client.first_name, client.last_name)}
            </div>
            <div style={{ minWidth:0 }}>
              <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(1.2rem,4vw,1.5rem)", letterSpacing:"-0.01em" }}>
                {client.first_name} {client.last_name}
              </h1>
              <p style={{ color:"var(--text-mute)", fontSize:"0.85rem", marginTop:"0.15rem" }}>{client.email}{client.phone ? ` · ${client.phone}` : ""}</p>
              {/* Goal chips */}
              {typeof intake?.primaryGoal === "string" && (
                <div style={{ display:"flex", gap:"0.35rem", marginTop:"0.65rem", flexWrap:"wrap" }}>
                  {(intake.primaryGoal as string).split(",").map(g=>g.trim()).filter(Boolean).map(g=>(
                    <span key={g} className="chip" style={{ background:"var(--gold-dim)", color:"var(--gold-light)", border:"none" }}>{prettyGoal(g)}</span>
                  ))}
                </div>
              )}
              {/* Status pills */}
              <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.65rem", flexWrap:"wrap" }}>
                {["APPROVED","PENDING","FLAGGED"].map(s=>(
                  <button key={s} onClick={()=>updateStatus(s)} className="pill" data-active={client.status===s} style={{ fontSize:"0.7rem" }}>
                    {s==="APPROVED"?"Active":s==="PENDING"?"Pending":"Flagged"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexShrink:0 }}>
            {/* Protocol progress ring */}
            {protocol && startDate && protocol.duration_weeks ? (() => {
              const start = new Date(startDate).getTime()
              const wk = Math.min(Math.max(Math.floor((Date.now()-start)/(7*864e5))+1, 1), protocol.duration_weeks!)
              return (
                <div style={{ textAlign:"center" }}>
                  <Ring value={wk} max={protocol.duration_weeks!} size={70} color="var(--gold)" label={`${wk}/${protocol.duration_weeks}`} />
                  <div style={{ fontSize:"0.66rem", color:"var(--text-mute)", marginTop:"0.3rem" }}>weeks in</div>
                </div>
              )
            })() : null}
            <button onClick={()=>setShowEdit(true)} title="Edit details" className="btn-ghost" style={{ fontSize:"0.78rem", padding:"0.45rem 0.75rem" }}>
              <Pencil size={13}/> Edit
            </button>
            <button onClick={()=>setShowDelete(true)} title="Delete client" className="btn-ghost" style={{ color:"#F87171", borderColor:"rgba(248,113,113,0.4)", fontSize:"0.78rem", padding:"0.45rem 0.75rem" }}>
              <Trash2 size={13}/> Delete
            </button>
          </div>
        </div>

        {showEdit && client && (
          <EditDetailsModal
            intake={{ id: client.id, first_name: client.first_name, last_name: client.last_name, email: client.email, data: client.data }}
            onClose={()=>setShowEdit(false)}
            onSaved={load}
          />
        )}

        {showDelete && (
          <div onClick={()=>setShowDelete(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
            <div onClick={e=>e.stopPropagation()} className="card" style={{ maxWidth:420 }}>
              <h2 style={{ fontWeight:800, fontSize:"1.05rem", marginBottom:"0.5rem" }}>Delete {client.first_name} {client.last_name}?</h2>
              <p style={{ color:"var(--text-mute)", fontSize:"0.85rem", lineHeight:1.5, marginBottom:"1rem" }}>This permanently removes the client and <b>all</b> their data — intake, protocol, proposals, check-ins and fulfillment cards. This cannot be undone.</p>
              <div style={{ display:"flex", gap:"0.6rem", justifyContent:"flex-end" }}>
                <button onClick={()=>setShowDelete(false)} style={{ padding:"0.55rem 1rem", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text)", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button onClick={deleteClient} disabled={deleting} style={{ padding:"0.55rem 1rem", background:"#ef4444", border:"none", borderRadius:"var(--radius)", color:"#fff", fontWeight:700, cursor: deleting?"default":"pointer", opacity: deleting?0.6:1 }}>{deleting?"Deleting…":"Delete permanently"}</button>
              </div>
            </div>
          </div>
        )}

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
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.1rem", color:s.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {(weightPts.length>=2 || bfPts.length>=2 || energyPts.length>=2 || moodPts.length>=2) ? (
                <div className="client-charts-grid">
                  {weightPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={weightPts} color="var(--gold)" label="Weight" unit=" lbs"/></div>}
                  {bfPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={bfPts} color="#f87171" label="Body Fat" unit="%"/></div>}
                  {energyPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={energyPts} color="#60a5fa" label="Energy" unit="/10" kind="avg"/></div>}
                  {moodPts.length>=2 && <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={moodPts} color="#4ade80" label="Mood" unit="/10" kind="avg"/></div>}
                </div>
              ) : (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"2rem", textAlign:"center", color:"var(--text-mute)", fontSize:"0.875rem" }}>
                  No check-in data yet.
                </div>
              )}
            </div>
          )}

          {/* PROTOCOL */}
          {tab==="protocol" && client && (
            <ProtocolWorkspace clientId={id} clientEmail={client.email} onChanged={load} />
          )}

          {/* CHECK-INS */}
          {tab==="checkins" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {/* Progress charts */}
              {(weightPts.length>=2 || bfPts.length>=2 || energyPts.length>=2 || moodPts.length>=2) && (
                <div style={{ marginBottom:"0.5rem" }}>
                  <p style={{ fontSize:"0.8rem", color:"var(--text-mute)", marginBottom:"0.75rem" }}>How {client.first_name} is trending over their check-ins.</p>
                  <div className="client-charts-grid">
                    {weightPts.length>=2 && <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={weightPts} color="var(--gold)" label="Weight" unit=" lbs"/></div>}
                    {bfPts.length>=2 && <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={bfPts} color="#F87171" label="Body Fat" unit="%"/></div>}
                    {energyPts.length>=2 && <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={energyPts} color="#60A5FA" label="Energy" unit="/10" kind="avg"/></div>}
                    {moodPts.length>=2 && <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}><LineChart points={moodPts} color="#34D399" label="Mood" unit="/10" kind="avg"/></div>}
                  </div>
                </div>
              )}
              {checkins.length === 0 && (
                <div style={{ textAlign:"center", padding:"2.5rem 1rem", color:"var(--text-mute)" }}>
                  <p style={{ fontSize:"0.95rem" }}>No check-ins yet.</p>
                  <p style={{ fontSize:"0.82rem", marginTop:"0.35rem" }}>They’ll appear here as {client.first_name} submits weekly updates.</p>
                </div>
              )}
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
                  { label:"Rate / order", val: monthlyRate ? `$${monthlyRate.toFixed(0)}` : "—", color:"var(--gold)" },
                  { label:"Billing Status", val: pForm.billingStatus || "—", color:"#4ade80" },
                  { label:"Lifetime Order COGS", val: `$${orderCogs.toFixed(2)}`, color:"#60a5fa" },
                  { label:"Est. Gross Margin", val: monthlyRate>0 && orders.length ? `${Math.round(((monthlyRate-(orderCogs/orders.length))/monthlyRate)*100)}%` : "—", color:"#c084fc" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.875rem 1rem" }}>
                    <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-mute)", marginBottom:"0.35rem" }}>{s.label}</div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.1rem", color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"0.75rem" }}>
                  <div><label>Rate ($) — per order</label><input type="number" value={pForm.monthlyRate} onChange={e=>setPForm(p=>({...p,monthlyRate:e.target.value}))} style={{marginTop:"0.35rem"}}/></div>
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
                          <a href={`/proposal/${p.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--gold)", fontSize:"0.82rem", fontWeight:600 }}>{p.status === "signed" ? "View signed proposal →" : "View proposal →"}</a>
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
