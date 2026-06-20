"use client"
import { useState } from "react"
import { X } from "lucide-react"

export interface EditableIntake {
  id: string
  first_name: string
  last_name: string
  email: string
  data?: Record<string, unknown>
}

// Fields handled by dedicated contact inputs (or non-editable structures) — kept
// out of the auto-discovered data grid so they don't appear twice.
const RESERVED = new Set(["email", "firstname", "lastname", "phone", "rawanswers"])

const pretty = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim()

// Admin editor for an applicant/client's contact + intake answers. Saves through
// the shared intake PATCH route, then calls onSaved so the parent can refresh.
export default function EditDetailsModal({ intake, onClose, onSaved }: {
  intake: EditableIntake
  onClose: () => void
  onSaved: () => void
}) {
  const data = intake.data ?? {}
  // Discover scalar (string/number) data fields to expose as editable inputs.
  const dataKeys = Object.keys(data).filter(k => {
    if (RESERVED.has(k.toLowerCase())) return false
    const v = data[k]
    return v === null || typeof v === "string" || typeof v === "number"
  })

  const [first, setFirst] = useState(intake.first_name ?? "")
  const [last, setLast] = useState(intake.last_name ?? "")
  const [email, setEmail] = useState(intake.email ?? "")
  const [phone, setPhone] = useState(String((data.phone as string) ?? ""))
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(dataKeys.map(k => [k, data[k] == null ? "" : String(data[k])]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const save = async () => {
    if (!email.trim()) { setError("Email is required"); return }
    setSaving(true); setError("")
    try {
      const dataPayload: Record<string, string> = { phone: phone.trim(), ...fields }
      const res = await fetch(`/api/admin/intakes/${intake.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: first.trim(), last_name: last.trim(), email: email.trim(), data: dataPayload }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      onSaved()
      onClose()
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
      setSaving(false)
    }
  }

  const label: React.CSSProperties = { fontSize: "0.72rem", color: "var(--text-mute)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.1rem" }}>Edit details</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div><label style={label}>First name</label><input value={first} onChange={e => setFirst(e.target.value)} /></div>
          <div><label style={label}>Last name</label><input value={last} onChange={e => setLast(e.target.value)} /></div>
          <div><label style={label}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label style={label}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>

        {dataKeys.length > 0 && (
          <>
            <p style={{ fontSize: "0.72rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.75rem 0 0.5rem" }}>Intake answers</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {dataKeys.map(k => (
                <div key={k}>
                  <label style={label}>{pretty(k)}</label>
                  <input value={fields[k] ?? ""} onChange={e => setFields(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.75rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? "Saving…" : "Save changes"}</button>
          <button onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </div>
    </div>
  )
}
