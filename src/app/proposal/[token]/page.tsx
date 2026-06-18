"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface ProposalData {
  id: string; status: string; tos_text: string; created_at: string
  protocol_snapshot: Record<string, unknown>
  first_name: string; last_name: string; email: string
  signed_at?: string; signed_name?: string
}

export default function ProposalPage() {
  const { token } = useParams<{ token: string }>()
  const [proposal, setProposal] = useState<ProposalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [signedName, setSignedName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState("")
  const [signSuccess, setSignSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/proposal/${token}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => {
        if (d?.proposal) setProposal(d.proposal)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  const handleSign = async () => {
    if (!signedName.trim()) { setSignError("Please enter your full name."); return }
    if (!agreed) { setSignError("Please agree to the Terms of Service."); return }
    setSigning(true)
    setSignError("")
    const r = await fetch(`/api/proposal/${token}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signed_name: signedName, agreed }),
    })
    const d = await r.json() as { ok?: boolean; error?: string }
    setSigning(false)
    if (d.ok) {
      setSignSuccess(true)
    } else {
      setSignError(d.error ?? "Something went wrong. Please try again.")
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#000" }}>
      <p style={{ color: "#888" }}>Loading…</p>
    </div>
  )

  if (notFound) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#000" }}>
      <div style={{ textAlign: "center", color: "#888" }}>
        <p style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "0.5rem" }}>Agreement not found</p>
        <p>Questions? Email <a href="mailto:richard@richardortizcoaching.com" style={{ color: "#C9A84C" }}>richard@richardortizcoaching.com</a></p>
      </div>
    </div>
  )

  if (!proposal) return null

  if (proposal.status === "signed" && !signSuccess) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#000" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ color: "#C9A84C", fontSize: "1.4rem", fontFamily: "Inter Tight,sans-serif", fontWeight: 900, marginBottom: "0.5rem" }}>Agreement Already Signed</h2>
        <p style={{ color: "#888", lineHeight: 1.7 }}>This coaching agreement has already been signed. Questions? Email <a href="mailto:richard@richardortizcoaching.com" style={{ color: "#C9A84C" }}>richard@richardortizcoaching.com</a></p>
      </div>
    </div>
  )

  if (signSuccess) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#000" }}>
      <div style={{ textAlign: "center", maxWidth: 520, padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ color: "#C9A84C", fontSize: "1.6rem", fontFamily: "Inter Tight,sans-serif", fontWeight: 900, marginBottom: "0.75rem" }}>
          Welcome, {signedName.split(" ")[0]}!
        </h2>
        <p style={{ color: "#ccc", lineHeight: 1.7, fontSize: "1rem" }}>
          Your agreement is signed and Richard has been notified.<br/>
          Check your email for confirmation. He&apos;ll reach out within 24 hours to kick off your protocol.
        </p>
      </div>
    </div>
  )

  const snap = proposal.protocol_snapshot ?? {}

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
          <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.6rem", color: "#C9A84C", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            RICHARD ORTIZ COACHING
          </h1>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Personalized Peptide Protocol Agreement</p>
        </div>

        {/* Client Info */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem" }}>Client</span>
              <p style={{ fontWeight: 700 }}>{proposal.first_name} {proposal.last_name}</p>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem" }}>Email</span>
              <p style={{ color: "#ccc" }}>{proposal.email}</p>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem" }}>Date</span>
              <p style={{ color: "#ccc" }}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Protocol */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "Inter Tight,sans-serif", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
            Your Protocol
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.2rem" }}>Primary</p>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>
              {String(snap.peptide ?? "")} ({String(snap.sku_strength ?? snap.vialSize ?? "")}mg vial · Elixsir)
            </p>
            {snap.dose_amount && (
              <p style={{ color: "#ccc", fontSize: "0.875rem", marginTop: "0.2rem" }}>
                Dose: {String(snap.dose_amount)} {String(snap.dose_unit ?? "")}
              </p>
            )}
            {snap.frequency_days && (() => {
              try {
                const days = typeof snap.frequency_days === "string" ? JSON.parse(snap.frequency_days) : snap.frequency_days
                return <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Frequency: {(days as string[]).join(" / ")}</p>
              } catch { return null }
            })()}
            {snap.duration_weeks && <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Duration: {String(snap.duration_weeks)} weeks</p>}
            {snap.monthly_rate && (
              <p style={{ color: "#C9A84C", fontWeight: 700, marginTop: "0.4rem" }}>Monthly Investment: ${String(snap.monthly_rate)}/month</p>
            )}
          </div>

          {snap.secondary_peptide && (
            <div style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.2rem" }}>Secondary (optional)</p>
              <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{String(snap.secondary_peptide)} (Elixsir)</p>
            </div>
          )}

          {snap.coach_notes && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.4rem" }}>Coach Notes</p>
              <p style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: 1.6 }}>{String(snap.coach_notes)}</p>
            </div>
          )}
        </div>

        {/* TOS */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "Inter Tight,sans-serif", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Terms of Service
          </h2>
          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "1.25rem", maxHeight: 320, overflowY: "auto" }}>
            <pre style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", lineHeight: 1.7, color: "#999", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {proposal.tos_text}
            </pre>
          </div>
        </div>

        {/* Signature */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "1.5rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "Inter Tight,sans-serif", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Electronic Signature
          </h2>
          <p style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            By signing below you confirm you have read and agree to all terms above.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#ccc", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Full Name</label>
            <input
              type="text"
              placeholder="Your full legal name"
              value={signedName}
              onChange={e => setSignedName(e.target.value)}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6, padding: "0.75rem 1rem", color: "#fff", fontSize: "1rem",
                fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: "0.2rem", accentColor: "#C9A84C", width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="agree" style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: 1.6, cursor: "pointer" }}>
              I agree to the Terms of Service and authorize the monthly coaching fee.
            </label>
          </div>

          {signError && (
            <p style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{signError}</p>
          )}

          <button
            onClick={handleSign}
            disabled={signing || !signedName.trim() || !agreed}
            style={{
              width: "100%", padding: "0.875rem", background: "#C9A84C", color: "#000",
              border: "none", borderRadius: 6, fontFamily: "Inter Tight,sans-serif",
              fontWeight: 900, fontSize: "1rem", cursor: "pointer", letterSpacing: "-0.01em",
              opacity: (signing || !signedName.trim() || !agreed) ? 0.5 : 1,
            }}
          >
            {signing ? "Signing…" : "Sign & Get Started →"}
          </button>
        </div>
      </div>
    </div>
  )
}
