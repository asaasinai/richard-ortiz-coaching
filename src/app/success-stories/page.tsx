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

      <section style={{ background: "var(--bg)", padding: "6rem 1.5rem 4rem" }}>
        <div className="max-w-5xl mx-auto">
          <span className="section-num">Success Stories</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2.2rem, 5vw, 3.25rem)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 700 }}>
            Real people. Real transformations.
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 540 }}>
            Fat loss, lean muscle, strength, energy, and lifestyles that last — built with the PHAS3 System.
          </p>
        </div>
      </section>

      <section style={{ background: "var(--bg-2)", padding: "4rem 1.5rem 5rem" }}>
        <div className="max-w-5xl mx-auto">
          {successStories.length === 0 ? (
            /* Designed empty state — never a blank page, never fake testimonials */
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
              <TrendingUp size={36} style={{ color: "var(--gold)", margin: "0 auto 1.25rem" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.5rem", marginBottom: "0.75rem" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {successStories.map(s => (
                <div key={s.slug} style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
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
                            background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "0.72rem",
                            fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "var(--radius)",
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
