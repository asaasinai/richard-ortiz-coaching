"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Users, ClipboardList, Activity, MessageSquare, BarChart2, Settings, Menu, X, Calculator, DollarSign, Package, Zap } from "lucide-react"
import NotificationBell from "@/components/admin/NotificationBell"

const nav = [
  { href: "/admin",            label: "Overview",    icon: BarChart2,      group: "main" },
  { href: "/admin/ops",        label: "Ops Queue",   icon: Zap,            group: "main" },
  { href: "/admin/revenue",    label: "Revenue",     icon: DollarSign,     group: "main" },
  { href: "/admin/inventory",  label: "Inventory",   icon: Package,        group: "main" },
  { href: "/admin/clients",    label: "Clients",     icon: Users,          group: "clients" },
  { href: "/admin/intakes",    label: "Intakes",     icon: ClipboardList,  group: "clients" },
  { href: "/admin/checkins",   label: "Check-Ins",   icon: Activity,       group: "clients" },
  { href: "/admin/sms",        label: "SMS Builder", icon: MessageSquare,  group: "tools" },
  { href: "/calculator",       label: "Calculator",  icon: Calculator,     group: "tools" },
  { href: "/admin/settings",   label: "Settings",    icon: Settings,       group: "tools" },
]

const groups = [
  { id: "main",    label: "Dashboard" },
  { id: "clients", label: "Clients" },
  { id: "tools",   label: "Tools" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav style={{ marginTop:"0.75rem", display:"flex", flexDirection:"column", gap:"0", padding:"0 0.75rem" }}>
      {groups.map(group => (
        <div key={group.id} style={{ marginBottom:"0.5rem" }}>
          <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", padding:"0.6rem 0.75rem 0.3rem" }}>
            {group.label}
          </div>
          {nav.filter(n => n.group === group.id).map(item => {
            const active = path === item.href
            return (
              <Link key={item.href} href={item.href} onClick={onClick} style={{
                display:"flex", alignItems:"center", gap:"0.6rem",
                padding:"0.6rem 0.75rem", borderRadius:"var(--radius)",
                fontSize:"0.875rem", fontWeight: active ? 700 : 500,
                color: active ? "#000" : "var(--text-soft)",
                background: active ? "var(--gold)" : "transparent",
                textDecoration:"none", transition:"all 0.15s"
              }}>
                <item.icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

      {/* ── Desktop sidebar ── */}
      <aside style={{
        width:220, background:"var(--surface)", borderRight:"1px solid var(--border)",
        display:"flex", flexDirection:"column", padding:"1.5rem 0", flexShrink:0,
        position:"sticky", top:0, height:"100vh",
        // hide below 768px
        ...({}) as React.CSSProperties
      }} className="admin-sidebar-desktop">
        <div style={{ padding:"0 1.25rem 1.5rem", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"0.85rem", letterSpacing:"0.05em", color:"var(--gold)" }}>ROC ADMIN</span>
        </div>
        <NavLinks />
        <div style={{ marginTop:"auto", padding:"1rem 1.25rem", borderTop:"1px solid var(--border)" }}>
          <Link href="/" style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>← Back to site</Link>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="admin-topbar-mobile" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:300,
        background:"var(--surface)", borderBottom:"1px solid var(--border)",
        display:"none", alignItems:"center", justifyContent:"space-between",
        padding:"0 1rem", height:52
      }}>
        <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"0.85rem", letterSpacing:"0.05em", color:"var(--gold)" }}>ROC ADMIN</span>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <NotificationBell />
          <button onClick={() => setMobileOpen(o => !o)} style={{ background:"none", border:"none", color:"var(--text)", cursor:"pointer", padding:"0.25rem", display:"flex", alignItems:"center" }}>
            {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          style={{ position:"fixed", inset:0, zIndex:290, background:"rgba(0,0,0,0.7)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className="admin-drawer-mobile" style={{
        position:"fixed", top:52, left:0, bottom:0, width:260, zIndex:295,
        background:"var(--surface)", borderRight:"1px solid var(--border)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform 0.22s ease",
        display:"none", flexDirection:"column", paddingTop:"0.75rem", overflowY:"auto"
      }}>
        <NavLinks onClick={() => setMobileOpen(false)} />
        <div style={{ marginTop:"auto", padding:"1rem 1.25rem", borderTop:"1px solid var(--border)" }}>
          <Link href="/" onClick={() => setMobileOpen(false)} style={{ fontSize:"0.8rem", color:"var(--text-mute)" }}>← Back to site</Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="admin-main" style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
        {/* Desktop header bar */}
        <header className="admin-header-desktop" style={{
          display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"0.75rem",
          padding:"0.6rem 2rem", borderBottom:"1px solid var(--border)",
          position:"sticky", top:0, background:"var(--bg)", zIndex:100, minHeight:52
        }}>
          <NotificationBell />
          <Link href="/admin/settings" aria-label="Admin" style={{ textDecoration:"none" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--gold)", color:"#000", fontWeight:800, fontSize:"0.72rem", display:"flex", alignItems:"center", justifyContent:"center" }}>RO</div>
          </Link>
        </header>
        <div style={{ padding:"2rem", flex:1 }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-topbar-mobile   { display: flex !important; }
          .admin-drawer-mobile   { display: flex !important; }
          .admin-header-desktop  { display: none !important; }
          .admin-main            { margin-top: 52px; }
          .admin-main > div      { padding: 1rem !important; }
        }
      `}</style>
    </div>
  )
}
