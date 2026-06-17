"use client"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

const links = [
  { href: "/coaching", label: "Program" },
  { href: "/meet-your-coach", label: "Meet Your Coach" },
  { href: "/success-stories", label: "Success Stories" },
  { href: "/pricing", label: "Pricing" },
]

const clientResources = [
  { href: "/intake", label: "Intake Form" },
  { href: "/checkin", label: "Two-Week Check-In" },
  { href: "/dashboard", label: "Client Dashboard" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setResOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Hover-open with a small close delay so the pointer can travel into the menu
  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setResOpen(true)
  }
  const leave = () => {
    closeTimer.current = setTimeout(() => setResOpen(false), 150)
  }

  const linkStyle = {
    fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
    color: "var(--text-soft)", whiteSpace: "nowrap" as const,
    padding: "0.5rem 0.25rem",   // real hover/tap area, not text-height only
  }

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }} className="sticky top-0 z-50">
      {/* nav frame stays wider than page content so the link cluster never collides with the logo */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-3" style={{ whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
            RICHARD ORTIZ
          </span>
          <span style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>COACHING</span>
        </Link>

        {/* Desktop (lg+: six items + CTA need the room; md was overflowing) */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={linkStyle} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          <div style={{ position: "relative" }} onMouseEnter={enter} onMouseLeave={leave}>
            <button onClick={() => setResOpen(o => !o)} aria-expanded={resOpen} aria-haspopup="true"
              style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem 0" }}
              className="hover:text-white transition-colors">
              Client Resources <ChevronDown size={13} style={{ transform: resOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {resOpen && (
              <div style={{
                position: "absolute", top: "100%", right: 0, minWidth: 210, paddingTop: "0.5rem",
              }}>
                <div style={{
                  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "0.5rem", display: "flex", flexDirection: "column", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                }}>
                  {clientResources.map(r => (
                    <Link key={r.href} href={r.href} onClick={() => setResOpen(false)}
                      style={{ fontSize: "0.82rem", color: "var(--text-soft)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius)", whiteSpace: "nowrap" }}
                      className="hover:text-white hover:bg-black/30 transition-colors">{r.label}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/contact" style={linkStyle} className="hover:text-white transition-colors">Contact</Link>

          <Link href="/intake" className="btn-gold" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Start Intake</Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu"
          style={{ color: "var(--text)", width: 44, height: 44, display: "grid", placeItems: "center", background: "none", border: "none", cursor: "pointer" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile / tablet drawer */}
      {open && (
        <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }} className="lg:hidden px-4 py-4 flex flex-col gap-4">
          <Link href="/" onClick={() => setOpen(false)} style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>Home</Link>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>{l.label}</Link>
          ))}
          <span style={{ fontSize: "0.7rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginTop: "0.25rem" }}>
            Client Resources
          </span>
          {clientResources.map(r => (
            <Link key={r.href} href={r.href} onClick={() => setOpen(false)}
              style={{ fontSize: "0.9rem", color: "var(--text-soft)", paddingLeft: "0.75rem" }}>{r.label}</Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>Contact</Link>

          <Link href="/intake" className="btn-gold text-center" onClick={() => setOpen(false)}>Start Intake</Link>
        </div>
      )}
    </nav>
  )
}
