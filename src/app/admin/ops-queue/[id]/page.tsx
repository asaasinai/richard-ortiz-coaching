"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Truck, X, Check } from "lucide-react"

interface LineItem { sku_id: string; peptide: string; strength?: string; strength_unit?: string; qty: number; cost_per_unit?: number; line_total?: number; lot_ids?: string[] }
interface Allocation { lot_id: string; lot_identifier: string | null; qty: number; unit_cost: number; line_cost: number }
interface FifoPreview { sku_id: string; requested: number; available: number; sufficient: boolean; allocations: Allocation[]; total_cost: number }
interface Card {
  id: string; client_id: string | null; client_name: string | null; client_email: string | null
  status: string; line_items: LineItem[]; total_cogs: string; tracking_number: string | null
  notes: string | null; due_date: string | null; shipped_at: string | null; delivered_at: string | null
}

const STEPS = ["pending", "packed", "shipped", "delivered"]
const STEP_COLOR: Record<string, string> = { pending: "#f59e0b", packed: "#3b82f6", shipped: "#22c55e", delivered: "var(--text-mute)" }
const NEXT_LABEL: Record<string, string> = { pending: "Mark Packed (deduct FIFO)", packed: "Mark Shipped", shipped: "Mark Delivered" }

export default function OpsCardDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [card, setCard] = useState<Card | null>(null)
  const [previews, setPreviews] = useState<Record<string, FifoPreview>>({})
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState("")
  const [notes, setNotes] = useState("")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/admin/ops-cards/${id}`).then(r => r.json()).then(d => {
      if (d.ok) { setCard(d.card); setPreviews(d.previews ?? {}); setTracking(d.card.tracking_number ?? ""); setNotes(d.card.notes ?? "") }
      setLoading(false)
    })
  }, [id])
  useEffect(() => { load() }, [load])

  const advance = () => {
    if (!card) return
    setBusy(true); setErr("")
    fetch(`/api/admin/ops-cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "advance", tracking_number: tracking || null }) })
      .then(r => r.json()).then(d => { setBusy(false); if (!d.ok) setErr(d.error || "Failed"); else { if (d.warnings?.length) setErr("Packed with low stock: " + d.warnings.join("; ")); load() } })
  }
  const setStatus = (status: string) => {
    setBusy(true); setErr("")
    fetch(`/api/admin/ops-cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_status", status, tracking_number: tracking || null }) })
      .then(r => r.json()).then(d => { setBusy(false); if (!d.ok) setErr(d.error || "Failed"); else { if (d.warnings?.length) setErr("Packed with low stock: " + d.warnings.join("; ")); load() } })
  }
  const cancel = () => { setBusy(true); fetch(`/api/admin/ops-cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) }).then(() => load()).finally(() => setBusy(false)) }
  const saveMeta = () => { fetch(`/api/admin/ops-cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", tracking_number: tracking, notes }) }) }

  if (loading) return <p style={{ color: "var(--text-mute)" }}>Loading…</p>
  if (!card) return <p style={{ color: "var(--text-mute)" }}>Card not found. <Link href="/admin/ops-queue" style={{ color: "var(--gold)" }}>← Back</Link></p>

  const curIdx = STEPS.indexOf(card.status)
  const canAdvance = card.status !== "delivered" && card.status !== "cancelled"
  const money = (v: number | string | undefined) => `$${Number(v ?? 0).toFixed(2)}`

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/ops-queue" style={{ color: "var(--text-mute)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1rem" }}><ArrowLeft size={14} /> Ops Queue</Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.25rem" }}>{card.client_name ?? card.client_email ?? "Fulfillment"}</h1>
            {card.client_id && <Link href={`/admin/clients/${card.client_id}`} style={{ color: "var(--gold)", fontSize: "0.8rem", textDecoration: "none" }}>View client profile →</Link>}
          </div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: STEP_COLOR[card.status] ?? "var(--text-mute)", border: `1px solid ${STEP_COLOR[card.status] ?? "var(--border)"}`, padding: "0.2rem 0.6rem", borderRadius: 6 }}>{card.status}</span>
        </div>

        {/* Stepper */}
        {card.status !== "cancelled" && (
          <div style={{ display: "flex", alignItems: "center", marginTop: "1.1rem" }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i <= curIdx ? STEP_COLOR[s] : "var(--surface-2)", color: i <= curIdx ? "#000" : "var(--text-mute)", fontSize: "0.7rem", fontWeight: 700 }}>{i < curIdx ? <Check size={13} /> : i + 1}</div>
                  <span style={{ fontSize: "0.66rem", color: i <= curIdx ? "var(--text)" : "var(--text-mute)", textTransform: "capitalize" }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < curIdx ? STEP_COLOR[STEPS[i + 1]] : "var(--border)", margin: "0 0.4rem", marginBottom: "1rem" }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Line items + FIFO */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.75rem" }}>Line Items {card.status === "pending" && <span style={{ fontWeight: 400, fontSize: "0.74rem", color: "var(--text-mute)" }}>· FIFO lots consumed on “Packed”</span>}</h2>
        {(card.line_items ?? []).map((li, i) => {
          const p = previews[li.sku_id]
          return (
            <div key={i} style={{ padding: "0.6rem 0", borderBottom: i < card.line_items.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{li.peptide} {li.strength}{li.strength_unit} <span style={{ color: "var(--text-mute)", fontWeight: 400 }}>×{li.qty}</span></span>
                <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.82rem" }}>{money(li.line_total)}</span>
              </div>
              {/* committed lots OR FIFO preview */}
              {card.status === "pending" && p ? (
                <div style={{ marginTop: "0.4rem", fontSize: "0.74rem" }}>
                  {!p.sufficient ? (
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠ Insufficient stock — need {p.requested}, have {p.available}</span>
                  ) : (
                    <span style={{ color: "var(--text-mute)" }}>Will consume: {p.allocations.map(a => `${a.lot_identifier ?? a.lot_id.slice(0, 8)} (${a.qty}@${money(a.unit_cost)})`).join(" → ")}</span>
                  )}
                </div>
              ) : (li.lot_ids?.length ? (
                <div style={{ marginTop: "0.4rem", fontSize: "0.74rem", color: "var(--text-mute)" }}>Lots: {li.lot_ids.map(l => l.slice(0, 8)).join(", ")}</div>
              ) : null)}
            </div>
          )
        })}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontWeight: 700 }}>
          <span>Total COGS</span><span style={{ color: "var(--gold)" }}>{money(card.total_cogs)}</span>
        </div>
      </div>

      {/* Tracking + notes */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        {(card.status === "shipped" || card.status === "packed" || card.status === "delivered") && (
          <>
            <label style={lbl}>Tracking number</label>
            <input value={tracking} onChange={e => setTracking(e.target.value)} onBlur={saveMeta} placeholder="1Z…" style={inp} />
          </>
        )}
        <label style={lbl}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveMeta} rows={2} style={{ ...inp, resize: "vertical" }} />
      </div>

      {err && <div style={{ background: "#2d1111", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "var(--radius)", padding: "0.6rem 0.85rem", marginBottom: "1rem", fontSize: "0.82rem", fontWeight: 600 }}>{err}</div>}

      {/* Manual status control — set any stage directly */}
      {card.status !== "cancelled" && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ ...lbl, marginTop: 0 }}>Set status</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {STEPS.map(s => {
              const active = card.status === s
              return (
                <button key={s} onClick={() => !active && setStatus(s)} disabled={busy || active}
                  style={{ flex: 1, minWidth: 90, padding: "0.6rem 0.5rem", borderRadius: "var(--radius)", fontWeight: 700, fontSize: "0.8rem", textTransform: "capitalize", cursor: active ? "default" : "pointer",
                    background: active ? (STEP_COLOR[s] ?? "var(--gold)") : "var(--surface)", color: active ? "#000" : "var(--text-soft)",
                    border: `1px solid ${active ? (STEP_COLOR[s] ?? "var(--gold)") : "var(--border)"}`, opacity: busy && !active ? 0.6 : 1 }}>
                  {s === "packed" && card.status === "pending" ? "Pack (FIFO)" : s}
                </button>
              )
            })}
          </div>
          {card.status === "pending" && <p style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginTop: "0.4rem" }}>Marking “Packed” deducts FIFO lots (best-effort; low stock warns but won’t block).</p>}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {card.status !== "delivered" && card.status !== "cancelled" && (
          <button onClick={() => setStatus("delivered")} disabled={busy} style={{ flex: 1, minWidth: 160, padding: "0.7rem", background: "#22c55e", color: "#000", border: "none", borderRadius: "var(--radius)", fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}><Check size={15} /> Mark Delivered</button>
        )}
        {card.client_email && (
          <button onClick={() => router.push(`/admin/sms?to=${encodeURIComponent(card.client_email!)}`)} style={{ padding: "0.7rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}><Truck size={15} /> Shipment SMS</button>
        )}
        {card.status !== "cancelled" && card.status !== "delivered" && (
          <button onClick={cancel} disabled={busy} style={{ padding: "0.7rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "#ef4444", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}><X size={15} /> Cancel</button>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: "0.74rem", color: "var(--text-mute)", display: "block", marginBottom: "0.3rem", marginTop: "0.5rem", fontWeight: 600 }
const inp: React.CSSProperties = { width: "100%", padding: "0.55rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: "0.85rem", marginBottom: "0.4rem" }
