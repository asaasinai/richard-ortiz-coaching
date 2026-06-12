"use client"
import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const links = [
  { href: "/peptides", label: "Peptides" },
  { href: "/protocols", label: "Protocols" },
  { href: "/calculator", label: "Calculator" },
  { href: "/intake", label: "Intake" },
  { href: "/checkin", label: "Check-In" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contact", label: "Contact" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
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
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-soft)" }}
              className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          <Link href="/intake" className="btn-gold" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>Start Intake</Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: "var(--text)" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }} className="md:hidden px-4 py-4 flex flex-col gap-4">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>{l.label}</Link>
          ))}
          <Link href="/intake" className="btn-gold text-center" onClick={() => setOpen(false)}>Start Intake</Link>
        </div>
      )}
    </nav>
  )
}