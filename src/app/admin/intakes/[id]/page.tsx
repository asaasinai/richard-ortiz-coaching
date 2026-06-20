"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DOSE_UNITS = ["mg","mcg","IU","mL"]

interface Intake {
  id: string; first_name: string; last_name: string; email: string; phone?: string
  status: string; submitted_at: string; data: Record<string, unknown>
  ai_recommendation?: AiRec | null; ai_rec_generated_at?: string | null
}
interface Protocol {
  peptide: string; dose_amount: string; dose_unit: string; frequency_days: string
  coach_notes: string; assigned_at: string; sku_id?: string; monthly_rate?: string
  billing_status?: string; secondary_peptide?: string; secondary_sku_id?: string
  duration_weeks?: number; internal_notes?: string
}
interface Proposal {
  id: string; status: string; created_at: string; sent_at?: string
  signed_at?: string; signed_name?: string; proposal_token: string
}
interface SkuInfo {
  id: string; units_in_stock: string; fifo_cost: number | null
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

const proposalStatusColor = (s: string) => ({
  draft:   { bg:"rgba(255,255,255,0.08)", color:"var(--text-mute)" },
  sent:    { bg:"rgba(201,168,76,0.15)", color:"var(--gold)" },
  signed:  { bg:"rgba(74,222,128,0.15)", color:"#4ade80" },
}[s] ?? { bg:"transparent", color:"var(--text-mute)" })

const DEFAULT_TOS = `COACHING SERVICES AGREEMENT

This agreement is between Richard Ortiz Coaching ("Coach") and the client named above ("Client").

1. SERVICES
Coach will provide personalized peptide optimization coaching including protocol design using 
manufacturer peptide products, progress check-in review, and ongoing protocol adjustments based 
on Client's results.

2. PAYMENT
Client agrees to pay the monthly coaching fee listed in this agreement. Payment is due on 
the 1st of each month. Service continues month-to-month until either party cancels in writing.

3. CANCELLATION
Either party may cancel with 7 days written notice via email. No refunds for partial months 
already billed.

4. HEALTH DISCLAIMER
Coaching services are educational and informational in nature. They do not constitute medical 
advice, diagnosis, or treatment. Client should consult a licensed physician before beginning 
any peptide protocol. Richard Ortiz is not a licensed medical professional.

5. CLIENT RESPONSIBILITIES
Client agrees to: (a) follow the assigned protocol as instructed, (b) complete weekly 
check-ins honestly and on time, (c) notify Coach immediately of any adverse reactions, 
(d) disclose all relevant health conditions and medications, and (e) maintain communication 
for protocol adjustments.

6. PRODUCT SOURCE
All peptides are sourced exclusively from the manufacturer. Client acknowledges that peptide products 
are for research and personal optimization purposes.

7. CONFIDENTIALITY
Coach will keep all client health information confidential and will not share it with third 
parties without written consent, except as required by law.

8. LIMITATION OF LIABILITY
Coach's total liability is limited to the monthly coaching fee paid for the month in which 
any claim arises. Coach is not liable for outcomes resulting from Client's failure to follow 
the protocol, failure to disclose relevant health information, or misuse of products.

9. ENTIRE AGREEMENT
This agreement, together with the protocol summary above, constitutes the entire agreement 
between the parties and supersedes all prior discussions.`

export default function IntakeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [intake, setIntake] = useState<Intake | null>(null)
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  // AI rec state
  const [aiRec, setAiRec] = useState<AiRec | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  // Protocol form
  const [pForm, setPForm] = useState({
    peptide: "", skuId: "", vialSize: 0,
    doseAmount: "", doseUnit: "mcg", frequencyDays: [] as string[],
    secondaryPeptide: "", secondarySkuId: "", secondaryVialSize: 0,
    notes: "", internalNotes: "", durationWeeks: 12,
    monthlyRate: "", billingStatus: "active",
  })
  const [skuInfo, setSkuInfo] = useState<SkuInfo | null>(null)
  const [secondarySkuInfo, setSecondarySkuInfo] = useState<SkuInfo | null>(null)

