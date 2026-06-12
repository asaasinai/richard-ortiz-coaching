import type { Metadata } from "next"
import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { User } from "lucide-react"

export const metadata: Metadata = {
  title: "Meet Richard Ortiz | Richard Ortiz Coaching",
  description:
    "30+ years in health, fitness, and nutrition. Founder of Richard Ortiz Coaching and owner of OC LAB. Train. Recover. Optimize.",
}

export default function MeetYourCoachPage() {
  return (
    <>
      <Nav />

      <section style={{ background: "var(--bg)", padding: "6rem 1rem 4rem", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="section-num">Meet Your Coach</span>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Richard Ortiz
          </h1>
          <p style={{ color: "var(--gold)", fontSize: "0.95rem", letterSpacing: "0.05em", marginTop: "0.75rem", fontWeight: 700 }}>
            Train. Recover. Optimize.
          </p>
          {/* Photo slot — replace with next/image when the professional photo lands */}
          <div className="card" style={{
            width: "min(320px, 100%)", aspectRatio: "4/5", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.75rem",
            background: "var(--surface-2)", marginTop: "2.5rem",
          }}>
            <User size={48} style={{ color: "var(--text-mute)" }} />
            <span style={{ color: "var(--text-mute)", fontSize: "0.8rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Photo coming soon
            </span>
          </div>
          <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.8, marginTop: "2.5rem", maxWidth: 560 }}>
            At 55 years old, Richard Ortiz isn&apos;t teaching a lifestyle he once lived — he&apos;s living it every day.
          </p>
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

      {/* FAITH & MISSION */}
      <section style={{ background: "var(--bg)", padding: "5rem 1rem" }}>
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
      <section style={{ background: "var(--bg-2)", padding: "5rem 1rem", textAlign: "center" }}>
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
