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

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section style={{ background: "var(--bg)", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div className="max-w-5xl mx-auto px-6 py-24 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div>
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
          <div className="flex justify-center lg:justify-end order-first lg:order-last">
            <Image src="/richard-ortiz-badge.jpeg" alt="Richard Ortiz Coaching — Strength, Longevity, 55"
              width={1158} height={1383} priority
              style={{ width: "min(440px, 100%)", height: "auto" }} />
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
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
      <section style={{ background: "var(--bg)", padding: "5rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto">
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
      <section style={{ background: "var(--bg-2)", padding: "4rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto text-center">
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
      <section style={{ background: "var(--bg)", padding: "5rem 1.5rem" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
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

      {/* TESTIMONIALS */}
      {successStories.length > 0 && (
        <section style={{ background: "var(--bg)", padding: "5rem 1.5rem", overflow: "hidden" }}>
          <div className="max-w-5xl mx-auto">
            <span className="section-num">Client Stories</span>
            <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "2.5rem" }}>
              Real people. Real results.
            </h2>

            {/* Mobile: vertical stack / Desktop: 3-col grid showing first 3 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "1.25rem",
            }}>
              {successStories.slice(0, 3).map(s => (
                <div key={s.slug} style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}>
                  <Quote size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.75, flex: 1 }}>
                    &ldquo;{s.story.split("\n\n")[0]}&rdquo;
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {s.metrics.slice(0, 2).map(m => (
                      <span key={m} style={{
                        background: "rgba(201,168,76,0.1)", color: "var(--gold)",
                        fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                        borderRadius: "var(--radius)", letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                      {s.name}{s.age ? `, ${s.age}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link href="/success-stories" className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Read All Stories <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SOCIAL PROOF / CTA */}
      <section style={{ background: "var(--bg-2)", padding: "5rem 1.5rem", textAlign: "center" }}>
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
