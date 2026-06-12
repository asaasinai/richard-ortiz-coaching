import Link from "next/link"
export default function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "3rem 1rem" }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, color: "var(--text)" }}>RICHARD ORTIZ COACHING</span>
          <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.75rem", lineHeight: 1.7 }}>
            Personalized peptide therapy guidance and wellness coaching.
          </p>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Navigation</span>
          <ul style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              ["Peptides",   "/peptides"],
              ["Calculator", "https://thepeptidepedia.com/dose"],
              ["Intake",     "/intake"],
              ["Check-In",   "/checkin"],
              ["Dashboard",  "/dashboard"],
              ["Contact",    "/contact"],
            ].map(([l,h]) => (
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
