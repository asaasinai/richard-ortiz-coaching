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
