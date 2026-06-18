import { query } from "@/lib/db"
import { Users, ClipboardList, Activity, AlertTriangle } from "lucide-react"
import Link from "next/link"
// Note: server component — no browser event handlers

async function getStats() {
  const [intakes, checkins, urgent, activeClients, pendingList] = await Promise.all([
    query("SELECT COUNT(*) as n, COUNT(*) FILTER (WHERE status='PENDING') as pending FROM roc.intakes"),
    query("SELECT COUNT(*) as n FROM roc.checkins"),
    query("SELECT COUNT(*) as n FROM roc.checkins WHERE urgent_flag = true AND submitted_at > NOW() - INTERVAL '7 days'"),
    query("SELECT COUNT(*) as n FROM roc.intakes WHERE status = 'APPROVED'"),
    query("SELECT id, first_name, last_name, email, submitted_at FROM roc.intakes WHERE status='PENDING' ORDER BY submitted_at DESC LIMIT 5"),
  ])
  return {
    totalIntakes:   Number((intakes.rows[0] as {n:string}).n),
    pendingIntakes: Number((intakes.rows[0] as {pending:string}).pending),
    totalCheckins:  Number((checkins.rows[0] as {n:string}).n),
    urgentFlags:    Number((urgent.rows[0] as {n:string}).n),
    activeClients:  Number((activeClients.rows[0] as {n:string}).n),
    pendingList:    pendingList.rows as {id:string;first_name:string;last_name:string;email:string;submitted_at:string}[],
  }
}

export default async function AdminOverview() {
  const stats = await getStats()
  const cards = [
    { icon: ClipboardList, label:"Total Intakes",    value: stats.totalIntakes,   sub: `${stats.pendingIntakes} pending review`, color:"var(--gold)",  href:"/admin/intakes" },
    { icon: ClipboardList, label:"Pending Review",   value: stats.pendingIntakes, sub:"Awaiting action",                          color:"var(--gold)",  href:"/admin/intakes?status=PENDING" },
    { icon: Activity,      label:"Check-Ins",        value: stats.totalCheckins,  sub:"All time",                                 color:"#4ade80",      href:"/admin/checkins" },
    { icon: AlertTriangle, label:"Urgent Flags",     value: stats.urgentFlags,    sub:"Last 7 days",                              color:"#f87171",      href:"/admin/checkins?filter=urgent" },
    { icon: Users,         label:"Active Clients",   value: stats.activeClients,  sub:"Status = APPROVED",                        color:"#60a5fa",      href:"/admin/clients?status=APPROVED" },
  ]

  return (
    <div>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"clamp(1.25rem,4vw,1.75rem)",letterSpacing:"-0.02em",marginBottom:"0.25rem" }}>Overview</h1>
      <p style={{ color:"var(--text-mute)",fontSize:"0.875rem",marginBottom:"1.5rem" }}>Richard Ortiz Coaching — Admin Dashboard</p>

      {/* Stat cards — all clickable */}
      <div className="admin-stat-grid" style={{ display:"grid", gap:"1rem", marginBottom:"2rem" }}>
        {cards.map(c => (
          <Link key={c.label} href={c.href} style={{ textDecoration:"none" }}>
            <div className="card stat-card" style={{ cursor:"pointer" }}>
              <c.icon size={18} style={{ color:c.color, marginBottom:"0.6rem" }} />
              <div style={{ fontSize:"2rem",fontWeight:900,fontFamily:"Inter Tight,sans-serif",color:"var(--text)",lineHeight:1 }}>{c.value}</div>
              <div style={{ fontWeight:600,fontSize:"0.875rem",marginTop:"0.4rem" }}>{c.label}</div>
              <div style={{ color:"var(--text-mute)",fontSize:"0.775rem",marginTop:"0.2rem" }}>{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Urgent check-ins callout */}
      {stats.urgentFlags > 0 && (
        <Link href="/admin/checkins?filter=urgent" style={{ textDecoration:"none", display:"block", marginBottom:"1.5rem" }}>
          <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.4)", borderRadius:"var(--radius)", padding:"0.875rem 1.25rem", display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer" }}>
            <AlertTriangle size={18} style={{ color:"#f87171", flexShrink:0 }}/>
            <span style={{ color:"#f87171", fontWeight:700 }}>⚠ {stats.urgentFlags} urgent check-in{stats.urgentFlags > 1 ? "s" : ""} need{stats.urgentFlags === 1 ? "s" : ""} attention</span>
            <span style={{ marginLeft:"auto", color:"#f87171", fontSize:"0.85rem" }}>Review →</span>
          </div>
        </Link>
      )}

      {/* Pending intakes quick list */}
      {stats.pendingList.length > 0 && (
        <div className="card" style={{ marginBottom:"2rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.875rem" }}>
            <h2 style={{ fontWeight:700, fontSize:"1rem" }}>Needs Review</h2>
            <Link href="/admin/intakes?status=PENDING" style={{ color:"var(--gold)", fontSize:"0.8rem", textDecoration:"none" }}>View all →</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
            {stats.pendingList.map(r => {
              const daysAgo = Math.floor((Date.now() - new Date(r.submitted_at).getTime()) / (1000*60*60*24))
              return (
                <Link key={r.id} href={`/admin/intakes/${r.id}`} style={{ textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 0.875rem", background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", cursor:"pointer" }}>
                  <div>
                    <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{r.first_name} {r.last_name}</span>
                    <span style={{ color:"var(--text-mute)", fontSize:"0.78rem", marginLeft:"0.75rem" }}>{r.email}</span>
                  </div>
                  <span style={{ color:"var(--text-mute)", fontSize:"0.75rem", flexShrink:0 }}>{daysAgo === 0 ? "today" : `${daysAgo}d ago`}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent intakes table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
          <h2 style={{ fontWeight:700, fontSize:"1rem" }}>Recent Intakes</h2>
        </div>

        <div className="admin-table-wrap">
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.875rem" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Name","Email","Status","Submitted"].map(h => (
                  <th key={h} style={{ textAlign:"left",padding:"0.5rem 0.75rem",color:"var(--text-mute)",fontWeight:600,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.pendingList.map((r,i) => (
                <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"0.75rem" }}>
                    <Link href={`/admin/intakes/${r.id}`} style={{ color:"inherit", textDecoration:"none", fontWeight:600 }}>
                      {r.first_name} {r.last_name}
                    </Link>
                  </td>
                  <td style={{ padding:"0.75rem",color:"var(--text-mute)" }}>{r.email}</td>
                  <td style={{ padding:"0.75rem" }}>
                    <span style={{ padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.75rem",fontWeight:700,background:"rgba(201,168,76,0.15)",color:"var(--gold)" }}>PENDING</span>
                  </td>
                  <td style={{ padding:"0.75rem",color:"var(--text-mute)",fontSize:"0.8rem" }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats.pendingList.length === 0 && (
                <tr><td colSpan={4} style={{ padding:"2rem",textAlign:"center",color:"var(--text-mute)" }}>No pending intakes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-stat-grid { grid-template-columns: repeat(5, 1fr); }
        @media (max-width: 900px) { .admin-stat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 767px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-table-wrap { display: none; }
        }
      `}</style>
    </div>
  )
}
