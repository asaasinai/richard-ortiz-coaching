"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, X, Copy, Check, MessageSquare, FileSignature, Mail } from "lucide-react"
import { PEPTIDE_NAMES } from "@/lib/peptides-data"

interface Line {
  peptide: string
  dose_amount: string; dose_unit: string; frequency: string
  duration_weeks: string; rate: string; coach_notes: string
}

const blankLine = (): Line => ({
  peptide: "",
  dose_amount: "", dose_unit: "mg", frequency: "", duration_weeks: "", rate: "", coach_notes: "",
})

const FREQUENCIES = ["Daily", "5x / week", "3x / week", "2x / week", "Weekly", "Every other day"]

export default function ProposalBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "var(--text-mute)" }}>Loading…</div>}>
      <ProposalBuilder />
    </Suspense>
  )
}

function ProposalBuilder() {
  const params = useSearchParams()
  const [first, setFirst] = useState(params.get("first") ?? "")
  const [last, setLast] = useState(params.get("last") ?? "")
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [lines, setLines] = useState<Line[]>([blankLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [link, setLink] = useState("")
  const [pid, setPid] = useState("")
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const linesOk = lines.some(l => l.peptide.trim())
  const canSubmit = !saving && first.trim() && emailOk && linesOk

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines(prev => prev.map((l, x) => x === i ? { ...l, ...patch } : l))

  const total = lines.reduce((s, l) => s + Number(l.rate || 0), 0)

  const generate = async () => {
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/admin/quick-proposal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first, last_name: last, email,
          lines: lines.filter(l => l.peptide.trim()).map(l => ({
            sku_id: null, peptide: l.peptide,
            strength: null, strength_unit: null,
            dose_amount: l.dose_amount || null, dose_unit: l.dose_unit || null,
            frequency: l.frequency || null,
            duration_weeks: l.duration_weeks ? Number(l.duration_weeks) : null,
            rate: l.rate ? Number(l.rate) : 0,
            coach_notes: l.coach_notes || null,
          })),
        }),
      })
      const d = await res.json()
      if (!d.ok) { setError(d.error || "Something went wrong"); return }
      setLink(`${window.location.origin}${d.url}`)
      setPid(d.id || "")
      setSent(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  // Email the proposal link to the client (uses the editable proposal template).
  const sendToClient = async () => {
    if (!pid) return
    setSending(true); setError("")
    try {
      const res = await fetch(`/api/admin/proposals/${pid}/send`, { method: "POST" })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || d.error) { setError(d.error || "Could not send email"); return }
      setSent(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "1.5rem 1rem 4rem" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--gold-grad)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 800, fontFamily: "var(--font-display)" }}>R</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.01em" }}>Proposal Builder</span>
        </div>

        {link ? (
          // ── Success: textable link ──
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <FileSignature size={28} color="#000" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{first} {last}</p>
            <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>{email} · ${total} total</p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--solid-1)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.8rem", marginBottom: "1rem" }}>
              <input readOnly value={link} style={{ flex: 1, background: "none", border: "none", color: "var(--text)", fontSize: "0.8rem", padding: 0 }} />
              <button onClick={copy} className="btn-outline" style={{ padding: "0.4rem 0.7rem", display: "flex", gap: "0.35rem", alignItems: "center", whiteSpace: "nowrap" }}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={sendToClient} disabled={sending || sent || !pid}
                className="btn-gold" style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", opacity: (sending || sent || !pid) ? 0.6 : 1 }}>
                {sent ? <><Check size={15} /> Sent ✓</> : <><Mail size={15} /> {sending ? "Sending…" : "Send to client"}</>}
              </button>
              <a href={`sms:?&body=${encodeURIComponent(`Hi ${first}, here's your coaching proposal — review & sign here: ${link}`)}`}
                className="btn-outline" style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                <MessageSquare size={15} /> Text to client
              </a>
            </div>
            {sent && <p style={{ color: "#34D399", fontSize: "0.8rem", marginTop: "0.6rem" }}>Proposal emailed to {email}.</p>}
            {error && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.6rem" }}>{error}</p>}
            <div style={{ marginTop: "1.25rem" }}>
              <button onClick={() => { setLink(""); setLines([blankLine()]); setFirst(""); setLast(""); setEmail("") }}
                className="btn-ghost" style={{ fontSize: "0.85rem" }}>+ Build another</button>
            </div>
          </div>
        ) : (
          // ── Builder ──
          <>
            <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              Build a protocol and generate a link to text the client. They review, sign, and you&apos;re notified by email.
            </p>

            <div className="card" style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, marginBottom: "0.85rem" }}>Client</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <div><label>First name *</label><input value={first} onChange={e => setFirst(e.target.value)} placeholder="First" autoComplete="off" data-1p-ignore /></div>
                <div><label>Last name</label><input value={last} onChange={e => setLast(e.target.value)} placeholder="Last" autoComplete="off" data-1p-ignore /></div>
              </div>
              <label>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" autoComplete="off" data-1p-ignore />
              {email.trim() && !emailOk && <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "0.35rem" }}>Enter a valid email.</p>}
            </div>

            {lines.map((l, i) => (
              <div key={i} className="card" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <p style={{ fontWeight: 700 }}>Protocol {i + 1}</p>
                  {lines.length > 1 && (
                    <button onClick={() => setLines(lines.filter((_, x) => x !== i))}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <label>Peptide *</label>
                <select value={l.peptide} onChange={e => setLine(i, { peptide: e.target.value })} style={{ marginBottom: "0.6rem" }}>
                  <option value="">Select peptide…</option>
                  {PEPTIDE_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                  <div><label>Dose</label><input value={l.dose_amount} onChange={e => setLine(i, { dose_amount: e.target.value })} placeholder="e.g. 0.25" autoComplete="off" /></div>
                  <div><label>Unit</label><input value={l.dose_unit} onChange={e => setLine(i, { dose_unit: e.target.value })} placeholder="mg / mcg / IU" autoComplete="off" /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                  <div>
                    <label>Frequency</label>
                    <select value={l.frequency} onChange={e => setLine(i, { frequency: e.target.value })}>
                      <option value="">Select…</option>
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div><label>Duration (weeks)</label><input type="number" min={1} value={l.duration_weeks} onChange={e => setLine(i, { duration_weeks: e.target.value })} placeholder="12" autoComplete="off" /></div>
                </div>

                <label>Price (per order, $)</label>
                <input type="number" min={0} value={l.rate} onChange={e => setLine(i, { rate: e.target.value })} placeholder="Enter price" autoComplete="off" style={{ marginBottom: "0.6rem" }} />

                <label>Coach notes (optional)</label>
                <textarea rows={2} value={l.coach_notes} onChange={e => setLine(i, { coach_notes: e.target.value })} placeholder="Titration, timing, guidance…" />
              </div>
            ))}

            <button onClick={() => setLines([...lines, blankLine()])} className="btn-outline"
              style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.4rem", alignItems: "center", marginBottom: "1rem" }}>
              <Plus size={15} /> Add another protocol
            </button>

            {total > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0.25rem 1rem", fontWeight: 700 }}>
                <span style={{ color: "var(--text-soft)" }}>Total</span>
                <span className="gold-text">${total}</span>
              </div>
            )}

            {error && <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}

            <button onClick={generate} disabled={!canSubmit} className="btn-gold"
              style={{ width: "100%", opacity: canSubmit ? 1 : 0.5 }}>
              {saving ? "Generating…" : "Generate proposal link"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
