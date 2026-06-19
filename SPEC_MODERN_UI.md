# ROC Admin — Modern UI Rebuild Spec

**Target:** `richardortizcoaching.com/admin`
**Branch:** `loop/roc-admin-modern`
**Goal:** Rebuild the admin UX/UI to a modern, premium feel (Credit Karma / Apple-grade) while keeping the existing **black + gold** brand palette. Purge real client data, seed 5 full demo profiles, and confirm every stat, card, and graph works. Simplify so a non-technical coach can run the whole business from this screen.

---

## 1. Design philosophy

Keep the brand (black `#000`, gold `#C9A84C`). Change the *execution* from "sharp dark dashboard" to "premium, calm, legible product."

| Dimension | Today | Modern target |
|---|---|---|
| Corners | 4px sharp | 14–18px soft, friendly |
| Surfaces | flat `#111` on `#000` | layered: `#0C0C0E` base → `#16161A` card → `#1E1E24` raised, with hairline borders + soft ambient shadow |
| Gold use | borders everywhere (busy) | gold reserved for **focus, primary action, key metric** — not every border |
| Type | one weight jump | clear scale: 32/24/18/15/13 with tuned line-height + letter-spacing |
| Density | tight, technical | generous whitespace, breathing room, larger tap targets (44px min) |
| Motion | hover scale | calm spring transitions (framer-motion), 150–220ms, no jank |
| Language | jargon ("Ops Queue", "FIFO COGS") | plain-language labels + helper subtext under every section |
| Charts | minimal/none | the centerpiece — gradient area, donut, progress rings, sparklines |

**Net feel:** Apple's dark mode + Linear/Vercel clarity + Credit Karma's "one glanceable number + plain English" friendliness. Luxury, not clinical.

### Design tokens (new)
```
--bg:        #0A0A0B   (near-black, warmer than pure #000)
--surface-1: #141417   (cards)
--surface-2: #1C1C21   (raised / hover / inputs)
--surface-3: #26262D   (popovers, active)
--border:    rgba(255,255,255,0.07)   (hairline, neutral — NOT gold by default)
--border-strong: rgba(255,255,255,0.12)
--gold:      #C9A84C   --gold-light: #E8C96A   --gold-dim: rgba(201,168,76,0.12)
--text:      #F5F5F4   --text-soft: #B4B4B8   --text-mute: #76767E
--good: #34D399  --warn: #FBBF24  --bad: #F87171  --info: #60A5FA
--radius: 16px  --radius-sm: 10px  --radius-pill: 999px
--shadow-card: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.25)
--shadow-pop:  0 12px 40px rgba(0,0,0,.55)
font: Inter (body) / Inter Tight (display headings + big numbers)
```

Implementation: replace `src/app/globals.css` tokens + add reusable component classes (`.card`, `.btn`, `.pill`, `.chip`, `.stat`, `.ring`). Keep Tailwind config in sync. Migrate pages off ad-hoc inline styles toward shared classes where practical (loop does this page-by-page).

---

## 2. Global navigation & wayfinding

- **Back arrows on every screen** (hard requirement). New `<PageHeader>` component renders a back chevron ("← Clients") that returns to the logical parent (detail → list → overview), plus the page title + one-line helper subtext + optional primary action. Every admin page uses it. Uses `router.back()` with a sensible parent fallback so it works from deep links.
- Sidebar: same nav set, modernized — softer active state (gold-dim pill, no harsh left-border), grouped with quiet section labels ("Daily", "Catalog", "Tools"), live count badges kept but restyled as subtle pills. Collapse rail preserved.
- Topbar: keep ⌘K search + notification bell; restyle to floating pill search and a cleaner avatar.
- Breadcrumb line under PageHeader on detail pages (Overview / Clients / Marcus Bennett).

---

## 3. Per-screen modernization

Each screen: PageHeader w/ back arrow, plain-language helper text, modern cards, empty states, loading skeletons, mobile-clean.

