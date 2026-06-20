import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "Meet Richard Ortiz | Richard Ortiz Coaching",
  description:
    "30+ years in health, fitness, and nutrition. Founder of Richard Ortiz Coaching and owner of OC LAB. Train. Recover. Optimize.",
}

// Bio copy supplied by Richard 2026-06-12 — used verbatim. Edit only on his word.
const para = { color: "var(--text-soft)", lineHeight: 1.85, fontSize: "1rem" } as const
const pillarHead = {
  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.2rem",
  color: "var(--gold)", marginTop: "0.5rem",
} as const

export default function MeetYourCoachPage() {
  return (
    <>
      <Nav />

      <section style={{ position: "relative", padding: "7rem 1.5rem 4rem", textAlign: "center", overflow: "hidden" }}>
        <div className="max-w-3xl mx-auto reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="section-num">Meet Your Coach</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)", letterSpacing: "-0.035em", lineHeight: 1.06 }}>
            About <span className="gold-text">Richard Ortiz</span>
          </h1>
          {/* Brand badge — swap for the professional portrait when it lands */}
          <div style={{ position: "relative", marginTop: "2.75rem", width: "min(380px, 100%)", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ position: "absolute", inset: "-10%", background: "radial-gradient(circle at 50% 45%, rgba(212,175,90,0.26), transparent 62%)", filter: "blur(8px)", pointerEvents: "none" }} />
            <Image src="/richard-ortiz-badge.jpeg" alt="Richard Ortiz — Strength, Longevity, 55"
              width={1158} height={1383} priority
              style={{ width: "100%", height: "auto", position: "relative", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.55)", display: "block" }} />
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.012))", padding: "4.5rem 1.5rem 5.5rem", borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "65ch" }}>
          <p style={para}>
            At 55 years old, Richard Ortiz isn&rsquo;t teaching a lifestyle he once lived&mdash;he&rsquo;s living it every day.
          </p>
          <p style={para}>
            For more than 30 years, Richard has dedicated his life to health, fitness, nutrition, and helping others
            become the strongest version of themselves. Throughout his career, he has worked in multiple areas of the
            health and wellness industry, including owning and operating a successful healthy meal preparation company
            for five years, helping clients develop sustainable nutrition habits that supported long-term health and
            body composition goals.
          </p>
          <p style={para}>
            Today, Richard is the founder of Richard Ortiz Coaching and owner of OC LAB, where he helps men and women
            improve their health, transform their physiques, and create lifestyles that support long-term success. His
            coaching combines fitness, nutrition, recovery, accountability, and wellness strategies into a simple
            system designed to produce real, sustainable results.
          </p>
          <p style={para}>
            Richard has helped hundreds of individuals&mdash;from busy professionals and entrepreneurs to parents,
            first responders, and adults over 40&mdash;lose body fat, build lean muscle, improve energy levels, and
            regain confidence. While physical transformation is often what brings people to him, Richard believes true
            transformation goes much deeper than appearance alone.
          </p>

          <p style={para}>His coaching philosophy is built on three foundational pillars:</p>

          <h2 style={pillarHead}>Train</h2>
          <p style={para}>Develop strength, resilience, and a body capable of performing at a high level.</p>

          <h2 style={pillarHead}>Recover</h2>
          <p style={para}>Prioritize recovery, sleep, stress management, and lifestyle habits that support long-term health.</p>

          <h2 style={pillarHead}>Optimize</h2>
          <p style={para}>
            Use accountability, nutrition, wellness strategies, and performance-based habits to help individuals become
            the best version of themselves.
          </p>

          <p style={para}>Together, these principles form the foundation of the PHAS3 System:</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.4rem", color: "var(--text)" }}>
            Train. Recover. Optimize.
          </p>

          <p style={para}>
            Beyond fitness, Richard&rsquo;s life is deeply rooted in his faith. As a follower of Jesus Christ, he
            believes that our bodies are gifts from God and that taking care of our physical, mental, and spiritual
            health is an important part of living with purpose. His faith influences the way he serves others&mdash;with
            integrity, compassion, encouragement, and a genuine desire to help people grow not only physically, but as
            individuals.
          </p>
          <p style={para}>
            Richard understands firsthand the challenges of balancing family, business, health, and life&rsquo;s
            responsibilities. He believes that discipline, consistency, faith, and personal accountability are the keys
            to creating lasting change.
          </p>

          <p style={para}>His mission is simple:</p>
          <div className="card" style={{ position: "relative", overflow: "hidden", padding: "2rem", boxShadow: "var(--glow-gold)", borderColor: "rgba(212,175,90,0.3)" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle, rgba(212,175,90,0.16), transparent 70%)", pointerEvents: "none" }} />
            <p style={{ color: "var(--text)", lineHeight: 1.55, fontWeight: 600, fontSize: "1.3rem", fontStyle: "italic", fontFamily: "var(--font-display)", position: "relative" }}>
              To help people become stronger in body, mind, and spirit so they can live healthier, more fulfilling
              lives and become the person God created them to be.
            </p>
          </div>

          <p style={para}>
            Whether your goal is fat loss, muscle gain, increased energy, improved health markers, or simply feeling
            like yourself again, Richard is committed to helping you reach your next level.
          </p>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.4rem", color: "var(--text)", textAlign: "center", marginTop: "1rem" }}>
            Train. Recover. Optimize.
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.1rem", color: "var(--gold)", textAlign: "center" }}>
            Welcome to the Next Level.
          </p>

          <p style={{ color: "var(--text-mute)", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem", lineHeight: 1.7 }}>
            &ldquo;I can do all things through Christ who strengthens me.&rdquo; &mdash; The Epistle to the Philippians 4:13
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", padding: "7rem 1.5rem", textAlign: "center", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 380px at 50% 0%, rgba(212,175,90,0.12), transparent 65%)", pointerEvents: "none" }} />
        <div className="max-w-3xl mx-auto" style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2rem,4.5vw,3rem)", letterSpacing: "-0.03em", marginBottom: "1.5rem", lineHeight: 1.05 }}>
            Ready to reach your <span className="gold-text">next level?</span>
          </h2>
          <Link href="/intake" className="btn-gold">Start Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
