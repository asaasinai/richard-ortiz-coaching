import { query } from "@/lib/db"

export type NotificationType =
  | "urgent_checkin"
  | "new_intake"
  | "low_stock"
  | "ops_overdue"
  | "checkin_submitted"

export type RefType = "checkin" | "intake" | "inventory" | "ops"

// Create a notification. Dedupes on (type, ref_id) for unresolved rows via the
// partial unique index in the migration — ON CONFLICT keeps it idempotent.
export async function createNotification(opts: {
  type: NotificationType
  refId?: string | null
  refType?: RefType | null
  message: string
  adminId?: string | null
}): Promise<void> {
  try {
    await query(
      `INSERT INTO roc.notifications (type, ref_id, ref_type, message, admin_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (type, ref_id) WHERE resolved = FALSE DO NOTHING`,
      [opts.type, opts.refId ?? null, opts.refType ?? null, opts.message, opts.adminId ?? null]
    )
  } catch (err) {
    // Never let notification writes break the primary action.
    console.error("[createNotification]", err)
  }
}

// Resolve (and mark read) any open notifications pointing at a record.
export async function resolveNotifications(type: NotificationType, refId: string): Promise<void> {
  try {
    await query(
      `UPDATE roc.notifications SET resolved = true, read = true
       WHERE type = $1 AND ref_id = $2 AND resolved = false`,
      [type, refId]
    )
  } catch (err) {
    console.error("[resolveNotifications]", err)
  }
}

export interface NotificationRow {
  id: string
  type: NotificationType
  ref_id: string | null
  ref_type: RefType | null
  message: string
  read: boolean
  resolved: boolean
  created_at: string
}

// Exclude notifications whose referenced record no longer exists (e.g. a
// check-in or intake was deleted) so the bell never shows a ghost "1 alert,
// nothing there". NULL ref / other ref types always pass.
const LIVE_REF = `(
  n.ref_id IS NULL OR n.ref_type IS NULL
  OR (n.ref_type = 'checkin' AND EXISTS (SELECT 1 FROM roc.checkins c WHERE c.id::text = n.ref_id))
  OR (n.ref_type = 'intake'  AND EXISTS (SELECT 1 FROM roc.intakes i WHERE i.id::text = n.ref_id))
  OR n.ref_type NOT IN ('checkin','intake')
)`

export async function getNotifications(limit = 20): Promise<{ rows: NotificationRow[]; unread: number }> {
  try {
    const [list, unread] = await Promise.all([
      query<NotificationRow>(
        `SELECT n.id, n.type, n.ref_id, n.ref_type, n.message, n.read, n.resolved, n.created_at
         FROM roc.notifications n
         WHERE n.resolved = false AND ${LIVE_REF}
         ORDER BY n.created_at DESC LIMIT $1`,
        [limit]
      ),
      query<{ n: string }>(`SELECT COUNT(*) AS n FROM roc.notifications n WHERE n.read = false AND n.resolved = false AND ${LIVE_REF}`),
    ])
    return { rows: list.rows, unread: Number(unread.rows[0]?.n ?? 0) }
  } catch {
    // Pre-migration / table absent — degrade to empty feed, never 500.
    return { rows: [], unread: 0 }
  }
}