1. **Overview** — hero row of 4 *primary* glanceable stat tiles (Active Clients, This Week's Check-ins, Needs Attention, Revenue MTD) with sparkline + plain delta ("3 more than last week"). Secondary stats demoted to a compact strip. Replace dense alert banners with a single friendly "Today" action list ("2 clients waiting on you →"). Charts: 30-day check-in volume area chart, revenue-by-protocol donut, client-status breakdown ring.
2. **Clients** — card/table hybrid; avatar initials, status chip, current protocol, week #, last check-in. Search + filter pills. Row → profile.
3. **Client profile** — modern tabbed profile (Profile / Protocol / Check-Ins / Intake / Orders / Billing). Header card: avatar, goals as chips, progress ring (week X of Y), quick actions. Check-in tab shows the client's **progress charts** (weight, energy, mood over weeks).
4. **Check-Ins** — friendly review queue; filter pills (Needs reply / Urgent / This week / Resolved); each card shows trend arrows; slide-over detail with follow-up + resolve.
5. **Intakes** — "New applicants" framing; status pills; AI-recommendation card; one-click approve → becomes client.
6. **Ops / Fulfillment** — rename "Ops Queue" → **Fulfillment** in UI; Kanban + list; clear "what to ship, to whom, by when"; cost shown plainly.
7. **Inventory** — stock cards with low-stock ring; per-SKU lot ledger; plain "reorder soon" language.
8. **Revenue** — MTD/▾date; revenue-by-protocol donut; margin after product cost in plain English; CSV export.
9. **SMS Builder / Settings / Calculator** — modern form styling, back arrows, helper text.

---

## 4. Charts (the visual upgrade)

Lightweight, dependency-light SVG charts (no heavy lib unless justified): gradient **area** (check-in volume, weight trend), **donut** (revenue by protocol, client status), **progress ring** (protocol week X/Y, stock level), **sparkline** (stat tiles), **horizontal bars** (top protocols). Gold + status-color gradients on the dark surface. Animated draw-in on mount. All chart data comes from existing admin APIs — no new data contracts, just presentation.

---

## 5. Demo data (purge + seed)

DB is **live prod** (`roc` schema, Neon). Full backup taken first → `backups/roc-clientdata-backup-*.json` (gitignored, PII).

**Purge** (client data only — keep inventory_skus, inventory_batches, admin_settings, users):
`intakes, client_protocols, checkins, nextday_checkins, proposals, ops_cards, dosage_calculations, lot_transactions`, and clear `notifications` + client rows in `activity_log`.

**Seed 5 full demo profiles** (realistic peptide-coaching clients, using real SKU ids from the live catalog):

| # | Client | Profile | Protocol | State |
|---|--------|---------|----------|-------|
| 1 | Marcus Bennett | 35-44 M, fat-loss + recomp | Tirzepatide 10mg + BPC-157 | Wk 6, thriving, billing active |
| 2 | Sarah Chen | 30-39 F, longevity + skin | GHK-Cu + Epitalon + NAD+ | Wk 3, steady |
| 3 | David Rodriguez | 45-54 M, injury recovery | BPC-157 + TB-500 | Wk 8, **urgent** check-in (joint flare) |
| 4 | Emily Watson | 25-34 F, fat-loss | Semaglutide | Wk 1, brand new (pending first check-in) |
| 5 | James Park | 50-59 M, GH/anti-aging | CJC-1295 No DAC + Ipamorelin | Wk 12, top results, proposal signed |

Each profile gets: APPROVED intake (full `data` jsonb + ai_recommendation), client_protocol (real sku_id, monthly_rate, duration_weeks, billing_status), 1–4 progressive check-ins (weight/energy/mood trending), at least one signed proposal, and ops/fulfillment cards. Result: every Overview stat and chart shows real, non-zero, believable numbers (active clients=5, check-ins trend, 1 urgent flag, revenue MTD, ops pending, low-stock if any).

Seed is an **idempotent SQL file** in `sql/` + a node runner using `.vercel` prod env. Executed once, verified by re-querying counts.

---

## 6. "Simplify so anyone can use it"

- Plain-language labels + one-line helper subtext under every page title.
- Each Overview number answers "so what?" (delta in words, link to the action).
- Reduce jargon (Ops Queue → Fulfillment, COGS → "product cost", FIFO hidden behind plain stock numbers).
- Consistent primary action per screen (one gold button), everything else quiet.
- Empty states that teach ("No check-ins yet — they'll appear here when clients submit").
- Mobile: single-column, big tap targets, back arrow always reachable.

---

## 7. Constraints (prod safety)

- DB is live prod. Schema migrations + the purge/seed are **explicit, backed-up, idempotent** SQL run via the prod env; backup taken before any destructive op.
- Local `next build` can't reach prod DB → verify code with `npx tsc --noEmit`.
- Every admin route handler keeps `export const dynamic = "force-dynamic"`.
- No new external deps unless justified; charts are hand-rolled SVG.
- Deploy is human-gated: `vercel deploy --prod` (git deploys wedge per repo history).

---

## 8. Acceptance

- [ ] Every admin screen has a working back arrow to its parent.
- [ ] Modern token system live; no sharp 4px / busy gold borders remain.
- [ ] All 7+ Overview stats compute correctly against seeded data (non-zero, believable).
- [ ] Charts render with real data and animate in.
- [ ] 5 demo profiles fully navigable (profile → protocol → check-ins → orders → billing).
- [ ] 1 urgent flag surfaces in the "needs attention" flow.
- [ ] `npx tsc --noEmit` clean; mobile layout clean.
