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
  fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.2rem",
  color: "var(--gold)", marginTop: "0.5rem",
} as const

export default function MeetYourCoachPage() {
  return (
    <>
      <Nav />

      <section style={{ background: "var(--bg)", padding: "6rem 1.5rem 4rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="section-num">Meet Your Coach</span>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            About Richard Ortiz
          </h1>
          {/* Brand badge — swap for the professional portrait when it lands */}
          <Image src="/richard-ortiz-badge.jpeg" alt="Richard Ortiz — Strength, Longevity, 55"
            width={1158} height={1383} priority
            style={{ width: "min(380px, 100%)", height: "auto", marginTop: "2.5rem" }} />
        </div>
      </section>

      <section style={{ background: "var(--bg-2)", padding: "4rem 1.5rem 5rem" }}>
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
          <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "var(--text)" }}>
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
          <div className="card" style={{ borderLeft: "3px solid var(--gold)", padding: "1.75rem" }}>
            <p style={{ color: "var(--text)", lineHeight: 1.7, fontWeight: 600, fontSize: "1.3rem", fontStyle: "italic", fontFamily: "Inter Tight, sans-serif" }}>
              To help people become stronger in body, mind, and spirit so they can live healthier, more fulfilling
              lives and become the person God created them to be.
            </p>
          </div>

          <p style={para}>
            Whether your goal is fat loss, muscle gain, increased energy, improved health markers, or simply feeling
            like yourself again, Richard is committed to helping you reach your next level.
          </p>

          <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "var(--text)", textAlign: "center", marginTop: "1rem" }}>
            Train. Recover. Optimize.
          </p>
          <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "var(--gold)", textAlign: "center" }}>
            Welcome to the Next Level.
          </p>

          <p style={{ color: "var(--text-mute)", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem", lineHeight: 1.7 }}>
            &ldquo;I can do all things through Christ who strengthens me.&rdquo; &mdash; The Epistle to the Philippians 4:13
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg)", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Ready to reach your next level?
          </h2>
          <Link href="/intake" className="btn-gold">Start Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
