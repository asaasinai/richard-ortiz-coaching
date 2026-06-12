"use client"
import { useState } from "react"
import { Copy, CheckCircle, ClipboardList } from "lucide-react"

const TEMPLATES = [
  {
    name: "2-Week Check-In Reminder",
    body: "Hi {{first_name}}, your 2-week check-in is ready. Please complete it here: {{checkin_link}} — {{coach_name}}",
  },
  {
    name: "Appointment Reminder",
    body: "Hi {{first_name}}, just a reminder about your coaching call tomorrow. Reply to confirm or reschedule. — {{coach_name}}",
  },
  {
    name: "Urgent Follow-Up",
    body: "Hi {{first_name}}, please log into your dashboard when you get a chance — your coach has a note for you: {{dashboard_link}} — {{coach_name}}",
  },
  {
    name: "Protocol Start",
    body: "Hi {{first_name}}, your protocol has been approved and is ready to view in your dashboard: {{dashboard_link}} — {{coach_name}}",
  },
  {
    name: "Welcome",
    body: "Hi {{first_name}}, welcome to Richard Ortiz Coaching! Your intake is under review. Watch for an email within 48 hours. — {{coach_name}}",
  },
]

const VARS = ["{{first_name}}", "{{checkin_link}}", "{{dashboard_link}}", "{{coach_name}}"]

const defaults: Record<string, string> = {
  "{{first_name}}":     "",
  "{{checkin_link}}":   "https://richardortizcoaching.com/checkin",
  "{{dashboard_link}}": "https://richardortizcoaching.com/dashboard",
  "{{coach_name}}":     "Richard",
}

export default function AdminSMSPage() {
  const [selected, setSelected] = useState(0)
  const [vars, setVars] = useState<Record<string,string>>(defaults)
  const [copied, setCopied] = useState(false)
  const [log, setLog] = useState<{time:string,template:string,preview:string}[]>([])

  const tpl = TEMPLATES[selected]
  const preview = tpl.body.replace(/\{\{(\w+)\}\}/g, (_,k) => vars[`{{${k}}}`] || `[${k}]`)
  const charCount = preview.length

  const copy = async () => {
    await navigator.clipboard.writeText(preview)
    setCopied(true)
    setLog(p => [{
      time: new Date().toLocaleTimeString(),
      template: tpl.name,
      preview: preview.slice(0, 80) + (preview.length > 80 ? "…" : "")
    }, ...p].slice(0, 20))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth:900 }}>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.5rem)", marginBottom:"0.25rem" }}>SMS Builder</h1>
      <p style={{ color:"var(--text-mute)", fontSize:"0.875rem", marginBottom:"1.5rem" }}>PHI-free templates only. Copy to clipboard — send manually via your phone.</p>

      {/* Template selector — horizontal scroll on mobile */}
      <div className="sms-templates-bar" style={{ marginBottom:"1.25rem" }}>
        <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.6rem" }}>Templates</p>
        <div className="sms-templates-scroll">
          {TEMPLATES.map((t,i) => (
            <button key={t.name} onClick={() => setSelected(i)} style={{
              textAlign:"left", padding:"0.55rem 0.85rem", borderRadius:"var(--radius)", cursor:"pointer",
              background: selected===i ? "var(--gold)" : "var(--surface)",
              color: selected===i ? "#000" : "var(--text-soft)",
              border:`1px solid ${selected===i ? "var(--gold)" : "var(--border)"}`,
              fontSize:"0.82rem", fontWeight: selected===i ? 700 : 400,
              whiteSpace:"nowrap", flexShrink:0
            }}>{t.name}</button>
          ))}
        </div>
      </div>

      {/* Builder — single column on mobile, 2-col on desktop */}
      <div className="sms-builder-layout">
        {/* Variables */}
        <div className="card">
          <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1rem" }}>Fill Variables</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            {VARS.map(v => (
              <div key={v}>
                <label style={{ fontSize:"0.78rem", color:"var(--text-mute)", marginBottom:"0.25rem", display:"block" }}>{v}</label>
                <input
                  value={vars[v] || ""}
                  onChange={e => setVars(p => ({...p,[v]:e.target.value}))}
                  placeholder={v === "{{first_name}}" ? "e.g. John" : vars[v]}
                  style={{ fontSize:"0.85rem", padding:"0.5rem 0.75rem" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview + copy */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Preview</p>
            <span style={{ fontSize:"0.75rem", color: charCount > 160 ? "#f87171" : "var(--text-mute)" }}>{charCount}/160 chars</span>
          </div>
          <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem", fontSize:"0.9rem", lineHeight:1.7, color:"var(--text-soft)", minHeight:80 }}>
            {preview}
          </div>
          {charCount > 160 && (
            <p style={{ color:"#f87171", fontSize:"0.78rem", marginTop:"0.5rem" }}>⚠ Exceeds 160 chars — will send as 2 SMS segments.</p>
          )}
          <button onClick={copy} className="btn-gold" style={{ marginTop:"1rem", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 1.25rem" }}>
            {copied ? <><CheckCircle size={14}/> Copied!</> : <><Copy size={14}/> Copy to Clipboard</>}
          </button>
          <p style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginTop:"0.5rem" }}>Paste into your SMS app and send manually. No PHI is included.</p>
        </div>
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="card" style={{ marginTop:"1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1rem" }}>
            <ClipboardList size={15} style={{ color:"var(--gold)" }} />
            <p style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Send Log (this session)</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
            {log.map((entry,i) => (
              <div key={i} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", fontSize:"0.8rem", borderBottom:"1px solid var(--border)", paddingBottom:"0.4rem", flexWrap:"wrap" }}>
                <span style={{ color:"var(--text-mute)", flexShrink:0, minWidth:60 }}>{entry.time}</span>
                <span style={{ color:"var(--gold)", flexShrink:0, minWidth:140 }}>{entry.template}</span>
                <span style={{ color:"var(--text-mute)" }}>{entry.preview}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .sms-templates-scroll {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .sms-builder-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 767px) {
          .sms-templates-scroll {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            gap: 0.4rem;
            -webkit-overflow-scrolling: touch;
          }
          .sms-builder-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
