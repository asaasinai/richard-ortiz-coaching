# Coaching Repositioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition richardortizcoaching.com from a peptide clinic into a transformation coaching site (PHAS3 System: Train. Recover. Optimize.) without touching any operational system.

**Architecture:** Next.js 14 App Router, all-inline-style components on a dark/gold design system (CSS vars in `globals.css`, helper classes `.btn-gold`/`.btn-outline`/`.card`/`.section-num`). Public peptide pages are deleted with 301 redirects; the calculator becomes a client-tool gated with the same sessionStorage pattern the dashboard uses (`roc_dashboard_email`) — there is no cookie-based client session, so middleware gating is impossible; client-side guard is the established codebase pattern.

**Tech Stack:** Next.js 14.2.5, React 18, Tailwind (used sparingly; most styling is inline + CSS vars), lucide-react icons. No test framework exists — verification is `npm run build` plus dev-server curl checks per task.

**Spec:** `docs/superpowers/specs/2026-06-12-coaching-repositioning-design.md`

**Conventions to follow (read before any task):**
- Components use inline `style={{}}` with CSS vars (`var(--gold)`, `var(--text-soft)` etc.), NOT Tailwind color classes. Tailwind is used only for layout utilities (`max-w-6xl mx-auto px-4`, `grid`, `flex`, responsive `md:` prefixes).
- Headings: `fontFamily: "Inter Tight, sans-serif", fontWeight: 900`, tight letterSpacing.
- Public pages render `<Nav />` at top and `<Footer />` at bottom themselves (no shared layout wrapper).
- Eyebrow/kicker labels use the `.section-num` class.
- Commit after every task. Author must be MorrisMedia: every commit command below uses `git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit ...`. Work directly on `main` (repo has no PR flow; Atlas/Foreman push to main).

**Setup (once):** `cd ~/richard-ortiz-coaching && npm install` — then `npm run build` to confirm a clean baseline BEFORE any changes. If the baseline build fails, STOP and report; do not fix unrelated breakage silently.

---

### Task 1: Site config + root metadata

**Files:**
- Create: `src/lib/site-config.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/lib/site-config.ts`**

```ts
// Central site configuration. Social URLs render in the footer and on
// Success Stories ONLY when non-empty — leave "" until handles are supplied.
export const siteConfig = {
  name: "Richard Ortiz Coaching",
  tagline: "Welcome to the Next Level.",
  description:
    "Personalized coaching designed to help you lose body fat, build lean muscle, improve performance, and create sustainable results.",
  url: "https://richardortizcoaching.com",
  social: {
    instagram: "", // e.g. "https://instagram.com/..."
    facebook: "",  // e.g. "https://facebook.com/..."
  },
}
```

- [ ] **Step 2: Replace the metadata block in `src/app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Richard Ortiz Coaching | Transformation & Performance Coaching",
  description:
    "Personalized coaching to lose body fat, build lean muscle, improve performance, and create sustainable results. Train. Recover. Optimize.",
  openGraph: {
    title: "Richard Ortiz Coaching",
    description:
      "Transformation and performance coaching — fat loss, lean muscle, strength, nutrition, recovery, and accountability.",
    url: "https://richardortizcoaching.com",
    siteName: "Richard Ortiz Coaching",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: compiles with no type errors (route table prints).

- [ ] **Step 4: Commit**

```bash
git add src/lib/site-config.ts src/app/layout.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: site config + coaching-positioned root metadata"
```

---

### Task 2: Navigation + Footer

**Files:**
- Modify: `src/components/Nav.tsx` (full rewrite)
- Modify: `src/components/Footer.tsx` (full rewrite)

- [ ] **Step 1: Replace `src/components/Nav.tsx` entirely**

```tsx
"use client"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

const links = [
  { href: "/", label: "Home" },
  { href: "/coaching", label: "Coaching" },
  { href: "/meet-your-coach", label: "Meet Your Coach" },
  { href: "/success-stories", label: "Success Stories" },
]

