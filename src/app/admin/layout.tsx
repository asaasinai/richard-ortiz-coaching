"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ClipboardList, Activity, MessageSquare, BarChart2, Settings } from "lucide-react"

const nav = [
  { href: "/admin",            label: "Overview",    icon: BarChart2 },
  { href: "/admin/intakes",    label: "Intakes",     icon: ClipboardList },
  { href: "/admin/checkins",   label: "Check-Ins",   icon: Activity },
  { href: "/admin/clients",    label: "Clients",     icon: Users },
  { href: "/admin/sms",        label: "SMS Builder", icon: MessageSquare },
  { href: "/admin/settings",   label: "Settings",    icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:"var(--surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"1.5rem 0", flexShrink:0 }}>
        <div style={{ padding:"0 1.25rem 1.5rem", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"0.85rem", letterSpacing:"0.05em", color:"var(--gold)" }}>ROC ADMIN</span>
        </div>
        <nav style={{ marginTop:"1rem", display:"flex", flexDirection:"column", gap:"0.25rem", padding:"0 0.75rem" }}>
          {nav.map(item => {
            const active = path === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex", alignItems:"center", gap:"0.6rem",
                padding:"0.6rem 0.75rem", borderRadius:"var(--radius)",
                fontSize:"0.85rem", fontWeight: active ? 700 : 500,
                color: active ? "#000" : "var(--text-soft)",
                background: active ? "var(--gold)" : "transparent",
                textDecoration:"none", transition:"all 0.15s"
              }}>
                <item.icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ marginTop:"auto", padding:"1rem 1.25rem", borderTop:"1px solid var(--border)" }}>
          <Link href="/" style={{ fontSize:"0.75rem", color:"var(--text-mute)" }}>← Back to site</Link>
        </div>
      </aside>
      {/* Main content */}
      <main style={{ flex:1, overflow:"auto", padding:"2rem" }}>
        {children}
      </main>
    </div>
  )
}
