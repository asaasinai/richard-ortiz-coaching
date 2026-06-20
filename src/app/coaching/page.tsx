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

      <section style={{ position: "relative", padding: "7rem 1.5rem 4.5rem", overflow: "hidden" }}>
        <div className="max-w-5xl mx-auto reveal">
          <span className="section-num">Coaching</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)", letterSpacing: "-0.035em", lineHeight: 1.06, maxWidth: 760 }}>
            A complete transformation system — <span className="gold-text">built around your life.</span>
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.7, marginTop: "1.75rem", maxWidth: 560 }}>
            This isn&apos;t a workout PDF. It&apos;s personalized coaching that combines training, nutrition,
            recovery, and accountability into one simple system — the PHAS3 System — designed to produce
            real, sustainable results.
          </p>
        </div>
      </section>

      {/* PILLARS IN DEPTH */}
      <section style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.012))", padding: "6rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-num">The PHAS3 System</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.4rem)", letterSpacing: "-0.025em", marginBottom: "2.5rem" }}>
            Train. Recover. Optimize.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pillarsDeep.map((p, i) => (
              <div key={p.title} className="card reveal" style={{ animationDelay: `${0.08 * i}s` }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--gold-dim)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <p.icon size={24} style={{ color: "var(--gold)" }} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.65rem", letterSpacing: "-0.01em" }}>{p.title}</h3>
                <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-num">What&apos;s Included</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.4rem)", letterSpacing: "-0.025em", marginBottom: "2rem" }}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid md:grid-cols-2 gap-4" style={{ maxWidth: 860 }}>
            {included.map((item, i) => (
              <div key={item} className="card reveal" style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", padding: "1.15rem 1.35rem", animationDelay: `${0.05 * i}s` }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.05rem" }}>
                  <Check size={15} style={{ color: "var(--gold)" }} />
                </span>
                <span style={{ color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", padding: "7rem 1.5rem", textAlign: "center", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 380px at 50% 0%, rgba(212,175,90,0.12), transparent 65%)", pointerEvents: "none" }} />
        <div className="max-w-3xl mx-auto" style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2rem,4.5vw,3rem)", letterSpacing: "-0.03em", marginBottom: "1.25rem", lineHeight: 1.05 }}>
            Welcome to the <span className="gold-text">Next Level.</span>
          </h2>
          <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "2.25rem" }}>
            Start with your intake. Richard reviews every submission personally and builds your plan from there.
          </p>
          <Link href="/intake" className="btn-gold">Start Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
