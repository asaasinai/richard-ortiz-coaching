"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Sku { id: string; peptide_name: string; strength: string; strength_unit: string; units_in_stock: string; reorder_point: string | null; reorder_qty: string; wholesale_cost: string | null }
interface Lot { id: string; lot_identifier: string | null; qty_received: string; qty_remaining: string; unit_cost: string; supplier: string | null; received_at: string | null; received_by: string | null; created_at: string }
interface Usage { id: string; qty_deducted: string; transaction_type: string; created_at: string; ops_card_id: string | null; client_id: string | null; lot_identifier: string | null; unit_cost: string | null; client_name: string | null }

const money = (v: number | string | undefined | null) => `$${Number(v ?? 0).toFixed(2)}`

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const [sku, setSku] = useState<Sku | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [usage, setUsage] = useState<Usage[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState("")

  const load = useCallback(() => {
    fetch(`/api/admin/inventory/${id}`).then(r => r.json()).then(d => {
      if (d.ok) { setSku(d.sku); setLots(d.lots ?? []); setUsage(d.usage ?? []); setThreshold(d.sku.reorder_point ?? "") }
      setLoading(false)
    })
  }, [id])
  useEffect(() => { load() }, [load])

  const saveThreshold = () => {
    if (threshold === "") return
    fetch("/api/admin/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reorder_point: threshold }) })
  }

  if (loading) return <p style={{ color: "var(--text-mute)" }}>Loading…</p>
  if (!sku) return <p style={{ color: "var(--text-mute)" }}>SKU not found. <Link href="/admin/inventory" style={{ color: "var(--gold)" }}>← Inventory</Link></p>

  const totalUnits = lots.reduce((s, l) => s + Number(l.qty_remaining), 0)
  const totalValue = lots.reduce((s, l) => s + Number(l.qty_remaining) * Number(l.unit_cost), 0)
  const lotStatus = (l: Lot) => Number(l.qty_remaining) <= 0 ? { t: "Depleted", c: "var(--text-mute)" } : Number(l.qty_remaining) < Number(l.qty_received) ? { t: "Partial", c: "#f59e0b" } : { t: "Full", c: "#22c55e" }

  return (
    <div>
      <Link href="/admin/inventory" style={{ color: "var(--text-mute)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1rem" }}><ArrowLeft size={14} /> Inventory</Link>

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.4rem", marginBottom: "0.2rem" }}>{sku.peptide_name} <span style={{ color: "var(--text-mute)", fontWeight: 600, fontSize: "1rem" }}>{sku.strength}{sku.strength_unit}</span></h1>

      {/* Overview stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", margin: "1rem 0 1.5rem" }} className="inv-stats">
        <Stat label="Units in Stock" value={totalUnits} />
        <Stat label="Total Lot Value" value={money(totalValue)} color="var(--gold)" />
        <Stat label="Wholesale / Unit" value={money(sku.wholesale_cost)} />
        <div className="card">
          <div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.3rem" }}>Reorder Threshold</div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input value={threshold} onChange={e => setThreshold(e.target.value)} onBlur={saveThreshold} style={{ width: 56, padding: "0.3rem 0.4rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: "0.9rem", fontWeight: 700 }} />
          </div>
        </div>
      </div>

      {/* Lot Ledger */}
      <Section title="Lot Ledger (FIFO)">
        <Table head={["Lot ID", "Received", "Units In", "Remaining", "Cost/Unit", "Lot Value", "Status"]}>
          {lots.length === 0 ? <Empty cols={7} text="No lots received yet" /> : lots.map(l => {
            const st = lotStatus(l)
            return (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>{l.lot_identifier ?? l.id.slice(0, 8)}</td>
                <td style={td}>{l.received_at ? new Date(l.received_at).toLocaleDateString() : "—"}</td>
                <td style={td}>{Number(l.qty_received)}</td>
                <td style={td}>{Number(l.qty_remaining)}</td>
                <td style={td}>{money(l.unit_cost)}</td>
                <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{money(Number(l.qty_remaining) * Number(l.unit_cost))}</td>
                <td style={td}><span style={{ color: st.c, fontWeight: 700, fontSize: "0.72rem" }}>{st.t}</span></td>
              </tr>
            )
          })}
        </Table>
      </Section>

      {/* Usage History */}
      <Section title="Usage History (FIFO Deductions)">
        <Table head={["Date", "Client", "Ops Card", "Lot", "Qty", "COGS", "Type"]}>
          {usage.length === 0 ? <Empty cols={7} text="No deductions yet" /> : usage.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td style={td}>{u.client_name ?? (u.client_id ? u.client_id.slice(0, 8) : "—")}</td>
              <td style={td}>{u.ops_card_id ? <Link href={`/admin/ops-queue/${u.ops_card_id}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{u.ops_card_id.slice(0, 8)}</Link> : "—"}</td>
              <td style={td}>{u.lot_identifier ?? "—"}</td>
              <td style={td}>{Number(u.qty_deducted)}</td>
              <td style={{ ...td, color: "var(--gold)" }}>{money(Number(u.qty_deducted) * Number(u.unit_cost ?? 0))}</td>
              <td style={td}><span style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{u.transaction_type}</span></td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* Reorder History */}
      <Section title="Reorder History">
        <Table head={["Date", "Lot ID", "Units Received", "Cost/Unit", "Supplier", "Received By"]}>
          {lots.length === 0 ? <Empty cols={6} text="No receipts yet" /> : [...lots].reverse().map(l => (
            <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={td}>{l.received_at ? new Date(l.received_at).toLocaleDateString() : "—"}</td>
              <td style={td}>{l.lot_identifier ?? l.id.slice(0, 8)}</td>
              <td style={td}>{Number(l.qty_received)}</td>
              <td style={td}>{money(l.unit_cost)}</td>
              <td style={td}>{l.supplier ?? "—"}</td>
              <td style={td}>{l.received_by ?? "—"}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <style>{`@media (max-width:767px){ .inv-stats{ grid-template-columns:1fr 1fr !important; } }`}</style>
    </div>
  )
}

const td: React.CSSProperties = { padding: "0.55rem 0.75rem", fontSize: "0.82rem" }
function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div className="card"><div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.3rem" }}>{label}</div><div style={{ fontSize: "1.4rem", fontWeight: 900, fontFamily: "var(--font-display)", color: color ?? "var(--text)" }}>{value}</div></div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.25rem" }}><div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" }}><h2 style={{ fontWeight: 700, fontSize: "0.92rem" }}>{title}</h2></div><div className="admin-table-wrap" style={{ overflowX: "auto" }}>{children}</div></div>
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{head.map(h => <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text-mute)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table>
}
function Empty({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-mute)", fontSize: "0.84rem" }}>{text}</td></tr>
}
