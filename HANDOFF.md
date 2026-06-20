# ROC Admin — Modern UI Rebuild · HANDOFF

**Branch:** `loop/roc-admin-modern` · **Spec:** `SPEC_MODERN_UI.md` (live: preview.smashforms.com/sites/roc-admin-modern-spec/)
**Status:** ✅ All 21 roadmap rows complete. `npx tsc --noEmit` clean. Not deployed (human-gated).

## What shipped

**Design system (new tokens in `globals.css`)** — warmer near-black, layered surfaces (`#141417` → `#1C1C21` → `#26262D`), neutral hairline borders (gold reserved for accent/focus), 16px radii, soft shadows, and reusable `.card / .btn / .pill / .chip / .skeleton` classes. Same black + gold brand, modern execution.

**Shared components**
- `components/admin/PageHeader.tsx` — back arrow on **every** admin screen (`router.back()` + parent fallback) + plain-language title/subtitle + optional action.
- `components/admin/Charts.tsx` — hand-rolled SVG kit (Area, Sparkline, Donut, Ring, Bars), animated, zero dependencies.

**Screens modernized**
- **Overview** — "Welcome, Richard." greeting, 4 glanceable hero tiles (+ sparkline), plain-English "Today" action list, revenue/client-status donuts, top-protocol bars, area-chart activity.
- **Sidebar** — grouped Daily / Catalog / Tools, soft gold-dim active state; "Ops Queue → Fulfillment", "Intakes → Applicants".
- **Clients** — avatar rows, pill filters w/ counts, status chips, skeletons.
- **Client profile** — avatar + goal chips + week-progress ring + pill status; Check-Ins tab now shows weight/energy/mood trend charts.
- **Check-Ins** — PageHeader, pill filters, per-client trend arrows, skeleton.
- **Applicants (intakes)** — avatars, pill filters, `?status=` deep-link; detail page pill back/status, "Applied" framing.
- **Fulfillment** — PageHeader, pill filters, soft view toggle, refreshed Kanban colors/labels, skeleton.
- **Inventory** — 3 stock-ring summary cards, pill filters, skeleton, "cost" plain language.
- **Revenue** — PageHeader, area-chart trend, billing donut, "product cost / margin" plain language, skeleton.
- **SMS / Settings / Login** — PageHeader + back (SMS, Settings); login "Welcome back" + back-to-site. Calculator already had a back arrow.
- **Mobile** — global card-padding + tap-target rules; all grids collapse to one column; no fixed-width overflow.

## Data (live prod `roc` schema)
- Full backup of prior client data → `backups/roc-clientdata-backup-*.json` (gitignored — PII). Restore from there if needed.
- Purged client data and seeded **5 full demo profiles** (`sql/seed-demo-profiles.mjs`, idempotent):
  Marcus Bennett (Tirz+BPC, wk6) · Sarah Chen (GHK-Cu+NAD+, wk3) · David Rodriguez (BPC+TB-500, wk8, **urgent flag**) · Emily Watson (Semaglutide, wk1, new) · James Park (CJC+Ipamorelin, wk12, signed).
- **Verified live:** 5 active clients · 15 check-ins · 1 open urgent · $1,825 MRR · 1 order pending · 4 signed proposals.

## To deploy (your call)
DB writes are already live (seed ran against prod). To ship the UI:
```
cd ~/richard-ortiz-coaching
git checkout main && git merge loop/roc-admin-modern   # or open a PR
vercel deploy --prod                                    # git deploys wedge — use CLI
```
(inventory / inventory_batches / admin_settings / users were left untouched. No schema migrations were run.)

## Notes / minor gaps
- Demo client emails use `@demo.roc` so they never collide with real inboxes or trigger sends.
- Re-running `sql/seed-demo-profiles.mjs` re-purges + re-seeds (safe, idempotent) — it deletes ALL client rows first, so don't run it once real clients exist without re-checking the backup step.
- Drag-and-drop between Fulfillment columns is still button-driven (deferred in the prior loop; not in this scope).
