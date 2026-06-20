"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Users, ClipboardList, Activity, MessageSquare, Settings, Menu, X, Calculator, DollarSign, Package, ListChecks, LayoutDashboard, PanelLeftClose, PanelLeft, Search } from "lucide-react"
import NotificationBell from "@/components/admin/NotificationBell"
import CommandPalette from "@/components/admin/CommandPalette"

type BadgeKey = "pending_ops" | "unread_checkins" | "pending_intakes" | "low_stock"
interface NavItem { href: string; label: string; icon: typeof Users; badge?: BadgeKey; badgeColor?: string }
interface NavGroup { title: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { title: "Daily", items: [
    { href: "/admin",           label: "Overview",    icon: LayoutDashboard },
    { href: "/admin/checkins",  label: "Check-Ins",   icon: Activity,       badge: "unread_checkins", badgeColor: "#34D399" },
    { href: "/admin/clients",   label: "Clients",     icon: Users },
    { href: "/admin/intakes",   label: "Applicants",  icon: ClipboardList,  badge: "pending_intakes", badgeColor: "var(--gold)" },
  ]},
  { title: "Catalog", items: [
    { href: "/admin/ops-queue", label: "Fulfillment", icon: ListChecks,     badge: "pending_ops",     badgeColor: "#FBBF24" },
    { href: "/admin/inventory", label: "Inventory",   icon: Package,        badge: "low_stock",       badgeColor: "#F87171" },
    { href: "/admin/revenue",   label: "Revenue",     icon: DollarSign },
  ]},
  { title: "Tools", items: [
    { href: "/admin/sms",      label: "SMS Builder", icon: MessageSquare },
    { href: "/calculator",     label: "Calculator",  icon: Calculator },
    { href: "/admin/settings", label: "Settings",    icon: Settings },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({ pending_ops: 0, unread_checkins: 0, pending_intakes: 0, low_stock: 0 })

  const loadBadges = useCallback(() => {
    fetch("/api/admin/badges").then(r => r.json()).then(setBadges).catch(() => {})
  }, [])
  useEffect(() => { loadBadges(); const t = setInterval(loadBadges, 60000); return () => clearInterval(t) }, [loadBadges, path])

  const isActive = (href: string) => href === "/admin" ? path === "/admin" : path.startsWith(href)

  const NavRow = ({ item, onClick, mini }: { item: NavItem; onClick?: () => void; mini?: boolean }) => {
    const active = isActive(item.href)
    const count = item.badge ? badges[item.badge] : 0
    return (
      <Link href={item.href} onClick={onClick} title={mini ? item.label : undefined} className="nav-row" data-active={active} style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        padding: mini ? "0.6rem" : "0.55rem 0.7rem", borderRadius: "var(--radius-sm)",
        fontSize: "0.875rem", fontWeight: active ? 700 : 500,
        color: active ? "var(--gold-light)" : "var(--text-soft)",
        background: active ? "var(--gold-dim)" : "transparent",
        textDecoration: "none", transition: "all 0.15s", justifyContent: mini ? "center" : "flex-start",
        position: "relative",
      }}>
        <item.icon size={16} style={{ flexShrink: 0 }} />
        {!mini && <span style={{ flex: 1 }}>{item.label}</span>}
        {item.badge && count > 0 && (
          <span style={{
            position: mini ? "absolute" : "static", top: 4, right: 4,
            minWidth: 17, height: 17, padding: "0 5px", borderRadius: 9,
            background: item.badgeColor ?? "var(--gold)", color: (item.badgeColor === "var(--gold)") ? "#000" : "#fff",
            fontSize: "0.64rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{count > 99 ? "99+" : count}</span>
        )}
      </Link>
    )
  }

  const NavLinks = ({ onClick, mini }: { onClick?: () => void; mini?: boolean }) => (
    <nav style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.15rem", padding: mini ? "0 0.5rem" : "0 0.7rem", flex: 1 }}>
      {GROUPS.map((g, gi) => (
        <div key={g.title} style={{ marginBottom: "0.4rem" }}>
          {!mini ? (
            <div style={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-mute)", padding: "0.5rem 0.7rem 0.3rem" }}>{g.title}</div>
          ) : gi > 0 ? <div style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0.3rem" }} /> : null}
          {g.items.map(item => <NavRow key={item.href} item={item} onClick={onClick} mini={mini} />)}
        </div>
      ))}
    </nav>
  )

  const sidebarW = collapsed ? 56 : 220

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "transparent" }}>
      {/* ── Desktop sidebar ── */}
      <aside className="admin-sidebar-desktop" style={{
        width: sidebarW, background: "rgba(10,10,12,0.55)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "1.1rem 0", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", transition: "width 0.18s",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      }}>
        <div style={{ padding: collapsed ? "0 0 1.1rem" : "0 1.1rem 1.1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "0.5rem" }}>
          {!collapsed ? (
            <>
              <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: "var(--gold-grad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(212,175,90,0.35)" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "#1A1400" }}>R</span>
                </div>
                <div style={{ lineHeight: 1.05, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.84rem", color: "var(--text)", whiteSpace: "nowrap" }}>Richard Ortiz</div>
                  <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)" }}>Coaching</div>
                </div>
              </Link>
              <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" style={{ background: "none", border: "none", color: "var(--text-mute)", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" title="Richard Ortiz Coaching" style={{ width: 34, height: 34, borderRadius: 11, background: "var(--gold-grad)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(212,175,90,0.35)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "#1A1400" }}>R</span>
            </button>
          )}
        </div>
        <NavLinks mini={collapsed} />
        {!collapsed && (
          <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
            <Link href="/" style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}>← Back to site</Link>
          </div>
        )}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="admin-topbar-mobile" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "none", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 52 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.05em", color: "var(--gold)" }}>ROC ADMIN</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <NotificationBell />
          <button onClick={() => setMobileOpen(o => !o)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && <div style={{ position: "fixed", inset: 0, zIndex: 290, background: "rgba(0,0,0,0.7)" }} onClick={() => setMobileOpen(false)} />}

      {/* ── Mobile drawer ── */}
      <div className="admin-drawer-mobile" style={{ position: "fixed", top: 52, left: 0, bottom: 0, width: 260, zIndex: 295, background: "var(--surface)", borderRight: "1px solid var(--border)", transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.22s ease", display: "none", flexDirection: "column", paddingTop: "0.75rem", overflowY: "auto" }}>
        <NavLinks onClick={() => setMobileOpen(false)} />
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <Link href="/" onClick={() => setMobileOpen(false)} style={{ fontSize: "0.8rem", color: "var(--text-mute)" }}>← Back to site</Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="admin-main" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <header className="admin-header-desktop" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.65rem 2rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "rgba(8,8,10,0.6)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", zIndex: 100, minHeight: 54 }}>
          <button onClick={() => window.dispatchEvent(new Event("roc:cmdk"))} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", color: "var(--text-mute)", fontSize: "0.82rem", padding: "0.45rem 0.85rem", cursor: "pointer", minWidth: 240 }}>
            <Search size={14} /> <span style={{ flex: 1, textAlign: "left" }}>Search clients, applicants…</span>
            <kbd style={{ fontSize: "0.66rem", border: "1px solid var(--border)", borderRadius: 6, padding: "0.1rem 0.35rem", color: "var(--text-soft)" }}>⌘K</kbd>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationBell />
          <Link href="/admin/settings" aria-label="Admin" style={{ textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gold-grad)", color: "#1A1400", fontWeight: 800, fontSize: "0.74rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(212,175,90,0.3)" }}>RO</div>
          </Link>
          </div>
        </header>
        <div style={{ padding: "2.25rem 2rem", flex: 1 }}>{children}</div>
      </main>
      <CommandPalette />

      <style>{`
        .nav-row[data-active="false"]:hover { background: var(--surface-2) !important; color: var(--text) !important; }
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
