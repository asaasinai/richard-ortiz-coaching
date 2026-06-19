import { query } from "@/lib/db"
import { Users, ClipboardList, Activity, AlertTriangle, Clock, ListChecks, Package, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import OverviewActivity from "@/components/admin/OverviewActivity"
// server component — stat cards + banners; live activity is a client child

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
async function safe<T = Row>(sql: string): Promise<T[]> {
  try { return (await query<T>(sql)).rows } catch { return [] }
}
const n = (rows: Row[], key = "n") => Number((rows[0]?.[key] as string) ?? 0)

async function getStats() {
  const [
    intakes, checkins, urgent, activeClients,
    intakeDelta, checkinDelta, opsPending, lowStock,
  ] = await Promise.all([
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE status='PENDING') pending FROM roc.intakes`),
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE read=false) unread FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.checkins WHERE urgent_flag=true AND COALESCE(resolved,false)=false`),
    safe(`SELECT COUNT(*) n FROM roc.intakes WHERE status='APPROVED'`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.intakes`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.ops_cards WHERE status='pending'`),
    safe(`SELECT COUNT(*) n FROM roc.inventory_skus WHERE units_in_stock <= COALESCE(reorder_point,0) OR units_in_stock = 0`),
  ])
  return {
    totalIntakes: n(intakes), pendingIntakes: n(intakes, "pending"),
    totalCheckins: n(checkins), unreadCheckins: n(checkins, "unread"),
    urgentFlags: n(urgent), activeClients: n(activeClients),
    opsPending: n(opsPending), lowStock: n(lowStock),
    intakeThis: n(intakeDelta, "this"), intakePrev: n(intakeDelta, "prev"),
    checkinThis: n(checkinDelta, "this"), checkinPrev: n(checkinDelta, "prev"),
  }
}

function Delta({ now, prev }: { now: number; prev: number }) {
  const d = now - prev
  if (d === 0) return <span style={{ color: "var(--text-mute)", fontSize: "0.72rem" }}>— vs last week</span>
  const up = d > 0
  return (
    <span style={{ color: up ? "#4ade80" : "#f87171", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 2 }}>
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(d)} from last week
    </span>
  )
}

export default async function AdminOverview() {
  const s = await getStats()
  const cards = [
    { icon: ClipboardList, label: "Total Intakes",  value: s.totalIntakes,   color: "var(--gold)", href: "/admin/intakes" },
    { icon: Clock,         label: "Pending Review", value: s.pendingIntakes, color: "#f59e0b",     href: "/admin/intakes?status=PENDING" },
    { icon: Activity,      label: "Check-Ins",      value: s.totalCheckins,  color: "#22c55e",     href: "/admin/checkins", delta: { now: s.checkinThis, prev: s.checkinPrev } },
    { icon: AlertTriangle, label: "Urgent Flags",   value: s.urgentFlags,    color: "#ef4444",     href: "/admin/checkins?filter=urgent" },
    { icon: Users,         label: "Active Clients", value: s.activeClients,  color: "#3b82f6",     href: "/admin/clients?status=APPROVED" },
    { icon: ListChecks,    label: "Ops Pending",    value: s.opsPending,     color: "#f59e0b",     href: "/admin/ops-queue?filter=pending" },
    { icon: Package,       label: "Low Stock",      value: s.lowStock,       color: "#ef4444",     href: "/admin/inventory?filter=order-soon" },
  ]

  const banners = [
    s.urgentFlags > 0 && { key: "u", bg: "#2d1111", border: "#ef4444", color: "#ef4444", icon: AlertTriangle, text: `${s.urgentFlags} urgent check-in${s.urgentFlags > 1 ? "s" : ""} need attention`, href: "/admin/checkins?filter=urgent" },
    s.pendingIntakes > 0 && { key: "p", bg: "#1a1500", border: "#a38412", color: "var(--gold)", icon: ClipboardList, text: `${s.pendingIntakes} intake${s.pendingIntakes > 1 ? "s" : ""} pending review`, href: "/admin/intakes?status=PENDING" },
    s.lowStock > 0 && { key: "l", bg: "#1a0f00", border: "#f59e0b", color: "#f59e0b", icon: Package, text: `${s.lowStock} SKU${s.lowStock > 1 ? "s" : ""} low on stock`, href: "/admin/inventory?filter=order-soon" },
  ].filter(Boolean) as { key: string; bg: string; border: string; color: string; icon: typeof Package; text: string; href: string }[]

  return (
    <div>
      <h1 style={{ fontFamily: "Inter Tight,sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,4vw,1.75rem)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Overview</h1>
      <p style={{ color: "var(--text-mute)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Richard Ortiz Coaching — Admin Dashboard</p>

      {/* Stat cards */}
      <div className="admin-stat-grid" style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {cards.map(c => (
          <Link key={c.label} href={c.href} className="stat-card-link" style={{ textDecoration: "none" }}>
            <div className="card stat-card" style={{ cursor: "pointer", position: "relative" }}>
              <c.icon size={18} style={{ color: c.color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Inter Tight,sans-serif", color: "var(--text)", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontWeight: 600, fontSize: "0.82rem", marginTop: "0.35rem" }}>{c.label}</div>
              <div style={{ marginTop: "0.2rem" }}>{c.delta ? <Delta now={c.delta.now} prev={c.delta.prev} /> : <span style={{ color: "var(--text-mute)", fontSize: "0.72rem" }}>&nbsp;</span>}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alert banners */}
      {banners.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
          {banners.map(b => (
            <Link key={b.key} href={b.href} style={{ textDecoration: "none" }}>
              <div style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: "var(--radius)", padding: "0.75rem 1.1rem", display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer" }}>
                <b.icon size={17} style={{ color: b.color, flexShrink: 0 }} />
                <span style={{ color: b.color, fontWeight: 700, fontSize: "0.875rem" }}>{b.text}</span>
                <span style={{ marginLeft: "auto", color: b.color, fontSize: "0.82rem" }}>Review →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Live activity: charts, urgent queue, dismissible recent check-ins/intakes */}
      <OverviewActivity />

      <style>{`
        .admin-stat-grid { grid-template-columns: repeat(7, 1fr); }
        .stat-card-link .stat-card { transition: transform .12s, border-color .12s; }
        .stat-card-link:hover .stat-card { transform: scale(1.02); border-color: var(--gold); }
        @media (max-width: 1100px) { .admin-stat-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 767px) { .admin-stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  )
}

