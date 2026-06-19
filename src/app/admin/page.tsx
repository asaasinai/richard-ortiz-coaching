import { query } from "@/lib/db"
import { Users, ClipboardList, Activity, AlertTriangle, Clock, ListChecks, Package, CheckCircle, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
// server component — no browser event handlers

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
    recentCheckins, recentIntakes, recentOps,
  ] = await Promise.all([
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE status='PENDING') pending FROM roc.intakes`),
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE read=false) unread FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.checkins WHERE urgent_flag=true AND COALESCE(resolved,false)=false`),
    safe(`SELECT COUNT(*) n FROM roc.intakes WHERE status='APPROVED'`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.intakes`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.ops_cards WHERE status='pending'`),
    safe(`SELECT COUNT(*) n FROM roc.inventory_skus WHERE units_in_stock <= COALESCE(reorder_point,0) OR units_in_stock = 0`),
    safe<{id:string;client_email:string;submitted_at:string;urgent_flag:boolean;read:boolean;resolved:boolean;data:{progressScore?:number;energyScore?:number;moodScore?:number};first_name:string;last_name:string}>(`
      SELECT ci.id, ci.client_email, ci.submitted_at, ci.urgent_flag, ci.read, ci.resolved, ci.data, i.first_name, i.last_name
      FROM roc.checkins ci LEFT JOIN roc.intakes i ON lower(i.email)=lower(ci.client_email)
      ORDER BY ci.submitted_at DESC LIMIT 5`),
    safe<{id:string;first_name:string;last_name:string;email:string;status:string;submitted_at:string}>(`
      SELECT id, first_name, last_name, email, status, submitted_at FROM roc.intakes ORDER BY submitted_at DESC LIMIT 5`),
    safe<{id:string;client_name:string;status:string;due_date:string;line_items:{peptide?:string}[]}>(`
      SELECT id, client_name, status, due_date, line_items FROM roc.ops_cards WHERE status IN ('pending','packed') ORDER BY due_date ASC NULLS LAST LIMIT 5`),
  ])
  return {
    totalIntakes: n(intakes), pendingIntakes: n(intakes, "pending"),
    totalCheckins: n(checkins), unreadCheckins: n(checkins, "unread"),
    urgentFlags: n(urgent), activeClients: n(activeClients),
    opsPending: n(opsPending), lowStock: n(lowStock),
    intakeThis: n(intakeDelta, "this"), intakePrev: n(intakeDelta, "prev"),
    checkinThis: n(checkinDelta, "this"), checkinPrev: n(checkinDelta, "prev"),
    recentCheckins, recentIntakes, recentOps,
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

  const score = (v?: number) => v === undefined ? null :
    <span style={{ color: v >= 7 ? "#22c55e" : v >= 4 ? "var(--gold)" : "#ef4444", fontWeight: 700 }}>{v}</span>

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

      {/* Recent sections */}
      <div className="admin-recent-grid" style={{ display: "grid", gap: "1rem" }}>
        {/* Recent Check-Ins */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <SectionHead title="Recent Check-Ins" href="/admin/checkins" />
          {s.recentCheckins.length === 0 ? <Empty text="No check-ins yet" /> : (
            <div>
              {s.recentCheckins.map(c => (
                <Link key={c.id} href="/admin/checkins" style={rowStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: c.read ? 500 : 800, fontSize: "0.84rem" }}>
                      {c.first_name ? `${c.first_name} ${c.last_name ?? ""}` : c.client_email}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-mute)", display: "flex", gap: "0.6rem", marginTop: 2 }}>
                      <span>P {score(c.data?.progressScore)}</span><span>E {score(c.data?.energyScore)}</span><span>M {score(c.data?.moodScore)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                    {c.urgent_flag && !c.resolved && <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "0.1rem 0.35rem", borderRadius: 4 }}>URGENT</span>}
                    {!c.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />}
                    <span style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{new Date(c.submitted_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Intakes */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <SectionHead title="Recent Intakes" href="/admin/intakes" />
          {s.recentIntakes.length === 0 ? <Empty text="No intakes yet" /> : (
            <div>
              {s.recentIntakes.map(r => (
                <Link key={r.id} href={`/admin/intakes/${r.id}`} style={rowStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-mute)" }}>{r.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <StatusBadge status={r.status} />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{new Date(r.submitted_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ops Queue — Next Actions */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <SectionHead title="Ops Queue — Next Actions" href="/admin/ops-queue" />
          {s.recentOps.length === 0 ? <Empty text="No open fulfillment cards" icon={CheckCircle} /> : (
            <div>
              {s.recentOps.map(o => (
                <Link key={o.id} href={`/admin/ops-queue/${o.id}`} style={rowStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>{o.client_name ?? "—"}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-mute)" }}>{Array.isArray(o.line_items) && o.line_items[0]?.peptide ? o.line_items.map(li => li.peptide).filter(Boolean).join(", ") : "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <StatusBadge status={o.status} />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{o.due_date ? new Date(o.due_date).toLocaleDateString() : "—"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-stat-grid { grid-template-columns: repeat(7, 1fr); }
        .admin-recent-grid { grid-template-columns: repeat(3, 1fr); }
        .stat-card-link .stat-card { transition: transform .12s, border-color .12s; }
        .stat-card-link:hover .stat-card { transform: scale(1.02); border-color: var(--gold); }
        @media (max-width: 1100px) { .admin-stat-grid { grid-template-columns: repeat(4, 1fr); } .admin-recent-grid { grid-template-columns: 1fr; } }
        @media (max-width: 767px) { .admin-stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  )
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.7rem 1rem", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "inherit" }

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" }}>
      <h2 style={{ fontWeight: 700, fontSize: "0.92rem" }}>{title}</h2>
      <Link href={href} style={{ color: "var(--gold)", fontSize: "0.76rem", textDecoration: "none" }}>View all →</Link>
    </div>
  )
}

function Empty({ text, icon: Icon = CheckCircle }: { text: string; icon?: typeof CheckCircle }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-mute)" }}>
      <Icon size={26} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
      <p style={{ fontSize: "0.82rem" }}>{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; c: string }> = {
    APPROVED: { bg: "rgba(34,197,94,0.15)", c: "#22c55e" }, PENDING: { bg: "rgba(245,158,11,0.15)", c: "#f59e0b" }, FLAGGED: { bg: "rgba(239,68,68,0.15)", c: "#ef4444" },
    pending: { bg: "rgba(245,158,11,0.15)", c: "#f59e0b" }, packed: { bg: "rgba(59,130,246,0.15)", c: "#3b82f6" }, shipped: { bg: "rgba(34,197,94,0.15)", c: "#22c55e" }, delivered: { bg: "rgba(82,82,91,0.2)", c: "var(--text-mute)" },
  }
  const st = map[status] ?? { bg: "var(--surface-2)", c: "var(--text-mute)" }
  return <span style={{ padding: "0.15rem 0.5rem", borderRadius: 5, fontSize: "0.68rem", fontWeight: 700, background: st.bg, color: st.c, textTransform: "uppercase", letterSpacing: "0.04em" }}>{status}</span>
}
