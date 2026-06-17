import type { Metadata } from "next"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pricing | Richard Ortiz Coaching",
  description:
    "Three tiers of transformation coaching — product + protocol support, guided optimization, and full coaching. Customized to your goals.",
}

const tiers = [
  {
    num: "01",
    name: "Product + Protocol Support",
    price: "Starting at $199/month",
    tagline:
      "Perfect for individuals who want access to quality products with expert guidance.",
    features: [
      "Product Included",
      "Recommended Dosing Protocol",
      "Reconstitution Instructions",
      "Protocol Guide",
      "Basic Support",
    ],
    differentiator: "You follow the protocol.",
    highlight: false,
    ctaLabel: "Get Started",
  },
  {
    num: "02",
    name: "Guided Optimization",
    price: "Starting at $299/month",
    tagline:
      "For clients who want additional accountability, monitoring, and adjustments.",
    features: [
      "Product Included",
      "Bi-Weekly Check-Ins",
      "Progress Monitoring",
      "Protocol Adjustments",
      "Direct Support Access",
    ],
    differentiator: "We monitor and adjust together.",
    highlight: true,
    badge: "Most Popular",
    ctaLabel: "Get Started",
  },
  {
    num: "03",
    name: "Full Transformation Coaching",
    price: "Starting at $599/month",
    tagline:
      "Our highest level of support designed for maximum results. Custom protocols may include advanced optimization strategies based on your goals and starting point.",
    features: [
      "Product Included",
      "Weekly Check-Ins",
      "Nutrition Guidance",
      "Training Guidance",
      "Weekly Protocol Adjustments",
      "Accountability & Support",
      "Ongoing Coaching",
    ],
    differentiator: "I coach you every step of the way.",
    highlight: false,
    ctaLabel: "Get Started",
  },
]

export default function PricingPage() {
  return (
    <>
      <Nav />

      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        {/* ─── Page header ─── */}
        <section style={{ padding: "5rem 1.5rem 3.5rem" }}>
          <div className="max-w-3xl mx-auto text-center">
            <p className="section-num" style={{ marginBottom: "1rem" }}>
              Pricing
            </p>
            <h1
              style={{
                fontFamily: "Inter Tight, sans-serif",
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
                fontFamily: "Inter Tight, sans-serif",
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
            {tiers.map((tier) => (
              <div
                key={tier.num}
                className="card"
                style={{
                  position: "relative",
                  border: tier.highlight
                    ? "2px solid var(--gold)"
                    : "1px solid var(--border)",
                  transform: tier.highlight ? "translateY(-6px)" : "none",
                  boxShadow: tier.highlight
                    ? "0 20px 60px rgba(201, 168, 76, 0.12)"
                    : "none",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {/* Most Popular badge */}
                {tier.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-1px",
                      left: "50%",
                      transform: "translateX(-50%) translateY(-50%)",
                      background: "var(--gold)",
                      color: "#000",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "0.3rem 0.9rem",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
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
                      fontFamily: "Inter Tight, sans-serif",
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
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 900,
                      fontSize: "1.6rem",
                      color: tier.highlight ? "var(--gold)" : "var(--text)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
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
                    fontFamily: "Inter Tight, sans-serif",
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
            background: "var(--bg-2)",
            borderTop: "1px solid var(--border)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                color: "var(--text)",
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              Schedule Your Consultation
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
