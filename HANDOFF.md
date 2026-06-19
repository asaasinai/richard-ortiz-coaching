# HANDOFF — ROC Admin UX/UI Upgrade

**Branch:** `loop/roc-admin-ux` (local; not pushed) · **Base:** `main` · **Built:** 2026-06-19 (autonomous /loop)

## STATE
All 22 roadmap rows ✅ (Sprints 1–4). `npx tsc --noEmit` clean on every commit. 18 commits.
Nothing executed against the live DB; nothing deployed. See ROADMAP.md for the row-by-row table and LOOP_LOG.md for per-iteration detail.

## LAND HERE
- Worktree: `/home/marshall/richard-ortiz-coaching` on branch `loop/roc-admin-ux`.
- Last sha: `git log -1` on that branch. To review: `git diff main...loop/roc-admin-ux`.
- Repo has a GitHub remote (`asaasinai/richard-ortiz-coaching`); branch is **local only** — `git push -u origin loop/roc-admin-ux` to back it up / open a PR.

## RUN IT  (⚠ two human-gated steps — the loop did NOT do these)
1. **Migration (REQUIRED before deploy).** Run `sql/2026-06-19-admin-ux-upgrade.sql` against Neon `neondb` schema `roc` (psql, as migrations always are here). Idempotent. Adds: checkin read/resolve/follow-up cols, `notifications`, `ops_cards`, `lot_transactions`, lot cols on `inventory_batches`, `admin_settings` (+ seeds defaults). The new code assumes these exist; pages degrade gracefully pre-migration (no 500s) but features need it.
2. **Deploy.** Either merge to `main` (Vercel git integration auto-deploys production) OR `vercel --prod` from the repo with `"target":"production"` (API-triggered deploys default to preview and won't take over richardortizcoaching.com).
- **Verify locally first:** `npx tsc --noEmit` (the gate — `next build` FAILS locally because NEON_HOST/DATABASE_URL are Vercel-only and the `/admin` server page prerenders DB calls; this is environmental, not a bug). On Vercel the env vars are set, so build/prerender succeed.

## WHY / DECISIONS
- **Reused `roc.inventory_batches` as the FIFO lot ledger** (it already was one — the inventory route computed FIFO cost from it). The spec's `inventory_lots` = this table; added `lot_identifier`/`received_by` cols rather than a duplicate table.
- **New cross-ref columns are TEXT with `::text` cast joins** — the existing id column types (uuid/serial/text) couldn't be confirmed offline, and this matches the codebase's loose raw-SQL style. If you later want hard FKs, confirm `roc.intakes.id` / `roc.inventory_skus.id` types and tighten.
- **"Client" = APPROVED intake** in this schema (`client_protocols.client_id = intakes.id`); there is no separate clients table, so intake-approval needs no auto-create step beyond the status change.
- **Real outbound is NOT triggered by the loop.** Urgent-checkin/new-intake create *in-app* notifications; the pre-existing Resend email path (`sendAdminCheckinUrgent`/`sendAdminIntakeNotify`) was left untouched. SMS is copy-only (SMS Builder). Wiring the settings alert-toggles to actually dispatch email/SMS via Resend/Twilio is a deliberate human-gated step.
- **FIFO commit is not transactional across calls** (Neon HTTP has no multi-statement txn). Mitigated by an all-or-nothing availability pre-check before any deduction; fine for a single-admin tool. If concurrency grows, move the deduction into one CTE statement.

## GOTCHAS
- Every new `/api/admin/*` route has `export const dynamic = "force-dynamic"` (App Router caches GET handlers otherwise → stale UI). Keep this on any new admin route.
- `/api/intake` and `/api/checkin` are public POST endpoints (no force-dynamic needed).
- Local dev can't hit the DB — don't trust a local `next build` failure on `/admin`; use tsc.

## NEXT ACTIONS (ordered)
1. Run the migration (step 1 above), then deploy (step 2).
2. Smoke-test post-deploy: submit a low-score check-in → urgent notification appears in the bell + Overview banner; create an Ops card → advance to Packed → confirm FIFO deduction in the SKU lot ledger + `lot_transactions`.
3. **Deferred / not built (scope gaps, flagged honestly):**
   - **Ops auto-generation**: the `auto_generate_ops_cards` + `billing_cycle_day` settings persist, but no job creates recurring ops cards yet. Needs a cron/route that, on the billing day, generates a card per active protocol. (Settings UI + storage are ready.)
   - **Alert dispatch**: email/SMS toggles are stored and read, but a dispatcher that sends on `notify_*` is not wired (see Decisions).
   - **cmd+k**: searches clients/intakes/inventory; check-in-by-content search not included.
   - **Kanban drag-drop**: status advances via the card detail button (functional); column drag is a polish item.
