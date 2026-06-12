"use client"
import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { Calendar, Activity, TrendingUp, TrendingDown, Minus, Mail, ArrowRight } from "lucide-react"

interface CheckIn {
  id: string
  submitted_at: string
  data: {
    weight?: string
    energyScore?: number
    moodScore?: number
    progressScore?: number
    sideEffects?: string[]
    notes?: string
    urgentFlag?: boolean
  }
}

function SparkLine({ values, color = "var(--gold)", height = 48 }: { values: number[], color?: string, height?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 200
  const h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(" ")
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  const trend = last > prev ? "up" : last < prev ? "down" : "flat"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * w
          const y = h - ((v - min) / range) * (h - 8) - 4
          return <circle key={i} cx={x} cy={y} r={i === values.length - 1 ? 4 : 2.5} fill={color} />
        })}
      </svg>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "Inter Tight, sans-serif", color: "var(--text)", lineHeight: 1 }}>{last}</div>
        <div style={{ fontSize: "0.7rem", color: trend === "up" ? "#4ade80" : trend === "down" ? "#f87171" : "var(--text-mute)", display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.25rem", justifyContent: "flex-end" }}>
          {trend === "up" ? <TrendingUp size={11}/> : trend === "down" ? <TrendingDown size={11}/> : <Minus size={11}/>}
          {trend === "up" ? "improving" : trend === "down" ? "declining" : "stable"}
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ label, values, color }: { label: string, values: number[], color: string }) {
  const latest = values[values.length - 1]
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mute)", marginBottom: "0.75rem" }}>{label}</div>
      <SparkLine values={values} color={color} height={40} />
    </div>
  )
}

function LoginGate({ onAuth }: { onAuth: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!email) return
    setLoading(true)
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }).catch(() => null)
    setLoading(false)
    setSent(true)
    // For demo: also call onAuth immediately so they can preview
    onAuth(email)
  }

  if (sent) return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <Mail size={40} style={{ color: "var(--gold)", margin: "0 auto 1rem" }} />
      <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.5rem" }}>Check your email</h2>
      <p style={{ color: "var(--text-mute)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
        We sent a secure login link to <strong style={{ color: "var(--text)" }}>{email}</strong>.<br/>
        Click it to access your dashboard.
      </p>
    </div>
  )

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1rem" }}>
      <span className="section-num">08 — Dashboard</span>
      <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>Client Dashboard</h1>
      <p style={{ color: "var(--text-mute)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
        Enter the email you used for your intake. We&apos;ll send a secure magic link — no password needed.
      </p>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
        </div>
        <button className="btn-gold" onClick={send} disabled={loading || !email}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          {loading ? "Sending..." : <><span>Send login link</span><ArrowRight size={15}/></>}
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false)
  const [clientEmail, setClientEmail] = useState("")
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check sessionStorage for token
    const stored = sessionStorage.getItem("roc_dashboard_email")
    if (stored) { setClientEmail(stored); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (!authed || !clientEmail) return
    setLoading(true)
    fetch(`/api/checkin?email=${encodeURIComponent(clientEmail)}`)
      .then(r => r.json())
      .then(d => { setCheckins(d.checkins ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authed, clientEmail])

  const handleAuth = (email: string) => {
    sessionStorage.setItem("roc_dashboard_email", email)
    setClientEmail(email)
    setAuthed(true)
  }

  const weightVals = checkins
    .filter(c => c.data.weight && !isNaN(Number(c.data.weight)))
    .map(c => Number(c.data.weight))
    .slice(-10)

  const energyVals = checkins.filter(c => c.data.energyScore !== undefined).map(c => c.data.energyScore!).slice(-10)
  const moodVals = checkins.filter(c => c.data.moodScore !== undefined).map(c => c.data.moodScore!).slice(-10)

  if (!authed) return (
    <>
      <Nav />
      <LoginGate onAuth={handleAuth} />
      <Footer />
    </>
  )

  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <span className="section-num">08 — Dashboard</span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.03em" }}>Your Progress</h1>
            <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{clientEmail}</p>
          </div>
          <button onClick={() => { sessionStorage.removeItem("roc_dashboard_email"); setAuthed(false) }}
            style={{ fontSize: "0.75rem", color: "var(--text-mute)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
        </div>

        {loading && <p style={{ color: "var(--text-mute)" }}>Loading your data...</p>}

        {!loading && checkins.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <Activity size={32} style={{ color: "var(--gold)", margin: "0 auto 1rem" }} />
            <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>No check-ins yet</h2>
            <p style={{ color: "var(--text-mute)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Complete your first 2-week check-in to start tracking progress.
            </p>
            <Link href="/checkin" className="btn-gold" style={{ display: "inline-block" }}>Start Check-In</Link>
          </div>
        )}

        {!loading && checkins.length > 0 && (
          <>
            {/* Weight chart */}
            {weightVals.length >= 2 && (
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mute)", marginBottom: "1rem" }}>Weight Trend (lbs)</div>
                <SparkLine values={weightVals} color="var(--gold)" height={64} />
              </div>
            )}

            {/* Score trend cards */}
            {(energyVals.length >= 2 || moodVals.length >= 2) && (
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {energyVals.length >= 2 && <ScoreCard label="Energy" values={energyVals} color="#60a5fa" />}
                {moodVals.length >= 2 && <ScoreCard label="Mood" values={moodVals} color="#4ade80" />}
              </div>
            )}

            {/* Check-in history */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1.25rem" }}>Check-In History</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {checkins.slice().reverse().map(c => (
                  <div key={c.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{new Date(c.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {c.data.urgentFlag && <span style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 700 }}>⚠ Urgent</span>}
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "var(--text-mute)" }}>
                      {c.data.weight && <span>⚖ {c.data.weight} lbs</span>}
                      {c.data.energyScore && <span>⚡ Energy {c.data.energyScore}/10</span>}
                      {c.data.moodScore && <span>😊 Mood {c.data.moodScore}/10</span>}
                    </div>
                    {c.data.sideEffects && c.data.sideEffects.length > 0 && c.data.sideEffects[0] !== "None" && (
                      <div style={{ marginTop: "0.3rem", fontSize: "0.75rem", color: "var(--text-mute)" }}>
                        Side effects: {c.data.sideEffects.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Book a session */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          <Link href="/contact" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem" }}>
              <Calendar size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Book a Session</h3>
                <p style={{ color: "var(--text-mute)", fontSize: "0.875rem" }}>Schedule your next coaching call with Richard.</p>
              </div>
              <ArrowRight size={16} style={{ color: "var(--text-mute)", marginLeft: "auto" }} />
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
