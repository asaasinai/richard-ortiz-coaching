# ROC Admin — Modern UI Rebuild Loop

Branch: `loop/roc-admin-modern` · Spec: `SPEC_MODERN_UI.md` · DB schema: `roc` (Neon, live prod)

## Build rules (prod safety)
- DB is **live production**. Local `next build` can't reach it → verify with `npx tsc --noEmit`.
- Backup of all client data taken before purge → `backups/` (gitignored).
- Purge/seed run via idempotent SQL + node runner using `.vercel` prod env. Backup-first, always.
- Every admin route handler keeps `export const dynamic = "force-dynamic"`.
- Charts are hand-rolled SVG — no heavy chart lib.
- Loop NEVER deploys to prod. Deploy is human-gated (`vercel deploy --prod`).

## Status: ⬜ todo · 🔵 wip · ✅ done · ⛔ blocked · 🚧 human-gated

| # | Sprint | Row | Status | Notes |
|---|--------|-----|--------|-------|
| 0.1 | 0 | Modern token system in `globals.css` (bg/surfaces/border/radius/shadow/type) + Tailwind sync | ✅ | warmer black, layered surfaces, 16px radius, hairline borders, shadow tokens |
| 0.2 | 0 | Shared component classes: `.card`, `.btn`, `.btn-ghost`, `.pill`, `.chip`, `.stat`, `.skeleton` | ✅ | replaces ad-hoc inline styles |
| 0.3 | 0 | `<PageHeader>` component (back arrow + title + helper + action) + breadcrumb | ✅ | router.back() w/ parent fallback; used by every page |
| 0.4 | 0 | Reusable SVG chart kit: `Area`, `Donut`, `Ring`, `Sparkline`, `Bars` | ✅ | animated draw-in, gold+status gradients |
| D.1 | data | Backup + purge client data (idempotent SQL + runner) | ✅ | inventory/settings/users kept |
| D.2 | data | Seed 5 full demo profiles (intakes+protocols+checkins+proposals+ops) | ✅ | real SKU ids; all stats non-zero |
| D.3 | data | Verify seeded counts + every Overview stat query returns believable values | ✅ | 5 clients/5 protocols/15 checkins/5 proposals/5 ops/1 urgent — all stats non-zero |
| 1.1 | 1 | Modernize sidebar + topbar (grouped nav, soft active, pill search, badges) | ✅ | Daily/Catalog/Tools groups, gold-dim soft active, Ops Queue→Fulfillment, Intakes→Applicants |
| 1.2 | 1 | Overview rebuild: Welcome Richard + 4 hero tiles + sparklines + "Today" list + revenue/status/protocol charts | ✅ | new page.tsx; tsc clean |
| 1.3 | 1 | OverviewActivity component restyle to charts + plain language | ✅ | AreaChart trends, modern rows/pills, Recent Applicants rename |
| 2.1 | 2 | Clients list: card/table hybrid, avatars, chips, filter pills + back header | ✅ | colored avatars, pill filters w/ counts, status chips, skeleton loader, mobile-clean |
| 2.2 | 2 | Client profile: header card + progress ring + chip goals + modern tabs | ✅ | avatar + goal chips + week progress ring + pill status + soft tabs |
| 2.3 | 2 | Client Check-Ins tab: weight/energy/mood progress charts | ✅ | trend charts atop check-ins tab + friendly empty state |
| 3.1 | 3 | Check-Ins queue: friendly review cards, trend arrows, slide-over, pills | ✅ | PageHeader+back, pill filters w/counts, per-client trend arrows, skeleton, plain helper |
| 3.2 | 3 | Intakes: "applicants" framing, AI-rec card, approve flow, back header | ✅ | list→avatars+pill filters+status deep-link+skeleton; detail→pill back/status, "Applied" framing |
| 4.1 | 4 | Fulfillment (Ops Queue rename): modern Kanban+list, plain cost | ✅ | PageHeader+back, pill filters, soft view toggle, refreshed column colors/labels, skeleton |
| 4.2 | 4 | Inventory: stock cards + low-stock ring + lot ledger restyle | ✅ | PageHeader+back, 3 ring stat cards, pill filters, skeleton, "cost" plain language |
| 4.3 | 4 | Revenue: donut by protocol + plain-English margin + date filter | ✅ | PageHeader+back, area-chart trend, billing donut, "product cost/margin" plain language, skeleton |
| 5.1 | 5 | SMS Builder / Settings / Calculator / Login modern form pass + back arrows | ✅ | SMS+Settings PageHeader/back+plain copy; login "Welcome back"+back-to-site; calculator already had back |
| 5.2 | 5 | Mobile pass: single-column, 44px targets, back arrow reachable everywhere | ✅ | audited fixed widths (none overflow), global mobile card padding + tap-target rules; all grids collapse to 1col |
| 5.3 | 5 | Final: `npx tsc --noEmit` clean, empty/loading states, acceptance checklist | ✅ | tsc clean, 22/22 admin routes force-dynamic, live stats verified, HANDOFF.md written |

## Human-gated (do NOT auto-run)
- Deploy: `vercel deploy --prod` after review.
