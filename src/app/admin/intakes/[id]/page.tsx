"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import EditDetailsModal from "@/components/admin/EditDetailsModal"
import ProtocolWorkspace from "@/components/admin/ProtocolWorkspace"

interface Intake {
  id: string; first_name: string; last_name: string; email: string; phone?: string
  status: string; submitted_at: string; data: Record<string, unknown>
}
interface Proposal {
  id: string; status: string; created_at: string; sent_at?: string; signed_at?: string
  signed_name?: string; proposal_token: string
}

const proposalStatusColor = (s: string) => ({
  draft:   { bg: "rgba(255,255,255,0.08)", color: "var(--text-mute)" },
  sent:    { bg: "rgba(201,168,76,0.15)", color: "var(--gold)" },
  signed:  { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
}[s] ?? { bg: "transparent", color: "var(--text-mute)" })

export default function IntakeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [intake, setIntake] = useState<Intake | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/intakes/${id}`)
    const d = await r.json() as { intake: Intake; proposals: Proposal[] }
    setIntake(d.intake)
    setProposals(d.proposals ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const updateStatus = async (status: string) => {
    await fetch("/api/admin/intakes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setIntake(p => p ? { ...p, status } : p)
    // Approving moves the record out of Applicants and into Clients — take the
    // coach straight to the client record.
    if (status === "APPROVED") router.push(`/admin/clients/${id}`)
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
  const currentProposal = proposals[0] ?? null

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
      <button onClick={() => router.push("/admin/intakes")} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", color: "var(--text-mute)", fontSize: "0.82rem", fontWeight: 600, padding: "0.35rem 0.85rem 0.35rem 0.6rem", cursor: "pointer", marginBottom: "1rem" }}>
        <ArrowLeft size={15}/> Applicants
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.3rem,4vw,1.6rem)", letterSpacing: "-0.01em", marginBottom: "0.2rem" }}>
            {intake.first_name} {intake.last_name}
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-mute)", marginTop: "0.3rem" }}>
            <a href={`mailto:${intake.email}`} style={{ color: "var(--gold)" }}>{intake.email}</a>
            {intake.phone && <a href={`tel:${intake.phone}`} style={{ color: "var(--text-mute)" }}>{intake.phone}</a>}
            <span>Applied {new Date(intake.submitted_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setShowEdit(true)} className="pill" style={{ fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Pencil size={12} /> Edit
          </button>
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

      {showEdit && (
        <EditDetailsModal
          intake={{ id, first_name: intake.first_name, last_name: intake.last_name, email: intake.email, data: intake.data }}
          onClose={() => setShowEdit(false)}
          onSaved={load}
        />
      )}

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

      {/* AI rec + multi-protocol builder + optional proposal (shared with Clients) */}
      <ProtocolWorkspace clientId={id} clientEmail={intake.email} onChanged={load} />

      <style>{`
        .intake-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        @media (max-width: 600px) { .intake-field-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
