# Loop Log — ROC Admin UX/UI Upgrade

## Iteration 1 (2026-06-19)
**PLAN/RECON** — Mapped existing v2 admin (13 pages, 13 API routes). Key findings:
- `roc.*` schema is hand-rolled SQL; Prisma `public` schema is legacy/unused by admin.
- FIFO lot ledger ALREADY exists as `roc.inventory_batches` (sku_id, qty_received, qty_remaining, unit_cost, received_at) — inventory route already computes FIFO cost from it. → Extend, don't duplicate (spec's `inventory_lots` = `inventory_batches`).
- `/admin/ops` is a "next-actions" page, NOT the fulfillment Kanban → build separate `/admin/ops-queue`.
- Check-ins detail panel already opens for ALL cards (not just urgent); scores live in `checkins.data` jsonb (progressScore/energyScore/moodScore). Filter currently only All/Urgent.
- Stat cards on Overview already clickable; need full 7 + deltas + banners + recent sections.
- Cross-ref id types unknown (uuid/serial/text) → new ref cols typed TEXT, joins cast ::text.

**DONE** — Row 0: wrote `sql/2026-06-19-admin-ux-upgrade.sql` (checkins state cols, notifications, ops_cards, inventory_batches lot cols, lot_transactions, admin_settings — all idempotent). Wrote ROADMAP.md.

**NEXT** — Sprint 1: Overview rebuild (1.1), check-in read/unread + follow-up/resolve (1.2–1.5). All consume the new schema; built forward against it, verified via `npx tsc --noEmit`.

## Iteration 2 (2026-06-19)
**DONE** — Sprint 1 COMPLETE.
- 1.2/1.3/1.4 (iter 1) checkin read/unread/filters/follow-up.
- 1.5: `/api/checkin` submit now derives urgency from `urgent_threshold` (admin_settings, default 5) across progress/energy/mood scores, and writes an in-app notification (`urgent_checkin` or `checkin_submitted`). Pre-existing Resend email path left as-is (not my outbound action). Added `lib/settings.ts` (get/set, degrade-safe).
- 1.1: Overview rebuilt — 7 hover-scale clickable stat cards (Total Intakes, Pending, Check-Ins, Urgent, Active Clients, Ops Pending, Low Stock), week-over-week delta on intakes+checkins, 3 persistent alert banners (urgent/pending/low-stock), 3 recent sections (Check-Ins w/ unread dot + urgent badge, Intakes w/ status badge, Ops Queue next actions), icon empty states. All new-table queries wrapped degrade-safe (`safe()` helper) so a pre-migration/partial deploy renders zeros, never 500s.
- tsc clean.

**NEXT** — Sprint 2: Ops Queue page (`/admin/ops-queue` Kanban+List+detail, `ops_cards`), FIFO lot creation on receive + FIFO deduction on pack (`lot_transactions`), inventory lot ledger `/admin/inventory/[id]`, notification bell in header.

## Iteration 3 (2026-06-19)
**DONE** — Sprint 2 rows 2.5, 2.1, 2.3:
- 2.5 Notification bell: `/api/admin/notifications` GET+POST, `components/admin/NotificationBell.tsx` (30s poll, unread badge, type-icon rows, deeplinks, caught-up empty), header bar in layout (desktop) + bell in mobile topbar, avatar→settings stub.
- 2.1 Ops Queue: `/api/admin/ops-cards` (list w/ status+search filters, create w/ FIFO-costed lines) + `/[id]` (get+previews, PATCH advance/ship/deliver/update/cancel). `/admin/ops-queue` Kanban(default)+List toggle, filter pills, create modal (approved-client + SKU picker), overdue flag, empty state. `/admin/ops-queue/[id]` stepper, line items w/ FIFO preview or committed lots, total COGS, tracking+notes (blur-save), advance/cancel/shipment-SMS. Sidebar repointed to /admin/ops-queue.
- 2.3 FIFO: `lib/fifo.ts` previewFifo + commitFifo (oldest-lot-first, split across lots, GREATEST(0,...) stock floor, lot_transactions log). Advance pending→packed runs an all-or-nothing precheck across every line item before any deduction (409 + block on insufficient).
- Note: cross-call atomicity limited by Neon HTTP (no multi-statement txn); single-admin tool + pre-check makes partial-write risk minimal. Documented in fifo.ts.
- DnD between Kanban columns deferred to polish (advance-by-button is the functional path). tsc clean throughout.

**NEXT** — Sprint 2 finish: 2.2 (receive-order lot_identifier+cost), 2.4 (inventory lot ledger page `/admin/inventory/[id]`). Then Sprint 3.
