import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

async function count(sql: string): Promise<number> {
  try { return Number(((await query<{ n: string }>(sql)).rows[0]?.n) ?? 0) } catch { return 0 }
}

// Live counts for sidebar nav badges.
export async function GET() {
  const [pendingOps, unreadCheckins, pendingIntakes, lowStock] = await Promise.all([
    count(`SELECT COUNT(*) n FROM roc.ops_cards WHERE status = 'pending'`),
    count(`SELECT COUNT(*) n FROM roc.checkins WHERE read = false AND dismissed = false`),
    count(`SELECT COUNT(*) n FROM roc.intakes WHERE status = 'PENDING'`),
    count(`SELECT COUNT(*) n FROM roc.inventory_skus WHERE units_in_stock <= COALESCE(reorder_point,0) OR units_in_stock = 0`),
  ])
  return NextResponse.json({ pending_ops: pendingOps, unread_checkins: unreadCheckins, pending_intakes: pendingIntakes, low_stock: lowStock })
}
