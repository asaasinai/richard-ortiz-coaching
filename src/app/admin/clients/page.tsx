"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"

interface Client {
  id: string; first_name: string; last_name: string; email: string
  phone?: string; status: string; submitted_at: string; data?: Record<string, unknown>
  has_protocol?: boolean; protocol_peptide?: string | null
  protocol_billing_status?: string | null; protocol_monthly_rate?: string | null
}

const statusChip = (s: string) => ({
  APPROVED: { bg: "rgba(52,211,153,0.14)", color: "#34D399", label: "Active" },
  FLAGGED:  { bg: "rgba(248,113,113,0.14)", color: "#F87171", label: "Flagged" },
  PENDING:  { bg: "rgba(201,168,76,0.14)",  color: "var(--gold-light)", label: "Pending" },
}[s] ?? { bg: "var(--surface-2)", color: "var(--text-mute)", label: s })

const initials = (f: string, l: string) => `${(f || "?")[0] ?? ""}${(l || "")[0] ?? ""}`.toUpperCase()
const AVATAR_BG = ["#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#A78BFA", "#C9A84C"]
const avatarColor = (s: string) => AVATAR_BG[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length]

function Avatar({ c, size = 38 }: { c: Client; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: avatarColor(c.email || c.id),
      color: "#0A0A0B", fontWeight: 800, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {initials(c.first_name, c.last_name)}
    </div>
  )
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/intakes").then(r => r.json()).then(d => {
      setClients(d.intakes ?? [])
      setLoading(false)
    })
    const st = new URLSearchParams(window.location.search).get("status")
    if (st === "APPROVED") setStatusFilter("Active")
    else if (st === "PENDING") setStatusFilter("Pending")
    else if (st === "FLAGGED") setStatusFilter("Flagged")
  }, [])

  const STATUS_FOR: Record<string, string | null> = { All: null, Active: "APPROVED", Pending: "PENDING", Flagged: "FLAGGED" }
  const filtered = clients.filter(c => {
    const matchSearch = `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    const want = STATUS_FOR[statusFilter]
    return matchSearch && (!want || c.status === want)
  })
  const countFor = (f: string) => { const w = STATUS_FOR[f]; return w ? clients.filter(c => c.status === w).length : clients.length }

  const exportCsv = () => {
    const cols = ["Name", "Email", "Phone", "Status", "Protocol", "Billing", "Monthly Rate", "Intake Date"]
    const lines = [cols.join(",")]
    for (const c of filtered) lines.push([
      `"${c.first_name} ${c.last_name}"`, `"${c.email}"`, `"${c.phone ?? ""}"`, c.status,
      `"${c.protocol_peptide ?? ""}"`, c.protocol_billing_status ?? "", c.protocol_monthly_rate ?? "",
      new Date(c.submitted_at).toISOString().slice(0, 10),
    ].join(","))
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `roc-clients-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle="Everyone you're coaching, with their current protocol and status." backHref="/admin" backLabel="Overview"
        action={<button onClick={exportCsv} className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.5rem 0.9rem" }}><Download size={14} /> Export CSV</button>} />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
        {Object.keys(STATUS_FOR).map(f => (
          <button key={f} className="pill" data-active={statusFilter === f} onClick={() => setStatusFilter(f)}>
            {f} <span style={{ opacity: 0.6 }}>{countFor(f)}</span>
          </button>
        ))}
      </div>
      <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: "1.25rem" }} />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-mute)" }}>
          <p style={{ fontSize: "0.95rem" }}>No clients match.</p>
          <p style={{ fontSize: "0.82rem", marginTop: "0.35rem" }}>Try a different filter or search term.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map(c => {
            const chip = statusChip(c.status)
            return (
              <div key={c.id} className="client-row" onClick={() => router.push(`/admin/clients/${c.id}`)}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all .12s", boxShadow: "var(--shadow-card)" }}>
                <Avatar c={c} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.first_name} {c.last_name}</div>
                  <div style={{ color: "var(--text-mute)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                </div>
                <div className="client-protocol" style={{ minWidth: 0, flex: 1 }}>
                  {c.has_protocol ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{c.protocol_peptide || "—"}</span>
                      {c.protocol_monthly_rate && Number(c.protocol_monthly_rate) > 0 &&
                        <span style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}>${Math.round(Number(c.protocol_monthly_rate))}/mo</span>}
                    </div>
                  ) : <span style={{ color: "var(--text-mute)", fontSize: "0.82rem" }}>No protocol yet</span>}
                </div>
                <span className="chip" style={{ background: chip.bg, color: chip.color, border: "none", flexShrink: 0 }}>{chip.label}</span>
                <span className="client-open" style={{ color: "var(--gold)", fontSize: "0.82rem", fontWeight: 700, flexShrink: 0 }}>Open →</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .client-row:hover { border-color: var(--border-strong) !important; transform: translateY(-1px); }
        @media (max-width: 700px) { .client-protocol { display: none !important; } .client-open { display: none !important; } }
      `}</style>
    </div>
  )
}
