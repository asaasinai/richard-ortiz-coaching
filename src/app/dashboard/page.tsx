"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { Calendar, ArrowRight, Beaker, Trash2, Calculator } from "lucide-react"

interface CheckIn {
  id: string
  submitted_at: string
  data: {
    weight?: string; energyScore?: number; moodScore?: number
    sideEffects?: string[]; notes?: string; urgentFlag?: boolean
  }
}
interface Protocol { peptide: string; protocol: string; coach_notes: string; assigned_at: string }

// kind="delta": headline is the change first→last (weight — lower is better).
// kind="avg": headline is the average (energy, mood). Plots every point with its
// value labelled, and shows the point count.
function Spark({ values, color="var(--gold)", h=52, kind="avg", unit="" }: { values: number[], color?: string, h?: number, kind?: "delta"|"avg", unit?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1
  const w = 220
  const xy = (v: number, i: number) => ({ x: (i/(values.length-1))*w, y: h - ((v-min)/range)*(h-8) - 4 })
  const pts = values.map((v,i) => { const p = xy(v,i); return `${p.x},${p.y}` }).join(" ")
  const first = values[0]; const last = values[values.length-1]
  const avg = values.reduce((a,b)=>a+b,0)/values.length
  const delta = last - first
  let result: string, rColor: string
  if (kind === "avg") { result = `avg ${avg.toFixed(1)}${unit}`; rColor = "var(--gold)" }
  else { result = delta === 0 ? "no change" : `${delta < 0 ? "down" : "up"} ${Math.abs(delta).toFixed(1)} ${unit}`.trim(); rColor = delta < 0 ? "#4ade80" : delta > 0 ? "#f87171" : "var(--text-mute)" }
  const showLabels = values.length <= 14
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
      <svg width={w} height={h+14} style={{ overflow:"visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {values.map((v,i) => {
          const p = xy(v,i)
          return <g key={i}>
            <circle cx={p.x} cy={p.y} r={i===values.length-1?5:3} fill={color} opacity={i===values.length-1?1:0.5}/>
            {showLabels && <text x={p.x} y={p.y-7} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--text-soft)">{v}</text>}
          </g>
        })}
      </svg>
      <div>
        <div style={{ fontSize:"1.5rem", fontWeight:900, fontFamily:"var(--font-display)", color:rColor, lineHeight:1.1 }}>{result}</div>
        <div style={{ fontSize:"0.7rem", marginTop:"0.3rem", color:"var(--text-mute)" }}>{values.length} check-ins · latest {last}{unit}</div>
      </div>
    </div>
  )
}