  // Live manufacturer catalog: peptide name -> sorted vial sizes (drives picker)
  const [catalog, setCatalog] = useState<Record<string, number[]>>({})
  const peptideList = Object.keys(catalog).sort((a, b) => a.localeCompare(b))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Proposal state
  const [tosText, setTosText] = useState(DEFAULT_TOS)
  const [proposalLoading, setProposalLoading] = useState(false)
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null)
  const [sendingProposal, setSendingProposal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/intakes/${id}`)
    const d = await r.json() as { intake: Intake; protocol: Protocol | null; proposals: Proposal[] }
    setIntake(d.intake)
    setProtocol(d.protocol)
    setProposals(d.proposals ?? [])
    if (d.proposals?.[0]) setCurrentProposal(d.proposals[0])
    if (d.protocol) {
      let days: string[] = []
      try { days = JSON.parse(d.protocol.frequency_days) } catch { days = [] }
      setPForm(p => ({
        ...p,
        peptide: d.protocol!.peptide ?? "",
        doseAmount: d.protocol!.dose_amount ?? "",
        doseUnit: d.protocol!.dose_unit ?? "mcg",
        frequencyDays: days,
        notes: d.protocol!.coach_notes ?? "",
        internalNotes: d.protocol!.internal_notes ?? "",
        durationWeeks: d.protocol!.duration_weeks ?? 12,
        monthlyRate: d.protocol!.monthly_rate ?? "",
        billingStatus: d.protocol!.billing_status ?? "active",
        secondaryPeptide: d.protocol!.secondary_peptide ?? "",
      }))
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // Load the live catalog once so peptide + vial-size pickers match real SKUs
  useEffect(() => {
    fetch(`/api/admin/inventory`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number[]> = {}
        for (const s of (d.skus ?? []) as { peptide_name: string; strength: string }[]) {
          (map[s.peptide_name] ??= []).push(Number(s.strength))
        }
        for (const k in map) map[k].sort((a, b) => a - b)
        setCatalog(map)
      })
      .catch(() => {})
  }, [])

  // Load AI rec from cache on mount
  useEffect(() => {
    if (!id) return
    const loadAiRec = async () => {
      setAiLoading(true)
      setAiError("")
      try {
        const r = await fetch(`/api/admin/intakes/${id}/ai-recommendation`)
        const d = await r.json() as { recommendation?: AiRec; error?: string }
        if (d.recommendation) setAiRec(d.recommendation)
        else setAiError(d.error ?? "Unknown error")
      } catch (e) {
        setAiError(String(e))
      }
      setAiLoading(false)
    }
    loadAiRec()
  }, [id])

  const regenAiRec = async () => {
    setAiLoading(true)
    setAiError("")
    setAiRec(null)
    try {
      const r = await fetch(`/api/admin/intakes/${id}/ai-recommendation?regen=1`)
      const d = await r.json() as { recommendation?: AiRec; error?: string }
      if (d.recommendation) setAiRec(d.recommendation)
      else setAiError(d.error ?? "Unknown error")
    } catch (e) {
      setAiError(String(e))
    }
    setAiLoading(false)
  }

  const applyAiRec = () => {
    if (!aiRec) return
    setPForm(p => ({
      ...p,
      peptide: aiRec.primary_peptide,
      vialSize: aiRec.primary_vial_size_mg,
      doseAmount: aiRec.primary_dose_amount,
      doseUnit: aiRec.primary_dose_unit,
      frequencyDays: aiRec.primary_frequency,
      secondaryPeptide: aiRec.secondary_peptide ?? "",
      secondaryVialSize: aiRec.secondary_vial_size_mg ?? 0,
      durationWeeks: aiRec.duration_weeks,
    }))
  }

  // Resolve SKU when peptide/size changes
  useEffect(() => {
    if (!pForm.peptide || !pForm.vialSize) { setSkuInfo(null); return }
    fetch(`/api/admin/inventory?peptide=${encodeURIComponent(pForm.peptide)}&strength=${pForm.vialSize}`)
      .then(r => r.json())
      .then(d => {
        if (d.skus?.length) {
          const sku = d.skus[0] as SkuInfo
          setSkuInfo(sku)
          setPForm(p => ({ ...p, skuId: sku.id }))
        } else {
          setSkuInfo(null)
          setPForm(p => ({ ...p, skuId: "" }))
        }
      })
  }, [pForm.peptide, pForm.vialSize])

  useEffect(() => {
    if (!pForm.secondaryPeptide || !pForm.secondaryVialSize) { setSecondarySkuInfo(null); return }
    fetch(`/api/admin/inventory?peptide=${encodeURIComponent(pForm.secondaryPeptide)}&strength=${pForm.secondaryVialSize}`)
      .then(r => r.json())
      .then(d => {
        if (d.skus?.length) {
          const sku = d.skus[0] as SkuInfo
          setSecondarySkuInfo(sku)
          setPForm(p => ({ ...p, secondarySkuId: sku.id }))
        } else {
          setSecondarySkuInfo(null)
          setPForm(p => ({ ...p, secondarySkuId: "" }))
        }
      })
  }, [pForm.secondaryPeptide, pForm.secondaryVialSize])

  const toggleDay = (d: string) =>
    setPForm(p => ({ ...p, frequencyDays: p.frequencyDays.includes(d) ? p.frequencyDays.filter(x => x !== d) : [...p.frequencyDays, d] }))

  const saveProtocol = async () => {
    setSaving(true); setSaved(false)
    await fetch("/api/admin/assign-protocol", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: id, peptide: pForm.peptide, doseAmount: pForm.doseAmount,
        doseUnit: pForm.doseUnit, frequencyDays: pForm.frequencyDays,
        notes: pForm.notes, skuId: pForm.skuId || null,
        monthlyRate: pForm.monthlyRate ? Number(pForm.monthlyRate) : null,
        billingStatus: pForm.billingStatus,
        secondaryPeptide: pForm.secondaryPeptide || null,
        secondarySkuId: pForm.secondarySkuId || null,
        durationWeeks: pForm.durationWeeks || null,
        internalNotes: pForm.internalNotes || null,
      }),
    })
    // Also mark APPROVED
    await fetch("/api/admin/intakes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "APPROVED" }),
    })
    setIntake(p => p ? { ...p, status: "APPROVED" } : p)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    await load()
  }

  const generateProposal = async () => {
    setProposalLoading(true)
    const r = await fetch(`/api/admin/intakes/${id}/proposal`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tos_text: tosText }),
    })
    const d = await r.json() as { proposalId: string; token: string }
    setProposalLoading(false)
    await load()
  }

  const sendProposal = async () => {
    if (!currentProposal) return
    setSendingProposal(true)
    await fetch(`/api/admin/proposals/${currentProposal.id}/send`, { method: "POST" })
    setSendingProposal(false)
    await load()
  }

  const updateStatus = async (status: string) => {
    await fetch("/api/admin/intakes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setIntake(p => p ? { ...p, status } : p)
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "var(--text-mute)" }}>Loading…</p>
    </div>
  )

  if (!intake) return (
    <div>
      <p style={{ color: "#f87171" }}>Intake not found.</p>
      <button onClick={() => router.push("/admin/intakes")} className="btn-outline" style={{ marginTop: "1rem" }}>← Back</button>
    </div>
  )

  const intakeData = intake.data ?? {}

  // Group intake fields
  const fieldGroups: { label: string; keys: string[] }[] = [
    { label: "Personal", keys: ["ageRange","age","gender","weight","height","bmi"] },
    { label: "Goals & Struggles", keys: ["primaryGoals","goals","biggestStruggles","struggles","primaryConcern"] },
    { label: "Health History", keys: ["healthHistory","currentMedications","medications","allergies","priorPeptideExperience","priorPeptides","medicalConditions"] },
    { label: "Lifestyle", keys: ["exerciseFrequency","exercise","sleepHours","sleep","stressLevel","stress","dietType","diet","nutrition"] },
    { label: "Contact Preferences", keys: ["preferredContact","contactMethod","bestTimeToReach","howHeard","howDidYouHear"] },
  ]

  const allGroupedKeys = fieldGroups.flatMap(g => g.keys)
  const otherKeys = Object.keys(intakeData).filter(k => !allGroupedKeys.includes(k))

  const renderValue = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return ""
    if (Array.isArray(v)) return v.join(", ")
    if (typeof v === "boolean") return v ? "Yes" : "No"
    return String(v)
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => router.push("/admin/intakes")} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", color: "var(--text-mute)", fontSize: "0.82rem", fontWeight: 600, padding: "0.35rem 0.85rem 0.35rem 0.6rem", cursor: "pointer", marginBottom: "1rem" }}>
        <ArrowLeft size={15}/> Applicants
      </button>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem,4vw,1.6rem)", letterSpacing: "-0.01em", marginBottom: "0.2rem" }}>
            {intake.first_name} {intake.last_name}
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-mute)", marginTop: "0.3rem" }}>
            <a href={`mailto:${intake.email}`} style={{ color: "var(--gold)" }}>{intake.email}</a>
            {intake.phone && <a href={`tel:${intake.phone}`} style={{ color: "var(--text-mute)" }}>{intake.phone}</a>}
            <span>Applied {new Date(intake.submitted_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          {["APPROVED","PENDING","FLAGGED"].map(s => (
            <button key={s} onClick={() => updateStatus(s)} className="pill" data-active={intake.status === s} style={{ fontSize: "0.72rem" }}>
              {s === "APPROVED" ? "Approve" : s === "PENDING" ? "Pending" : "Flag"}
            </button>
          ))}
          {currentProposal && (
            <span className="chip" style={{ ...proposalStatusColor(currentProposal.status), border: "none" }}>
              Proposal: {currentProposal.status}
            </span>
          )}
        </div>
      </div>

      {/* Intake Answers */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Intake Answers</h2>
        {fieldGroups.map(group => {
          const fields = group.keys.filter(k => {
            const v = intakeData[k]
            return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
          })
          if (!fields.length) return null
          return (
            <div key={group.label} style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: "0.5rem" }}>{group.label}</p>
              <div className="intake-field-grid">
                {fields.map(k => {
                  const val = renderValue(intakeData[k])
                  if (!val) return null
                  const label = k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
                  return (
                    <div key={k} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.875rem" }}>
                      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-mute)", marginBottom: "0.2rem" }}>{label}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 500, wordBreak: "break-word" }}>{val}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {otherKeys.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: "0.5rem" }}>Other</p>
            <div className="intake-field-grid">
              {otherKeys.map(k => {
                const val = renderValue(intakeData[k])
                if (!val) return null
                const label = k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
                return (
                  <div key={k} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.875rem" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-mute)", marginBottom: "0.2rem" }}>{label}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 500, wordBreak: "break-word" }}>{val}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Panel */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>🤖 AI Recommendation</h2>
          <button onClick={regenAiRec} disabled={aiLoading} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}>
            {aiLoading ? "Analyzing…" : "Regen"}
          </button>
        </div>

        {aiLoading && (
          <div style={{ color: "var(--text-mute)", fontSize: "0.875rem", padding: "1rem 0" }}>
            ⏳ Analyzing intake with Claude…
          </div>
        )}

        {aiError && !aiLoading && (
          <div style={{ color: "#f87171", fontSize: "0.875rem" }}>
            Couldn&apos;t generate recommendation: {aiError}{" "}
            <button onClick={regenAiRec} style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Try again</button>
          </div>
        )}

        {aiRec && !aiLoading && (
          <div>
            {/* Confidence bar */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                <span style={{ color: "var(--text-mute)" }}>Confidence</span>
                <span style={{ fontWeight: 700, color: "var(--gold)" }}>{Math.round(aiRec.confidence * 100)}%</span>
              </div>
              <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3 }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${aiRec.confidence * 100}%`, background: "var(--gold)", transition: "width 0.5s" }}/>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: "0.5rem" }}>Primary</p>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{aiRec.primary_peptide} · {aiRec.primary_vial_size_mg}mg vial</p>
                <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.primary_dose_amount} {aiRec.primary_dose_unit}</p>
                <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.primary_frequency?.join("/")} · {aiRec.duration_weeks} weeks</p>
              </div>
              {aiRec.secondary_peptide && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-mute)", marginBottom: "0.5rem" }}>Secondary (optional)</p>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{aiRec.secondary_peptide} · {aiRec.secondary_vial_size_mg}mg vial</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.secondary_dose_amount} {aiRec.secondary_dose_unit}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>{aiRec.secondary_frequency?.join("/")}</p>
                </div>
              )}
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-mute)", marginBottom: "0.4rem" }}>Rationale</p>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-soft)" }}>{aiRec.rationale}</p>
            </div>

            {aiRec.contraindications_noted?.length > 0 && (
              <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "var(--radius)", padding: "0.75rem", marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <AlertTriangle size={14} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }}/>
                <p style={{ fontSize: "0.82rem", color: "#fbbf24" }}>⚠ {aiRec.contraindications_noted.join("; ")}</p>
              </div>
            )}

            {aiRec.alternatives?.length > 0 && (
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

            <button onClick={applyAiRec} className="btn-gold" style={{ marginTop: "0.5rem" }}>
              Use This Recommendation →
            </button>
          </div>
        )}
      </div>

      {/* Coach Protocol Section */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>Coach Protocol</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Primary Peptide */}
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
                    background: pForm.vialSize === mg ? "var(--gold)" : "var(--surface-2)",
                    color: pForm.vialSize === mg ? "#000" : "var(--text-mute)",
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
              <input type="text" placeholder="e.g. 250" value={pForm.doseAmount} onChange={e => setPForm(p => ({ ...p, doseAmount: e.target.value }))} style={{ marginTop: "0.35rem" }}/>
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
              {[{ label:"Daily", days:DAYS }, { label:"3×/wk", days:["Mon","Wed","Fri"] }, { label:"2×/wk", days:["Mon","Thu"] }, { label:"Weekly", days:["Mon"] }].map(preset => (
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
                  background: pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--surface-2)",
                  color: pForm.frequencyDays.includes(d) ? "#000" : "var(--text-mute)",
                  border: `1px solid ${pForm.frequencyDays.includes(d) ? "var(--gold)" : "var(--border)"}`,
                }}>{d}</button>
              ))}
            </div>
          </div>

          {/* Secondary peptide */}
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
                    background: pForm.secondaryVialSize === mg ? "var(--gold)" : "var(--surface-2)",
                    color: pForm.secondaryVialSize === mg ? "#000" : "var(--text-mute)",
                    border: `1px solid ${pForm.secondaryVialSize === mg ? "var(--gold)" : "var(--border)"}`,
                  }}>{mg}mg</button>
                ))}
              </div>
              {pForm.secondarySkuId && secondarySkuInfo && (
                <p style={{ fontSize: "0.78rem", marginTop: "0.5rem", color: Number(secondarySkuInfo.units_in_stock) === 0 ? "#f87171" : "#4ade80" }}>
                  {Number(secondarySkuInfo.units_in_stock) === 0 ? "⚠ 0 in stock" : `${secondarySkuInfo.units_in_stock} in stock`}
                </p>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label>Duration (weeks)</label>
              <input type="number" value={pForm.durationWeeks} onChange={e => setPForm(p => ({ ...p, durationWeeks: Number(e.target.value) }))} style={{ marginTop: "0.35rem" }}/>
            </div>
            <div>
              <label>Monthly Rate ($)</label>
              <input type="number" placeholder="299" value={pForm.monthlyRate} onChange={e => setPForm(p => ({ ...p, monthlyRate: e.target.value }))} style={{ marginTop: "0.35rem" }}/>
            </div>
            <div>
              <label>Billing Status</label>
              <select value={pForm.billingStatus} onChange={e => setPForm(p => ({ ...p, billingStatus: e.target.value }))} style={{ marginTop: "0.35rem" }}>
                {["active","paused","complimentary"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label>Coach Notes (shown to client)</label>
            <textarea rows={3} value={pForm.notes} onChange={e => setPForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Reconstitution instructions, timing, special notes…" style={{ marginTop: "0.35rem" }}/>
          </div>

          <div>
            <label>Internal Notes (admin only)</label>
            <textarea rows={2} value={pForm.internalNotes} onChange={e => setPForm(p => ({ ...p, internalNotes: e.target.value }))}
              placeholder="Private notes not shown in proposal…" style={{ marginTop: "0.35rem" }}/>
          </div>

          <button onClick={saveProtocol} disabled={saving || !pForm.peptide} className="btn-gold" style={{ alignSelf: "flex-start" }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Protocol"}
          </button>
        </div>
      </div>

      {/* Proposal Builder */}
      {protocol && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Proposal Builder</h2>

          {!currentProposal && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ color: "var(--text-mute)", marginBottom: "1rem" }}>Protocol saved. Ready to generate the client proposal.</p>
              <button onClick={generateProposal} disabled={proposalLoading} className="btn-gold">
                {proposalLoading ? "Generating…" : "Generate Proposal"}
              </button>
            </div>
          )}

          {currentProposal && currentProposal.status === "draft" && (
            <div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-mute)", marginBottom: "0.5rem" }}>
                  Draft created {new Date(currentProposal.created_at).toLocaleString()}.{" "}
                  <a href={`/proposal/${currentProposal.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>Preview →</a>
                </p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label>Terms of Service (editable)</label>
                <textarea rows={8} value={tosText} onChange={e => setTosText(e.target.value)}
                  style={{ marginTop: "0.35rem", fontFamily: "monospace", fontSize: "0.78rem", lineHeight: 1.6 }}/>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={generateProposal} disabled={proposalLoading} className="btn-outline" style={{ fontSize: "0.875rem" }}>
                  {proposalLoading ? "Saving…" : "Save Draft"}
                </button>
                <button onClick={sendProposal} disabled={sendingProposal} className="btn-gold">
                  {sendingProposal ? "Sending…" : "Send to Client →"}
                </button>
              </div>
            </div>
          )}

          {currentProposal && currentProposal.status === "sent" && (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "var(--radius)", padding: "1rem" }}>
              <p style={{ color: "var(--gold)", fontWeight: 600 }}>
                ✉ Sent to {intake.email} on {new Date(currentProposal.sent_at!).toLocaleString()}. Awaiting signature.
              </p>
              <a href={`/proposal/${currentProposal.proposal_token}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-mute)", fontSize: "0.82rem", display: "inline-block", marginTop: "0.5rem" }}>
                View proposal →
              </a>
            </div>
          )}

          {currentProposal && currentProposal.status === "signed" && (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "var(--radius)", padding: "1rem" }}>
              <p style={{ color: "#4ade80", fontWeight: 600 }}>
                ✅ Signed by {currentProposal.signed_name} on {new Date(currentProposal.signed_at!).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .intake-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        @media (max-width: 600px) { .intake-field-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
