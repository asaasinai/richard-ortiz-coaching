"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, AlertTriangle, ClipboardList, Package, Clock, Activity, CalendarDays, DollarSign } from "lucide-react"

interface Notif {
  id: string
  type: string
  ref_id: string | null
  ref_type: string | null
  message: string
  read: boolean
  created_at: string
}

const ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  urgent_checkin:    { icon: AlertTriangle, color: "#ef4444" },
  new_intake:        { icon: ClipboardList, color: "var(--gold)" },
  low_stock:         { icon: Package,       color: "#f59e0b" },
  ops_overdue:       { icon: Clock,         color: "#f59e0b" },
  checkin_submitted: { icon: Activity,      color: "#3b82f6" },
  checkin_due:       { icon: CalendarDays,  color: "#60a5fa" },
  renewal_due:       { icon: DollarSign,    color: "var(--gold)" },
}

function deeplink(nf: Notif): string {
  switch (nf.ref_type) {
    case "checkin":   return "/admin/checkins"
    case "intake":    return nf.ref_id ? `/admin/intakes/${nf.ref_id}` : "/admin/intakes"
    case "inventory": return nf.ref_id ? `/admin/inventory/${nf.ref_id}` : "/admin/inventory"
    case "ops":       return nf.ref_id ? `/admin/ops-queue/${nf.ref_id}` : "/admin/ops-queue"
    case "schedule":  return "/admin/schedule"
    default:          return "/admin"
  }
}

function ago(ts: string): string {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const load = useCallback(() => {
    fetch("/api/admin/notifications").then(r => r.json()).then(d => {
      setNotifs(d.notifications ?? [])
      setUnread(d.unread ?? 0)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const markRead = (id: string) => {
    fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read", id }) })
    setNotifs(ns => ns.map(x => x.id === id ? { ...x, read: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }
  const markAll = () => {
    fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_all_read" }) })
    setNotifs(ns => ns.map(x => ({ ...x, read: true })))
    setUnread(0)
  }
  const onClick = (nf: Notif) => { markRead(nf.id); setOpen(false); router.push(deeplink(nf)) }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications"
        style={{ position: "relative", background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer", padding: "0.4rem", display: "flex", alignItems: "center" }}>
        <Bell size={19} />
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "#ef4444", color: "#fff", fontSize: "0.62rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, maxHeight: 440, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)", zIndex: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)" }}>
            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Notifications</span>
            {unread > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "0.74rem", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-mute)", fontSize: "0.82rem" }}>You&apos;re all caught up</div>
          ) : notifs.map(nf => {
            const cfg = ICONS[nf.type] ?? { icon: Bell, color: "var(--text-mute)" }
            return (
              <button key={nf.id} onClick={() => onClick(nf)}
                style={{ width: "100%", textAlign: "left", display: "flex", gap: "0.6rem", padding: "0.7rem 1rem", borderBottom: "1px solid var(--border)", background: nf.read ? "transparent" : "rgba(201,168,76,0.06)", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--border)", cursor: "pointer" }}>
                <cfg.icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: nf.read ? 400 : 600 }}>{nf.message}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-mute)", marginTop: 2 }}>{ago(nf.created_at)}</div>
                </div>
                {!nf.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", flexShrink: 0, marginTop: 5 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
