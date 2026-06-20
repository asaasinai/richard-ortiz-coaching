import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import { siteConfig } from "@/lib/site-config"

export default function Footer() {
  const socials = [
    { url: siteConfig.social.instagram, label: "Instagram", Icon: Instagram },
    { url: siteConfig.social.facebook, label: "Facebook", Icon: Facebook },
  ].filter(s => s.url)

  return (
    <footer style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.015))", borderTop: "1px solid var(--border)", padding: "4rem 1.5rem 3rem" }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: "var(--gold-grad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(212,175,90,0.3)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", color: "#1A1400" }}>R</span>
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em", color: "var(--text)" }}>RICHARD ORTIZ COACHING</span>
          </div>
          <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "1rem", lineHeight: 1.7 }}>
            Transformation and performance coaching — fat loss, lean muscle, strength, nutrition, recovery, and accountability.
          </p>
          <p style={{ color: "var(--gold)", fontSize: "0.8rem", marginTop: "0.5rem", letterSpacing: "0.05em" }}>
            Train. Recover. Optimize.
          </p>
          {socials.length > 0 && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              {socials.map(({ url, label, Icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ color: "var(--text-soft)" }} className="hover:text-white transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Navigation</span>
          <ul style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              ["Program", "/coaching"],
              ["Meet Your Coach", "/meet-your-coach"],
              ["Success Stories", "/success-stories"],
              ["Intake Form", "/intake"],
              ["Two-Week Check-In", "/checkin"],
              ["Client Dashboard", "/dashboard"],
              ["Contact", "/contact"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} style={{ color: "var(--text-soft)", fontSize: "0.85rem" }} className="hover:text-white transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", marginTop: "2rem", paddingTop: "1.5rem", textAlign: "center" }}>
        <span style={{ color: "var(--text-mute)", fontSize: "0.8rem" }}>© {new Date().getFullYear()} Richard Ortiz Coaching. All rights reserved.</span>
      </div>
    </footer>
  )
}
