"use client"
import { useEffect, useState } from "react"
import { Package, AlertTriangle, Plus, X, ChevronDown, ChevronUp } from "lucide-react"

interface Batch {
  id: string; qty_received: string; qty_remaining: string; unit_cost: string
  supplier: string | null; ordered_at: string | null; received_at: string | null; notes: string | null
}

interface SKU {
  id: string; peptide_name: string; strength: string; strength_unit: string
  units_in_stock: string; reorder_qty: string; reorder_point: number
  fifo_cost: number | null; fifo_supplier: string | null
  weekly_burn: number; active_clients: number
  weeks_of_stock: number | null; stock_status: "ok" | "warning" | "critical" | "unknown"
  batches: Batch[]
}

const STATUS = {
  ok:       { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  color: "#4ade80", label: "In Stock" },
  warning:  { bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)",  color: "#fbbf24", label: "Order Soon" },
  critical: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)",color: "#f87171", label: "Order Now" },
  unknown:  { bg: "rgba(255,255,255,0.04)", border: "var(--border)",          color: "var(--text-mute)", label: "No Usage Data" },
}

export default function InventoryPage() {
  const [skus, setSkus] = useState<SKU[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAddSKU, setShowAddSKU] = useState(false)
  const [showAddBatch, setShowAddBatch] = useState<string | null>(null) // sku_id
  const [saving, setSaving] = useState(false)

  // New SKU form
  const [newSKU, setNewSKU] = useState({ peptide_name: "", strength: "", strength_unit: "mg", reorder_qty: "10", notes: "" })
  // New batch form
  const [newBatch, setNewBatch] = useState({ qty_received: "", unit_cost: "", supplier: "", ordered_at: "", received_at: "", notes: "" })

  const load = () => {
    setLoading(true)
    fetch("/api/admin/inventory").then(r => r.json()).then(d => { setSkus(d.skus ?? []); setLoading(false) })
  }
  useEffect(load, [])

  const addSKU = async () => {
    if (!newSKU.peptide_name || !newSKU.strength) return
    setSaving(true)
    await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSKU) })
    setSaving(false)
    setShowAddSKU(false)
    setNewSKU({ peptide_name: "", strength: "", strength_unit: "mg", reorder_qty: "10", notes: "" })
    load()
  }

  const addBatch = async (skuId: string) => {
    if (!newBatch.qty_received || !newBatch.unit_cost) return
    setSaving(true)
    await fetch("/api/admin/inventory/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_id: skuId, ...newBatch }) })
    setSaving(false)
    setShowAddBatch(null)
    setNewBatch({ qty_received: "", unit_cost: "", supplier: "", ordered_at: "", received_at: "", notes: "" })
    load()
  }

  const criticalCount = skus.filter(s => s.stock_status === "critical").length
  const warningCount = skus.filter(s => s.stock_status === "warning").length

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,4vw,1.75rem)", letterSpacing: "-0.02em", marginBottom: "0.2rem" }}>Inventory</h1>
          <p style={{ color: "var(--text-mute)", fontSize: "0.875rem" }}>
            {loading ? "Loading…" : `${skus.length} SKUs · ${criticalCount} critical · ${warningCount} need ordering`}
          </p>
        </div>
        <button onClick={() => setShowAddSKU(true)} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem" }}>
          <Plus size={15} /> Add SKU
        </button>
      </div>

      {/* Add SKU modal */}
      {showAddSKU && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.1rem" }}>New SKU</h2>
              <button onClick={() => setShowAddSKU(false)} style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><label>Peptide Name</label><input placeholder="BPC-157" value={newSKU.peptide_name} onChange={e => setNewSKU(p => ({ ...p, peptide_name: e.target.value }))} style={{ marginTop: "0.3rem" }}/></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div><label>Strength</label><input type="number" placeholder="5" value={newSKU.strength} onChange={e => setNewSKU(p => ({ ...p, strength: e.target.value }))} style={{ marginTop: "0.3rem" }}/></div>
                <div><label>Unit</label>
                  <select value={newSKU.strength_unit} onChange={e => setNewSKU(p => ({ ...p, strength_unit: e.target.value }))} style={{ marginTop: "0.3rem" }}>
                    {["mg","mcg","IU","mL"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div><label>Default Reorder Qty</label><input type="number" value={newSKU.reorder_qty} onChange={e => setNewSKU(p => ({ ...p, reorder_qty: e.target.value }))} style={{ marginTop: "0.3rem" }}/></div>
              <div><label>Notes</label><textarea rows={2} value={newSKU.notes} onChange={e => setNewSKU(p => ({ ...p, notes: e.target.value }))} style={{ marginTop: "0.3rem" }}/></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
              <button onClick={addSKU} disabled={saving || !newSKU.peptide_name || !newSKU.strength} className="btn-gold">{saving ? "Saving…" : "Add SKU"}</button>
              <button onClick={() => setShowAddSKU(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ color: "var(--text-mute)", padding: "2rem", textAlign: "center" }}>Loading…</div>}

      {!loading && skus.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Package size={36} style={{ color: "var(--gold)", margin: "0 auto 1rem" }}/>
          <p style={{ color: "var(--text-soft)" }}>No SKUs yet. Add your first peptide SKU to start tracking inventory.</p>
        </div>
      )}

      {/* SKU cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {skus.map(sku => {
          const st = STATUS[sku.stock_status]
          const isOpen = expanded === sku.id
          return (
            <div key={sku.id} style={{ border: `1px solid ${st.border}`, borderRadius: "var(--radius)", overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ background: st.bg, padding: "1rem 1.25rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1rem", color: "var(--text)" }}>
                      {sku.peptide_name}
                    </span>
                    <span style={{ color: st.color, fontWeight: 700, fontSize: "0.85rem", marginLeft: "0.4rem" }}>
                      {sku.strength}{sku.strength_unit}
                    </span>
                  </div>
                  <span style={{ background: st.color, color: "#000", padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 900 }}>
                    {st.label}
                  </span>
                </div>

                {/* Stock stats */}
                <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.3rem", color: st.color, lineHeight: 1 }}>{Number(sku.units_in_stock)}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>In Stock</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.3rem", color: "var(--text)", lineHeight: 1 }}>
                      {sku.weeks_of_stock !== null ? `${sku.weeks_of_stock.toFixed(1)}w` : "—"}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Runway</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.3rem", color: "var(--text)", lineHeight: 1 }}>
                      {sku.active_clients}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Clients</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "var(--gold)", lineHeight: 1 }}>
                      {sku.fifo_cost !== null ? `$${sku.fifo_cost}` : "—"}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>FIFO Cost</div>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : sku.id)}
                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-soft)", cursor: "pointer", padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                    {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {isOpen ? "Close" : "Detail"}
                  </button>
                </div>
              </div>

              {/* Reorder warning banner */}
              {(sku.stock_status === "warning" || sku.stock_status === "critical") && (
                <div style={{ background: st.bg, borderTop: `1px solid ${st.border}`, padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertTriangle size={14} style={{ color: st.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: "0.8rem", color: st.color, fontWeight: 600 }}>
                    {sku.stock_status === "critical"
                      ? `Order now — only ${sku.weeks_of_stock?.toFixed(1) ?? "< 1"} weeks of stock remaining. Reorder qty: ${sku.reorder_qty} units.`
                      : `Order this week — ${sku.weeks_of_stock?.toFixed(1)} weeks of stock. Target: reorder at 5 weeks. Reorder qty: ${sku.reorder_qty} units.`}
                  </span>
                </div>
              )}

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Batch History (FIFO)</h3>
                    <button onClick={() => setShowAddBatch(sku.id)} className="btn-gold" style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Plus size={13}/> Receive Batch
                    </button>
                  </div>

                  {/* Add batch inline form */}
                  {showAddBatch === sku.id && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div><label style={{ fontSize: "0.72rem" }}>Qty Received *</label><input type="number" placeholder="10" value={newBatch.qty_received} onChange={e => setNewBatch(p => ({ ...p, qty_received: e.target.value }))} style={{ marginTop: "0.2rem" }}/></div>
                        <div><label style={{ fontSize: "0.72rem" }}>Unit Cost ($) *</label><input type="number" step="0.01" placeholder="45.00" value={newBatch.unit_cost} onChange={e => setNewBatch(p => ({ ...p, unit_cost: e.target.value }))} style={{ marginTop: "0.2rem" }}/></div>
                        <div><label style={{ fontSize: "0.72rem" }}>Supplier</label><input placeholder="Supplier name" value={newBatch.supplier} onChange={e => setNewBatch(p => ({ ...p, supplier: e.target.value }))} style={{ marginTop: "0.2rem" }}/></div>
                        <div><label style={{ fontSize: "0.72rem" }}>Ordered</label><input type="date" value={newBatch.ordered_at} onChange={e => setNewBatch(p => ({ ...p, ordered_at: e.target.value }))} style={{ marginTop: "0.2rem" }}/></div>
                        <div><label style={{ fontSize: "0.72rem" }}>Received</label><input type="date" value={newBatch.received_at} onChange={e => setNewBatch(p => ({ ...p, received_at: e.target.value }))} style={{ marginTop: "0.2rem" }}/></div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => addBatch(sku.id)} disabled={saving || !newBatch.qty_received || !newBatch.unit_cost} className="btn-gold" style={{ fontSize: "0.8rem" }}>
                          {saving ? "Saving…" : "Add Batch"}
                        </button>
                        <button onClick={() => setShowAddBatch(null)} className="btn-outline" style={{ fontSize: "0.8rem" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Batch table */}
                  {sku.batches.length === 0 ? (
                    <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No batches received yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["Received", "Qty In", "Remaining", "Unit Cost", "Supplier", "Notes"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--text-mute)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sku.batches.map((b, i) => {
                            const isActive = Number(b.qty_remaining) > 0
                            const isFirst = i === 0 && isActive
                            return (
                              <tr key={b.id} style={{ borderBottom: "1px solid var(--border)", opacity: isActive ? 1 : 0.45 }}>
                                <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                                  {b.received_at ? new Date(b.received_at).toLocaleDateString() : "—"}
                                  {isFirst && <span style={{ marginLeft: "0.4rem", background: "var(--gold)", color: "#000", borderRadius: "3px", padding: "0.1rem 0.35rem", fontSize: "0.65rem", fontWeight: 700 }}>FIFO</span>}
                                </td>
                                <td style={{ padding: "0.5rem 0.6rem" }}>{b.qty_received}</td>
                                <td style={{ padding: "0.5rem 0.6rem", fontWeight: isActive ? 700 : 400, color: isActive ? "var(--text)" : "var(--text-mute)" }}>{b.qty_remaining}</td>
                                <td style={{ padding: "0.5rem 0.6rem", color: "var(--gold)", fontWeight: 700 }}>${Number(b.unit_cost).toFixed(2)}</td>
                                <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-mute)" }}>{b.supplier ?? "—"}</td>
                                <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-mute)" }}>{b.notes ?? "—"}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Stats footer */}
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-mute)" }}>
                    <span>Weekly burn: <strong style={{ color: "var(--text)" }}>{sku.weekly_burn.toFixed(2)} {sku.strength_unit}</strong></span>
                    <span>Reorder at: <strong style={{ color: "var(--text)" }}>{sku.reorder_point.toFixed(0)} units (~5 weeks)</strong></span>
                    <span>Reorder qty: <strong style={{ color: "var(--text)" }}>{sku.reorder_qty} units</strong></span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
