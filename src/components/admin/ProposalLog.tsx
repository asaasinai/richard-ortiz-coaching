"use client"
import { useEffect, useState, useCallback } from "react"
import { FileSignature, ExternalLink, Plus, CheckCircle, Clock, FileText } from "lucide-react"

interface SnapLine { peptide?: string; monthly_rate?: string | number }
interface Proposal {
  id: string
  status: string
  created_at: string
  sent_at: string | null
  signed_at: string | null
  signed_name: string | null
  proposal_token: string
  protocol_snapshot: { lines?: SnapLine[]; total_monthly?: number; monthly_rate?: number } | null
}

const statusChip = (s: string) => ({
  signed: { bg: "rgba(52,211,153,0.14)", color: "#34D399", label: "Signed", Icon: CheckCircle },
  sent:   { bg: "rgba(96,165,250,0.15)", color: "#93c5fd", label: "Sent",   Icon: Clock },
  draft:  { bg: "var(--surface-2)",      color: "var(--text-mute)", label: "Draft", Icon: FileText },
}[s] ?? { bg: "var(--surface-2)", color: "var(--text-mute)", label: s, Icon: FileText })

export default function ProposalLog({
  clientId, clientEmail, firstName = "", lastName = "",
}: { clientId: string; clientEmail?: string; firstName?: string; lastName?: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetch(`/api/admin/intakes/${clientId}/proposal`)
      .then(r => r.json())
      .then(d => setProposals(d.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => { load() }, [load])

  // Open the external proposal builder, pre-filling the client.
  const builderUrl = `/proposal-builder?${new URLSearchParams({
    first: firstName, last: lastName, email: clientEmail ?? "",
  }).toString()}`

  const total = (p: Proposal) => {
    const snap = p.protocol_snapshot ?? {}
    return Number(snap.total_monthly ?? snap.monthly_rate ?? (snap.lines ?? []).reduce((s, l) => s + Number(l.monthly_rate ?? 0), 0))
  }
  const peptides = (p: Proposal) =>
    (p.protocol_snapshot?.lines ?? []).map(l => l.peptide).filter(Boolean).join(", ")

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>Proposals</h2>
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginTop: "0.15rem" }}>Proposals are built in the Proposal Builder form. This is the log for this client.</p>
        </div>
        <a href={builderUrl} target="_blank" rel="noopener noreferrer" className="btn-gold"
          style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", whiteSpace: "nowrap" }}>
          <Plus size={15} /> Build proposal
        </a>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>Loading…</p>
      ) : proposals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "1.75rem 1rem" }}>
          <FileSignature size={28} style={{ color: "var(--text-mute)", margin: "0 auto 0.6rem" }} />
          <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>No proposals yet</p>
          <p style={{ color: "var(--text-mute)", fontSize: "0.82rem", marginTop: "0.2rem" }}>Use “Build proposal” to create one and text the link to the client.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {proposals.map(p => {
            const chip = statusChip(p.status)
            const when = p.signed_at ?? p.sent_at ?? p.created_at
            return (
              <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", padding: "0.85rem 1rem" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.66rem", fontWeight: 700, padding: "0.12rem 0.5rem", borderRadius: "var(--radius-pill)", background: chip.bg, color: chip.color }}>
                      <chip.Icon size={11} /> {chip.label}
                    </span>
                    {total(p) > 0 && <span className="gold-text" style={{ fontWeight: 700, fontSize: "0.85rem" }}>${total(p)}</span>}
                  </div>
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, wordBreak: "break-word" }}>{peptides(p) || "—"}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginTop: "0.1rem" }}>
                    {p.status === "signed" && p.signed_name ? `Signed by ${p.signed_name} · ` : ""}
                    {new Date(when).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <a href={`/proposal/${p.proposal_token}`} target="_blank" rel="noopener noreferrer" className="btn-outline"
                  style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                  View <ExternalLink size={13} />
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
