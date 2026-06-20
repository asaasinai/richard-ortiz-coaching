import Link from "next/link"
import Image from "next/image"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Dumbbell, Moon, Target, ClipboardList, FileText, CalendarCheck, RefreshCw, ArrowRight, Quote } from "lucide-react"
import { successStories } from "@/lib/success-stories-data"

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

const h2 = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.4rem)", letterSpacing: "-0.025em", marginBottom: "2.5rem", lineHeight: 1.08 } as const

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div className="max-w-5xl mx-auto px-6 py-24 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal">
            <span className="section-num">Welcome to the Next Level</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.75rem, 6.5vw, 4.5rem)", lineHeight: 1.02, letterSpacing: "-0.035em", color: "var(--text)", maxWidth: 700 }}>
              Train. <span className="gold-text">Recover.</span> Optimize.
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: "1.15rem", lineHeight: 1.7, marginTop: "1.75rem", maxWidth: 520 }}>
              Personalized coaching designed to help you lose body fat, build lean muscle,
              improve performance, and create sustainable results.
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Link href="/intake" className="btn-gold">Start Intake</Link>
              <Link href="/coaching" className="btn-outline">Learn About Coaching</Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end order-first lg:order-last reveal" style={{ animationDelay: "0.12s" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: "-12%", background: "radial-gradient(circle at 50% 45%, rgba(212,175,90,0.28), transparent 62%)", filter: "blur(8px)", pointerEvents: "none" }} />
              <Image src="/richard-ortiz-badge.jpeg" alt="Richard Ortiz Coaching — Strength, Longevity, 55"
                width={1158} height={1383} priority
                style={{ width: "min(440px, 100%)", height: "auto", position: "relative", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.012))", padding: "6rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-num">The PHAS3 System</span>
          <h2 style={h2}>Three pillars. One system.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
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

      {/* HOW IT WORKS */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-num">How It Works</span>
          <h2 style={h2}>A simple system built for real life.</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="card reveal" style={{ animationDelay: `${0.07 * i}s` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <span className="gold-text" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.9rem", lineHeight: 1 }}>{i + 1}</span>
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
      <section style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.012), transparent)", padding: "4.5rem 1.5rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <span className="section-num">Real Results</span>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {outcomes.map(o => (
              <span key={o} className="chip" style={{
                padding: "0.55rem 1.25rem", fontSize: "0.82rem", letterSpacing: "0.04em", textTransform: "uppercase",
              }}>{o}</span>
            ))}
          </div>
        </div>
      </section>

      {/* COACH TEASER */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="section-num">Your Coach</span>
            <h2 style={{ ...h2, marginBottom: "1rem" }}>Richard Ortiz</h2>
            <p style={{ color: "var(--text-soft)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
              At 55, Richard isn&apos;t teaching a lifestyle he once lived — he&apos;s living it every day.
              With 30+ years in health, fitness, and nutrition, he has helped hundreds of people
              lose body fat, build lean muscle, and become the strongest version of themselves.
            </p>
            <Link href="/meet-your-coach" className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Meet Your Coach <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card" style={{ position: "relative", overflow: "hidden", boxShadow: "var(--glow-gold)", borderColor: "rgba(212,175,90,0.3)" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "radial-gradient(circle, rgba(212,175,90,0.16), transparent 70%)", pointerEvents: "none" }} />
            <Quote size={28} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
            <p style={{ color: "var(--text)", lineHeight: 1.7, fontSize: "1.1rem", fontFamily: "var(--font-display)", fontWeight: 500 }}>
              &ldquo;My mission is simple: to help people become stronger in body, mind, and spirit so they can
              live healthier, more fulfilling lives.&rdquo;
            </p>
            <p style={{ color: "var(--gold)", fontSize: "0.85rem", marginTop: "1rem", fontWeight: 700 }}>— Richard Ortiz</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {successStories.length > 0 && (
        <section style={{ padding: "6rem 1.5rem", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-5xl mx-auto">
            <span className="section-num">Client Stories</span>
            <h2 style={h2}>Real people. Real results.</h2>

            {/* Mobile: vertical stack / Desktop: 3-col grid showing first 3 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "1.25rem",
            }}>
              {successStories.slice(0, 3).map((s, i) => (
                <div key={s.slug} className="card reveal" style={{
                  display: "flex", flexDirection: "column", gap: "1rem", animationDelay: `${0.08 * i}s`,
                }}>
                  <Quote size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.75, flex: 1 }}>
                    &ldquo;{s.story.split("\n\n")[0]}&rdquo;
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {s.metrics.slice(0, 2).map(m => (
                      <span key={m} style={{
                        background: "var(--gold-dim)", color: "var(--gold-light)",
                        fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.65rem",
                        borderRadius: "var(--radius-pill)", letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
                      {s.name}{s.age ? `, ${s.age}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <Link href="/success-stories" className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Read All Stories <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SOCIAL PROOF / CTA */}
      <section style={{ position: "relative", padding: "7rem 1.5rem", textAlign: "center", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 380px at 50% 0%, rgba(212,175,90,0.12), transparent 65%)", pointerEvents: "none" }} />
        <div className="max-w-3xl mx-auto" style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2rem,4.5vw,3rem)", letterSpacing: "-0.03em", marginBottom: "1.25rem", lineHeight: 1.05 }}>
            Ready for your <span className="gold-text">transformation?</span>
          </h2>
          <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "2.25rem" }}>
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
