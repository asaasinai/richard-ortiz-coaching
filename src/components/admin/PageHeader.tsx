"use client"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  title: string
  subtitle?: string
  /** Where the back arrow goes. Falls back to router.back(). */
  backHref?: string
  backLabel?: string
  /** Optional right-aligned action(s). */
  action?: React.ReactNode
}

/**
 * Standard admin page header. Renders a back arrow on EVERY screen
 * (hard product requirement), a plain-language title + helper subtitle,
 * and an optional primary action.
 */
export default function PageHeader({ title, subtitle, backHref, backLabel = "Back", action }: Props) {
  const router = useRouter()

  const Back = backHref ? (
    <Link href={backHref} className="ph-back" style={backStyle}>
      <ChevronLeft size={16} /> {backLabel}
    </Link>
  ) : (
    <button onClick={() => router.back()} className="ph-back" style={backStyle}>
      <ChevronLeft size={16} /> {backLabel}
    </button>
  )

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ marginBottom: "0.85rem" }}>{Back}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.4rem,4vw,2rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{title}</h1>
          {subtitle && <p style={{ color: "var(--text-mute)", fontSize: "0.9rem", marginTop: "0.35rem" }}>{subtitle}</p>}
        </div>
        {action && <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>{action}</div>}
      </div>
      <style>{`.ph-back:hover { color: var(--text) !important; background: var(--surface-2); }`}</style>
    </div>
  )
}

const backStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.2rem",
  background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)",
  color: "var(--text-mute)", fontSize: "0.82rem", fontWeight: 600,
  padding: "0.35rem 0.85rem 0.35rem 0.6rem", cursor: "pointer", textDecoration: "none",
  transition: "all .12s",
}
