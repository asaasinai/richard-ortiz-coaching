# richardortizcoaching.com — Coaching Repositioning Design

**Date:** 2026-06-12
**Repo:** `asaasinai/richard-ortiz-coaching` (Next.js App Router + Prisma, Vercel, live at richardortizcoaching.com)
**Approved by:** Marshall (brainstorm session 2026-06-12)

## 1. Strategic Goal

Reposition the public website from a peptide clinic to a **transformation coaching company**. No operational change: intake, two-week check-in, client management, admin dashboard, peptide/protocol backend systems, SMS, and PDF flows all stay exactly as they are. This is a frontend positioning and information-architecture change.

A visitor should land and think *"this is a coaching program that transforms bodies and builds lasting results"* — not *"this is a peptide clinic."*

## 2. Brand Framework — PHAS3 System

Canonical pillar order is **Train. Recover. Optimize.** (the PHAS3 System, per Richard's bio — this supersedes the "Train. Optimize. Recover." order in the original brief). Supporting tagline: **"Welcome to the Next Level."**

- **Train.** Develop strength, resilience, and a body capable of performing at a high level.
- **Recover.** Prioritize recovery, sleep, stress management, and lifestyle habits that support long-term health.
- **Optimize.** Use accountability, nutrition, wellness strategies, and performance-based habits to become the best version of yourself.

This framework is the central theme of the homepage, the Coaching page, and the Meet Your Coach page.

## 3. Navigation

**New primary nav** (`src/components/Nav.tsx`, mirrored in `Footer.tsx`):

| Item | Route |
|---|---|
| Home | `/` |
| Coaching | `/coaching` (new) |
| Meet Your Coach | `/meet-your-coach` (new) |
| Success Stories | `/success-stories` (new) |
| Client Resources ▾ | dropdown: Intake Form `/intake`, Two-Week Check-In `/checkin`, Client Dashboard `/dashboard` |
| Contact | `/contact` |

CTA button stays **Start Intake** → `/intake`. **Removed from nav and footer:** Peptides, Calculator, Dashboard (dashboard moves into the Client Resources dropdown).

Mobile drawer mirrors the same structure (Client Resources items listed flat under a small heading).

## 4. Page Changes

### 4.1 Homepage (`src/app/page.tsx`) — full rewrite

1. **Hero:** `Train. Recover. Optimize.` headline; subcopy: "Personalized coaching designed to help you lose body fat, build lean muscle, improve performance, and create sustainable results." Primary CTA **Start Intake**, secondary **Learn About Coaching** → `/coaching`. "Welcome to the Next Level." appears as the hero kicker/tagline.
2. **Three-pillar section:** Train / Recover / Optimize cards with the framework copy above.
3. **How it works:** Intake → Custom Plan → Bi-Weekly Check-Ins → Accountability & Adjustments (maps to the real operational systems).
4. **Outcomes strip:** fat loss · lean muscle · strength · energy · health markers · sustainable lifestyle change.
5. **Coach teaser:** short Richard intro + link to `/meet-your-coach`.
6. **Social-proof teaser:** links to `/success-stories`.
7. **Metadata:** `<title>` becomes "Richard Ortiz Coaching | Transformation & Performance Coaching"; description rewritten to coaching positioning. Root `layout.tsx` metadata updated likewise (currently says "Peptide Therapy & Wellness").

### 4.2 `/coaching` (new)

Written from the PHAS3 framework — no pricing, no tiers:

- Who it's for: busy professionals, entrepreneurs, parents, first responders, adults over 40 (audience straight from Richard's bio).
- The three pillars in depth.
- How the program works: intake → personalized plan → bi-weekly check-ins → ongoing accountability.
- What's included: personalized training and nutrition guidance, recovery and lifestyle strategy, accountability check-ins, and advanced wellness tools where appropriate (the only public nod to the advanced-wellness side).
- CTA: Start Intake.

### 4.3 `/meet-your-coach` (new)

