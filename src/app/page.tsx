import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Beaker, FileText, Activity, Shield } from "lucide-react"

const services = [
  { icon: Beaker, title: "Peptide Guidance", desc: "Evidence-based protocols for GLP-1, BPC-157, TB-500, Sermorelin & more. Every recommendation linked to thepeptidepedia.com." },
  { icon: FileText, title: "Dosage Calculator", desc: "Precise syringe calculations — input your vial, reconstitution volume, desired dose. PDF export included." },
  { icon: Activity, title: "Progress Check-Ins", desc: "Structured 2-week check-ins track adherence, side effects, and subjective progress. Flags sent to coach automatically." },
  { icon: Shield, title: "Private Dashboard", desc: "Your protocols, PDFs, check-in history, and booking link — all in one secure client portal." },
]

export default function Home() {
  return (
    <>
      <Nav />
      {/* HERO */}
      <section style={{ background: "var(--bg)", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="section-num">01 — Coaching</span>
            <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--text)" }}>
              Peptide Therapy.<br />
              <span style={{ color: "var(--gold)" }}>Done Right.</span>
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: "1.1rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 480 }}>
              Personalized guidance on peptide protocols, dosage calculations, and wellness coaching — all evidence-referenced and coach-supervised.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/intake" className="btn-gold">Start Intake</Link>
              <Link href="/peptides" className="btn-outline">Browse Peptides</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-20">
          <span className="section-num">02 — Services</span>
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "2rem", letterSpacing: "-0.02em" }}>What You Get</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {services.map(s => (
              <div key={s.title} className="card">
                <s.icon size={20} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ color: "var(--text-mute)", fontSize: "0.9rem", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{ background: "var(--gold)", padding: "4rem 1rem" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "1.75rem", color: "#000", letterSpacing: "-0.02em" }}>Ready to start your protocol?</h2>
          <p style={{ color: "rgba(0,0,0,0.7)", marginTop: "0.75rem", marginBottom: "2rem" }}>Complete the intake form — takes about 10 minutes. Coach reviews within 48 hours.</p>
          <Link href="/intake" style={{ background: "#000", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.9rem 2.5rem", borderRadius: "var(--radius)", display: "inline-block" }}>Begin Intake</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
