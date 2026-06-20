"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageHeader from "@/components/admin/PageHeader"

interface Intake {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  submitted_at: string
  data: Record<string, unknown>
}

const statusChip = (s: string) => ({
  PENDING:  { bg: "rgba(201,168,76,0.14)",  color: "var(--gold-light)", label: "Pending" },
  APPROVED: { bg: "rgba(52,211,153,0.14)",  color: "#34D399", label: "Approved" },
  FLAGGED:  { bg: "rgba(248,113,113,0.14)", color: "#F87171", label: "Flagged" },
}[s] ?? { bg: "var(--surface-2)", color: "var(--text-mute)", label: s })

const initials = (f: string, l: string) => `${(f || "?")[0] ?? ""}${(l || "")[0] ?? ""}`.toUpperCase()
const AV = ["#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#A78BFA", "#C9A84C"]
const avColor = (s: string) => AV[[...(s || "x")].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length]

function IntakesInner() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch("/api/admin/intakes").then(r => r.json()).then(d => {
      setIntakes(d.intakes ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const st = searchParams.get("status")
    if (st && ["PENDING", "APPROVED", "FLAGGED"].includes(st)) setFilter(st)
  }, [searchParams])

  const filtered = filter === "all" ? intakes : intakes.filter(i => i.status === filter)
  const countFor = (v: string) => v === "all" ? intakes.length : intakes.filter(i => i.status === v).length

  return (
    <div>
      <PageHeader title="Applicants" subtitle="People who applied to work with you. Review their intake and approve to make them a client." backHref="/admin" backLabel="Overview" />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[["all", "All"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["FLAGGED", "Flagged"]].map(([val, label]) => (
          <button key={val} className="pill" data-active={filter === val} onClick={() => setFilter(val)}>
            {label} <span style={{ opacity: 0.6 }}>{countFor(val)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-mute)" }}>
          <p style={{ fontSize: "0.95rem" }}>No applicants here.</p>
          <p style={{ fontSize: "0.82rem", marginTop: "0.35rem" }}>New applications show up the moment someone submits the intake form.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map(intake => {
            const chip = statusChip(intake.status)
            return (
              <div key={intake.id} className="applicant-row" onClick={() => router.push(`/admin/intakes/${intake.id}`)}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.9rem 1.1rem",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all .12s", boxShadow: "var(--shadow-card)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: avColor(intake.email || intake.id), color: "#0A0A0B", fontWeight: 800, fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {initials(intake.first_name, intake.last_name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{intake.first_name} {intake.last_name}</div>
                  <div style={{ color: "var(--text-mute)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{intake.email}</div>
                </div>
                <span className="applicant-date" style={{ color: "var(--text-mute)", fontSize: "0.78rem", flexShrink: 0 }}>{new Date(intake.submitted_at).toLocaleDateString()}</span>
                <span className="chip" style={{ background: chip.bg, color: chip.color, border: "none", flexShrink: 0 }}>{chip.label}</span>
                <span className="applicant-open" style={{ color: "var(--gold)", fontSize: "0.82rem", fontWeight: 700, flexShrink: 0 }}>Review →</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .applicant-row:hover { border-color: var(--border-strong) !important; transform: translateY(-1px); }
        @media (max-width: 600px) { .applicant-date { display: none !important; } .applicant-open { display: none !important; } }
      `}</style>
    </div>
  )
}

export default function AdminIntakesPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-mute)" }}>Loading…</p>}>
      <IntakesInner />
    </Suspense>
  )
}
