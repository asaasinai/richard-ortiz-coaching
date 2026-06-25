import type { Metadata } from "next"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pricing | Richard Ortiz Coaching",
  description:
    "Two tiers of transformation coaching — product + protocol support and full coaching. Customized to your goals.",
}

const tiers = [
  {
    num: "01",
    name: "Product + Protocol Support",
    price: "Starting at $349/month",
    tagline:
      "Perfect for individuals who want access to quality products with expert guidance.",
    features: [
      "Product Included",
      "Recommended Dosing Protocol",
      "Twice-Monthly Check-Ins with Coach",
      "Accountability & Support",
    ],
    differentiator: "You follow the protocol.",
    highlight: false,
    ctaLabel: "Get Started",
  },
  {
    num: "02",
    name: "Full Transformation Coaching",
    price: "Starting at $599/month",
    tagline:
      "Our highest level of support designed for maximum results. Custom protocols may include advanced optimization strategies based on your goals and starting point.",
    features: [
      "Product Included",
      "Recommended Dosing Protocol",
      "Weekly Check-Ins with Coach",
      "Accountability & Support",
      "Weekly Protocol Adjustments",
      "Nutrition Guidance",
      "Training Guidance",
      "Ongoing Coaching",
    ],
    differentiator: "I coach you every step of the way.",
    highlight: true,
    badge: "Most Popular",
    ctaLabel: "Get Started",
  },
]

export default function PricingPage() {
  return (
    <>
      <Nav />

      <main style={{ minHeight: "100vh" }}>
        {/* ─── Page header ─── */}
        <section style={{ position: "relative", padding: "6.5rem 1.5rem 3.5rem", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 360px at 50% -10%, rgba(212,175,90,0.1), transparent 65%)", pointerEvents: "none" }} />
          <div className="max-w-3xl mx-auto text-center reveal" style={{ position: "relative" }}>
            <p className="section-num" style={{ marginBottom: "1rem" }}>
              Pricing
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                letterSpacing: "-0.03em",
                color: "var(--text)",
                marginBottom: "0.75rem",
                lineHeight: 1.1,
              }}
            >
              The Richard Ortiz Transformation System
            </h1>
            <p
              style={{
                color: "var(--gold)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                fontSize: "0.85rem",
                textTransform: "uppercase",
                marginBottom: "1.25rem",
              }}
            >
              Strength • Fat Loss • Longevity
            </p>
            <p
              style={{
                color: "var(--text-soft)",
                fontSize: "1.05rem",
                lineHeight: 1.65,
                maxWidth: "580px",
                margin: "0 auto",
              }}
            >
              Every protocol is customized based on your goals, experience, and
              current starting point.
            </p>
          </div>
        </section>

        {/* ─── Pricing grid ─── */}
        <section style={{ padding: "0 1.5rem 5rem" }}>
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {tiers.map((tier, i) => (
              <div
                key={tier.num}
                className="card reveal"
                style={{
                  position: "relative",
                  border: tier.highlight
                    ? "1px solid rgba(212,175,90,0.5)"
                    : "1px solid var(--border)",
                  transform: tier.highlight ? "translateY(-8px)" : "none",
                  boxShadow: tier.highlight
                    ? "var(--glow-gold), 0 24px 60px rgba(0,0,0,0.4)"
                    : "var(--shadow-card)",
                  padding: "2.25rem 2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  animationDelay: `${0.08 * i}s`,
                }}
              >
                {/* Glow blob clipped to the card so it doesn't spill, while the
                    card itself stays unclipped so the badge isn't cut off. */}
                {tier.highlight && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle, rgba(212,175,90,0.16), transparent 70%)" }} />
                  </div>
                )}
                {/* Most Popular badge */}
                {tier.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-1px",
                      left: "50%",
                      transform: "translateX(-50%) translateY(-50%)",
                      background: "var(--gold-grad)",
                      color: "#1A1400",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "0.32rem 0.95rem",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 6px 18px rgba(212,175,90,0.4)",
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Tier number + name */}
                <div>
                  <span
                    className="section-num"
                    style={{ fontSize: "0.72rem", marginBottom: "0.5rem", display: "block" }}
                  >
                    {tier.num}
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: "1.25rem",
                      color: "var(--text)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {tier.name}
                  </h2>
                </div>

                {/* Price */}
                <div>
                  <p
                    className={tier.highlight ? "gold-text" : undefined}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "1.7rem",
                      color: tier.highlight ? undefined : "var(--text)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                    }}
                  >
                    {tier.price}
                  </p>
                </div>

                {/* Tagline */}
                <p
                  style={{
                    color: "var(--text-soft)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  {tier.tagline}
                </p>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "var(--border)",
                  }}
                />

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        color: "var(--text-soft)",
                        fontSize: "0.88rem",
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "rgba(201,168,76,0.15)",
                          border: "1px solid var(--gold)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4l2 2 4-4"
                            stroke="#C9A84C"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Differentiator */}
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "var(--gold)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                    marginTop: "auto",
                  }}
                >
                  {tier.differentiator}
                </p>

                {/* CTA */}
                <Link
                  href="/intake"
                  className={tier.highlight ? "btn-gold" : "btn-outline"}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  {tier.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Bottom CTA ─── */}
        <section
          style={{
            position: "relative",
            borderTop: "1px solid var(--border)",
            padding: "7rem 1.5rem",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 380px at 50% 0%, rgba(212,175,90,0.12), transparent 65%)", pointerEvents: "none" }} />
          <div className="max-w-2xl mx-auto text-center" style={{ position: "relative" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                color: "var(--text)",
                letterSpacing: "-0.03em",
                marginBottom: "1.25rem",
                lineHeight: 1.05,
              }}
            >
              Schedule Your <span className="gold-text">Consultation</span>
            </h2>
            <p
              style={{
                color: "var(--text-soft)",
                fontSize: "1rem",
                lineHeight: 1.65,
                marginBottom: "2rem",
              }}
            >
              Every protocol is customized based on your goals, experience, and
              current starting point.
            </p>
            <Link
              href="/intake"
              className="btn-gold"
              style={{ padding: "0.9rem 2.5rem", fontSize: "0.95rem" }}
            >
              Start Your Intake
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
