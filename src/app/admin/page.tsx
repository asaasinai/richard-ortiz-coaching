import { query } from "@/lib/db"
import { Users, Activity, AlertTriangle, DollarSign, ClipboardList, ListChecks, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import OverviewActivity from "@/components/admin/OverviewActivity"
import { Donut, Bars, Sparkline } from "@/components/admin/Charts"

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
async function safe<T = Row>(sql: string): Promise<T[]> {
  try { return (await query<T>(sql)).rows } catch { return [] }
}
const n = (rows: Row[], key = "n") => Number((rows[0]?.[key] as string) ?? 0)

async function getStats() {
  const [
    intakes, checkins, urgent, activeClients, intakeDelta, checkinDelta,
    opsPending, lowStock, mrr, byProtocol, statusBreak, ckSeries,
  ] = await Promise.all([
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE status='PENDING') pending FROM roc.intakes`),
    safe(`SELECT COUNT(*) n, COUNT(*) FILTER (WHERE read=false) unread, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') week FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.checkins WHERE urgent_flag=true AND COALESCE(resolved,false)=false`),
    safe(`SELECT COUNT(*) n FROM roc.intakes WHERE status='APPROVED'`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.intakes`),
    safe(`SELECT COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '7 days') this, COUNT(*) FILTER (WHERE submitted_at > NOW()-INTERVAL '14 days' AND submitted_at <= NOW()-INTERVAL '7 days') prev FROM roc.checkins`),
    safe(`SELECT COUNT(*) n FROM roc.ops_cards WHERE status='pending'`),
    safe(`SELECT COUNT(*) n FROM roc.inventory_skus WHERE units_in_stock <= COALESCE(reorder_point,0) OR units_in_stock = 0`),
    safe(`SELECT COALESCE(SUM(monthly_rate),0) n FROM roc.client_protocols WHERE billing_status='active'`),
    safe(`SELECT peptide, COALESCE(SUM(monthly_rate),0) rev FROM roc.client_protocols WHERE billing_status='active' GROUP BY peptide ORDER BY rev DESC LIMIT 6`),
    safe(`SELECT status, COUNT(*) c FROM roc.intakes GROUP BY status`),
    safe(`SELECT to_char(date_trunc('week', submitted_at),'MM/DD') wk, COUNT(*) c FROM roc.checkins WHERE submitted_at > NOW()-INTERVAL '56 days' GROUP BY 1 ORDER BY 1`),
  ])
  return {
    totalIntakes: n(intakes), pendingIntakes: n(intakes, "pending"),
    totalCheckins: n(checkins), unreadCheckins: n(checkins, "unread"), weekCheckins: n(checkins, "week"),
    urgentFlags: n(urgent), activeClients: n(activeClients),
    opsPending: n(opsPending), lowStock: n(lowStock), mrr: n(mrr),
    intakeThis: n(intakeDelta, "this"), intakePrev: n(intakeDelta, "prev"),
    checkinThis: n(checkinDelta, "this"), checkinPrev: n(checkinDelta, "prev"),
    byProtocol: byProtocol.map(r => ({ label: String(r.peptide ?? "—"), value: Math.round(Number(r.rev)) })),
    statusBreak: statusBreak.map(r => ({ label: String(r.status ?? "—"), value: Number(r.c) })),
    ckSeries: ckSeries.map(r => Number(r.c)),
  }
}

const PALETTE = ["#C9A84C", "#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#A78BFA"]

function deltaWords(now: number, prev: number) {
  const d = now - prev
  if (d === 0) return { up: null as boolean | null, text: "same as last week" }
  return { up: d > 0, text: `${Math.abs(d)} ${d > 0 ? "more" : "fewer"} than last week` }
}

export default async function AdminOverview() {
  const s = await getStats()

  const hero = [
    { icon: Users, label: "Active clients", value: s.activeClients, color: "#60A5FA", href: "/admin/clients",
      foot: "people you're coaching right now" as string | { up: boolean | null; text: string }, spark: null as number[] | null },
    { icon: Activity, label: "Check-ins this week", value: s.weekCheckins, color: "#34D399", href: "/admin/checkins",
      foot: deltaWords(s.checkinThis, s.checkinPrev), spark: s.ckSeries },
    { icon: AlertTriangle, label: "Needs your attention", value: s.urgentFlags, color: "#F87171", href: "/admin/checkins?filter=urgent",
      foot: s.urgentFlags ? "urgent check-in flagged" : "all clear", spark: null },
    { icon: DollarSign, label: "Monthly revenue", value: `$${s.mrr.toLocaleString()}`, color: "var(--gold)", href: "/admin/revenue",
      foot: "recurring from active protocols", spark: null },
  ]

  const secondary = [
    { icon: ClipboardList, label: "New applicants", value: s.pendingIntakes, href: "/admin/intakes?status=PENDING", color: "#FBBF24" },
    { icon: ListChecks, label: "To fulfill", value: s.opsPending, href: "/admin/ops-queue?filter=pending", color: "#FBBF24" },
    { icon: Activity, label: "Unread check-ins", value: s.unreadCheckins, href: "/admin/checkins?filter=unread", color: "#34D399" },
  ]

  const today = [
    s.urgentFlags > 0 && { color: "#F87171", text: `${s.urgentFlags} client${s.urgentFlags > 1 ? "s" : ""} flagged something urgent`, cta: "Review now", href: "/admin/checkins?filter=urgent" },
    s.pendingIntakes > 0 && { color: "var(--gold)", text: `${s.pendingIntakes} new applicant${s.pendingIntakes > 1 ? "s are" : " is"} waiting on you`, cta: "Review", href: "/admin/intakes?status=PENDING" },
    s.unreadCheckins > 0 && { color: "#34D399", text: `${s.unreadCheckins} check-in${s.unreadCheckins > 1 ? "s" : ""} you haven't read yet`, cta: "Open", href: "/admin/checkins?filter=unread" },
    s.opsPending > 0 && { color: "#FBBF24", text: `${s.opsPending} order${s.opsPending > 1 ? "s" : ""} ready to ship`, cta: "Fulfill", href: "/admin/ops-queue?filter=pending" },
  ].filter(Boolean) as { color: string; text: string; cta: string; href: string }[]

  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const revData = s.byProtocol.map((p, i) => ({ ...p, color: PALETTE[i % PALETTE.length] }))
  const statusData = s.statusBreak.map(p => ({ ...p, color: p.label === "APPROVED" ? "#34D399" : p.label === "PENDING" ? "#FBBF24" : "#60A5FA" }))

  return (
    <div>
      {/* Greeting */}
      <div className="reveal" style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.6rem" }}>{todayLabel}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.9rem,5vw,2.9rem)", letterSpacing: "-0.03em", lineHeight: 1.02 }}>
          Hello, <span className="gold-text">Richard</span>.
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "1rem", marginTop: "0.5rem", maxWidth: 520 }}>Here's how your coaching business is performing today.</p>
      </div>

      {/* Hero tiles */}
      <div className="hero-grid" style={{ display: "grid", gap: "1rem", marginBottom: "1.25rem" }}>
        {hero.map((c, i) => {
          const foot = typeof c.foot === "string" ? null : c.foot
          const isGold = c.color === "var(--gold)"
          return (
            <Link key={c.label} href={c.href} className="hero-tile reveal" style={{ textDecoration: "none", animationDelay: `${0.06 * i + 0.05}s` }}>
              <div className="card hero-card" style={{ position: "relative", overflow: "hidden", boxShadow: isGold ? "var(--glow-gold)" : undefined, borderColor: isGold ? "rgba(212,175,90,0.3)" : undefined }}>
                {isGold && <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, background: "radial-gradient(circle, rgba(212,175,90,0.18), transparent 70%)", pointerEvents: "none" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, background: isGold ? "var(--gold-dim)" : "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <c.icon size={19} style={{ color: c.color }} />
                  </div>
                  {c.spark && c.spark.length > 1 && <Sparkline data={c.spark} color={c.color} />}
                </div>
                <div className={isGold ? "gold-text" : undefined} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.7rem", lineHeight: 1, marginTop: "1.1rem", letterSpacing: "-0.02em" }}>{c.value}</div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem", marginTop: "0.5rem", color: "var(--text)" }}>{c.label}</div>
                <div style={{ fontSize: "0.78rem", marginTop: "0.3rem", color: foot?.up == null ? "var(--text-mute)" : foot.up ? "var(--good)" : "var(--bad)", display: "flex", alignItems: "center", gap: 3 }}>
                  {foot && foot.up != null && (foot.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />)}
                  {typeof c.foot === "string" ? c.foot : c.foot.text}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Secondary stat strip */}
      <div className="sec-grid" style={{ display: "grid", gap: "0.75rem", marginBottom: "1.75rem" }}>
        {secondary.map(c => (
          <Link key={c.label} href={c.href} style={{ textDecoration: "none" }}>
            <div className="sec-tile" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.9rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", transition: "all .12s" }}>
              <c.icon size={17} style={{ color: c.color, flexShrink: 0 }} />
              <span style={{ color: "var(--text-soft)", fontSize: "0.85rem", flex: 1 }}>{c.label}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem" }}>{c.value}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Today + revenue donut */}
      <div className="ov-2col" style={{ display: "grid", gap: "1.25rem", marginBottom: "1.75rem" }}>
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.25rem" }}>Today</h2>
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginBottom: "1rem" }}>What needs you right now.</p>
          {today.length === 0 ? (
            <div style={{ padding: "1.5rem 0", color: "var(--text-mute)", fontSize: "0.9rem", textAlign: "center" }}>🎉 You're all caught up. Nothing needs attention.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {today.map((t, i) => (
                <Link key={i} href={t.href} style={{ textDecoration: "none" }}>
                  <div className="today-row" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem 0.9rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${t.color}`, transition: "all .12s" }}>
                    <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--text)" }}>{t.text}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: t.color, whiteSpace: "nowrap" }}>{t.cta} →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.25rem" }}>Revenue by protocol</h2>
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Monthly recurring, by peptide.</p>
          {revData.length ? <Donut segments={revData} centerLabel={`$${s.mrr.toLocaleString()}`} centerSub="per month" /> : <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No active protocols yet.</p>}
        </div>
      </div>

      {/* Client status + top protocols */}
      <div className="ov-2col" style={{ display: "grid", gap: "1.25rem", marginBottom: "1.75rem" }}>
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.25rem" }}>Clients by status</h2>
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Where everyone stands.</p>
          {statusData.length ? <Donut segments={statusData} size={150} centerLabel={String(s.totalIntakes)} centerSub="total" /> : <p style={{ color: "var(--text-mute)", fontSize: "0.85rem" }}>No clients yet.</p>}
        </div>
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.25rem" }}>Top protocols by revenue</h2>
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Your biggest earners.</p>
          <Bars data={revData.map(r => ({ label: r.label, value: r.value, sub: `$${r.value}/mo` }))} />
        </div>
      </div>

      {/* Live activity (restyled in loop row 1.3) */}
      <OverviewActivity />

      <style>{`
        .hero-grid { grid-template-columns: repeat(4, 1fr); }
        .sec-grid { grid-template-columns: repeat(4, 1fr); }
        .ov-2col { grid-template-columns: 1fr 1fr; }
        .hero-tile .card { transition: transform .2s cubic-bezier(.2,.7,.2,1), border-color .2s, box-shadow .2s; }
        .hero-tile:hover .card { transform: translateY(-4px); border-color: var(--border-strong); box-shadow: var(--shadow-card), 0 22px 50px rgba(0,0,0,.4); }
        .sec-tile:hover { background: var(--surface-2) !important; border-color: var(--border-strong) !important; transform: translateY(-1px); }
        .today-row:hover { background: var(--surface-3) !important; }
        @media (max-width: 1100px) { .hero-grid { grid-template-columns: repeat(2, 1fr); } .sec-grid { grid-template-columns: repeat(2, 1fr); } .ov-2col { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .hero-grid { grid-template-columns: 1fr; } .sec-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
