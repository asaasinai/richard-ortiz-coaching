import Link from "next/link"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <>
      <Nav />
      {/* HERO */}
      <section style={{ background: "var(--bg)", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div className="max-w-6xl mx-auto px-4 py-24">
        <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--text)", maxWidth: 700 }}>
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
      </section>
      <Footer />
    </>
  )
}
