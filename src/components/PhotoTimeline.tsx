"use client"

export interface TimelinePhoto {
  id: string
  checkin_id: string | null
  source: "intake" | "checkin"
  kind: "front" | "side" | "back"
  url: string
  marketing_consent?: boolean
  created_at: string
}

const KIND_ORDER = { front: 0, side: 1, back: 2 } as const

// Groups a flat photo list into upload sessions (baseline intake set, then one
// set per check-in), newest first. Shared by the client dashboard and the
// admin client record.
export default function PhotoTimeline({ photos }: { photos: TimelinePhoto[] }) {
  const groups = new Map<string, TimelinePhoto[]>()
  for (const p of photos) {
    const key = p.checkin_id ? `checkin:${p.checkin_id}` : `${p.source}:${p.created_at.slice(0, 10)}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }
  const sessions = [...groups.values()]
    .map(arr => arr.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]))
    .sort((a, b) => +new Date(b[0].created_at) - +new Date(a[0].created_at))

  if (sessions.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {sessions.map(session => {
        const first = session[0]
        const isBaseline = first.source === "intake"
        const date = new Date(first.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        return (
          <div key={first.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: isBaseline ? "var(--gold)" : "var(--text-mute)" }}>
                {isBaseline ? "Baseline" : "Check-In"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}>{date}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", maxWidth: 480 }}>
              {session.map(p => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" style={{ position: "relative", display: "block", aspectRatio: "3 / 4", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`${p.kind} progress photo`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", bottom: 5, left: 5, fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,0,0,0.65)", color: "var(--gold)", padding: "0.12rem 0.45rem", borderRadius: "var(--radius-pill)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {p.kind}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