const clientResources = [
  { href: "/intake", label: "Intake Form" },
  { href: "/checkin", label: "Two-Week Check-In" },
  { href: "/dashboard", label: "Client Dashboard" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const resRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const linkStyle = {
    fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
    color: "var(--text-soft)",
  }

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
            RICHARD ORTIZ
          </span>
          <span style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>COACHING</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={linkStyle} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          <div ref={resRef} style={{ position: "relative" }}>
            <button onClick={() => setResOpen(o => !o)}
              style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              className="hover:text-white transition-colors">
              Client Resources <ChevronDown size={13} style={{ transform: resOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {resOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 0.75rem)", right: 0, minWidth: 200,
                background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                padding: "0.5rem", display: "flex", flexDirection: "column", zIndex: 60,
              }}>
                {clientResources.map(r => (
                  <Link key={r.href} href={r.href} onClick={() => setResOpen(false)}
                    style={{ fontSize: "0.82rem", color: "var(--text-soft)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius)" }}
                    className="hover:text-white hover:bg-black/30 transition-colors">{r.label}</Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/contact" style={linkStyle} className="hover:text-white transition-colors">Contact</Link>
          <Link href="/intake" className="btn-gold" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>Start Intake</Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: "var(--text)" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }} className="md:hidden px-4 py-4 flex flex-col gap-4">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>{l.label}</Link>
          ))}
          <span style={{ fontSize: "0.7rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginTop: "0.25rem" }}>
            Client Resources
          </span>
          {clientResources.map(r => (
            <Link key={r.href} href={r.href} onClick={() => setOpen(false)}
              style={{ fontSize: "0.9rem", color: "var(--text-soft)", paddingLeft: "0.75rem" }}>{r.label}</Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>Contact</Link>
          <Link href="/intake" className="btn-gold text-center" onClick={() => setOpen(false)}>Start Intake</Link>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Replace `src/components/Footer.tsx` entirely**

```tsx
import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import { siteConfig } from "@/lib/site-config"

export default function Footer() {
  const socials = [
    { url: siteConfig.social.instagram, label: "Instagram", Icon: Instagram },
    { url: siteConfig.social.facebook, label: "Facebook", Icon: Facebook },
  ].filter(s => s.url)

  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "3rem 1rem" }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, color: "var(--text)" }}>RICHARD ORTIZ COACHING</span>
          <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.75rem", lineHeight: 1.7 }}>
            Transformation and performance coaching — fat loss, lean muscle, strength, nutrition, recovery, and accountability.
          </p>
          <p style={{ color: "var(--gold)", fontSize: "0.8rem", marginTop: "0.5rem", letterSpacing: "0.05em" }}>
            Train. Recover. Optimize.
          </p>
          {socials.length > 0 && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              {socials.map(({ url, label, Icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ color: "var(--text-soft)" }} className="hover:text-white transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Navigation</span>
          <ul style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              ["Coaching", "/coaching"],
              ["Meet Your Coach", "/meet-your-coach"],
              ["Success Stories", "/success-stories"],
              ["Intake Form", "/intake"],
              ["Two-Week Check-In", "/checkin"],
              ["Client Dashboard", "/dashboard"],
              ["Contact", "/contact"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} style={{ color: "var(--text-soft)", fontSize: "0.85rem" }} className="hover:text-white transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", marginTop: "2rem", paddingTop: "1.5rem", textAlign: "center" }}>
        <span style={{ color: "var(--text-mute)", fontSize: "0.8rem" }}>© {new Date().getFullYear()} Richard Ortiz Coaching. All rights reserved.</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: clean compile. (`/peptides` links are gone from nav/footer but pages still exist — fine, they're removed in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.tsx src/components/Footer.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: coaching nav with Client Resources dropdown + repositioned footer"
```

---

### Task 3: Homepage rewrite

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)

- [ ] **Step 1: Replace `src/app/page.tsx` entirely**

```tsx
import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Dumbbell, Moon, Target, ClipboardList, FileText, CalendarCheck, RefreshCw, ArrowRight } from "lucide-react"

const pillars = [
  {
    icon: Dumbbell, title: "Train.",
    body: "Develop strength, resilience, and a body capable of performing at a high level. Build lean muscle and physical capability that lasts.",
  },
  {
    icon: Moon, title: "Recover.",
    body: "Prioritize recovery, sleep, stress management, and lifestyle habits that support long-term health, resilience, and longevity.",
  },
  {
    icon: Target, title: "Optimize.",
    body: "Use accountability, nutrition, wellness strategies, and performance-based habits to become the best version of yourself.",
  },
]

const steps = [
  { icon: ClipboardList, title: "Start Your Intake", body: "Tell us about your goals, history, and lifestyle through a structured intake." },
  { icon: FileText, title: "Get Your Custom Plan", body: "Richard builds a personalized training, nutrition, and recovery plan around your life." },
  { icon: CalendarCheck, title: "Check In Every Two Weeks", body: "Structured check-ins track weight, energy, and progress so nothing drifts." },
  { icon: RefreshCw, title: "Adjust & Stay Accountable", body: "Your plan evolves with your results. Accountability keeps you moving forward." },
]

const outcomes = ["Fat Loss", "Lean Muscle", "Strength", "Energy", "Health Markers", "Sustainable Change"]

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section style={{ background: "var(--bg)", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div className="max-w-6xl mx-auto px-4 py-24">
          <span className="section-num">Welcome to the Next Level</span>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--text)", maxWidth: 700 }}>
            Train. <span style={{ color: "var(--gold)" }}>Recover.</span> Optimize.
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 520 }}>
            Personalized coaching designed to help you lose body fat, build lean muscle,
            improve performance, and create sustainable results.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/intake" className="btn-gold">Start Intake</Link>
            <Link href="/coaching" className="btn-outline">Learn About Coaching</Link>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">The PHAS3 System</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "2.5rem" }}>
            Three pillars. One system.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map(p => (
              <div key={p.title} className="card">
                <p.icon size={26} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
                <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.4rem", marginBottom: "0.6rem" }}>{p.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">How It Works</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "2.5rem" }}>
            A simple system built for real life.
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
                  <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.6rem", color: "var(--gold)", lineHeight: 1 }}>{i + 1}</span>
                  <s.icon size={20} style={{ color: "var(--text-mute)" }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: "0.875rem", lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section style={{ background: "var(--bg-2)", padding: "4rem 1rem" }}>
        <div className="max-w-6xl mx-auto text-center">
          <span className="section-num">Real Results</span>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {outcomes.map(o => (
              <span key={o} style={{
                border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.5rem 1.25rem",
                fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-soft)",
              }}>{o}</span>
            ))}
          </div>
        </div>
      </section>

      {/* COACH TEASER */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="section-num">Your Coach</span>
            <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
              Richard Ortiz
            </h2>
            <p style={{ color: "var(--text-soft)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
              At 55, Richard isn&apos;t teaching a lifestyle he once lived — he&apos;s living it every day.
              With 30+ years in health, fitness, and nutrition, he has helped hundreds of people
              lose body fat, build lean muscle, and become the strongest version of themselves.
            </p>
            <Link href="/meet-your-coach" className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Meet Your Coach <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
            <p style={{ color: "var(--text-soft)", lineHeight: 1.75, fontStyle: "italic" }}>
              &ldquo;My mission is simple: to help people become stronger in body, mind, and spirit so they can
              live healthier, more fulfilling lives.&rdquo;
            </p>
            <p style={{ color: "var(--gold)", fontSize: "0.85rem", marginTop: "0.75rem", fontWeight: 700 }}>— Richard Ortiz</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / CTA */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Ready for your transformation?
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.75, marginBottom: "2rem" }}>
            See what clients are achieving, then start your own intake. Your next level is waiting.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/intake" className="btn-gold">Start Intake</Link>
            <Link href="/success-stories" className="btn-outline">Success Stories</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: clean compile. (Links to `/coaching`, `/meet-your-coach`, `/success-stories` point at pages created in Tasks 4–6; Next.js does not fail builds on dead `<Link>` targets.)

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: homepage rewrite - PHAS3 hero, pillars, how-it-works, coach teaser"
```

---

### Task 4: Coaching page

**Files:**
- Create: `src/app/coaching/page.tsx`

- [ ] **Step 1: Create `src/app/coaching/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Dumbbell, Moon, Target, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Coaching | Richard Ortiz Coaching",
  description:
    "Personalized transformation coaching built on the PHAS3 System — training, nutrition, recovery, and accountability for real, sustainable results.",
}

const audience = [
  "Busy professionals & entrepreneurs",
  "Parents balancing family and health",
  "First responders",
  "Adults over 40 ready to feel like themselves again",
]

const included = [
  "Personalized training built around your level, schedule, and goals",
  "Nutrition guidance that builds sustainable habits — not crash diets",
  "Recovery, sleep, and stress strategy for long-term health",
  "Structured two-week check-ins tracking weight, energy, and progress",
  "Direct accountability from Richard — your plan evolves with your results",
  "Advanced wellness tools where appropriate, inside a complete program",
]

const pillarsDeep = [
  {
    icon: Dumbbell, title: "Train.",
    body: "Strength is the foundation. Your program develops lean muscle, physical capability, and performance — scaled to where you are today and built to progress. No cookie-cutter templates.",
  },
  {
    icon: Moon, title: "Recover.",
    body: "Results are built in recovery. Sleep, stress management, and lifestyle habits get the same attention as your workouts — because a body that can't recover can't transform.",
  },
  {
    icon: Target, title: "Optimize.",
    body: "Nutrition, accountability, and performance-based habits tie it together. Bi-weekly check-ins keep you honest, and your plan adjusts as your body responds.",
  },
]

export default function CoachingPage() {
  return (
    <>
      <Nav />

      <section style={{ background: "var(--bg)", padding: "6rem 1rem 4rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">Coaching</span>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 720 }}>
            A complete transformation system — built around your life.
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 560 }}>
            This isn&apos;t a workout PDF. It&apos;s personalized coaching that combines training, nutrition,
            recovery, and accountability into one simple system — the PHAS3 System — designed to produce
            real, sustainable results.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: "var(--bg-2)", padding: "4rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">Who It&apos;s For</span>
          <div className="grid md:grid-cols-2 gap-4 mt-4" style={{ maxWidth: 720 }}>
            {audience.map(a => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Check size={18} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <span style={{ color: "var(--text-soft)", fontSize: "0.95rem" }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS IN DEPTH */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">The PHAS3 System</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "2.5rem" }}>
            Train. Recover. Optimize.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pillarsDeep.map(p => (
              <div key={p.title} className="card">
                <p.icon size={26} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
                <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.4rem", marginBottom: "0.6rem" }}>{p.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">What&apos;s Included</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "2rem" }}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid md:grid-cols-2 gap-4" style={{ maxWidth: 860 }}>
            {included.map(item => (
              <div key={item} className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "1.1rem 1.25rem" }}>
                <Check size={18} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "0.15rem" }} />
                <span style={{ color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Welcome to the Next Level.
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.75, marginBottom: "2rem" }}>
            Start with your intake. Richard reviews every submission personally and builds your plan from there.
          </p>
          <Link href="/intake" className="btn-gold">Start Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: clean compile, `/coaching` appears in the route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/coaching/page.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: coaching page - PHAS3 program, audience, what's included"
```

---

### Task 5: Meet Your Coach page

**Files:**
- Create: `src/app/meet-your-coach/page.tsx`

Bio copy below is Richard's supplied bio, used substantially verbatim. Faith content stays prominent — it is part of the brand. Photo is a styled placeholder slot until the real photo lands.

- [ ] **Step 1: Create `src/app/meet-your-coach/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Dumbbell, Moon, Target, User } from "lucide-react"

export const metadata: Metadata = {
  title: "Meet Richard Ortiz | Richard Ortiz Coaching",
  description:
    "30+ years in health, fitness, and nutrition. Founder of Richard Ortiz Coaching and owner of OC LAB. Train. Recover. Optimize.",
}

const pillars = [
  { icon: Dumbbell, title: "Train", body: "Develop strength, resilience, and a body capable of performing at a high level." },
  { icon: Moon, title: "Recover", body: "Prioritize recovery, sleep, stress management, and lifestyle habits that support long-term health." },
  { icon: Target, title: "Optimize", body: "Use accountability, nutrition, wellness strategies, and performance-based habits to help individuals become the best version of themselves." },
]

export default function MeetYourCoachPage() {
  return (
    <>
      <Nav />

      <section style={{ background: "var(--bg)", padding: "6rem 1rem 4rem" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-3">
            <span className="section-num">Meet Your Coach</span>
            <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Richard Ortiz
            </h1>
            <p style={{ color: "var(--gold)", fontSize: "0.95rem", letterSpacing: "0.05em", marginTop: "0.75rem", fontWeight: 700 }}>
              Train. Recover. Optimize.
            </p>
            <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.8, marginTop: "1.5rem" }}>
              At 55 years old, Richard Ortiz isn&apos;t teaching a lifestyle he once lived — he&apos;s living it every day.
            </p>
          </div>
          {/* Photo slot — replace with next/image when the professional photo lands */}
          <div className="md:col-span-2 card" style={{
            aspectRatio: "4/5", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "0.75rem", background: "var(--surface-2)",
          }}>
            <User size={48} style={{ color: "var(--text-mute)" }} />
            <span style={{ color: "var(--text-mute)", fontSize: "0.8rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Photo coming soon
            </span>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--bg-2)", padding: "4rem 1rem" }}>
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {[
            "For more than 30 years, Richard has dedicated his life to health, fitness, nutrition, and helping others become the strongest version of themselves. Throughout his career, he has worked in multiple areas of the health and wellness industry, including owning and operating a successful healthy meal preparation company for five years, helping clients develop sustainable nutrition habits that supported long-term health and body composition goals.",
            "Today, Richard is the founder of Richard Ortiz Coaching and owner of OC LAB, where he helps men and women improve their health, transform their physiques, and create lifestyles that support long-term success. His coaching combines fitness, nutrition, recovery, accountability, and wellness strategies into a simple system designed to produce real, sustainable results.",
            "Richard has helped hundreds of individuals — from busy professionals and entrepreneurs to parents, first responders, and adults over 40 — lose body fat, build lean muscle, improve energy levels, and regain confidence. While physical transformation is often what brings people to him, Richard believes true transformation goes much deeper than appearance alone.",
          ].map((p, i) => (
            <p key={i} style={{ color: "var(--text-soft)", lineHeight: 1.85, fontSize: "1rem" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">Coaching Philosophy</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            Three foundational pillars.
          </h2>
          <p style={{ color: "var(--text-soft)", marginBottom: "2.5rem" }}>
            Together, these principles form the foundation of the <strong style={{ color: "var(--gold)" }}>PHAS3 System</strong>.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map(p => (
              <div key={p.title} className="card">
                <p.icon size={26} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
                <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.3rem", marginBottom: "0.6rem" }}>{p.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAITH & MISSION */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1rem" }}>
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <span className="section-num">Faith &amp; Mission</span>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.85 }}>
            Beyond fitness, Richard&apos;s life is deeply rooted in his faith. As a follower of Jesus Christ, he believes
            that our bodies are gifts from God and that taking care of our physical, mental, and spiritual health is an
            important part of living with purpose. His faith influences the way he serves others — with integrity,
            compassion, encouragement, and a genuine desire to help people grow not only physically, but as individuals.
          </p>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.85 }}>
            Richard understands firsthand the challenges of balancing family, business, health, and life&apos;s
            responsibilities. He believes that discipline, consistency, faith, and personal accountability are the keys
            to creating lasting change.
          </p>
          <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
            <p style={{ color: "var(--text)", lineHeight: 1.8, fontWeight: 600 }}>
              His mission is simple: to help people become stronger in body, mind, and spirit so they can live
              healthier, more fulfilling lives and become the person God created them to be.
            </p>
          </div>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.85 }}>
            Whether your goal is fat loss, muscle gain, increased energy, improved health markers, or simply feeling
            like yourself again, Richard is committed to helping you reach your next level.
          </p>
          <p style={{ color: "var(--text-mute)", fontStyle: "italic", textAlign: "center", marginTop: "1rem" }}>
            &ldquo;I can do all things through Christ who strengthens me.&rdquo; — Philippians 4:13
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Welcome to the Next Level.
          </h2>
          <Link href="/intake" className="btn-gold">Start Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: clean compile, `/meet-your-coach` in route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/meet-your-coach/page.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: Meet Richard Ortiz page with full bio, PHAS3 pillars, faith & mission"
```

---

### Task 6: Success Stories — data file + page

**Files:**
- Create: `src/lib/success-stories-data.ts`
- Create: `src/app/success-stories/page.tsx`

- [ ] **Step 1: Create `src/lib/success-stories-data.ts`**

```ts
// Client success stories. Real testimonials drop in here — no code changes
// needed. The page renders a designed empty state while this array is empty.
// NEVER add fabricated testimonials.
export type SuccessStory = {
  slug: string
  name: string            // full name or initials, per client consent
  headline: string        // e.g. "Lost 32 lbs in 16 weeks"
  metrics: string[]       // e.g. ["-32 lbs", "-9% body fat", "2x energy"]
  story: string
  beforePhoto?: string    // path under /public, with client consent
  afterPhoto?: string
  videoUrl?: string       // future enhancement — not rendered yet
}

export const successStories: SuccessStory[] = []
```

- [ ] **Step 2: Create `src/app/success-stories/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { TrendingUp, Instagram, Facebook } from "lucide-react"
import { successStories } from "@/lib/success-stories-data"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Success Stories | Richard Ortiz Coaching",
  description: "Real client transformations — fat loss, lean muscle, strength, energy, and sustainable lifestyle change.",
}

const outcomes = ["Weight Loss", "Body Fat Reduction", "Muscle Gain", "Strength", "Energy", "Lifestyle Change"]

export default function SuccessStoriesPage() {
  const socials = [
    { url: siteConfig.social.instagram, label: "Instagram", Icon: Instagram },
    { url: siteConfig.social.facebook, label: "Facebook", Icon: Facebook },
  ].filter(s => s.url)

  return (
    <>
      <Nav />

      <section style={{ background: "var(--bg)", padding: "6rem 1rem 4rem" }}>
        <div className="max-w-6xl mx-auto">
          <span className="section-num">Success Stories</span>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 700 }}>
            Real people. Real transformations.
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 540 }}>
            Fat loss, lean muscle, strength, energy, and lifestyles that last — built with the PHAS3 System.
          </p>
        </div>
      </section>

      <section style={{ background: "var(--bg-2)", padding: "4rem 1rem 5rem" }}>
        <div className="max-w-6xl mx-auto">
          {successStories.length === 0 ? (
            /* Designed empty state — never a blank page, never fake testimonials */
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
              <TrendingUp size={36} style={{ color: "var(--gold)", margin: "0 auto 1.25rem" }} />
              <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                Client transformations coming soon.
              </h2>
              <p style={{ color: "var(--text-soft)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                We&apos;re collecting before-and-after results from clients right now.
                In the meantime — why read about someone else&apos;s transformation when you could start your own?
              </p>
              <Link href="/intake" className="btn-gold">Be the Next Story</Link>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {outcomes.map(o => (
                  <span key={o} style={{
                    border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.4rem 1rem",
                    fontSize: "0.78rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-mute)",
                  }}>{o}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {successStories.map(s => (
                <div key={s.slug} className="card">
                  {s.beforePhoto && s.afterPhoto && (
                    <div className="grid grid-cols-2 gap-2" style={{ marginBottom: "1.25rem" }}>
                      {[[s.beforePhoto, "Before"], [s.afterPhoto, "After"]].map(([src, label]) => (
                        <div key={label} style={{ position: "relative" }}>
                          <Image src={src} alt={`${s.name} — ${label}`} width={400} height={500}
                            style={{ width: "100%", height: "auto", borderRadius: "var(--radius)" }} />
                          <span style={{
                            position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)",
                            color: "var(--gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: "var(--radius)",
                          }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.2rem", marginBottom: "0.5rem" }}>{s.headline}</h3>
                  <div className="flex flex-wrap gap-2" style={{ marginBottom: "0.9rem" }}>
                    {s.metrics.map(m => (
                      <span key={m} style={{
                        background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "0.75rem",
                        fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "var(--radius)",
                      }}>{m}</span>
                    ))}
                  </div>
                  <p style={{ color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.7 }}>{s.story}</p>
                  <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.9rem", fontWeight: 600 }}>— {s.name}</p>
                </div>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Follow along for client wins and transformations:
              </p>
              <div className="flex justify-center gap-4">
                {socials.map(({ url, label, Icon }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{ color: "var(--text-soft)" }} className="hover:text-white transition-colors">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: clean compile, `/success-stories` in route table.

- [ ] **Step 4: Commit**

```bash
git add src/lib/success-stories-data.ts src/app/success-stories/page.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: success stories page with data-driven cards and honest empty state"
```

---

### Task 7: Remove public peptide pages + 301 redirects

**Files:**
- Delete: `src/app/peptides/page.tsx`, `src/app/peptides/[slug]/page.tsx`, `src/app/protocols/page.tsx`
- Modify: `next.config.js`
- Keep untouched: `src/lib/peptides-data.ts` (imported by `src/app/admin/clients/page.tsx`)

- [ ] **Step 1: Delete the public peptide routes**

```bash
git rm -r src/app/peptides src/app/protocols
```

- [ ] **Step 2: Confirm nothing else imports the deleted pages**

Run: `grep -rn "app/peptides\|app/protocols\|href=\"/peptides\|href=\"/protocols" src/ || echo CLEAN`
Expected: `CLEAN` (nav/footer links were removed in Task 2; homepage link in Task 3). If any hit appears, fix that link to point at `/coaching` before proceeding.

- [ ] **Step 3: Add 301 redirects in `next.config.js`**

Replace the entire file with:

```js
/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "thepeptidepedia.com" }
    ]
  },
  async redirects() {
    return [
      { source: "/peptides", destination: "/coaching", permanent: true },
      { source: "/peptides/:slug", destination: "/coaching", permanent: true },
      { source: "/protocols", destination: "/coaching", permanent: true },
    ]
  }
}
module.exports = nextConfig
```

- [ ] **Step 4: Verify build + redirects**

Run: `npm run build`
Expected: clean compile; `/peptides` and `/protocols` no longer in route table.

Then: `npm run dev` (background), wait for ready, then:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/peptides
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/peptides/bpc-157
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/protocols
```
Expected: each prints `308 http://localhost:3000/coaching` (Next.js emits 308 for `permanent: true` — permanent redirect, correct for SEO). Kill the dev server after.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: remove public peptide/protocol pages, 301 old URLs to /coaching"
```

---

### Task 8: Gate calculator + client/admin tool links

**Files:**
- Modify: `src/app/calculator/page.tsx` (add sessionStorage guard at top of component)
- Modify: `src/app/dashboard/page.tsx` (add "Your Tools" card)
- Modify: `src/app/admin/layout.tsx` (add Calculator nav item)

- [ ] **Step 1: Add the client-session guard to `src/app/calculator/page.tsx`**

The file is already `"use client"`. Add to the imports at the top:

```tsx
import { useEffect } from "react"
import { useRouter } from "next/navigation"
```

(`useState` is already imported from "react" — merge into one import: `import { useState, useEffect } from "react"`.)

Then, inside the default-exported page component, add as the FIRST statements of the component body (before any existing state):

```tsx
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    // Same client-session pattern as /dashboard (sessionStorage, set at sign-in)
    if (!sessionStorage.getItem("roc_dashboard_email")) {
      router.replace("/auth/signin")
    } else {
      setAuthed(true)
    }
  }, [router])