function DeleteModal({ email, onClose, onDeleted }: { email: string; onClose: () => void; onDeleted: () => void }) {
  const [step, setStep] = useState<1|2>(1)
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const proceed = async () => {
    if (confirm !== "DELETE MY ACCOUNT") { setError("Type exactly: DELETE MY ACCOUNT"); return }
    setLoading(true)
    const res = await fetch("/api/client/delete-account", {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, confirmation: confirm })
    })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { sessionStorage.clear(); onDeleted() }
    else setError(d.error ?? "Something went wrong.")
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div className="card" style={{ maxWidth:420, width:"100%", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:"1rem", right:"1rem",
          background:"none", border:"none", color:"var(--text-mute)", cursor:"pointer", fontSize:"1.1rem" }}>&#x2715;</button>

        {step === 1 ? (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"1rem" }}>
              <Trash2 size={20} style={{ color:"#f87171" }}/>
              <h2 style={{ fontWeight:900, fontSize:"1.1rem", color:"#f87171" }}>Delete Account</h2>
            </div>
            <p style={{ color:"var(--text-soft)", fontSize:"0.9rem", lineHeight:1.65, marginBottom:"1.25rem" }}>
              This will permanently delete your account, all intake data, check-in history, and assigned protocols.
              <strong style={{ color:"#f87171", display:"block", marginTop:"0.5rem" }}>
                This action is irreversible and cannot be undone.
              </strong>
            </p>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={onClose} className="btn-outline" style={{ flex:1 }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ flex:1, padding:"0.6rem", borderRadius:"var(--radius)",
                background:"rgba(248,113,113,0.15)", border:"1px solid #f87171", color:"#f87171",
                fontWeight:700, fontSize:"0.875rem", cursor:"pointer" }}>
                I understand, continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.75rem" }}>
              <Trash2 size={20} style={{ color:"#f87171" }}/>
              <h2 style={{ fontWeight:900, fontSize:"1.1rem", color:"#f87171" }}>Final Confirmation</h2>
            </div>
            <p style={{ color:"var(--text-soft)", fontSize:"0.875rem", marginBottom:"1rem", lineHeight:1.6 }}>
              Type <strong style={{ color:"var(--text)" }}>DELETE MY ACCOUNT</strong> to confirm permanent deletion.
            </p>
            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="DELETE MY ACCOUNT" style={{ marginBottom:"0.75rem", fontFamily:"monospace" }}/>
            {error && <p style={{ color:"#f87171", fontSize:"0.82rem", marginBottom:"0.75rem" }}>{error}</p>}
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={onClose} className="btn-outline" style={{ flex:1 }}>Cancel</button>
              <button onClick={proceed} disabled={loading} style={{ flex:1, padding:"0.6rem", borderRadius:"var(--radius)",
                background:"#f87171", border:"none", color:"#000", fontWeight:700, fontSize:"0.875rem", cursor:"pointer" }}>
                {loading ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [clientEmail, setClientEmail] = useState<string|null>(null)
  const [clientName,  setClientName]  = useState("")
  const [checkins,    setCheckins]    = useState<CheckIn[]>([])
  const [protocol,    setProtocol]    = useState<Protocol|null>(null)
  const [loading,     setLoading]     = useState(true)
  const [showDelete,  setShowDelete]  = useState(false)

  useEffect(() => {
    const email = sessionStorage.getItem("roc_dashboard_email")
    const name  = sessionStorage.getItem("roc_dashboard_name") ?? ""
    if (!email) { router.replace("/auth/signin"); return }
    setClientEmail(email)
    setClientName(name)
  }, [router])

  useEffect(() => {
    if (!clientEmail) return
    setLoading(true)
    fetch(`/api/client/profile?email=${encodeURIComponent(clientEmail)}`)
      .then(r => r.json())
      .then(d => {
        setCheckins(d.checkins ?? [])
        setProtocol(d.protocol ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [clientEmail])

  const signOut = () => { sessionStorage.clear(); router.push("/auth/signin") }

  // Plot every check-in point (chronological), not just the last 10.
  const byDate = [...checkins].sort((a,b) => +new Date(a.submitted_at) - +new Date(b.submitted_at))
  const weightVals = byDate.filter(c => c.data.weight && !isNaN(Number(c.data.weight))).map(c => Number(c.data.weight))
  const energyVals = byDate.filter(c => c.data.energyScore !== undefined).map(c => c.data.energyScore!)
  const moodVals   = byDate.filter(c => c.data.moodScore !== undefined).map(c => c.data.moodScore!)

  if (!clientEmail) return null

  return (
    <>
      <Nav/>
      {showDelete && clientEmail && (
        <DeleteModal email={clientEmail} onClose={() => setShowDelete(false)} onDeleted={() => router.push("/")}/>
      )}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"2rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"2rem", letterSpacing:"-0.03em" }}>
              {clientName ? `Hey, ${clientName.split(" ")[0]}` : "Your Dashboard"}
            </h1>
            <p style={{ color:"var(--text-mute)", fontSize:"0.85rem", marginTop:"0.2rem" }}>{clientEmail}</p>
          </div>
          <button onClick={signOut} style={{ fontSize:"0.8rem", color:"var(--text-mute)", background:"none",
            border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.4rem 0.9rem", cursor:"pointer" }}>
            Sign out
          </button>
        </div>

        {loading && <p style={{ color:"var(--text-mute)" }}>Loading your data...</p>}

        {!loading && (
          <>
            {/* Assigned Protocol */}
            {protocol ? (
              <div className="card" style={{ marginBottom:"1.5rem", borderLeft:"3px solid var(--gold)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem" }}>
                  <Beaker size={20} style={{ color:"var(--gold)", marginTop:"0.15rem", flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.3rem" }}>Your Protocol</div>
                    <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"baseline" }}>
                      <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.3rem", color:"var(--text)" }}>{protocol.peptide}</span>
                      <span style={{ fontSize:"0.85rem", color:"var(--gold)", fontWeight:700 }}>{protocol.protocol} dose</span>
                    </div>
                    {protocol.coach_notes && (
                      <p style={{ color:"var(--text-soft)", fontSize:"0.875rem", marginTop:"0.5rem", lineHeight:1.65 }}>{protocol.coach_notes}</p>
                    )}
                    <p style={{ fontSize:"0.72rem", color:"var(--text-mute)", marginTop:"0.4rem" }}>
                      Assigned {new Date(protocol.assigned_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginBottom:"1.5rem", textAlign:"center", padding:"2rem" }}>
                <Beaker size={28} style={{ color:"var(--text-mute)", margin:"0 auto 0.75rem" }}/>
                <p style={{ color:"var(--text-mute)", fontSize:"0.875rem" }}>No protocol assigned yet. Your coach will assign one after reviewing your intake.</p>
              </div>
            )}

            {/* Your Tools */}
            <div className="card" style={{ marginBottom:"1.5rem" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.75rem" }}>Your Tools</div>
              <Link href="/calculator" style={{ display:"inline-flex", alignItems:"center", gap:"0.6rem",
                color:"var(--gold)", fontSize:"0.9rem", fontWeight:700 }} className="hover:underline">
                <Calculator size={18}/> Dose Calculator <ArrowRight size={14}/>
              </Link>
            </div>

            {/* Weight trend */}
            {weightVals.length >= 2 && (
              <div className="card" style={{ marginBottom:"1.5rem" }}>
                <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"1rem" }}>Weight Trend (lbs)</div>
                <Spark values={weightVals} color="var(--gold)" h={60} kind="delta" unit="lbs"/>
              </div>
            )}

            {/* Score trends */}
            {(energyVals.length>=2 || moodVals.length>=2) && (
              <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
                {energyVals.length>=2 && (
                  <div className="card" style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.75rem" }}>Energy</div>
                    <Spark values={energyVals} color="#60a5fa" h={40} kind="avg" unit="/10"/>
                  </div>
                )}
                {moodVals.length>=2 && (
                  <div className="card" style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.75rem" }}>Mood</div>
                    <Spark values={moodVals} color="#4ade80" h={40} kind="avg" unit="/10"/>
                  </div>
                )}
              </div>
            )}

            {/* Check-in history */}
            {checkins.length === 0 ? (
              <div className="card" style={{ textAlign:"center", padding:"2.5rem", marginBottom:"1.5rem" }}>
                <p style={{ color:"var(--text-mute)", fontSize:"0.875rem", marginBottom:"1.25rem" }}>
                  No check-ins yet. Complete your first 2-week check-in to start tracking progress.
                </p>
                <Link href="/checkin" className="btn-gold" style={{ display:"inline-block" }}>Start Check-In</Link>
              </div>
            ) : (
              <div className="card" style={{ marginBottom:"1.5rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
                  <h2 style={{ fontWeight:700, fontSize:"0.95rem" }}>Check-In History</h2>
                  <Link href="/checkin" className="btn-gold" style={{ fontSize:"0.78rem", padding:"0.35rem 0.9rem" }}>New Check-In</Link>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  {checkins.slice().reverse().map(c => (
                    <div key={c.id} style={{ borderBottom:"1px solid var(--border)", paddingBottom:"0.75rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
                        <span style={{ fontWeight:600, fontSize:"0.85rem" }}>
                          {new Date(c.submitted_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                        </span>
                        {c.data.urgentFlag && <span style={{ fontSize:"0.7rem", color:"#f87171", fontWeight:700 }}>&#x26A0; Urgent</span>}
                      </div>
                      <div style={{ display:"flex", gap:"1.25rem", fontSize:"0.8rem", color:"var(--text-mute)", flexWrap:"wrap" }}>
                        {c.data.weight      && <span>&#x2696; {c.data.weight} lbs</span>}
                        {c.data.energyScore && <span>Energy {c.data.energyScore}/10</span>}
                        {c.data.moodScore   && <span>Mood {c.data.moodScore}/10</span>}
                      </div>
                      {c.data.sideEffects && c.data.sideEffects.length>0 && c.data.sideEffects[0]!=="None" && (
                        <div style={{ marginTop:"0.25rem", fontSize:"0.75rem", color:"var(--text-mute)" }}>
                          Side effects: {c.data.sideEffects.join(", ")}
                        </div>
                      )}
                      {c.data.notes && (
                        <p style={{ marginTop:"0.3rem", fontSize:"0.78rem", color:"var(--text-soft)", lineHeight:1.55 }}>{c.data.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Book a session */}
            <Link href="/contact" style={{ textDecoration:"none", display:"block", marginBottom:"1.5rem" }}>
              <div className="card" style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:"1rem" }}>
                <Calendar size={20} style={{ color:"var(--gold)", flexShrink:0 }}/>
                <div>
                  <h3 style={{ fontWeight:700, marginBottom:"0.25rem" }}>Book a Session</h3>
                  <p style={{ color:"var(--text-mute)", fontSize:"0.875rem" }}>Schedule your next coaching call with Richard.</p>
                </div>
                <ArrowRight size={16} style={{ color:"var(--text-mute)", marginLeft:"auto" }}/>
              </div>
            </Link>

            {/* Danger zone */}
            <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.5rem" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.75rem" }}>Danger Zone</div>
              <button onClick={() => setShowDelete(true)}
                style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"none",
                  border:"1px solid rgba(248,113,113,0.4)", borderRadius:"var(--radius)",
                  padding:"0.6rem 1.1rem", color:"#f87171", fontSize:"0.85rem", fontWeight:600, cursor:"pointer" }}>
                <Trash2 size={14}/> Delete My Account
              </button>
              <p style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginTop:"0.4rem" }}>
                Permanently removes all your data. This cannot be undone.
              </p>
            </div>
          </>
        )}
      </div>
      <Footer/>
    </>
  )
}
