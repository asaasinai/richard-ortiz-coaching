"use client"
import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List as ListIcon, Plus, Package, X } from "lucide-react"

interface LineItem { sku_id: string; peptide: string; strength?: string; strength_unit?: string; dosage?: string; qty: number; cost_per_unit?: number; line_total?: number; lot_ids?: string[] }
interface OpsCard {
  id: string; client_name: string | null; client_email: string | null; status: string
  line_items: LineItem[]; total_cogs: string; due_date: string | null; tracking_number: string | null
}
interface Sku { id: string; peptide_name: string; strength: string; strength_unit: string; units_in_stock: string; stock_status?: string }

const COLUMNS = [
  { id: "pending",   label: "Pending",   color: "#f59e0b" },
  { id: "packed",    label: "Packed",    color: "#3b82f6" },
  { id: "shipped",   label: "Shipped",   color: "#22c55e" },
  { id: "delivered", label: "Delivered", color: "var(--text-mute)" },
]
const FILTERS = ["All", "Pending", "Packed", "Shipped", "Overdue"]

function initials(name?: string | null, email?: string | null) {
  if (name) { const p = name.trim().split(/\s+/); return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() }
  return (email?.[0] ?? "?").toUpperCase()
}

function OpsQueueInner() {
  const [cards, setCards] = useState<OpsCard[]>([])
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [filter, setFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()
  const sp = useSearchParams()

  const load = useCallback(() => {
    setLoading(true)
    const f = filter.toLowerCase()
    const q = f === "all" ? "" : `?status=${f}`
    fetch(`/api/admin/ops-cards${q}`).then(r => r.json()).then(d => { setCards(d.cards ?? []); setLoading(false) })
  }, [filter])

  useEffect(() => { const f = sp.get("filter"); if (f) setFilter(f.charAt(0).toUpperCase() + f.slice(1)) }, [sp])
  useEffect(() => { load() }, [load])

  const byStatus = (s: string) => cards.filter(c => c.status === s)
  const money = (v: string | number | undefined) => `$${Number(v ?? 0).toFixed(2)}`

  const Card = ({ c }: { c: OpsCard }) => {
    const overdue = c.due_date && new Date(c.due_date) < new Date() && ["pending", "packed"].includes(c.status)
    return (
      <Link href={`/admin/ops-queue/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="card" style={{ padding: "0.8rem", cursor: "pointer", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-2)", color: "var(--gold)", fontWeight: 700, fontSize: "0.66rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(c.client_name, c.client_email)}</div>
            <span style={{ fontWeight: 600, fontSize: "0.84rem" }}>{c.client_name ?? c.client_email ?? "—"}</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-soft)", marginBottom: "0.4rem" }}>
            {(c.line_items ?? []).map(li => `${li.peptide}${li.strength ? ` ${li.strength}${li.strength_unit ?? ""}` : ""} ×${li.qty}`).join(", ") || "—"}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
            <span style={{ color: overdue ? "#ef4444" : "var(--text-mute)", fontWeight: overdue ? 700 : 400 }}>{c.due_date ? (overdue ? "⚠ " : "") + new Date(c.due_date).toLocaleDateString() : "no date"}</span>
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>{money(c.total_cogs)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,4vw,1.5rem)" }}>Ops Queue</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <button onClick={() => setView("kanban")} style={{ padding: "0.4rem 0.6rem", background: view === "kanban" ? "var(--gold)" : "var(--surface)", color: view === "kanban" ? "#000" : "var(--text-mute)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><LayoutGrid size={15} /></button>
            <button onClick={() => setView("list")} style={{ padding: "0.4rem 0.6rem", background: view === "list" ? "var(--gold)" : "var(--surface)", color: view === "list" ? "#000" : "var(--text-mute)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><ListIcon size={15} /></button>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ padding: "0.45rem 0.9rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}><Plus size={15} /> New Card</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.35rem 0.85rem", borderRadius: "var(--radius)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: filter === f ? "var(--gold)" : "var(--surface)", color: filter === f ? "#000" : "var(--text-mute)", border: `1px solid ${filter === f ? "var(--gold)" : "var(--border)"}` }}>{f}</button>
        ))}
      </div>

      {loading ? <p style={{ color: "var(--text-mute)" }}>Loading…</p> : cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-mute)" }}>
          <Package size={32} style={{ opacity: 0.4, marginBottom: "0.75rem" }} />
          <p style={{ fontWeight: 700, color: "var(--text)" }}>No fulfillment cards</p>
          <p style={{ fontSize: "0.85rem" }}>Create one with “New Card”, or assign a protocol to auto-generate.</p>
        </div>
      ) : view === "kanban" ? (
        <div className="ops-kanban" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
          {COLUMNS.map(col => {
            const list = byStatus(col.id)
            return (
              <div key={col.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.7rem", minHeight: 120 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", color: col.color, display: "flex", alignItems: "center", gap: "0.4rem" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />{col.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{list.length}</span>
                </div>
                {list.map(c => <Card key={c.id} c={c} />)}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {cards.map(c => {
            const overdue = c.due_date && new Date(c.due_date) < new Date() && ["pending", "packed"].includes(c.status)
            return (
              <Link key={c.id} href={`/admin/ops-queue/${c.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.8rem 1rem", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0, flex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-2)", color: "var(--gold)", fontWeight: 700, fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(c.client_name, c.client_email)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.client_name ?? c.client_email ?? "—"}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(c.line_items ?? []).map(li => `${li.peptide} ×${li.qty}`).join(", ")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                  <span style={{ color: overdue ? "#ef4444" : "var(--text-mute)", fontSize: "0.74rem" }}>{c.due_date ? new Date(c.due_date).toLocaleDateString() : "—"}</span>
                  <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.8rem" }}>{money(c.total_cogs)}</span>
                  <span style={{ fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase", color: COLUMNS.find(x => x.id === c.status)?.color ?? "var(--text-mute)" }}>{c.status}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); router.push(`/admin/ops-queue/${id}`) }} />}

      <style>{`@media (max-width: 900px){ .ops-kanban{ grid-template-columns: 1fr 1fr !important; } } @media (max-width:600px){ .ops-kanban{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([])
  const [skus, setSkus] = useState<Sku[]>([])
  const [clientId, setClientId] = useState("")
  const [items, setItems] = useState<LineItem[]>([])
  const [skuId, setSkuId] = useState("")
  const [qty, setQty] = useState(1)
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/intakes?status=APPROVED").then(r => r.json()).then(d => setClients(d.intakes ?? d.rows ?? []))
    fetch("/api/admin/inventory").then(r => r.json()).then(d => setSkus(d.skus ?? []))
  }, [])

  const addItem = () => {
    const s = skus.find(x => String(x.id) === skuId)
    if (!s) return
    setItems(prev => [...prev, { sku_id: String(s.id), peptide: s.peptide_name, strength: s.strength, strength_unit: s.strength_unit, qty: Number(qty) || 1 }])
    setSkuId(""); setQty(1)
  }

  const create = () => {
    const client = clients.find(c => c.id === clientId)
    setSaving(true)
    fetch("/api/admin/ops-cards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId || null, client_email: client?.email ?? null, client_name: client ? `${client.first_name} ${client.last_name}` : null, line_items: items, due_date: dueDate || null }),
    }).then(r => r.json()).then(d => { setSaving(false); if (d.ok) onCreated(d.id) })
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>New Fulfillment Card</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <label style={lbl}>Client</label>
        <select value={clientId} onChange={e => setClientId(e.target.value)} style={inp}>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.email}</option>)}
        </select>

        <label style={lbl}>Line items</label>
        {items.map((li, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "var(--surface-2)", borderRadius: "var(--radius)", marginBottom: "0.35rem", fontSize: "0.8rem" }}>
            <span>{li.peptide} {li.strength}{li.strength_unit} ×{li.qty}</span>
            <button onClick={() => setItems(items.filter((_, x) => x !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><X size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <select value={skuId} onChange={e => setSkuId(e.target.value)} style={{ ...inp, marginBottom: 0, flex: 1 }}>
            <option value="">Add SKU…</option>
            {skus.map(s => <option key={s.id} value={s.id}>{s.peptide_name} {s.strength}{s.strength_unit} (stock {s.units_in_stock})</option>)}
          </select>
          <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} style={{ ...inp, marginBottom: 0, width: 64 }} />
          <button onClick={addItem} style={{ padding: "0 0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>Add</button>
        </div>

        <label style={lbl}>Due date</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />

        <button onClick={create} disabled={saving || !clientId || items.length === 0} style={{ width: "100%", padding: "0.7rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "var(--radius)", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: (saving || !clientId || items.length === 0) ? 0.5 : 1, marginTop: "0.5rem" }}>
          {saving ? "Creating…" : "Create Card"}
        </button>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: "0.74rem", color: "var(--text-mute)", display: "block", marginBottom: "0.3rem", marginTop: "0.6rem", fontWeight: 600 }
const inp: React.CSSProperties = { width: "100%", padding: "0.55rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.85rem", marginBottom: "0.4rem" }

export default function OpsQueuePage() {
  return <Suspense fallback={<p style={{ color: "var(--text-mute)" }}>Loading…</p>}><OpsQueueInner /></Suspense>
}
