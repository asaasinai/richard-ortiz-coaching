"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DEFAULT_TOS } from "@/lib/email-templates"

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

  if (signSuccess) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#000" }}>
      <div style={{ textAlign: "center", maxWidth: 520, padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ color: "#C9A84C", fontSize: "1.6rem", fontFamily: "var(--font-display)", fontWeight: 900, marginBottom: "0.75rem" }}>
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
  // Helper to safely extract string values from JSONB snapshot
  const ss = (key: string): string | null => {
    const val = snap[key]
    if (val == null || val === "") return null
    return String(val)
  }
  interface SnapLine {
    peptide?: string; strength?: string | number; strength_unit?: string
    dose_amount?: string; dose_unit?: string; frequency_days?: string | string[]
    duration_weeks?: number; monthly_rate?: string | number; coach_notes?: string; secondary_peptide?: string
  }
  const lines: SnapLine[] = Array.isArray(snap.lines) ? snap.lines as SnapLine[] : []
  const totalMonthly = snap.total_monthly != null
    ? Number(snap.total_monthly)
    : lines.reduce((s, l) => s + Number(l.monthly_rate ?? 0), 0)

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.6rem", color: "#C9A84C", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
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
          <h2 style={{ color: "#C9A84C", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
            Your Protocol{lines.length > 1 ? "s" : ""}
          </h2>

          {lines.length > 0 ? (
            <>
              {lines.map((ln, i) => {
                const freq = (() => {
                  try {
                    const fd = ln.frequency_days
                    if (!fd) return null
                    const days = typeof fd === "string" ? (fd.startsWith("[") ? JSON.parse(fd) : [fd]) : fd
                    return Array.isArray(days) && days.length ? (days as string[]).join(" / ") : null
                  } catch { return null }
                })()
                return (
                  <div key={i} style={{ marginBottom: "1rem", paddingBottom: i < lines.length - 1 ? "1rem" : 0, borderBottom: i < lines.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                      <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {ln.peptide}{ln.strength ? ` (${ln.strength}${ln.strength_unit ?? "mg"} syringe · the manufacturer)` : ""}
                      </p>
                      {ln.monthly_rate != null && Number(ln.monthly_rate) > 0 && (
                        <span style={{ color: "#C9A84C", fontWeight: 700, whiteSpace: "nowrap" }}>${Number(ln.monthly_rate)}</span>
                      )}
                    </div>
                    {ln.dose_amount && <p style={{ color: "#ccc", fontSize: "0.875rem", marginTop: "0.2rem" }}>Dose: {ln.dose_amount} {ln.dose_unit}</p>}
                    {freq && <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Frequency: {freq}</p>}
                    {ln.duration_weeks ? <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Duration: {ln.duration_weeks} weeks</p> : null}
                    {ln.secondary_peptide && <p style={{ color: "#aaa", fontSize: "0.82rem", marginTop: "0.15rem" }}>+ {ln.secondary_peptide}</p>}
                    {ln.coach_notes && <p style={{ color: "#999", fontSize: "0.82rem", marginTop: "0.35rem", lineHeight: 1.6 }}>{ln.coach_notes}</p>}
                  </div>
                )
              })}
              {totalMonthly > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(201,168,76,0.3)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>Total Investment</span>
                  <span style={{ color: "#C9A84C", fontWeight: 900, fontSize: "1.15rem" }}>${totalMonthly}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.2rem" }}>Primary</p>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {ss("peptide")} ({ss("sku_strength") ?? ss("vialSize")}mg syringe · the manufacturer)
                </p>
                {ss("dose_amount") && (
                  <p style={{ color: "#ccc", fontSize: "0.875rem", marginTop: "0.2rem" }}>
                    Dose: {ss("dose_amount")} {ss("dose_unit")}
                  </p>
                )}
                {ss("frequency_days") && (() => {
                  try {
                    const fd = ss("frequency_days")!
                    const days = fd.startsWith("[") ? JSON.parse(fd) : [fd]
                    return <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Frequency: {(days as string[]).join(" / ")}</p>
                  } catch { return null }
                })()}
                {ss("duration_weeks") && <p style={{ color: "#ccc", fontSize: "0.875rem" }}>Duration: {ss("duration_weeks")} weeks</p>}
                {ss("monthly_rate") && (
                  <p style={{ color: "#C9A84C", fontWeight: 700, marginTop: "0.4rem" }}>Investment: ${ss("monthly_rate")}</p>
                )}
              </div>

              {ss("secondary_peptide") && (
                <div style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.2rem" }}>Secondary (optional)</p>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{ss("secondary_peptide")} (manufacturer)</p>
                </div>
              )}

              {ss("coach_notes") && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.4rem" }}>Coach Notes</p>
                  <p style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: 1.6 }}>{ss("coach_notes")}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment instructions */}
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Payment Instructions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.25rem" }}>Venmo</p>
              <a href="https://venmo.com/u/Richard-Ortiz-78" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", borderBottom: "1px solid rgba(201,168,76,0.5)" }}>
                @Richard-Ortiz-78
              </a>
            </div>
            <div>
              <p style={{ color: "#888", fontSize: "0.78rem", marginBottom: "0.25rem" }}>Zelle</p>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Ricardo Ortiz</p>
              <p style={{ color: "#ccc", fontSize: "0.875rem" }}>661-425-3534</p>
            </div>
          </div>
          <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "1rem", lineHeight: 1.6 }}>
            Please include your full name in the payment note so we can match it to your protocol.
          </p>
        </div>

        {/* TOS */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Terms of Service
          </h2>
          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "1.25rem", maxHeight: 320, overflowY: "auto" }}>
            <pre style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", lineHeight: 1.7, color: "#999", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {proposal.tos_text && proposal.tos_text.trim().length >= 50 ? proposal.tos_text : DEFAULT_TOS}
            </pre>
          </div>
        </div>

        {/* Signature — recorded block once signed, otherwise the sign form */}
        {proposal.status === "signed" ? (
          <div style={{ background: "#0d0d0d", border: "1px solid rgba(74,222,128,0.35)", borderRadius: 8, padding: "1.5rem" }}>
            <h2 style={{ color: "#4ade80", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              ✓ Signed Agreement
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ color: "#666", fontSize: "0.78rem" }}>Signed by</span>
                <p style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", color: "#fff", marginTop: "0.25rem" }}>{proposal.signed_name}</p>
              </div>
              <div>
                <span style={{ color: "#666", fontSize: "0.78rem" }}>Date signed</span>
                <p style={{ color: "#ccc", marginTop: "0.5rem" }}>{proposal.signed_at ? new Date(proposal.signed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "—"}</p>
              </div>
            </div>
            <p style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.6, marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              This agreement was electronically signed and is on file. Questions? Email <a href="mailto:richard@richardortizcoaching.com" style={{ color: "#C9A84C" }}>richard@richardortizcoaching.com</a>
            </p>
          </div>
        ) : (
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "1.5rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
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
              I agree to the Terms of Service and authorize the coaching fee.
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
              border: "none", borderRadius: 6, fontFamily: "var(--font-display)",
              fontWeight: 900, fontSize: "1rem", cursor: "pointer", letterSpacing: "-0.01em",
              opacity: (signing || !signedName.trim() || !agreed) ? 0.5 : 1,
            }}
          >
            {signing ? "Signing…" : "Sign & Get Started →"}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
