import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // 1. Clients with no protocol assigned
    const noProtocol = await query<{ id: string; first_name: string; last_name: string; email: string; submitted_at: string }>(`
      SELECT i.id, i.first_name, i.last_name, i.email, i.submitted_at
      FROM roc.intakes i
      WHERE i.status = 'APPROVED'
        AND NOT EXISTS (SELECT 1 FROM roc.client_protocols cp WHERE cp.client_id = i.id)
      ORDER BY i.submitted_at DESC
    `)

    // 2. Protocols with no start date set
    const noStartDate = await query<{ client_id: string; first_name: string; last_name: string; email: string; peptide: string; assigned_at: string }>(`
      SELECT cp.client_id, cp.peptide, cp.assigned_at,
             i.first_name, i.last_name, i.email
      FROM roc.client_protocols cp
      LEFT JOIN roc.intakes i ON i.id = cp.client_id
      WHERE cp.protocol_start_date IS NULL
        AND cp.billing_status = 'active'
      ORDER BY cp.assigned_at DESC
    `)

    // 3. Day-1 trigger not yet sent (start date set, followup_sent=false, start_date <= today)
    const pendingDayOne = await query<{ client_id: string; first_name: string; last_name: string; email: string; peptide: string; protocol_start_date: string }>(`
      SELECT cp.client_id, cp.peptide, cp.protocol_start_date,
             i.first_name, i.last_name, i.email
      FROM roc.client_protocols cp
      LEFT JOIN roc.intakes i ON i.id = cp.client_id
      WHERE cp.protocol_start_date IS NOT NULL
        AND cp.followup_sent = FALSE
        AND cp.protocol_start_date <= CURRENT_DATE
      ORDER BY cp.protocol_start_date DESC
    `)

    // 4. Clients overdue for 2-week check-in (no check-in in 16+ days, active protocol)
    const overdueCheckin = await query<{ client_id: string; first_name: string; last_name: string; email: string; last_checkin: string | null; days_since: number }>(`
      SELECT cp.client_id, i.first_name, i.last_name, i.email,
             MAX(c.submitted_at)::text AS last_checkin,
             EXTRACT(DAY FROM NOW() - MAX(c.submitted_at))::int AS days_since
      FROM roc.client_protocols cp
      LEFT JOIN roc.intakes i ON i.id = cp.client_id
      LEFT JOIN roc.checkins c ON c.client_email = i.email
      WHERE cp.billing_status = 'active'
        AND cp.protocol_start_date IS NOT NULL
      GROUP BY cp.client_id, i.first_name, i.last_name, i.email
      HAVING MAX(c.submitted_at) IS NULL
          OR EXTRACT(DAY FROM NOW() - MAX(c.submitted_at)) > 16
      ORDER BY days_since DESC NULLS FIRST
    `)

    // 5. Urgent flags unresolved (last 30 days)
    const urgentFlags = await query<{ id: string; client_email: string; submitted_at: string; data: string }>(`
      SELECT id, client_email, submitted_at, data
      FROM roc.checkins
      WHERE urgent_flag = true
        AND submitted_at > NOW() - INTERVAL '30 days'
      ORDER BY submitted_at DESC
    `)

    // 6. Inventory alerts (critical + warning SKUs)
    const inventoryAlerts = await query<{ id: string; peptide_name: string; strength: string; strength_unit: string; units_in_stock: string }>(`
      SELECT s.id, s.peptide_name, s.strength, s.strength_unit, s.units_in_stock
      FROM roc.inventory_skus s
      WHERE s.units_in_stock <= COALESCE(s.reorder_point, 0)
         OR s.units_in_stock = 0
      ORDER BY s.units_in_stock ASC
    `)

    return NextResponse.json({
      ok: true,
      noProtocol: noProtocol.rows,
      noStartDate: noStartDate.rows,
      pendingDayOne: pendingDayOne.rows,
      overdueCheckin: overdueCheckin.rows,
      urgentFlags: urgentFlags.rows,
      inventoryAlerts: inventoryAlerts.rows,
      counts: {
        noProtocol: noProtocol.rows.length,
        noStartDate: noStartDate.rows.length,
        pendingDayOne: pendingDayOne.rows.length,
        overdueCheckin: overdueCheckin.rows.length,
        urgentFlags: urgentFlags.rows.length,
        inventoryAlerts: inventoryAlerts.rows.length,
      },
    })
  } catch (err) {
    console.error("[ops GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
