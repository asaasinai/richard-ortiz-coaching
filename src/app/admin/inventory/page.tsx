"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, AlertTriangle, Plus, X, ChevronDown, ChevronUp } from "lucide-react"

interface Batch {
  id: string; qty_received: string; qty_remaining: string; unit_cost: string
  supplier: string | null; ordered_at: string | null; received_at: string | null; notes: string | null
}

interface SKU {
  id: string; peptide_name: string; strength: string; strength_unit: string
  units_in_stock: string; reorder_qty: string; reorder_point: number
  wholesale_cost: number | null
  fifo_cost: number | null; fifo_supplier: string | null
  weekly_burn: number; active_clients: number
  weeks_of_stock: number | null; stock_status: "ok" | "warning" | "critical" | "unknown"
  batches: Batch[]
}

const STATUS = {
  ok:       { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  color: "#4ade80", label: "In Stock" },
  warning:  { bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)",  color: "#fbbf24", label: "Order Soon" },
  critical: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)",color: "#f87171", label: "Order Now" },
  unknown:  { bg: "rgba(255,255,255,0.04)", border: "var(--border)",          color: "var(--text-mute)", label: "No Data" },
}

// Vial sizes are sourced from the live catalog per peptide (Elixsir sells
// different sizes per compound — e.g. NAD+ 500mg, GHK-Cu 50mg, IGF-LR3 1mg).
const sizesOf = (group: Record<number, SKU>) =>
  Object.keys(group).map(Number).sort((a, b) => a - b)