"Meet Richard Ortiz" page using the bio copy Marshall supplied (2026-06-12) substantially verbatim: 55 years old, 30+ years in health and fitness, former owner of a healthy meal-prep company (5 years), founder of Richard Ortiz Coaching and owner of OC LAB, hundreds of clients transformed, the PHAS3 System pillars, his faith (follower of Jesus Christ, body as a gift from God, mission "to help people become stronger in body, mind, and spirit… become the person God created them to be"), and the closing quote: *"I can do all things through Christ who strengthens me." — Philippians 4:13*.

Faith content is presented genuinely and prominently — it is part of the brand, not boilerplate.

**Placeholder slot:** professional photo (structured `<Image>` slot with a styled placeholder until the real photo lands; certifications list slot likewise if/when supplied).

### 4.4 `/success-stories` (new)

Data-driven from `src/lib/success-stories-data.ts`:

```ts
type SuccessStory = {
  slug: string
  name: string            // or initials
  headline: string        // e.g. "Lost 32 lbs in 16 weeks"
  metrics: string[]       // weight loss, body fat %, strength PRs, energy
  story: string
  beforePhoto?: string
  afterPhoto?: string
  videoUrl?: string       // future enhancement
}
```

- Renders testimonial cards; before/after pairs when photos exist.
- **Empty state:** until real testimonials land, the page shows the transformation-outcomes framework plus a "client transformations coming soon — be the next one" CTA into intake. No fake testimonials, ever.
- Video testimonials: schema supports it now; UI ships later.

### 4.5 Peptide-facing pages — removed from public

- **Delete public routes:** `/peptides`, `/peptides/[slug]`, `/protocols`. (`src/lib/peptides-data.ts` and protocol data stay — admin assign-protocol and backend flows depend on them.)
- **Redirects:** `/peptides*` and `/protocols` → `/coaching` (301 via `next.config.js` redirects) so old links and indexed pages land on-brand.
- **Calculator (`/calculator`):** page stays but becomes a **login-gated client tool**. `middleware.ts` extended: `/calculator` requires the client session (same auth `/dashboard` uses); unauthenticated → `/auth/signin?from=/calculator`.
- **Client dashboard:** add a "Your Tools" section linking the Dose Calculator (`/calculator`).
- **Admin:** add a Calculator link in the admin sidebar/nav so Richard has one-click access.

### 4.6 Social integration

Instagram + Facebook icons in the footer and on Success Stories. **Handles TBD from Marshall/Richard** — icons render only when URLs are set in a single `src/lib/site-config.ts` constant, so they're invisible until handles are supplied (no dead links).

## 5. What Does NOT Change

- Intake form, flow, and API (`/intake`, `/api/intake`)
- Two-week check-in (`/checkin`, `/api/checkin`)
- Admin dashboard, auth, SMS, settings, assign-protocol
- Client auth (magic link), dashboard data, profile, delete-account
- Prisma schema, database, PDF generation, email
- Visual design system: existing dark surface + gold accent + Inter Tight typography. New pages are built from the same components/tokens — reskin, not rebrand.

## 6. Error Handling & Edge Cases

- Gated `/calculator` with no session → redirect to sign-in with return path; after login, land back on the calculator.
- Old peptide URLs (search engines, client bookmarks) → 301 to `/coaching`; no 404s.
- Success Stories with zero entries → designed empty state (never a blank page).
- Social config unset → icons not rendered.
- Missing coach photo → styled placeholder block, not a broken image.

## 7. Content Dependencies (Marshall/Richard-owned)

The site ships complete with structured placeholders; these drop in without code changes:

1. Professional photo of Richard
2. Certifications list (bio is otherwise complete — supplied 2026-06-12)
3. 3+ client testimonials with measurable results
4. Before/after photos with client consent
5. Instagram + Facebook URLs

## 8. Testing & Deploy

- `npm run build` clean locally.
- Manual verification: intake submit, check-in submit, admin login + dashboard, client sign-in → dashboard → calculator, gated-calculator redirect for logged-out visitor, all old peptide URLs 301 correctly, new nav on desktop + mobile drawer.
- Deploy: Vercel production. Verify live homepage `<title>` and hero post-deploy.

## 9. Out of Scope

- Pricing/program tiers (none defined; revisit if Richard supplies them)
- Video testimonial UI (schema-ready, UI later)
- Instagram feed embedding (links only for now)
- Any change to backend peptide/protocol management
