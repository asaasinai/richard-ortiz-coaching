"use client"
import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"

type Settings = Record<string, string>

const TOGGLES: { key: string; label: string }[] = [
  { key: "notify_email_urgent_checkin", label: "Email me on urgent check-ins" },
  { key: "notify_sms_urgent_checkin",   label: "SMS me on urgent check-ins" },
  { key: "notify_email_new_intake",     label: "Email me on new intakes" },
  { key: "notify_email_low_stock",      label: "Email me on low stock" },
  { key: "notify_email_ops_overdue",    label: "Email me on overdue ops cards" },
]

export default function AdminSettingsPage() {
  const [s, setS] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetch("/api/admin/settings").then(r => r.json()).then(d => { setS(d.settings ?? {}); setLoading(false) }) }, [])
  const set = (k: string, v: string) => setS(p => ({ ...p, [k]: v }))
  const bool = (k: string) => s[k] === "true"

  const save = () => {
    setSaving(true); setSaved(false)
    fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: s }) })
      .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500) })
  }

  if (loading) return <p style={{ color: "var(--text-mute)" }}>Loading…</p>

  const Toggle = ({ k, label }: { k: string; label: string }) => (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", cursor: "pointer" }}>
      <span style={{ fontSize: "0.875rem" }}>{label}</span>
      <button type="button" onClick={() => set(k, bool(k) ? "false" : "true")} style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
        background: bool(k) ? "var(--gold)" : "var(--surface-2)", transition: "background 0.15s",
      }}>
        <span style={{ position: "absolute", top: 3, left: bool(k) ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: bool(k) ? "#000" : "var(--text-mute)", transition: "left 0.15s" }} />
      </button>
    </label>
  )

  const num = (k: string, label: string, hint?: string) => (
    <div>
      <label style={lbl}>{label}</label>
      <input type="number" value={s[k] ?? ""} onChange={e => set(k, e.target.value)} style={inp} />
      {hint && <p style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginTop: "0.2rem" }}>{hint}</p>}
    </div>
  )
  const text = (k: string, label: string, type = "text") => (
    <div><label style={lbl}>{label}</label><input type={type} value={s[k] ?? ""} onChange={e => set(k, e.target.value)} style={inp} /></div>
  )
  const area = (k: string, label: string, rows = 6, mono = false) => (
    <div>
      <label style={lbl}>{label}</label>
      <textarea rows={rows} value={s[k] ?? ""} onChange={e => set(k, e.target.value)}
        style={{ ...inp, resize: "vertical", lineHeight: 1.55, fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? "0.78rem" : "0.875rem" }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="Settings" subtitle="Control your alerts and the rules that flag check-ins, stock, and orders." backHref="/admin" backLabel="Overview" />

      <Section title="Alerts">{TOGGLES.map(t => <Toggle key={t.key} k={t.key} label={t.label} />)}</Section>

      <Section title="Check-In Rules">
        {num("urgent_threshold", "Flag check-ins with any score at or below", "1–10. Lower = fewer urgent flags.")}
      </Section>

      <Section title="Inventory">
        {num("default_reorder_threshold", "Default units before Order Soon alert")}
      </Section>

      <Section title="Ops Queue">
        <Toggle k="auto_generate_ops_cards" label="Auto-generate ops cards on protocol assignment" />
        {num("billing_cycle_day", "Day of month to generate ops cards", "1–28")}
      </Section>

      <Section title="Admin Profile">
        {text("admin_name", "Admin / Coach Name")}
        {text("admin_email", "Admin Email", "email")}
        {text("admin_phone", "Admin Phone (for SMS alerts)", "tel")}
      </Section>

      <Section title="Terms of Service">
        <p style={{ fontSize: "0.74rem", color: "var(--text-mute)", marginBottom: "0.4rem" }}>
          Shown on every proposal and required for the client&apos;s e-signature. Edits apply to newly generated proposals.
        </p>
        {area("tos_text", "Coaching Agreement (TOS)", 14, true)}
      </Section>

      <Section title="Email Templates">
        <div style={{ fontSize: "0.74rem", color: "var(--text-mute)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
          These are the emails the system sends. Bodies are HTML. Use these placeholders — they fill in automatically:
          <div style={{ marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {["{{first_name}}", "{{last_name}}", "{{client_email}}", "{{proposal_url}}", "{{protocol_summary}}", "{{total_monthly}}", "{{signed_name}}", "{{admin_email}}", "{{admin_url}}"].map(p => (
              <code key={p} style={{ background: "var(--surface-2)", padding: "0.1rem 0.4rem", borderRadius: 3, fontSize: "0.72rem", color: "var(--gold-light)" }}>{p}</code>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-soft)", marginTop: "0.5rem" }}>1. Proposal — sent to client to review &amp; sign</p>
        {text("email_proposal_subject", "Subject")}
        {area("email_proposal_body", "Body (HTML)", 10, true)}

        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-soft)", marginTop: "0.75rem" }}>2. Welcome — sent to client after they sign</p>
        {text("email_welcome_subject", "Subject")}
        {area("email_welcome_body", "Body (HTML)", 8, true)}

        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-soft)", marginTop: "0.75rem" }}>3. Coach notification — sent to you when a client signs</p>
        {text("email_coach_notify_subject", "Subject")}
        {area("email_coach_notify_body", "Body (HTML)", 6, true)}
      </Section>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button onClick={save} disabled={saving} className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          {saved ? <><Check size={15} /> Saved</> : saving ? "Saving…" : "Save Settings"}
        </button>
        <p style={{ fontSize: "0.74rem", color: "var(--text-mute)" }}>API keys (Resend, Twilio, Anthropic) are managed via Vercel env vars.</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.75rem", color: "var(--gold)" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>{children}</div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: "0.78rem", color: "var(--text-soft)", display: "block", marginBottom: "0.3rem", fontWeight: 500 }
const inp: React.CSSProperties = { width: "100%", padding: "0.55rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.875rem" }
