# ROC Admin — UX/UI Upgrade Loop

Branch: `loop/roc-admin-ux` · DB schema: `roc` (Neon, live prod)

## Build rule (prod safety)
- DB is **live production**. Local `next build` cannot reach it (NEON_HOST/DATABASE_URL are Vercel-only) — verify code with `npx tsc --noEmit`.
- Migrations are **SQL files run manually by a human** against Neon. The loop NEVER executes migrations or deploys to prod. Migration: `sql/2026-06-19-admin-ux-upgrade.sql`.
- New code must tolerate the pre-migration DB (wrap new-table queries so the page degrades gracefully, not 500s).
- Every admin route handler MUST `export const dynamic = "force-dynamic"`.
- DEFACTO/branding rules N/A here.

## Status legend: ⬜ todo · 🔵 in_progress · ✅ done · ⛔ blocked · 🚧 human-gated

| # | Sprint | Row | Status | Notes |
|---|--------|-----|--------|-------|
| 0 | — | Migration SQL (all new schema) | ✅ | `sql/2026-06-19-admin-ux-upgrade.sql`, idempotent |
| 1.1 | 1 | Overview: 7 clickable stat cards + delta + alert banners + 3 recent sections + empty states | ⬜ | server comp; defensive queries for ops/lot tables |
| 1.2 | 1 | Check-in read/unread state (column + mark-read API + UI indicator) | ✅ | checkins GET cols, `[id]` PATCH mark_read, auto-read on open, gold-border + dot |
| 1.3 | 1 | Check-in detail slide-over for ALL cards (already partial) + filter pills (All/Unread/Urgent/Resolved/This Week) | ✅ | pills w/ live counts, initials, score chips, empty state |
| 1.4 | 1 | Follow-up action panel + resolve flow (action_taken/notes/resolved → clears urgent, logs) | ✅ | `[id]` PATCH follow_up; resolves notification |
| 1.5 | 1 | Urgent check-in admin alert (in-app notification row; email gated/stubbed — no real send) | 🔵 | helper `lib/notifications.ts` done; need to call createNotification at urgent check-in submit |
| 2.1 | 2 | Ops Queue page — Kanban + List + card detail slide-over | ⬜ | new `/admin/ops-queue`; `ops_cards` table |
| 2.2 | 2 | FIFO lot creation on Receive Order (lot_identifier, cost) | ⬜ | extend inventory batch flow |
| 2.3 | 2 | FIFO deduction on ops card → packed (oldest lot first, split, block if no stock) | ⬜ | writes `lot_transactions` |
| 2.4 | 2 | Inventory lot ledger page per SKU (`/admin/inventory/[id]`) | ⬜ | lot ledger + usage + reorder history |
| 2.5 | 2 | Notification bell + dropdown in header | ⬜ | header bar component in layout |
| 3.1 | 3 | Client profile page tabs (Profile/Protocol/Check-Ins/Intakes/Orders/Billing) | ⬜ | extend `clients/[id]` |
| 3.2 | 3 | Intake detail page + approval flow + auto-create client | ⬜ | extend `intakes/[id]` |
| 3.3 | 3 | Sidebar nav badges (live counts) + reorder + utility strip + collapse | ⬜ | layout.tsx |
| 3.4 | 3 | Revenue FIFO COGS tie-in + Revenue-by-Protocol chart + date filter | ⬜ | revenue route + page |
| 4.1 | 4 | Global cmd+k search (clients/intakes/checkins/peptides) | ⬜ | search API + modal |
| 4.2 | 4 | SMS triggers from check-in + ops card (draft only, no real send) | ⬜ | |
| 4.3 | 4 | Settings module (all sections, persisted to admin_settings) | ⬜ | settings route + page |
| 4.4 | 4 | CSV exports (clients, revenue, checkins) | ⬜ | |
| 4.5 | 4 | Admin SMS/email alert toggles wired to notification dispatch | ⬜ | |
| 4.6 | 4 | Mobile responsive sidebar collapse polish | ⬜ | |

## Human-gated (do NOT auto-run)
- Run `sql/2026-06-19-admin-ux-upgrade.sql` against Neon prod.
- Deploy: push to `main` (Vercel git integration) OR `vercel --prod` with `target:production`.