```

And immediately before the component's main `return (`:

```tsx
  if (!authed) return null
```

Note: the component may have early returns or multi-step state — place the guard so it runs before ANY content renders. Do not modify any calculator logic.

- [ ] **Step 2: Add a "Your Tools" card to `src/app/dashboard/page.tsx`**

Add `Calculator` to the existing lucide-react import (line 7):

```tsx
import { Calendar, TrendingUp, TrendingDown, Minus, ArrowRight, Beaker, Trash2, Calculator } from "lucide-react"
```

Inside the `!loading` fragment, directly AFTER the assigned-protocol block (the `{protocol ? (...) : (...)}` expression ends around line 212) and BEFORE the weight-trend card, insert:

```tsx
            {/* Your Tools */}
            <div className="card" style={{ marginBottom:"1.5rem" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-mute)", marginBottom:"0.75rem" }}>Your Tools</div>
              <Link href="/calculator" style={{ display:"inline-flex", alignItems:"center", gap:"0.6rem",
                color:"var(--gold)", fontSize:"0.9rem", fontWeight:700 }} className="hover:underline">
                <Calculator size={18}/> Dose Calculator <ArrowRight size={14}/>
              </Link>
            </div>
```

(`Link` is already imported on line 6.)

- [ ] **Step 3: Add Calculator to the admin nav in `src/app/admin/layout.tsx`**

In the `nav` array (lines 7–14), add after the SMS Builder entry:

```tsx
  { href: "/calculator",       label: "Calculator",  icon: Calculator },
```

And add `Calculator` to the lucide-react import on line 5:

```tsx
import { Users, ClipboardList, Activity, MessageSquare, BarChart2, Settings, Menu, X, Calculator } from "lucide-react"
```

Note: `/calculator` is outside `/admin`, so the sidebar's active-state check simply never matches it — that's fine. Richard reaching it from admin has no sessionStorage client session; he will be bounced to `/auth/signin` unless signed in as a client too. That is acceptable for now (admin cookie ≠ client session); if Richard complains, the guard can be extended to also accept the admin context later — out of scope today.

- [ ] **Step 4: Verify build + gating behavior**

Run: `npm run build`
Expected: clean compile.

Then `npm run dev` (background) and:
```bash
curl -s http://localhost:3000/calculator | grep -c "Peptide\|calculator" 
```
Expected: page HTML returns (client-side guard means SSR HTML still ships the shell; the redirect happens in the browser — same behavior `/dashboard` has today). This is consistent with the existing dashboard pattern, not a regression.

- [ ] **Step 5: Commit**

```bash
git add src/app/calculator/page.tsx src/app/dashboard/page.tsx src/app/admin/layout.tsx
git -c user.name="MorrisMedia" -c user.email="marshall@homelifemedia.com" commit -m "feat: gate calculator behind client session, add tool links to dashboard + admin"
```

---

### Task 9: Full verification + deploy

**Files:** none (verification + deploy)

- [ ] **Step 1: Clean production build**

Run: `npm run build`
Expected: route table contains `/`, `/coaching`, `/meet-your-coach`, `/success-stories`, `/calculator`, `/intake`, `/checkin`, `/dashboard`, `/contact`, `/admin/*`, `/auth/signin` — and does NOT contain `/peptides` or `/protocols`.

- [ ] **Step 2: Dev-server smoke flows**

Start `npm run dev` in background, then:

```bash
for p in / /coaching /meet-your-coach /success-stories /intake /checkin /contact; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$p)"
done
curl -s http://localhost:3000/ | grep -o "Train\. Recover\. Optimize\|Peptide Therapy" | sort -u
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/peptides
```

Expected: all pages `200`; homepage grep prints ONLY `Train. Recover. Optimize` (no "Peptide Therapy"); `/peptides` prints `308 .../coaching`. Kill dev server.

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 4: Deploy + verify production**

Vercel is connected to this repo (live deployment IDs visible on the production site), so the push should auto-deploy. Wait ~2 minutes, then:

```bash
curl -s https://richardortizcoaching.com | grep -o "Train\. Recover\. Optimize\|Peptide Therapy" | sort -u
curl -s -o /dev/null -w "%{http_code}\n" -L https://richardortizcoaching.com/peptides
```

Expected: first prints only `Train. Recover. Optimize`; second prints `200` (followed redirect to /coaching).

If after 5 minutes production still serves the old hero, the git deploy wedged (known pattern on other repos in this account) — deploy directly:

```bash
cd ~/richard-ortiz-coaching && npx vercel --prod
```

then re-run the two curl checks.

- [ ] **Step 5: Report**

Summarize to Marshall: live URL checks, what changed, and the outstanding content list (photo, certifications, testimonials, before/afters, IG/FB handles — all drop-in, no code changes).
