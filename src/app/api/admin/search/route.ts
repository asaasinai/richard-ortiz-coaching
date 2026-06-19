import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export interface SearchResult { type: string; label: string; sublabel: string; href: string }

// GET /api/admin/search?q=
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })
  const like = `%${q}%`
  const results: SearchResult[] = []

  // Clients / intakes (people)
  try {
    const people = await query<{ id: string; first_name: string; last_name: string; email: string; status: string }>(
      `SELECT id, first_name, last_name, email, status FROM roc.intakes
       WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
       ORDER BY submitted_at DESC LIMIT 6`, [like])
    for (const p of people.rows) {
      const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email
      results.push({ type: "Client", label: name, sublabel: p.email, href: p.status === "PENDING" ? `/admin/intakes/${p.id}` : `/admin/clients/${p.id}` })
    }
  } catch { /* degrade */ }

  // Inventory / peptides
  try {
    const skus = await query<{ id: string; peptide_name: string; strength: string; strength_unit: string }>(
      `SELECT id, peptide_name, strength, strength_unit FROM roc.inventory_skus
       WHERE peptide_name ILIKE $1 ORDER BY peptide_name LIMIT 6`, [like])
    for (const s of skus.rows) {
      results.push({ type: "Inventory", label: `${s.peptide_name} ${s.strength}${s.strength_unit}`, sublabel: "Lot ledger", href: `/admin/inventory/${s.id}` })
    }
  } catch { /* degrade */ }

  return NextResponse.json({ results })
}
