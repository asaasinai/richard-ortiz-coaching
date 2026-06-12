import { query } from "@/lib/db"
import { Users, ClipboardList, Activity, AlertTriangle } from "lucide-react"

async function getStats() {
  const [intakes, checkins, urgent, recent] = await Promise.all([
    query("SELECT COUNT(*) as n, COUNT(*) FILTER (WHERE status='PENDING') as pending FROM roc.intakes"),
    query("SELECT COUNT(*) as n FROM roc.checkins"),
    query("SELECT COUNT(*) as n FROM roc.checkins WHERE urgent_flag = true AND submitted_at > NOW() - INTERVAL '7 days'"),
    query("SELECT first_name, last_name, email, status, submitted_at FROM roc.intakes ORDER BY submitted_at DESC LIMIT 5"),
  ])
  return {
    totalIntakes:   Number((intakes.rows[0] as {n:string}).n),
    pendingIntakes: Number((intakes.rows[0] as {pending:string}).pending),
    totalCheckins:  Number((checkins.rows[0] as {n:string}).n),
    urgentFlags:    Number((urgent.rows[0] as {n:string}).n),
    recentIntakes:  recent.rows as {first_name:string,last_name:string,email:string,status:string,submitted_at:string}[],
  }
}

export default async function AdminOverview() {
  const stats = await getStats()
  const cards = [
    { icon: ClipboardList, label:"Total Intakes",    value: stats.totalIntakes,   sub: `${stats.pendingIntakes} pending review`, color:"var(--gold)" },
    { icon: Activity,      label:"Check-Ins",        value: stats.totalCheckins,  sub:"All time",                                 color:"#4ade80" },
    { icon: AlertTriangle, label:"Urgent Flags",     value: stats.urgentFlags,    sub:"Last 7 days",                              color:"#f87171" },
    { icon: Users,         label:"Active Clients",   value: stats.totalIntakes,   sub:"Registered",                               color:"#60a5fa" },
  ]
  return (
    <div>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"clamp(1.25rem,4vw,1.75rem)",letterSpacing:"-0.02em",marginBottom:"0.25rem" }}>Overview</h1>
      <p style={{ color:"var(--text-mute)",fontSize:"0.875rem",marginBottom:"1.5rem" }}>Richard Ortiz Coaching — Admin Dashboard</p>

      {/* Stat cards — 2-col on mobile, 4-col on desktop */}
      <div className="admin-stat-grid" style={{ display:"grid", gap:"1rem", marginBottom:"2rem" }}>
        {cards.map(c => (
          <div key={c.label} className="card">
            <c.icon size={18} style={{ color:c.color, marginBottom:"0.6rem" }} />
            <div style={{ fontSize:"2rem",fontWeight:900,fontFamily:"Inter Tight,sans-serif",color:"var(--text)",lineHeight:1 }}>{c.value}</div>
            <div style={{ fontWeight:600,fontSize:"0.875rem",marginTop:"0.4rem" }}>{c.label}</div>
            <div style={{ color:"var(--text-mute)",fontSize:"0.775rem",marginTop:"0.2rem" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent intakes — card list on mobile, table on desktop */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
          <h2 style={{ fontWeight:700, fontSize:"1rem" }}>Recent Intakes</h2>
        </div>

        {/* Desktop table */}
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
              {stats.recentIntakes.map((r,i) => (
                <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"0.75rem" }}>{r.first_name} {r.last_name}</td>
                  <td style={{ padding:"0.75rem",color:"var(--text-mute)" }}>{r.email}</td>
                  <td style={{ padding:"0.75rem" }}>
                    <span style={{
                      padding:"0.2rem 0.6rem",borderRadius:3,fontSize:"0.75rem",fontWeight:700,
                      background: r.status==="PENDING" ? "rgba(201,168,76,0.15)" : r.status==="APPROVED" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                      color: r.status==="PENDING" ? "var(--gold)" : r.status==="APPROVED" ? "#4ade80" : "#f87171"
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding:"0.75rem",color:"var(--text-mute)",fontSize:"0.8rem" }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats.recentIntakes.length === 0 && (
                <tr><td colSpan={4} style={{ padding:"2rem",textAlign:"center",color:"var(--text-mute)" }}>No intakes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="admin-card-list" style={{ display:"none", flexDirection:"column", gap:"0" }}>
          {stats.recentIntakes.map((r,i) => (
            <div key={i} style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"0.3rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontWeight:600, fontSize:"0.9rem" }}>{r.first_name} {r.last_name}</span>
                <span style={{
                  padding:"0.15rem 0.5rem", borderRadius:3, fontSize:"0.7rem", fontWeight:700,
                  background: r.status==="PENDING" ? "rgba(201,168,76,0.15)" : r.status==="APPROVED" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                  color: r.status==="PENDING" ? "var(--gold)" : r.status==="APPROVED" ? "#4ade80" : "#f87171"
                }}>{r.status}</span>
              </div>
              <span style={{ color:"var(--text-mute)", fontSize:"0.8rem" }}>{r.email}</span>
              <span style={{ color:"var(--text-mute)", fontSize:"0.75rem" }}>{new Date(r.submitted_at).toLocaleDateString()}</span>
            </div>
          ))}
          {stats.recentIntakes.length === 0 && (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-mute)", fontSize:"0.875rem" }}>No intakes yet.</div>
          )}
        </div>
      </div>

      <style>{`
        .admin-stat-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 767px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-table-wrap { display: none; }
          .admin-card-list  { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
