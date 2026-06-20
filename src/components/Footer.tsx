import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import { siteConfig } from "@/lib/site-config"

export default function Footer() {
  const socials = [
    { url: siteConfig.social.instagram, label: "Instagram", Icon: Instagram },
    { url: siteConfig.social.facebook, label: "Facebook", Icon: Facebook },
  ].filter(s => s.url)

  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "3rem 1.5rem" }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--text)" }}>RICHARD ORTIZ COACHING</span>
          <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.75rem", lineHeight: 1.7 }}>
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
