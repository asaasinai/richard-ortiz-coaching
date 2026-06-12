import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

const peptides = [
  { name: "BPC-157",         slug: "bpc-157",        summary: "Body Protection Compound — accelerates tissue healing, reduces inflammation, supports gut health.", category: "Healing & Recovery" },
  { name: "CJC-1295",        slug: "cjc-1295",       summary: "GHRH analogue — stimulates growth hormone release, improves body composition and sleep quality.", category: "Growth Hormone" },
  { name: "GHK-Cu",          slug: "ghk-cu",         summary: "Copper tripeptide — skin regeneration, hair growth, anti-inflammatory, wound healing.", category: "Anti-Aging" },
  { name: "Ipamorelin",      slug: "ipamorelin",     summary: "Selective GH secretagogue — clean GH pulse without cortisol or prolactin spikes.", category: "Growth Hormone" },
  { name: "KPV",             slug: "kpv",            summary: "Anti-inflammatory tripeptide — gut health, IBD, Crohn\'s, skin conditions.", category: "Anti-Inflammatory" },
  { name: "Melanotan II",    slug: "melanotan-ii",   summary: "Melanocortin agonist — tanning, libido, appetite suppression.", category: "Cosmetic & Libido" },
  { name: "PT-141",          slug: "pt-141",         summary: "Central nervous system-acting libido enhancer — FDA-approved for female sexual dysfunction.", category: "Libido" },
  { name: "Semaglutide",     slug: "semaglutide",    summary: "GLP-1 receptor agonist — weight loss, blood sugar regulation, appetite suppression.", category: "Weight Management" },
  { name: "Sermorelin",      slug: "sermorelin",     summary: "GHRH analogue — stimulates pituitary GH release, anti-aging, sleep, body composition.", category: "Growth Hormone" },
  { name: "TB-500",          slug: "tb-500",         summary: "Actin-binding peptide — muscle repair, flexibility, cardiovascular recovery, hair regrowth.", category: "Healing & Recovery" },
  { name: "Tesamorelin",     slug: "tesamorelin",    summary: "GHRH analogue — FDA-approved for HIV lipodystrophy; visceral fat reduction.", category: "Growth Hormone" },
  { name: "Tirzepatide",     slug: "tirzepatide",    summary: "Dual GIP/GLP-1 agonist — superior weight loss, metabolic health, insulin sensitivity.", category: "Weight Management" },
]

const categories = Array.from(new Set(peptides.map(p => p.category)))

export default function PeptidesPage() {
  return (
    <>
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <span className="section-num">03 — Peptide Catalogue</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em" }}>Peptide Library</h1>
        <p style={{ color:"var(--text-soft)",marginTop:"0.75rem",maxWidth:600 }}>
          Plain-language summaries of the most commonly coached peptides. Deep-reading links to{" "}
          <a href="https://thepeptidepedia.com" target="_blank" rel="noopener" style={{ color:"var(--gold)" }}>thepeptidepedia.com</a>{" "}
          for full research references.
        </p>

        {categories.map(cat => (
          <div key={cat} className="mt-12">
            <h2 style={{ fontSize:"0.75rem",color:"var(--gold)",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:"1rem" }}>{cat}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peptides.filter(p => p.category === cat).map(p => (
                <div key={p.slug} className="card flex flex-col gap-3">
                  <h3 style={{ fontWeight:700,fontSize:"1rem" }}>{p.name}</h3>
                  <p style={{ color:"var(--text-mute)",fontSize:"0.875rem",lineHeight:1.65,flex:1 }}>{p.summary}</p>
                  <div className="flex gap-3 flex-wrap">
                    <Link href={`/peptides/${p.slug}`} className="btn-outline" style={{ padding:"0.4rem 1rem",fontSize:"0.75rem" }}>Details + Protocol</Link>
                    <a href={`https://thepeptidepedia.com/peptides/${p.slug}`} target="_blank" rel="noopener"
                      style={{ display:"inline-flex",alignItems:"center",gap:"0.35rem",fontSize:"0.75rem",color:"var(--gold)" }}>
                      <ExternalLink size={12} /> PeptidePedia
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  )
}
