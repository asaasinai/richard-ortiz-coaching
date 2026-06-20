"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, Plus, X, ChevronDown, ChevronUp, DollarSign } from "lucide-react"
import PageHeader from "@/components/admin/PageHeader"
import { Ring } from "@/components/admin/Charts"

interface Batch {
  id: string; qty_received: string; qty_remaining: string; unit_cost: string
  supplier: string | null; ordered_at: string | null; received_at: string | null; notes: string | null
}

interface SKU {
  id: string; peptide_name: string; strength: string; strength_unit: string
  units_in_stock: string; reorder_qty: string; reorder_point: number
  wholesale_cost: number | null
  retail_price: number | null
  fifo_cost: number | null; fifo_supplier: string | null
  weekly_burn: number; active_clients: number
  weeks_of_stock: number | null; stock_status: "ok" | "warning" | "critical" | "unknown"
  batches: Batch[]
}

const STATUS = {
  ok:       { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  color: "#34D399", label: "In Stock" },
  warning:  { bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)",  color: "#FBBF24", label: "Order Soon" },
  critical: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)",color: "#F87171", label: "Order Now" },
  unknown:  { bg: "rgba(255,255,255,0.04)", border: "var(--border)",          color: "var(--text-mute)", label: "No Data" },
}

// Vial sizes are sourced from the live catalog per peptide (the manufacturer sells
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
  const [newBatch, setNewBatch] = useState({ qty_received: "", unit_cost: "", supplier: "Manufacturer", ordered_at: "", received_at: "", notes: "", lot_identifier: "" })

  // Bulk receive modal
  const [showBulkReceive, setShowBulkReceive] = useState(false)
  const [bulkEntries, setBulkEntries] = useState<{ skuId: string; qty: string; cost: string }[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)

  // Tabs + pricing editor
  const [tab, setTab] = useState<"stock" | "pricing">("stock")
  // Per-SKU draft prices, keyed by sku id: { retail, wholesale }
  const [priceEdits, setPriceEdits] = useState<Record<string, { retail: string; wholesale: string }>>({})
  const [markup, setMarkup] = useState("5")
  const [pricingSaving, setPricingSaving] = useState(false)
  const [pricingSaved, setPricingSaved] = useState(false)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/inventory").then(r => r.json()).then(d => {
      const list: SKU[] = d.skus ?? []
      setSkus(list)
      // Seed the pricing draft from the live values
      setPriceEdits(Object.fromEntries(list.map(s => [s.id, {
        retail: s.retail_price != null ? String(s.retail_price) : "",
        wholesale: s.wholesale_cost != null ? String(s.wholesale_cost) : "",
      }])))
      setLoading(false)
    })
  }
  useEffect(load, [])

  const setEdit = (id: string, field: "retail" | "wholesale", val: string) =>
    setPriceEdits(prev => ({ ...prev, [id]: { ...(prev[id] ?? { retail: "", wholesale: "" }), [field]: val } }))

  // Apply a cost × multiple to every SKU's retail draft (rounded to whole $)
  const applyMarkup = () => {
    const m = Number(markup)
    if (!m || m <= 0) return
    setPriceEdits(prev => {
      const next = { ...prev }
      for (const s of skus) {
        const cost = Number(next[s.id]?.wholesale || s.wholesale_cost || 0)
        if (cost > 0) next[s.id] = { ...next[s.id], retail: String(Math.round(cost * m)) }
      }
      return next
    })
  }

  // Only send rows whose retail or wholesale draft differs from the stored value
  const dirtyPricing = skus.filter(s => {
    const e = priceEdits[s.id]; if (!e) return false
    const r = s.retail_price != null ? String(s.retail_price) : ""
    const w = s.wholesale_cost != null ? String(s.wholesale_cost) : ""
    return e.retail !== r || e.wholesale !== w
  })

  const savePricing = async () => {
    if (!dirtyPricing.length) return
    setPricingSaving(true); setPricingSaved(false)
    const updates = dirtyPricing.map(s => ({
      id: s.id,
      retail_price: priceEdits[s.id].retail === "" ? null : Number(priceEdits[s.id].retail),
      wholesale_cost: priceEdits[s.id].wholesale === "" ? null : Number(priceEdits[s.id].wholesale),
    }))
    await fetch("/api/admin/inventory/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) })
    setPricingSaving(false); setPricingSaved(true)
    setTimeout(() => setPricingSaved(false), 2500)
    load()
  }

  const addBatch = async (skuId: string) => {
    if (!newBatch.qty_received || !newBatch.unit_cost) return
    setSaving(true)
    await fetch("/api/admin/inventory/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_id: skuId, ...newBatch }) })
    setSaving(false)
    setShowAddBatch(null)
    setNewBatch({ qty_received: "", unit_cost: "", supplier: "Manufacturer", ordered_at: "", received_at: "", notes: "", lot_identifier: "" })
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
      fetch("/api/admin/inventory/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_id: e.skuId, qty_received: e.qty, unit_cost: e.cost, supplier: "Manufacturer", received_at: new Date().toISOString().slice(0,10) }) })
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
      <PageHeader title="Inventory" subtitle="Your peptide stock and pricing. Track what's running low, receive orders, and set the price on every SKU." backHref="/admin" backLabel="Overview"
        action={tab === "stock" ? <button onClick={() => {
          const entries = Object.values(skuByPeptide).flatMap(group =>
            Object.values(group).map(sku => ({ skuId: sku.id, qty: "", cost: "" }))
          )
          setBulkEntries(entries.slice(0, 40))
          setShowBulkReceive(true)
        }} className="btn-gold" style={{ fontSize:"0.82rem", padding:"0.5rem 0.95rem" }}>
          <Package size={15} /> Receive order
        </button> : undefined} />

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", borderBottom:"1px solid var(--border)", paddingBottom:"0.1rem" }}>
        {([["stock","Stock",Package],["pricing","Pricing",DollarSign]] as const).map(([val,label,Icon]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1rem", background:"none", border:"none", cursor:"pointer",
            fontWeight:700, fontSize:"0.85rem", color: tab===val ? "var(--gold)" : "var(--text-mute)",
            borderBottom: `2px solid ${tab===val ? "var(--gold)" : "transparent"}`, marginBottom:"-1px",
          }}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {/* ===================== PRICING TAB ===================== */}
      {tab === "pricing" && (
        <PricingPanel
          skus={skus} loading={loading} priceEdits={priceEdits} setEdit={setEdit}
          markup={markup} setMarkup={setMarkup} applyMarkup={applyMarkup}
          dirtyCount={dirtyPricing.length} saving={pricingSaving} saved={pricingSaved} onSave={savePricing}
        />
      )}

      {/* ===================== STOCK TAB ===================== */}
      {tab === "stock" && <>

      {/* Stock summary strip */}
      {!loading && (
        <div className="inv-summary" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <div className="card" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem" }}>
            <Ring value={totalSkus - criticalCount - warningCount} max={totalSkus || 1} size={56} color="#34D399" label={`${totalSkus}`} />
            <div><div style={{ fontWeight:700, fontSize:"0.92rem" }}>Total SKUs</div><div style={{ color:"var(--text-mute)", fontSize:"0.8rem" }}>healthy stock</div></div>
          </div>
          <div className="card" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem" }}>
            <Ring value={warningCount} max={totalSkus || 1} size={56} color="#FBBF24" label={`${warningCount}`} />
            <div><div style={{ fontWeight:700, fontSize:"0.92rem" }}>Order soon</div><div style={{ color:"var(--text-mute)", fontSize:"0.8rem" }}>running low</div></div>
          </div>
          <div className="card" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem" }}>
            <Ring value={criticalCount} max={totalSkus || 1} size={56} color="#F87171" label={`${criticalCount}`} />
            <div><div style={{ fontWeight:700, fontSize:"0.92rem" }}>Order now</div><div style={{ color:"var(--text-mute)", fontSize:"0.8rem" }}>out / critical</div></div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="Search peptide…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:160, maxWidth:280 }}/>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
          {([["all","All"],["in_stock","In Stock"],["order_soon","Order Soon"],["out_of_stock","Out of Stock"]] as const).map(([val, label]) => (
            <button key={val} className="pill" data-active={stockFilter === val} onClick={() => setStockFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Bulk receive modal */}
      {showBulkReceive && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:400, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem 1rem", overflowY:"auto" }}>
          <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.5rem", width:"100%", maxWidth:660 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.1rem" }}>📦 Receive Order</h2>
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

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:52 }} />)}
        </div>
      )}

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
                <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"0.95rem", textAlign:"left" }}>{name}</span>
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
                              <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"1.1rem", color:st.color }}>{sku.units_in_stock}</span>
                              <span style={{ fontSize:"0.72rem", color:"var(--text-mute)" }}>in stock</span>
                              <span style={{ padding:"0.1rem 0.4rem", borderRadius:3, fontSize:"0.65rem", fontWeight:700, background:st.color, color:"#000" }}>{st.label}</span>
                            </div>
                            {sku.wholesale_cost !== null && <span style={{ color:"var(--text-mute)", fontSize:"0.78rem" }}>cost ${Number(sku.wholesale_cost).toFixed(2)}</span>}
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
                                    <div><label style={{ fontSize:"0.72rem" }}>Supplier</label><input placeholder="Manufacturer" value={newBatch.supplier} onChange={e => setNewBatch(p => ({ ...p, supplier: e.target.value }))} style={{ marginTop:"0.2rem" }}/></div>
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

      </>}

      <style>{`@media (max-width: 700px) { .inv-summary { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

// ── Pricing tab ──────────────────────────────────────────────────────────────
// Flat editable table of every SKU: wholesale cost (COGS) + retail price, with
// live unit margin. These retail prices feed the suggested monthly rate in the
// protocol builder and the planned-margin math on proposals/revenue.
function PricingPanel({
  skus, loading, priceEdits, setEdit, markup, setMarkup, applyMarkup, dirtyCount, saving, saved, onSave,
}: {
  skus: SKU[]; loading: boolean
  priceEdits: Record<string, { retail: string; wholesale: string }>
  setEdit: (id: string, field: "retail" | "wholesale", val: string) => void
  markup: string; setMarkup: (v: string) => void; applyMarkup: () => void
  dirtyCount: number; saving: boolean; saved: boolean; onSave: () => void
}) {
  const [search, setSearch] = useState("")
  const rows = skus
    .filter(s => !search || s.peptide_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.peptide_name.localeCompare(b.peptide_name) || Number(a.strength) - Number(b.strength))

  const priced = skus.filter(s => (priceEdits[s.id]?.retail ?? "") !== "").length

  return (
    <div>
      {/* Controls */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="Search peptide…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:160, maxWidth:260 }}/>
        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.3rem 0.6rem" }}>
          <span style={{ fontSize:"0.78rem", color:"var(--text-mute)" }}>Price all at</span>
          <input type="number" step="0.5" value={markup} onChange={e => setMarkup(e.target.value)} style={{ width:54, textAlign:"center", padding:"0.25rem" }}/>
          <span style={{ fontSize:"0.78rem", color:"var(--text-mute)" }}>× cost</span>
          <button onClick={applyMarkup} className="btn-outline" style={{ fontSize:"0.75rem", padding:"0.3rem 0.6rem" }}>Apply</button>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.75rem" }}>
          {saved && <span style={{ color:"#34D399", fontSize:"0.8rem", fontWeight:700 }}>✓ Saved</span>}
          <span style={{ fontSize:"0.78rem", color:"var(--text-mute)" }}>{priced}/{skus.length} priced</span>
          <button onClick={onSave} disabled={saving || dirtyCount === 0} className="btn-gold" style={{ fontSize:"0.82rem", padding:"0.5rem 0.95rem", opacity: dirtyCount===0 ? 0.5 : 1 }}>
            {saving ? "Saving…" : dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount!==1?"s":""}` : "Saved"}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          {[0,1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton" style={{ height:42 }} />)}
        </div>
      )}

      {!loading && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
                {["Peptide","Size","Wholesale cost","Retail price","Margin $","Margin %"].map((h,i) => (
                  <th key={h} style={{ textAlign: i<2 ? "left" : "right", padding:"0.6rem 0.85rem", color:"var(--text-mute)", fontWeight:600, fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const e = priceEdits[s.id] ?? { retail:"", wholesale:"" }
                const cost = Number(e.wholesale || 0)
                const retail = Number(e.retail || 0)
                const marginD = retail > 0 ? retail - cost : null
                const marginP = retail > 0 ? Math.round(((retail - cost) / retail) * 100) : null
                const mColor = marginP === null ? "var(--text-mute)" : marginP >= 70 ? "#34D399" : marginP >= 40 ? "#FBBF24" : "#F87171"
                return (
                  <tr key={s.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"0.45rem 0.85rem", fontWeight:600 }}>{s.peptide_name}</td>
                    <td style={{ padding:"0.45rem 0.85rem", color:"var(--text-mute)" }}>{s.strength}{s.strength_unit}</td>
                    <td style={{ padding:"0.35rem 0.85rem", textAlign:"right" }}>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:"0.15rem" }}>
                        <span style={{ color:"var(--text-mute)" }}>$</span>
                        <input type="number" step="0.01" value={e.wholesale} onChange={ev => setEdit(s.id, "wholesale", ev.target.value)} style={{ width:78, textAlign:"right", padding:"0.3rem 0.4rem" }}/>
                      </div>
                    </td>
                    <td style={{ padding:"0.35rem 0.85rem", textAlign:"right" }}>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:"0.15rem" }}>
                        <span style={{ color:"var(--gold)" }}>$</span>
                        <input type="number" step="1" placeholder="—" value={e.retail} onChange={ev => setEdit(s.id, "retail", ev.target.value)} style={{ width:78, textAlign:"right", padding:"0.3rem 0.4rem", borderColor: e.retail ? "var(--gold)" : undefined, color:"var(--gold)", fontWeight:700 }}/>
                      </div>
                    </td>
                    <td style={{ padding:"0.45rem 0.85rem", textAlign:"right", color: mColor, fontWeight:600 }}>{marginD !== null ? `$${marginD.toFixed(0)}` : "—"}</td>
                    <td style={{ padding:"0.45rem 0.85rem", textAlign:"right", color: mColor, fontWeight:700 }}>{marginP !== null ? `${marginP}%` : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p style={{ textAlign:"center", padding:"2rem", color:"var(--text-mute)" }}>No SKUs match.</p>}
        </div>
      )}

      <p style={{ fontSize:"0.76rem", color:"var(--text-mute)", marginTop:"0.85rem" }}>
        Retail price is the per-vial price the client pays. It powers the suggested monthly rate in the protocol builder (price × vials/month), so proposals and revenue margins stay consistent.
      </p>
    </div>
  )
}
