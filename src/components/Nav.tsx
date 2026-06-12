"use client"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

const links = [
  { href: "/", label: "Home" },
  { href: "/coaching", label: "Coaching" },
  { href: "/meet-your-coach", label: "Meet Your Coach" },
  { href: "/success-stories", label: "Success Stories" },
]

const clientResources = [
  { href: "/intake", label: "Intake Form" },
  { href: "/checkin", label: "Two-Week Check-In" },
  { href: "/dashboard", label: "Client Dashboard" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const resRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const linkStyle = {
    fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
    color: "var(--text-soft)",
  }

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
            RICHARD ORTIZ
          </span>
          <span style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>COACHING</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={linkStyle} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          <div ref={resRef} style={{ position: "relative" }}>
            <button onClick={() => setResOpen(o => !o)}
              style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              className="hover:text-white transition-colors">
              Client Resources <ChevronDown size={13} style={{ transform: resOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {resOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 0.75rem)", right: 0, minWidth: 200,
                background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                padding: "0.5rem", display: "flex", flexDirection: "column", zIndex: 60,
              }}>
                {clientResources.map(r => (
                  <Link key={r.href} href={r.href} onClick={() => setResOpen(false)}
                    style={{ fontSize: "0.82rem", color: "var(--text-soft)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius)" }}
                    className="hover:text-white hover:bg-black/30 transition-colors">{r.label}</Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/contact" style={linkStyle} className="hover:text-white transition-colors">Contact</Link>
          <Link href="/intake" className="btn-gold" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>Start Intake</Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: "var(--text)" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }} className="md:hidden px-4 py-4 flex flex-col gap-4">
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
