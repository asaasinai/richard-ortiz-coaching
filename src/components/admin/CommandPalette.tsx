"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Package, CornerDownLeft } from "lucide-react"

interface Result { type: string; label: string; sublabel: string; href: string }

const TYPE_ICON: Record<string, typeof Users> = { Client: Users, Inventory: Package }

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(o => !o) }
      if (e.key === "Escape") setOpen(false)
    }
    const openEvt = () => setOpen(true)
    window.addEventListener("keydown", h)
    window.addEventListener("roc:cmdk", openEvt)
    return () => { window.removeEventListener("keydown", h); window.removeEventListener("roc:cmdk", openEvt) }
  }, [])

  useEffect(() => { if (open) { setQ(""); setResults([]); setActive(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])

  const search = useCallback((term: string) => {
    if (term.trim().length < 2) { setResults([]); return }
    fetch(`/api/admin/search?q=${encodeURIComponent(term)}`).then(r => r.json()).then(d => { setResults(d.results ?? []); setActive(0) }).catch(() => {})
  }, [])
  useEffect(() => { const t = setTimeout(() => search(q), 180); return () => clearTimeout(t) }, [q, search])

  const go = (r: Result) => { setOpen(false); router.push(r.href) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]) }
  }

  if (!open) return null
  return (
    <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "92%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <Search size={17} style={{ color: "var(--text-mute)" }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search clients, intakes, inventory…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: "0.95rem" }} />
          <kbd style={{ fontSize: "0.66rem", color: "var(--text-mute)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.1rem 0.35rem" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {q.length < 2 ? (
            <p style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-mute)", fontSize: "0.84rem" }}>Type at least 2 characters…</p>
          ) : results.length === 0 ? (
            <p style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-mute)", fontSize: "0.84rem" }}>No matches for “{q}”</p>
          ) : results.map((r, i) => {
            const Icon = TYPE_ICON[r.type] ?? Search
            return (
              <button key={i} onClick={() => go(r)} onMouseEnter={() => setActive(i)}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.7rem 1rem", background: i === active ? "var(--surface-2)" : "transparent", border: "none", cursor: "pointer" }}>
                <Icon size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.86rem", color: "var(--text)", fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-mute)" }}>{r.type} · {r.sublabel}</div>
                </div>
                {i === active && <CornerDownLeft size={13} style={{ color: "var(--text-mute)", flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
