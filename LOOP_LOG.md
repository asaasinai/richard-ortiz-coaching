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

## Iteration 4 (2026-06-19)
**DONE** — Sprint 2 COMPLETE (2.2, 2.4):
- 2.2: batch route now auto-generates `lot_identifier` (LOT-YYYYMMDD-XXXX) when blank + accepts `received_by`; per-SKU receive form has optional Lot # field; reset state updated.
- 2.4: `/api/admin/inventory/[id]` returns SKU + lot ledger + FIFO usage (degrade-safe). `/admin/inventory/[id]` page: 4 overview stats (units, lot value, wholesale/unit, editable reorder threshold), Lot Ledger table (FIFO, full/partial/depleted status), Usage History (deductions w/ COGS + ops-card deeplinks), Reorder History. inventory PATCH gained `reorder_point`; SKU rows now have a 'Ledger →' link.
- tsc clean.

**NEXT** — Sprint 3: client profile tabs (3.1), intake detail + approval + auto-create client (3.2), sidebar nav badges/reorder/utility-strip (3.3), revenue FIFO COGS + by-protocol chart (3.4).

## Iteration 5 (2026-06-19)
**DONE** — Sprint 3 COMPLETE (3.1–3.4):
- 3.3 Sidebar: `/api/admin/badges` (live counts), nav redesigned to spec order w/ colored badges (60s poll), bottom utility strip, collapse toggle (220↔56 icon rail), left-gold-border active style.
- 3.4 Revenue: route adds by-protocol avg-margin + orders-this-month + server avgMargin; page adds Revenue-by-Protocol bar chart, clickable KPI cards (anchors/deeplinks), date-range trend selector, Export CSV, client→/clients/[id]?tab=billing links.
- 3.1 Client profile: added Orders tab (ops_cards history w/ lots+COGS+ship dates; client filter added to ops-cards GET) + Billing tab (rate/status/lifetime-COGS/est-margin + inline rate save); ?tab= deep-link via window.location.
- 3.2 Intake: v2 AI-rec→approve→proposal flow already existed. Added: new_intake notification on submit (bell+banner), resolve on approve/flag, ?status= filter on intakes GET. NOTE: in this schema an APPROVED intake IS the client (client_protocols.client_id = intakes.id) — no separate clients table to auto-create.
- tsc clean throughout.

**NEXT** — Sprint 4: cmd+k global search (4.1), SMS triggers from checkin/ops (4.2, draft-only), Settings module persisted to admin_settings (4.3), CSV exports (4.4 — revenue done; add clients/checkins), alert toggles wired (4.5), mobile sidebar polish (4.6). Then 360 review + HANDOFF.md.

## Iteration 6 (2026-06-19) — FINAL
**DONE** — Sprint 4 COMPLETE (4.1–4.6), roadmap COMPLETE (22/22):
- 4.3/4.5 Settings: `/api/admin/settings` GET/POST → admin_settings; full page (Alerts toggles, Check-In threshold, Inventory, Ops Queue auto-gen+billing-day, Admin profile).
- 4.1 cmd+k: `/api/admin/search` + CommandPalette (⌘K + header button via custom event, debounced, arrow/enter nav) over clients/intakes/inventory.
- 4.2 SMS: checkin/ops SMS buttons → /admin/sms?to=; recipient banner; copy-only (no real send).
- 4.4 CSV: revenue (iter5) + clients (status pills + ?status= + export) + checkins exports.
- 4.6 Mobile: existing drawer + desktop collapse rail.

**360 REVIEW:**
- All 22 rows shipped, tsc clean across all 18 commits. force-dynamic verified on every admin route.
- DEFERRED (flagged in HANDOFF, not silent): ops auto-generation job (settings ready, generator not built); email/SMS alert DISPATCH (toggles stored+read, sender not wired — deliberate, real outbound is human-gated); cmd+k check-in-by-content; Kanban drag-drop (button-advance is functional).
- HUMAN-GATED: run `sql/2026-06-19-admin-ux-upgrade.sql` on Neon; deploy via main-merge or `vercel --prod target:production`. Branch is local — push to back up.
- Wrote HANDOFF.md. Loop STOPPING (roadmap complete).
