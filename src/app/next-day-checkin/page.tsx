"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { CheckCircle, AlertCircle } from "lucide-react"

const QUESTIONS = [
  { id: "appetite",     label: "Appetite level",            hint: "10 = very hungry" },
  { id: "cravings",     label: "Cravings",                  hint: "10 = strong cravings" },
  { id: "fullness",     label: "Fullness after eating",     hint: "10 = very full quickly" },
  { id: "energy",       label: "Energy levels",             hint: "10 = high energy" },
  { id: "focus",        label: "Focus / mental clarity",    hint: "10 = very sharp" },
  { id: "nausea",       label: "Nausea",                    hint: "10 = severe" },
  { id: "bloating",     label: "Bloating / digestion issues", hint: "10 = severe" },
  { id: "hydration",    label: "Hydration",                 hint: "10 = well hydrated" },
  { id: "protein_goal", label: "Ability to hit protein goal", hint: "10 = no problem" },
  { id: "overall",      label: "Overall how you feel today", hint: "10 = great" },
] as const

type ScoreKey = typeof QUESTIONS[number]["id"]
type Scores = Record<ScoreKey, number>

const defaultScores = (): Scores =>
  Object.fromEntries(QUESTIONS.map(q => [q.id, 5])) as Scores

function CheckInForm() {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  // No token = default link: client self-identifies with name + email.
  const isDefault = !token
  const [scores, setScores] = useState<Scores>(defaultScores())
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error" | "invalid">("idle")
  const [alreadyDone, setAlreadyDone] = useState(false)

  // Validate the token on load — only in tokenized mode. The default link skips
  // validation and asks for name + email instead.
  useEffect(() => {
    if (!token) return
    fetch(`/api/nextday-checkin?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.alreadySubmitted) { setAlreadyDone(true); return }
        if (!d.valid) setStatus("invalid")
      })
      .catch(() => setStatus("invalid"))
  }, [token])

  const set = (id: ScoreKey, v: number) => setScores(p => ({ ...p, [id]: v }))

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail.trim())
  const canSubmit = status !== "saving" && (!isDefault || (clientName.trim().length > 1 && emailOk))

  const submit = async () => {
    setStatus("saving")
    const res = await fetch("/api/nextday-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, scores, clientName: clientName.trim(), clientEmail: clientEmail.trim() }),
    })
    const data = await res.json()
    if (data.ok) { setStatus("done"); return }
    if (res.status === 409) { setAlreadyDone(true); return } // already submitted
    setStatus("error")
  }

  if (status === "invalid") return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <AlertCircle size={48} style={{ color: "var(--gold)", margin: "0 auto 1rem" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.5rem" }}>Link Expired or Invalid</h2>
        <p style={{ color: "var(--text-soft)", marginTop: "0.75rem", lineHeight: 1.7 }}>
          This check-in link is no longer valid. It may have already been used or expired.
          Contact Richard if you need a new one.
        </p>
        <a href="/contact" className="btn-gold" style={{ display: "inline-block", marginTop: "1.5rem" }}>Contact Richard</a>
      </div>
    </div>
  )

  if (status === "done" || alreadyDone) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle size={36} color="#000" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.75rem" }}>
          {alreadyDone ? "Already submitted!" : "Check-in complete!"}
        </h2>
        <p style={{ color: "var(--text-soft)", marginTop: "0.75rem", lineHeight: 1.7 }}>
          {alreadyDone
            ? "You've already submitted your next-day check-in. Richard will review your data."
            : "Thanks — Richard will review your responses and reach out if any adjustments are needed to your protocol."}
        </p>
        <a href="/" className="btn-outline" style={{ display: "inline-block", marginTop: "1.5rem" }}>Done</a>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Day 1 Check-In</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.5rem,4vw,2rem)", letterSpacing: "-0.02em", marginTop: "0.3rem" }}>
          How are you feeling?
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginTop: "0.4rem", lineHeight: 1.6 }}>
          Rate each on a scale of 1–10. This helps Richard fine-tune your protocol.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {isDefault && (
          <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>Your details</p>
            <p style={{ color: "var(--text-mute)", fontSize: "0.78rem", margin: "0.15rem 0 0.85rem" }}>
              Enter your name and the email on file so we can match this to your record.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label>Full Name *</label>
                <input type="text" placeholder="First and last name" value={clientName}
                  autoComplete="name" data-1p-ignore data-lpignore="true"
                  onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <label>Email *</label>
                <input type="email" placeholder="you@email.com" value={clientEmail}
                  autoComplete="email" data-1p-ignore data-lpignore="true"
                  onChange={e => setClientEmail(e.target.value)} />
                {clientEmail.trim() && !emailOk && (
                  <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "0.35rem" }}>Enter a valid email.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "var(--gold)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {i + 1} / 10
                </span>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.1rem", color: "var(--text)" }}>{q.label}</p>
                <p style={{ color: "var(--text-mute)", fontSize: "0.78rem", marginTop: "0.1rem" }}>{q.hint}</p>
              </div>
              <div style={{
                minWidth: 52, height: 52, borderRadius: "50%",
                background: "var(--gold)", color: "#000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.4rem",
                flexShrink: 0,
              }}>
                {scores[q.id]}
              </div>
            </div>

            {/* Slider */}
            <div style={{ position: "relative" }}>
              <input
                type="range" min={1} max={10} step={1}
                value={scores[q.id]}
                onChange={e => set(q.id, Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--gold)", cursor: "pointer", height: 4 }}
              />
              {/* Tick labels */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <span key={n} style={{
                    fontSize: "0.7rem",
                    color: scores[q.id] === n ? "var(--gold)" : "var(--text-mute)",
                    fontWeight: scores[q.id] === n ? 700 : 400,
                    width: "10%",
                    textAlign: "center",
                    transition: "color 0.15s",
                  }}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn-gold"
          style={{ minWidth: 160, opacity: canSubmit ? 1 : 0.5 }}
        >
          {status === "saving" ? "Submitting…" : "Submit Check-In"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ color: "#ff4444", fontSize: "0.85rem", marginTop: "0.75rem", textAlign: "right" }}>
          Something went wrong. Try again or contact Richard.
        </p>
      )}
    </div>
  )
}

export default function NextDayCheckinPage() {
  return (
    <>
      <Nav />
      <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)", padding: "2.5rem 1.5rem 1.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.4rem,3.5vw,1.8rem)" }}>
            Next-Day Protocol Check-In
          </h2>
          <p style={{ color: "var(--text-soft)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Day 1 of your new protocol — quick 10-question check-in.
          </p>
        </div>
      </div>
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "var(--text-soft)" }}>Loading…</div>}>
        <CheckInForm />
      </Suspense>
      <Footer />
    </>
  )
}
