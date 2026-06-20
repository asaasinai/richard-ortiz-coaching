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

      <section style={{ position: "relative", padding: "7rem 1.5rem 4rem", overflow: "hidden" }}>
        <div className="max-w-5xl mx-auto reveal">
          <span className="section-num">Success Stories</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)", letterSpacing: "-0.035em", lineHeight: 1.06, maxWidth: 720 }}>
            Real people. <span className="gold-text">Real transformations.</span>
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.7, marginTop: "1.75rem", maxWidth: 540 }}>
            Fat loss, lean muscle, strength, energy, and lifestyles that last — built with the PHAS3 System.
          </p>
        </div>
      </section>

      <section style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.012))", padding: "4.5rem 1.5rem 5.5rem", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          {successStories.length === 0 ? (
            /* Designed empty state — never a blank page, never fake testimonials */
            <div className="card" style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "4.5rem 2rem", maxWidth: 640, margin: "0 auto", boxShadow: "var(--glow-gold)", borderColor: "rgba(212,175,90,0.3)" }}>
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 280, height: 200, background: "radial-gradient(circle, rgba(212,175,90,0.16), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--gold-dim)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <TrendingUp size={28} style={{ color: "var(--gold)" }} />
                </div>
                <h2 className="gold-text" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>
                  Client transformations coming soon.
                </h2>
                <p style={{ color: "var(--text-soft)", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "1.02rem" }}>
                  We&apos;re collecting before-and-after results from clients right now.
                  In the meantime — why read about someone else&apos;s transformation when you could start your own?
                </p>
                <Link href="/intake" className="btn-gold">Be the Next Story</Link>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {outcomes.map(o => (
                    <span key={o} className="chip" style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{o}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {successStories.map((s, idx) => (
                <div key={s.slug} className="card reveal" style={{
                  padding: 0,
                  overflow: "hidden",
                  animationDelay: `${0.06 * idx}s`,
                }}>
                  {/* Photos row if present */}
                  {s.beforePhoto && s.afterPhoto && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      {[[s.beforePhoto, "Before"], [s.afterPhoto, "After"]].map(([src, label]) => (
                        <div key={label} style={{ position: "relative" }}>
                          <Image src={src} alt={`${s.name} — ${label}`} width={600} height={700}
                            style={{ width: "100%", height: "auto", display: "block" }} />
                          <span style={{
                            position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)",
                            color: "var(--gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: "var(--radius)",
                          }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: "clamp(1.25rem, 4vw, 2rem)" }}>
                    {/* Name + metrics row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.3rem", margin: 0 }}>
                        {s.name}{s.age ? `, ${s.age}` : ""}
                      </h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {s.metrics.map(m => (
                          <span key={m} style={{
                            background: "var(--gold-dim)", color: "var(--gold-light)", fontSize: "0.72rem",
                            fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "var(--radius-pill)",
                            letterSpacing: "0.03em",
                          }}>{m}</span>
                        ))}
                      </div>
                    </div>

                    <p style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", lineHeight: 1.3 }}>
                      &ldquo;{s.headline}&rdquo;
                    </p>

                    {/* Full story — paragraphs split on double newline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {s.story.split("\n\n").map((para, i) => (
                        <p key={i} style={{ color: "var(--text-soft)", fontSize: "0.92rem", lineHeight: 1.8, margin: 0 }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
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