export default function InventoryPage() {
  const [skus, setSkus] = useState<SKU[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null) // peptide name
  const [expandedSku, setExpandedSku] = useState<string | null>(null) // sku id for batch history
  const [stockFilter, setStockFilter] = useState<"all"|"in_stock"|"order_soon"|"out_of_stock">("all")
  const [search, setSearch] = useState("")
  const [showAddBatch, setShowAddBatch] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newBatch, setNewBatch] = useState({ qty_received: "", unit_cost: "", supplier: "Elixsir", ordered_at: "", received_at: "", notes: "", lot_identifier: "" })

  // Bulk receive modal
  const [showBulkReceive, setShowBulkReceive] = useState(false)
  const [bulkEntries, setBulkEntries] = useState<{ skuId: string; qty: string; cost: string }[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/inventory").then(r => r.json()).then(d => { setSkus(d.skus ?? []); setLoading(false) })
  }
  useEffect(load, [])

  const addBatch = async (skuId: string) => {
    if (!newBatch.qty_received || !newBatch.unit_cost) return
    setSaving(true)
    await fetch("/api/admin/inventory/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_id: skuId, ...newBatch }) })
    setSaving(false)
    setShowAddBatch(null)
    setNewBatch({ qty_received: "", unit_cost: "", supplier: "Elixsir", ordered_at: "", received_at: "", notes: "", lot_identifier: "" })
    load()
  }

  const saveBulk = async () => {
    // Cost defaults to the SKU's wholesale price when left blank, so a coach
    // can receive a shipment by entering quantities only.
    const costFor = (skuId: string) => {
      const w = skus.find(s => s.id === skuId)?.wholesale_cost
      return w != null ? String(w) : ""
    }
    const toSave = bulkEntries
      .filter(e => e.qty)
      .map(e => ({ ...e, cost: e.cost || costFor(e.skuId) }))
      .filter(e => e.cost)
    if (!toSave.length) return
    setBulkSaving(true)
    await Promise.all(toSave.map(e =>
      fetch("/api/admin/inventory/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_id: e.skuId, qty_received: e.qty, unit_cost: e.cost, supplier: "Elixsir", received_at: new Date().toISOString().slice(0,10) }) })
    ))
    setBulkSaving(false)
    setShowBulkReceive(false)
    setBulkEntries([])
    load()
  }

  // Group SKUs by peptide name
  const skuByPeptide: Record<string, Record<number, SKU>> = {}
  for (const sku of skus) {
    if (!skuByPeptide[sku.peptide_name]) skuByPeptide[sku.peptide_name] = {}
    skuByPeptide[sku.peptide_name][Number(sku.strength)] = sku
  }

  // Peptide list comes from the actual catalog, not a static name list
  const peptideNames = Object.keys(skuByPeptide).sort((a, b) => a.localeCompare(b)).filter(name => {
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
    const skusInGroup = Object.values(skuByPeptide[name])
    if (stockFilter === "in_stock") return skusInGroup.some(s => Number(s.units_in_stock) > 0)
    if (stockFilter === "order_soon") return skusInGroup.some(s => s.stock_status === "warning" || s.stock_status === "critical")
    if (stockFilter === "out_of_stock") return skusInGroup.some(s => Number(s.units_in_stock) === 0)
    return true
  })

  const totalSkus = skus.length
  const criticalCount = skus.filter(s => s.stock_status === "critical").length
  const warningCount = skus.filter(s => s.stock_status === "warning").length

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"clamp(1.25rem,4vw,1.75rem)", letterSpacing:"-0.02em", marginBottom:"0.2rem" }}>Inventory</h1>
          <p style={{ color:"var(--text-mute)", fontSize:"0.875rem" }}>
            {loading ? "Loading…" : `${totalSkus} SKUs · ${criticalCount} critical · ${warningCount} need ordering`}
          </p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button onClick={() => {
            const entries = Object.values(skuByPeptide).flatMap(group =>
              Object.values(group).map(sku => ({ skuId: sku.id, qty: "", cost: "" }))
            )
            setBulkEntries(entries.slice(0, 40))
            setShowBulkReceive(true)
          }} className="btn-outline" style={{ fontSize:"0.875rem" }}>
            📦 Receive Elixsir Order
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="Search peptide…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:160, maxWidth:280 }}/>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
          {([["all","All"],["in_stock","In Stock"],["order_soon","Order Soon"],["out_of_stock","Out of Stock"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setStockFilter(val)} style={{
              padding:"0.35rem 0.75rem", borderRadius:"var(--radius)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer",
              background: stockFilter === val ? "var(--gold)" : "var(--surface-2)",
              color: stockFilter === val ? "#000" : "var(--text-mute)",
              border:`1px solid ${stockFilter === val ? "var(--gold)" : "var(--border)"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Bulk receive modal */}
      {showBulkReceive && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:400, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem 1rem", overflowY:"auto" }}>
          <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.5rem", width:"100%", maxWidth:660 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <h2 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem" }}>📦 Receive Elixsir Order</h2>
              <button onClick={() => setShowBulkReceive(false)} style={{ background:"none", border:"none", color:"var(--text-mute)", cursor:"pointer" }}><X size={18}/></button>
            </div>
            <p style={{ color:"var(--text-mute)", fontSize:"0.82rem", marginBottom:"1rem" }}>Enter quantity and cost for each SKU received. Leave blank to skip.</p>
            <div style={{ maxHeight:420, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {peptideNames.map(name => {
                const group = skuByPeptide[name]
                if (!group) return null
                return (
                  <div key={name} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.75rem" }}>
                    <p style={{ fontWeight:700, fontSize:"0.85rem", marginBottom:"0.5rem" }}>{name}</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.4rem" }}>
                      {sizesOf(group).map(mg => {
                        const sku = group[mg]
                        const entry = bulkEntries.find(e => e.skuId === sku.id)
                        return (
                          <div key={mg} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"0.72rem", color:"var(--text-mute)", marginBottom:"0.2rem" }}>{mg}mg</div>
                            <input
                              type="number"
                              placeholder="Qty"
                              value={entry?.qty ?? ""}
                              onChange={e => setBulkEntries(prev => prev.map(en => en.skuId === sku.id ? { ...en, qty: e.target.value } : en).concat(!prev.find(en => en.skuId === sku.id) ? [{ skuId: sku.id, qty: e.target.value, cost: "" }] : []))}
                              style={{ fontSize:"0.75rem", padding:"0.3rem", textAlign:"center" }}
                            />
                            <input
                              type="number"
                              placeholder={sku.wholesale_cost != null ? `$${Number(sku.wholesale_cost).toFixed(2)}` : "$"}
                              value={entry?.cost ?? ""}
                              onChange={e => setBulkEntries(prev => prev.map(en => en.skuId === sku.id ? { ...en, cost: e.target.value } : en).concat(!prev.find(en => en.skuId === sku.id) ? [{ skuId: sku.id, qty: "", cost: e.target.value }] : []))}
                              style={{ fontSize:"0.75rem", padding:"0.3rem", textAlign:"center", marginTop:"0.2rem" }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:"flex", gap:"0.5rem", marginTop:"1.25rem" }}>
              <button onClick={saveBulk} disabled={bulkSaving} className="btn-gold">{bulkSaving ? "Saving…" : "Save Order"}</button>
              <button onClick={() => setShowBulkReceive(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ color:"var(--text-mute)", padding:"2rem", textAlign:"center" }}>Loading…</div>}

      {!loading && peptideNames.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <Package size={36} style={{ color:"var(--gold)", margin:"0 auto 1rem" }}/>
          <p style={{ color:"var(--text-mute)" }}>No SKUs match your filter.</p>
        </div>
      )}

      {/* Grouped peptide accordion */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {peptideNames.map(name => {
          const group = skuByPeptide[name] ?? {}
          const isOpen = expanded === name
          // Overall group status
          const groupSizes = sizesOf(group)
          const allStatuses = groupSizes.map(mg => group[mg]?.stock_status).filter(Boolean)
          const hasCritical = allStatuses.includes("critical")
          const hasWarning = allStatuses.includes("warning")
          const groupBorderColor = hasCritical ? "rgba(248,113,113,0.35)" : hasWarning ? "rgba(251,191,36,0.3)" : "var(--border)"

          return (
            <div key={name} style={{ border:`1px solid ${groupBorderColor}`, borderRadius:"var(--radius)", overflow:"hidden" }}>
              {/* Accordion header */}
              <button
                onClick={() => setExpanded(isOpen ? null : name)}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.875rem 1.25rem", background:"var(--surface)", border:"none", cursor:"pointer", gap:"0.75rem" }}>
                <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:700, fontSize:"0.95rem", textAlign:"left" }}>{name}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  {/* Quick size tiles in header */}
                  <div style={{ display:"flex", gap:"0.3rem" }}>
                    {groupSizes.map(mg => {
                      const sku = group[mg]
                      const st = STATUS[sku.stock_status]
                      return (
                        <span key={mg} style={{ padding:"0.15rem 0.4rem", borderRadius:3, fontSize:"0.68rem", fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                          {mg}{sku.strength_unit} · {sku.units_in_stock}
                        </span>
                      )
                    })}
                  </div>
                  {isOpen ? <ChevronUp size={14} style={{ color:"var(--text-mute)", flexShrink:0 }}/> : <ChevronDown size={14} style={{ color:"var(--text-mute)", flexShrink:0 }}/>}
                </div>
              </button>

              {/* Expanded size details */}
              {isOpen && (
                <div style={{ borderTop:"1px solid var(--border)", padding:"1rem 1.25rem" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    {groupSizes.map(mg => {
                      const sku = group[mg]
                      const st = STATUS[sku.stock_status]
                      const isBatchOpen = expandedSku === sku.id
                      return (
                        <div key={mg} style={{ border:`1px solid ${st.border}`, borderRadius:"var(--radius)", overflow:"hidden" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.75rem 1rem", background:st.bg, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:700, fontSize:"0.875rem", width:50 }}>{mg}{sku.strength_unit}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", flex:1 }}>
                              <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", color:st.color }}>{sku.units_in_stock}</span>
                              <span style={{ fontSize:"0.72rem", color:"var(--text-mute)" }}>in stock</span>
                              <span style={{ padding:"0.1rem 0.4rem", borderRadius:3, fontSize:"0.65rem", fontWeight:700, background:st.color, color:"#000" }}>{st.label}</span>
                            </div>
                            {sku.wholesale_cost !== null && <span style={{ color:"var(--text-mute)", fontSize:"0.78rem" }}>COGS ${Number(sku.wholesale_cost).toFixed(2)}</span>}
                            {sku.fifo_cost !== null && <span style={{ color:"var(--gold)", fontWeight:700, fontSize:"0.82rem" }}>${Number(sku.fifo_cost).toFixed(2)}/vial</span>}
                            {sku.active_clients > 0 && (
                              <span style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>{sku.active_clients} client{sku.active_clients !== 1 ? "s" : ""}</span>
                            )}
                            <div style={{ display:"flex", gap:"0.4rem", marginLeft:"auto" }}>
                              <button onClick={() => { setShowAddBatch(sku.id); setExpandedSku(sku.id) }} style={{ fontSize:"0.72rem", padding:"0.25rem 0.5rem", background:"none", border:"1px solid var(--border)", borderRadius:3, color:"var(--text-mute)", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.25rem" }}>
                                <Plus size={11}/> Receive
                              </button>
                              <button onClick={() => setExpandedSku(isBatchOpen ? null : sku.id)} style={{ fontSize:"0.72rem", padding:"0.25rem 0.5rem", background:"none", border:"1px solid var(--border)", borderRadius:3, color:"var(--text-mute)", cursor:"pointer" }}>
                                {isBatchOpen ? "Hide" : "Batches"}
                              </button>
                              <Link href={`/admin/inventory/${sku.id}`} style={{ fontSize:"0.72rem", padding:"0.25rem 0.5rem", border:"1px solid var(--gold)", borderRadius:3, color:"var(--gold)", cursor:"pointer", textDecoration:"none", fontWeight:600 }}>
                                Ledger →
                              </Link>
                            </div>
                          </div>

                          {/* Batch history */}
                          {isBatchOpen && (
                            <div style={{ padding:"0.875rem 1rem", borderTop:"1px solid var(--border)" }}>
                              {/* Add batch form */}
                              {showAddBatch === sku.id && (
                                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.875rem", marginBottom:"0.875rem" }}>
                                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))", gap:"0.5rem", marginBottom:"0.5rem" }}>
                                    <div><label style={{ fontSize:"0.72rem" }}>Qty *</label><input type="number" placeholder="10" value={newBatch.qty_received} onChange={e => setNewBatch(p => ({ ...p, qty_received: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
                                    <div><label style={{ fontSize:"0.72rem" }}>Unit Cost ($) *</label><input type="number" step="0.01" placeholder="45.00" value={newBatch.unit_cost} onChange={e => setNewBatch(p => ({ ...p, unit_cost: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
                                    <div><label style={{ fontSize:"0.72rem" }}>Supplier</label><input placeholder="Elixsir" value={newBatch.supplier} onChange={e => setNewBatch(p => ({ ...p, supplier: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
                                    <div><label style={{ fontSize:"0.72rem" }}>Received</label><input type="date" value={newBatch.received_at} onChange={e => setNewBatch(p => ({ ...p, received_at: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
                                    <div><label style={{ fontSize:"0.72rem" }}>Lot # <span style={{ color:"var(--text-mute)" }}>(auto)</span></label><input placeholder="auto-generate" value={newBatch.lot_identifier} onChange={e => setNewBatch(p => ({ ...p, lot_identifier: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
                                  </div>
                                  <div style={{ display:"flex", gap:"0.4rem" }}>
                                    <button onClick={() => addBatch(sku.id)} disabled={saving || !newBatch.qty_received || !newBatch.unit_cost} className="btn-gold" style={{ fontSize:"0.78rem", padding:"0.35rem 0.75rem" }}>{saving ? "Saving…" : "Add Batch"}</button>
                                    <button onClick={() => setShowAddBatch(null)} className="btn-outline" style={{ fontSize:"0.78rem", padding:"0.35rem 0.75rem" }}>Cancel</button>
                                  </div>
                                </div>
                              )}

                              {sku.batches.length === 0 ? (
                                <p style={{ color:"var(--text-mute)", fontSize:"0.82rem" }}>No batches yet.</p>
                              ) : (
                                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.78rem" }}>
                                  <thead>
                                    <tr style={{ borderBottom:"1px solid var(--border)" }}>
                                      {["Received","Qty In","Remaining","Unit Cost","Supplier"].map(h => (
                                        <th key={h} style={{ textAlign:"left", padding:"0.3rem 0.5rem", color:"var(--text-mute)", fontWeight:600, fontSize:"0.65rem", textTransform:"uppercase" }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sku.batches.map((b, i) => {
                                      const isActive = Number(b.qty_remaining) > 0
                                      return (
                                        <tr key={b.id} style={{ borderBottom:"1px solid var(--border)", opacity: isActive ? 1 : 0.4 }}>
                                          <td style={{ padding:"0.4rem 0.5rem" }}>{b.received_at ? new Date(b.received_at).toLocaleDateString() : "—"}{i===0&&isActive && <span style={{ marginLeft:"0.3rem", background:"var(--gold)", color:"#000", borderRadius:2, padding:"0.1rem 0.3rem", fontSize:"0.6rem", fontWeight:700 }}>FIFO</span>}</td>
                                          <td style={{ padding:"0.4rem 0.5rem" }}>{b.qty_received}</td>
                                          <td style={{ padding:"0.4rem 0.5rem", fontWeight: isActive ? 700 : 400 }}>{b.qty_remaining}</td>
                                          <td style={{ padding:"0.4rem 0.5rem", color:"var(--gold)", fontWeight:700 }}>${Number(b.unit_cost).toFixed(2)}</td>
                                          <td style={{ padding:"0.4rem 0.5rem", color:"var(--text-mute)" }}>{b.supplier ?? "—"}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
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
