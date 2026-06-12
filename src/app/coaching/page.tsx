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

      <section style={{ background: "var(--bg)", padding: "6rem 1.5rem 4rem" }}>
        <div className="max-w-5xl mx-auto">
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

      {/* PILLARS IN DEPTH */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
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
      <section style={{ background: "var(--bg)", padding: "5rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
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
      <section style={{ background: "var(--bg-2)", padding: "5rem 1.5rem", textAlign: "center" }}>
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
