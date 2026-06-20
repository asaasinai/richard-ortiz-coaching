"use client"
import { useId } from "react"

/* ──────────────────────────────────────────────────────────
   Lightweight hand-rolled SVG chart kit for the ROC admin.
   No external dependency. Gold + status gradients on dark.
   ────────────────────────────────────────────────────────── */

type Pt = { label?: string; value: number }

/** Gradient-filled area + line chart. */
export function AreaChart({ data, color = "var(--gold)", height = 140, label }: {
  data: Pt[]; color?: string; height?: number; label?: string
}) {
  const id = useId().replace(/:/g, "")
  const w = 600, h = height, pad = 6
  if (!data.length) return <Empty height={h} label={label} />
  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const span = max - min || 1
  const x = (i: number) => pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2)
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ")
  const area = `${line} L${x(data.length - 1)},${h} L${x(0)},${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#a${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "draw 1.1s ease forwards" }} />
      {data.map((d, i) => i === data.length - 1 && (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill={color} />
      ))}
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  )
}

/** Inline sparkline for stat tiles. */
export function Sparkline({ data, color = "var(--gold)", width = 90, height = 30 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (!data.length) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0), span = max - min || 1
  const x = (i: number) => (i / Math.max(data.length - 1, 1)) * width
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

/** Donut / ring breakdown. segments: [{label, value, color}] */
export function Donut({ segments, size = 160, thickness = 22, centerLabel, centerSub }: {
  segments: { label: string; value: number; color: string }[]
  size?: number; thickness?: number; centerLabel?: string; centerSub?: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              strokeLinecap="butt" style={{ transition: "stroke-dasharray .8s ease" }} />
          )
          offset += len
          return el
        })}
      </svg>
      {(centerLabel || segments.length) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {centerLabel && <div style={{ marginBottom: "0.25rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem" }}>{centerLabel}</div>
            {centerSub && <div style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>{centerSub}</div>}
          </div>}
          {segments.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ color: "var(--text-soft)", flex: 1 }}>{s.label}</span>
              <span style={{ fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Progress ring (week X of Y, stock level…). */
export function Ring({ value, max, size = 64, thickness = 7, color = "var(--gold)", label }: {
  value: number; max: number; size?: number; thickness?: number; color?: string; label?: string
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(value / (max || 1), 1)
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .9s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size > 56 ? "0.95rem" : "0.8rem", lineHeight: 1 }}>{label ?? value}</span>
      </div>
    </div>
  )
}

/** Horizontal bar list (top protocols, revenue by category…). */
export function Bars({ data, color = "var(--gold)" }: { data: { label: string; value: number; sub?: string }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  if (!data.length) return <Empty height={120} />
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
            <span style={{ color: "var(--text-soft)" }}>{d.label}</span>
            <span style={{ fontWeight: 700 }}>{d.sub ?? d.value}</span>
          </div>
          <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: color, borderRadius: 6, transition: "width .8s ease" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty({ height = 140, label }: { height?: number; label?: string }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-mute)", fontSize: "0.85rem" }}>
      {label ? `No ${label} data yet` : "No data yet"}
    </div>
  )
}
