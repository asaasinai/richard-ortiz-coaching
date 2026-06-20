"use client"
import { useCallback, useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { DEFAULT_TOS } from "@/lib/email-templates"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DOSE_UNITS = ["mg", "mcg", "IU", "mL"]

interface SkuInfo {
  id: string; units_in_stock: string; fifo_cost: number | null
  retail_price: number | null; wholesale_cost: number | null; strength: string; strength_unit: string
}
interface ProtocolLine {
  id: string; peptide: string; sku_id?: string | null; strength?: string | null; strength_unit?: string | null
  dose_amount?: string; dose_unit?: string; frequency_days?: string; duration_weeks?: number | null
  monthly_rate?: string | null; coach_notes?: string | null; secondary_peptide?: string | null
}
interface AiRec {
  primary_peptide: string; primary_vial_size_mg: number
  primary_dose_amount: string; primary_dose_unit: string
  primary_frequency: string[]
  secondary_peptide?: string | null; secondary_vial_size_mg?: number | null
  secondary_dose_amount?: string | null; secondary_dose_unit?: string | null
  secondary_frequency?: string[] | null
  duration_weeks: number; rationale: string
  contraindications_noted: string[]; confidence: number
  alternatives: { peptide: string; vial_size_mg: number; rationale: string }[]
}
interface Proposal {
  id: string; status: string; created_at: string; sent_at?: string; signed_at?: string
  signed_name?: string; proposal_token: string
}

const proposalStatusColor = (s: string) => ({
  draft:  { bg: "rgba(255,255,255,0.08)", color: "var(--text-mute)" },
  sent:   { bg: "rgba(201,168,76,0.15)", color: "var(--gold)" },
  signed: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
}[s] ?? { bg: "transparent", color: "var(--text-mute)" })

// The full coach protocol workspace — AI recommendation, multi-protocol builder
// (saved line items + add/remove), and an optional proposal flow. Shared by the
// Applicants (/admin/intakes/[id]) and Clients (/admin/clients/[id]) screens so a
// coach can build, activate, and (optionally) send proposals from either place.
export default function ProtocolWorkspace({ clientId, clientEmail, showAi = true, onChanged }: {
  clientId: string
  clientEmail: string
  showAi?: boolean
  onChanged?: () => void
}) {
  const [aiRec, setAiRec] = useState<AiRec | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const [pForm, setPForm] = useState({
    peptide: "", skuId: "", vialSize: 0,
    doseAmount: "", doseUnit: "mcg", frequencyDays: [] as string[],
    secondaryPeptide: "", secondarySkuId: "", secondaryVialSize: 0,
    notes: "", durationWeeks: 12, monthlyRate: "", billingStatus: "active",
  })
  const [skuInfo, setSkuInfo] = useState<SkuInfo | null>(null)
  const [secondarySkuInfo, setSecondarySkuInfo] = useState<SkuInfo | null>(null)
  const [catalog, setCatalog] = useState<Record<string, number[]>>({})
  const peptideList = Object.keys(catalog).sort((a, b) => a.localeCompare(b))

  const [lines, setLines] = useState<ProtocolLine[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [tosText, setTosText] = useState(DEFAULT_TOS)
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null)
  const [proposalLoading, setProposalLoading] = useState(false)
  const [sendingProposal, setSendingProposal] = useState(false)
  const [markingSigned, setMarkingSigned] = useState(false)
  const [showProposal, setShowProposal] = useState(false)

  // Seed the proposal TOS from the admin-editable copy in Settings.
  useEffect(() => {
    fetch(`/api/admin/settings`).then(r => r.json()).then(d => {
      const t = d.settings?.tos_text
      if (t && String(t).trim().length >= 50) setTosText(String(t))
    }).catch(() => {})
  }, [])

  // Load manufacturer catalog (peptide -> sorted vial sizes)
  useEffect(() => {
    fetch(`/api/admin/inventory`).then(r => r.json()).then(d => {
      const map: Record<string, number[]> = {}
      for (const s of (d.skus ?? []) as { peptide_name: string; strength: string }[]) {
        (map[s.peptide_name] ??= []).push(Number(s.strength))
      }
      for (const k in map) map[k].sort((a, b) => a - b)
      setCatalog(map)
    }).catch(() => {})
  }, [])

  const loadLines = useCallback(async () => {
    const r = await fetch(`/api/admin/protocol-lines?clientId=${clientId}`)
    const d = await r.json() as { lines: ProtocolLine[] }
    setLines(d.lines ?? [])
    setShowBuilder(prev => prev || (d.lines ?? []).length === 0)
  }, [clientId])

  const loadProposal = useCallback(async () => {
    const r = await fetch(`/api/admin/intakes/${clientId}`)
    const d = await r.json() as { proposals?: Proposal[] }
    setCurrentProposal(d.proposals?.[0] ?? null)
  }, [clientId])

  useEffect(() => { loadLines(); loadProposal() }, [loadLines, loadProposal])

  // AI recommendation (cached server-side)
  useEffect(() => {
    if (!showAi || !clientId) return
    setAiLoading(true); setAiError("")
    fetch(`/api/admin/intakes/${clientId}/ai-recommendation`)
      .then(r => r.json())
      .then((d: { recommendation?: AiRec; error?: string }) => {
        if (d.recommendation) setAiRec(d.recommendation)
        else setAiError(d.error ?? "Unknown error")
      })
      .catch(e => setAiError(String(e)))
      .finally(() => setAiLoading(false))
  }, [clientId, showAi])

  const regenAiRec = async () => {
    setAiLoading(true); setAiError(""); setAiRec(null)
    try {
      const r = await fetch(`/api/admin/intakes/${clientId}/ai-recommendation?regen=1`)
      const d = await r.json() as { recommendation?: AiRec; error?: string }
      if (d.recommendation) setAiRec(d.recommendation)
      else setAiError(d.error ?? "Unknown error")
    } catch (e) { setAiError(String(e)) }
    setAiLoading(false)
  }

  // Apply the AI rec into the builder. Hardened against missing/non-array fields
  // (a non-array frequency previously crashed the page) and opens the builder.
  const applyAiRec = () => {
    if (!aiRec) return
    setShowBuilder(true)
    setPForm(p => ({
      ...p,
      peptide: aiRec.primary_peptide ?? "",
      vialSize: Number(aiRec.primary_vial_size_mg) || 0,
      doseAmount: aiRec.primary_dose_amount ?? "",
      doseUnit: aiRec.primary_dose_unit ?? "mcg",
      frequencyDays: Array.isArray(aiRec.primary_frequency) ? aiRec.primary_frequency : [],
      secondaryPeptide: aiRec.secondary_peptide ?? "",
      secondaryVialSize: Number(aiRec.secondary_vial_size_mg) || 0,
      durationWeeks: Number(aiRec.duration_weeks) || 12,
    }))
  }

  // Resolve primary/secondary SKU on peptide+size change
  useEffect(() => {
    if (!pForm.peptide || !pForm.vialSize) { setSkuInfo(null); return }
    fetch(`/api/admin/inventory?peptide=${encodeURIComponent(pForm.peptide)}&strength=${pForm.vialSize}`)
      .then(r => r.json()).then(d => {
        if (d.skus?.length) { setSkuInfo(d.skus[0]); setPForm(p => ({ ...p, skuId: d.skus[0].id })) }
        else { setSkuInfo(null); setPForm(p => ({ ...p, skuId: "" })) }
      })
  }, [pForm.peptide, pForm.vialSize])

  useEffect(() => {
    if (!pForm.secondaryPeptide || !pForm.secondaryVialSize) { setSecondarySkuInfo(null); return }
    fetch(`/api/admin/inventory?peptide=${encodeURIComponent(pForm.secondaryPeptide)}&strength=${pForm.secondaryVialSize}`)
      .then(r => r.json()).then(d => {
        if (d.skus?.length) { setSecondarySkuInfo(d.skus[0]); setPForm(p => ({ ...p, secondarySkuId: d.skus[0].id })) }
        else { setSecondarySkuInfo(null); setPForm(p => ({ ...p, secondarySkuId: "" })) }
      })
  }, [pForm.secondaryPeptide, pForm.secondaryVialSize])

  // Suggested rate = retail price/vial × vials needed for the WHOLE order (the
  // protocol's full duration), since protocols run different lengths (8, 12 wks…).
  // Falls back to ~1 month of vials when no duration is set.
  const orderVials = (info: SkuInfo | null, doseAmount: string, doseUnit: string, freq: string[], weeks: number) => {
    if (!info) return 0
    const toMg = (v: number, unit: string) => unit === "mcg" ? v / 1000 : v
    const dosesPerWeek = freq.length || 3
    const doseMg = toMg(Number(doseAmount || 0), doseUnit)
    const vialMg = toMg(Number(info.strength || 0), info.strength_unit || "mg")
    if (vialMg <= 0 || doseMg <= 0) return 0
    const runWeeks = weeks > 0 ? weeks : 4.333
    return (dosesPerWeek * doseMg * runWeeks) / vialMg
  }
  const suggestedRate = (() => {
    const weeks = Number(pForm.durationWeeks) || 0
    let total = 0
    if (skuInfo?.retail_price != null) total += Number(skuInfo.retail_price) * orderVials(skuInfo, pForm.doseAmount, pForm.doseUnit, pForm.frequencyDays, weeks)
    if (secondarySkuInfo?.retail_price != null) total += Number(secondarySkuInfo.retail_price) * orderVials(secondarySkuInfo, pForm.doseAmount, pForm.doseUnit, pForm.frequencyDays, weeks)
    return total > 0 ? Math.round(total) : null
  })()

  const toggleDay = (d: string) =>
    setPForm(p => ({ ...p, frequencyDays: p.frequencyDays.includes(d) ? p.frequencyDays.filter(x => x !== d) : [...p.frequencyDays, d] }))

  const resetBuilder = () => setPForm(p => ({
    ...p, peptide: "", skuId: "", vialSize: 0, doseAmount: "", doseUnit: "mcg",
    frequencyDays: [], secondaryPeptide: "", secondarySkuId: "", secondaryVialSize: 0, notes: "", monthlyRate: "",
  }))

  // Save the builder as a new protocol LINE. Saving immediately activates the
  // protocol for the client (the API syncs client_protocols → Revenue/Ops). A
  // proposal is optional and separate.
  const saveProtocol = async () => {
    if (!pForm.peptide) return
    setSaving(true); setSaved(false)
    await fetch("/api/admin/protocol-lines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId, peptide: pForm.peptide, skuId: pForm.skuId || null,
        strength: pForm.vialSize || null, strengthUnit: skuInfo?.strength_unit ?? "mg",
        doseAmount: pForm.doseAmount, doseUnit: pForm.doseUnit, frequencyDays: pForm.frequencyDays,
        durationWeeks: pForm.durationWeeks || null,
        monthlyRate: pForm.monthlyRate ? Number(pForm.monthlyRate) : null,
        coachNotes: pForm.notes, secondaryPeptide: pForm.secondaryPeptide || null,
      }),
    })
    await fetch("/api/admin/intakes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, status: "APPROVED" }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    resetBuilder(); setShowBuilder(false)
    await loadLines()
    onChanged?.()
  }

  const deleteLine = async (lineId: string) => {
    await fetch(`/api/admin/protocol-lines?id=${lineId}&clientId=${clientId}`, { method: "DELETE" })
    await loadLines()
    onChanged?.()
  }

  const generateProposal = async () => {
    setProposalLoading(true)
    await fetch(`/api/admin/intakes/${clientId}/proposal`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tos_text: tosText }),
    })
    setProposalLoading(false)
    setShowProposal(true)
    await loadProposal()
    onChanged?.()
  }

  const sendProposal = async () => {
    if (!currentProposal) return
    setSendingProposal(true)
    await fetch(`/api/admin/proposals/${currentProposal.id}/send`, { method: "POST" })
    setSendingProposal(false)
    await loadProposal()
    onChanged?.()
  }

  const markSigned = async () => {
    if (!currentProposal) return
    setMarkingSigned(true)
    await fetch(`/api/admin/proposals/${currentProposal.id}/mark-signed`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
    })
    setMarkingSigned(false)
    await loadProposal()
    onChanged?.()
  }

  const total = lines.reduce((s, l) => s + Number(l.monthly_rate ?? 0), 0)

  return (
    <div>
      {/* AI Recommendation */}
      {showAi && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>🤖 AI Recommendation</h2>
            <button onClick={regenAiRec} disabled={aiLoading} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}>
              {aiLoading ? "Analyzing…" : "Regen"}
            </button>
          </div>
          {aiLoading && <div style={{ color: "var(--text-mute)", fontSize: "0.875rem", padding: "1rem 0" }}>⏳ Analyzing intake with Claude…</div>}
          {aiError && !aiLoading && (
            <div style={{ color: "#f87171", fontSize: "0.875rem" }}>
              Couldn&apos;t generate recommendation: {aiError}{" "}
              <button onClick={regenAiRec} style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Try again</button>
            </div>
          )}
          {aiRec && !aiLoading && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                  <span style={{ color: "var(--text-mute)" }}>Confidence</span>
                  <span style={{ fontWeight: 700, color: "var(--gold)" }}>{Math.round((Number(aiRec.confidence) || 0) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3 }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${(Number(aiRec.confidence) || 0) * 100}%`, background: "var(--gold)", transition: "width 0.5s" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: "0.5rem" }}>Primary</p>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{aiRec.primary_peptide} · {aiRec.primary_vial_size_mg}mg vial</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.primary_dose_amount} {aiRec.primary_dose_unit}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{Array.isArray(aiRec.primary_frequency) ? aiRec.primary_frequency.join("/") : ""} · {aiRec.duration_weeks} weeks</p>
                </div>
                {aiRec.secondary_peptide && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-mute)", marginBottom: "0.5rem" }}>Secondary (optional)</p>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{aiRec.secondary_peptide} · {aiRec.secondary_vial_size_mg}mg vial</p>
                    <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.secondary_dose_amount} {aiRec.secondary_dose_unit}</p>
                    <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{Array.isArray(aiRec.secondary_frequency) ? aiRec.secondary_frequency.join("/") : ""}</p>
                  </div>
                )}
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-mute)", marginBottom: "0.4rem" }}>Rationale</p>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-soft)" }}>{aiRec.rationale}</p>
              </div>
              {Array.isArray(aiRec.contraindications_noted) && aiRec.contraindications_noted.length > 0 && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "var(--radius)", padding: "0.75rem", marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <AlertTriangle size={14} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: "0.82rem", color: "#fbbf24" }}>⚠ {aiRec.contraindications_noted.join("; ")}</p>
                </div>
              )}
              {Array.isArray(aiRec.alternatives) && aiRec.alternatives.length > 0 && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.4rem" }}>Alternatives:</p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {aiRec.alternatives.map((alt, i) => (
                      <span key={i} style={{ padding: "0.25rem 0.6rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, fontSize: "0.78rem" }}>
                        {alt.peptide} ({alt.vial_size_mg}mg)
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={applyAiRec} className="btn-gold" style={{ marginTop: "0.5rem" }}>Use This Recommendation →</button>
            </div>
          )}
        </div>
      )}

      {/* Coach Protocol */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Coach Protocol{lines.length > 0 ? ` (${lines.length})` : ""}</h2>
          {lines.length > 0 && (
            <span style={{ fontSize: "0.82rem", color: "var(--text-mute)" }}>
              Total <span style={{ color: "var(--gold)", fontWeight: 700 }}>${total}</span>
            </span>
          )}
        </div>

        {lines.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {lines.map(ln => {
              let freq = ""
              try { const f = ln.frequency_days ? JSON.parse(ln.frequency_days) : []; freq = Array.isArray(f) ? f.join("/") : "" } catch { freq = "" }
              return (
                <div key={ln.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.7rem 0.9rem" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {ln.peptide}{ln.strength ? ` · ${ln.strength}${ln.strength_unit ?? "mg"}` : ""}
                      {ln.secondary_peptide ? <span style={{ color: "var(--text-mute)", fontWeight: 400 }}> + {ln.secondary_peptide}</span> : null}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-mute)", marginTop: "0.15rem" }}>
                      {[ln.dose_amount ? `${ln.dose_amount}${ln.dose_unit ?? ""}` : null, freq || null, ln.duration_weeks ? `${ln.duration_weeks} wks` : null].filter(Boolean).join(" · ") || "No dosing set"}
                    </div>
                  </div>
                  {ln.monthly_rate != null && Number(ln.monthly_rate) > 0 && (
                    <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap" }}>${Number(ln.monthly_rate)}/order</span>
                  )}
                  <button onClick={() => deleteLine(ln.id)} title="Remove protocol" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, color: "#f87171", cursor: "pointer", padding: "0.25rem 0.45rem", fontSize: "0.72rem", fontWeight: 700 }}>Remove</button>
                </div>
              )
            })}
            <p style={{ fontSize: "0.76rem", color: "#4ade80", marginTop: "0.15rem" }}>✓ These protocols are active for the client. A proposal is optional.</p>
          </div>
        )}

        {!showBuilder && (
          <button onClick={() => setShowBuilder(true)} className="btn-outline" style={{ fontSize: "0.85rem" }}>+ Add another protocol</button>
        )}

        {showBuilder && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.35rem" }}>Primary Peptide</label>
              <select value={pForm.peptide} onChange={e => setPForm(p => ({ ...p, peptide: e.target.value, vialSize: 0, skuId: "" }))}>
                <option value="">— Select peptide —</option>
                {peptideList.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {pForm.peptide && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>Vial Size (manufacturer)</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(catalog[pForm.peptide] ?? []).map(mg => (
                    <button key={mg} type="button" onClick={() => setPForm(p => ({ ...p, vialSize: mg }))} style={{
                      flex: "1 0 auto", minWidth: "3.5rem", padding: "0.6rem", borderRadius: "var(--radius)", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem",
                      background: pForm.vialSize === mg ? "var(--gold)" : "var(--surface-2)", color: pForm.vialSize === mg ? "#000" : "var(--text-mute)",
                      border: `1px solid ${pForm.vialSize === mg ? "var(--gold)" : "var(--border)"}`,
                    }}>{mg}mg</button>
                  ))}
                </div>
                {pForm.skuId && skuInfo && (
                  <p style={{ fontSize: "0.78rem", marginTop: "0.5rem", color: Number(skuInfo.units_in_stock) === 0 ? "#f87171" : "#4ade80" }}>
                    {Number(skuInfo.units_in_stock) === 0 ? "⚠ 0 in stock" : `${skuInfo.units_in_stock} in stock`}
                    {skuInfo.fifo_cost ? ` · $${Number(skuInfo.fifo_cost).toFixed(2)}/vial (FIFO)` : ""}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label>Dose Amount</label>
                <input type="text" placeholder="e.g. 250" value={pForm.doseAmount} onChange={e => setPForm(p => ({ ...p, doseAmount: e.target.value }))} style={{ marginTop: "0.35rem" }} />
              </div>
              <div>
                <label>Unit</label>
                <select value={pForm.doseUnit} onChange={e => setPForm(p => ({ ...p, doseUnit: e.target.value }))} style={{ marginTop: "0.35rem" }}>
                  {DOSE_UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Frequency</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {[{ label: "Daily", days: DAYS }, { label: "3×/wk", days: ["Mon", "Wed", "Fri"] }, { label: "2×/wk", days: ["Mon", "Thu"] }, { label: "Weekly", days: ["Mon"] }].map(preset => (
                  <button key={preset.label} type="button" onClick={() => setPForm(p => ({ ...p, frequencyDays: preset.days }))} style={{
                    padding: "0.35rem 0.75rem", borderRadius: "var(--radius)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    background: JSON.stringify([...pForm.frequencyDays].sort()) === JSON.stringify([...preset.days].sort()) ? "var(--gold)" : "var(--surface-2)",
                    color: JSON.stringify([...pForm.frequencyDays].sort()) === JSON.stringify([...preset.days].sort()) ? "#000" : "var(--text-mute)",
                    border: "1px solid var(--border)",
                  }}>{preset.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)} style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                    background: pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--surface-2)", color: pForm.frequencyDays.includes(d) ? "#000" : "var(--text-mute)",
                    border: `1px solid ${pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--border)"}`,
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.35rem" }}>Secondary Peptide (optional)</label>
              <select value={pForm.secondaryPeptide} onChange={e => setPForm(p => ({ ...p, secondaryPeptide: e.target.value, secondaryVialSize: 0, secondarySkuId: "" }))}>
                <option value="">None</option>
                {peptideList.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {pForm.secondaryPeptide && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>Secondary Vial Size</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(catalog[pForm.secondaryPeptide] ?? []).map(mg => (
                    <button key={mg} type="button" onClick={() => setPForm(p => ({ ...p, secondaryVialSize: mg }))} style={{
                      flex: "1 0 auto", minWidth: "3.5rem", padding: "0.6rem", borderRadius: "var(--radius)", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem",
                      background: pForm.secondaryVialSize === mg ? "var(--gold)" : "var(--surface-2)", color: pForm.secondaryVialSize === mg ? "#000" : "var(--text-mute)",
                      border: `1px solid ${pForm.secondaryVialSize === mg ? "var(--gold)" : "var(--border)"}`,
                    }}>{mg}mg</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label>Duration (weeks)</label>
                <input type="number" value={pForm.durationWeeks} onChange={e => setPForm(p => ({ ...p, durationWeeks: Number(e.target.value) }))} style={{ marginTop: "0.35rem" }} />
              </div>
              <div>
                <label>Rate ($) <span style={{ color: "var(--text-mute)", fontWeight: 400, fontSize: "0.72rem" }}>— cost per order</span></label>
                <input type="number" placeholder="299" value={pForm.monthlyRate} onChange={e => setPForm(p => ({ ...p, monthlyRate: e.target.value }))} style={{ marginTop: "0.35rem" }} />
                {suggestedRate != null && (
                  <p style={{ fontSize: "0.72rem", marginTop: "0.3rem", color: "var(--text-mute)" }}>
                    Suggested <span style={{ color: "#C9A84C", fontWeight: 700 }}>${suggestedRate}</span>
                    {pForm.durationWeeks ? ` for ${pForm.durationWeeks} wks` : ""}
                    {String(pForm.monthlyRate) !== String(suggestedRate) && (
                      <button type="button" onClick={() => setPForm(p => ({ ...p, monthlyRate: String(suggestedRate) }))}
                        style={{ marginLeft: "0.4rem", background: "none", border: "none", color: "#C9A84C", cursor: "pointer", textDecoration: "underline", fontSize: "0.72rem", padding: 0 }}>use</button>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label>Billing Status</label>
                <select value={pForm.billingStatus} onChange={e => setPForm(p => ({ ...p, billingStatus: e.target.value }))} style={{ marginTop: "0.35rem" }}>
                  {["active", "paused", "complimentary"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label>Coach Notes (shown to client)</label>
              <textarea rows={3} value={pForm.notes} onChange={e => setPForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Reconstitution instructions, timing, special notes…" style={{ marginTop: "0.35rem" }} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button onClick={saveProtocol} disabled={saving || !pForm.peptide} className="btn-gold">
                {saving ? "Saving…" : saved ? "✓ Saved" : "Save protocol"}
              </button>
              {lines.length > 0 && (
                <button onClick={() => { resetBuilder(); setShowBuilder(false) }} className="btn-outline" style={{ fontSize: "0.85rem" }}>Cancel</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Proposal (optional) */}
      {(lines.length > 0 || currentProposal) && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Proposal <span style={{ color: "var(--text-mute)", fontWeight: 400, fontSize: "0.82rem" }}>(optional)</span></h2>
            {currentProposal && <span className="chip" style={{ ...proposalStatusColor(currentProposal.status), border: "none" }}>{currentProposal.status}</span>}
          </div>

          {lines.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.9rem 1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-mute)", marginBottom: "0.6rem" }}>
                {lines.length} protocol{lines.length !== 1 ? "s" : ""} in this proposal
              </p>
              {lines.map(ln => (
                <div key={ln.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", padding: "0.2rem 0" }}>
                  <span>{ln.peptide}{ln.strength ? ` · ${ln.strength}${ln.strength_unit ?? "mg"}` : ""}</span>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>{ln.monthly_rate != null && Number(ln.monthly_rate) > 0 ? `$${Number(ln.monthly_rate)}` : "—"}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.5rem", fontWeight: 700 }}>
                <span>Total per order</span><span style={{ color: "var(--gold)" }}>${total}</span>
              </div>
            </div>
          )}

          {!currentProposal && (
            <div style={{ padding: "0.25rem 0 0.5rem" }}>
              <p style={{ color: "var(--text-mute)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>Protocols are already active. Only generate a proposal if you want the client to review &amp; e-sign an agreement.</p>
              <button onClick={generateProposal} disabled={proposalLoading} className="btn-gold">
                {proposalLoading ? "Generating…" : "Generate Proposal →"}
              </button>
            </div>
          )}

          {currentProposal && currentProposal.status === "draft" && (
            <div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-mute)" }}>
                  Draft created {new Date(currentProposal.created_at).toLocaleString()}.{" "}
                  <a href={`/proposal/${currentProposal.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>View / preview →</a>
                </p>
                <p style={{ fontSize: "0.76rem", color: "var(--text-mute)", marginTop: "0.4rem" }}>Added or removed a protocol above? Click <b>Save Draft</b> to refresh the proposal contents.</p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label>Terms of Service (included in the proposal — editable)</label>
                <textarea rows={8} value={tosText} onChange={e => setTosText(e.target.value)}
                  style={{ marginTop: "0.35rem", fontFamily: "monospace", fontSize: "0.78rem", lineHeight: 1.6 }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={generateProposal} disabled={proposalLoading} className="btn-outline" style={{ fontSize: "0.875rem" }}>{proposalLoading ? "Saving…" : "Save Draft"}</button>
                <button onClick={sendProposal} disabled={sendingProposal} className="btn-gold">{sendingProposal ? "Sending…" : "Send to Client →"}</button>
                <button onClick={markSigned} disabled={markingSigned} className="btn-outline" style={{ fontSize: "0.875rem" }}>{markingSigned ? "Marking…" : "Mark signed (offline)"}</button>
              </div>
            </div>
          )}

          {currentProposal && currentProposal.status === "sent" && (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "var(--radius)", padding: "1rem" }}>
              <p style={{ color: "var(--gold)", fontWeight: 600 }}>✉ Sent to {clientEmail}{currentProposal.sent_at ? ` on ${new Date(currentProposal.sent_at).toLocaleString()}` : ""}. Awaiting signature.</p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.6rem", flexWrap: "wrap" }}>
                <a href={`/proposal/${currentProposal.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>View proposal →</a>
                <button onClick={markSigned} disabled={markingSigned} className="btn-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}>{markingSigned ? "Marking…" : "Mark as signed"}</button>
              </div>
            </div>
          )}

          {currentProposal && currentProposal.status === "signed" && (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "var(--radius)", padding: "1rem" }}>
              <p style={{ color: "#4ade80", fontWeight: 600 }}>✅ Signed{currentProposal.signed_name ? ` by ${currentProposal.signed_name}` : ""}{currentProposal.signed_at ? ` on ${new Date(currentProposal.signed_at).toLocaleString()}` : ""}</p>
              <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginTop: "0.35rem" }}>This client now appears under Clients.</p>
            </div>
          )}
        </div>
      )}

      <style>{`@media (max-width: 600px) { .intake-field-grid { grid-template-columns: 1fr; } }`}</style>
    </div>
  )
}
