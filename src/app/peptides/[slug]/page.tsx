import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ExternalLink, ArrowLeft } from "lucide-react"

const peptideData: Record<string, {
  name: string; summary: string; benefits: string[];
  contraindications: string[]; sideEffects: string[]
}> = {
  "bpc-157": {
    name: "BPC-157",
    summary: "Body Protection Compound — accelerates tissue healing and reduces inflammation.",
    benefits: ["Accelerated tendon & ligament healing","Reduced inflammation","Gut healing (IBD, leaky gut)","Improved muscle recovery"],
    contraindications: ["Active cancer","Pregnancy","Known hypersensitivity"],
    sideEffects: ["Mild injection site redness","Rare: nausea","Rare: dizziness"],
  },
  "semaglutide": {
    name: "Semaglutide",
    summary: "GLP-1 agonist for weight management and metabolic health.",
    benefits: ["Significant weight loss (~15% body weight)","Improved HbA1c","Cardiovascular protection","Reduced cravings"],
    contraindications: ["Medullary thyroid carcinoma history","MEN2","Pancreatitis","Pregnancy"],
    sideEffects: ["Nausea (early phase)","Vomiting","Constipation","Injection site reactions"],
  },
  "tb-500": {
    name: "TB-500 (Thymosin Beta-4)",
    summary: "Actin-binding peptide for muscle repair, flexibility, and recovery.",
    benefits: ["Accelerated muscle & tendon repair","Improved flexibility","Reduced scar tissue","Hair regrowth"],
    contraindications: ["Active malignancy","Pregnancy"],
    sideEffects: ["Mild transient fatigue","Injection site reactions","Rare: headache"],
  },
}

export default function PeptideDetailPage({ params }: { params: { slug: string } }) {
  const p = peptideData[params.slug] ?? null
  const base = process.env.NEXT_PUBLIC_PEPTIDEPEDIA_BASE ?? "https://thepeptidepedia.com"

  if (!p) return (
    <><Nav />
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p style={{ color:"var(--text-mute)" }}>Peptide not found.</p>
      <Link href="/peptides" style={{ color:"var(--gold)",marginTop:"1rem",display:"inline-block" }}>Back to Peptides</Link>
    </div><Footer /></>
  )

  return (
    <><Nav />
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/peptides" style={{ color:"var(--text-mute)",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:"0.3rem",marginBottom:"1.5rem" }}>
        <ArrowLeft size={13}/> All Peptides
      </Link>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em" }}>{p.name}</h1>
      <p style={{ color:"var(--text-soft)",marginTop:"0.6rem",fontSize:"1.05rem" }}>{p.summary}</p>
      <a href={`${base}/peptides/${params.slug}`} target="_blank" rel="noopener"
        style={{ display:"inline-flex",alignItems:"center",gap:"0.5rem",marginTop:"1.25rem",color:"var(--gold)",fontSize:"0.875rem",border:"1px solid var(--border)",padding:"0.5rem 1rem",borderRadius:"var(--radius)" }}>
        <ExternalLink size={13}/> Full research on PeptidePedia
      </a>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginTop:"2.5rem" }}>
        <div className="card">
          <h3 style={{ color:"var(--gold)",fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"1rem" }}>Benefits</h3>
          <ul style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
            {p.benefits.map(b => <li key={b} style={{ fontSize:"0.875rem",color:"var(--text-soft)",paddingLeft:"1rem",position:"relative" }}>
              <span style={{ position:"absolute",left:0,color:"var(--gold)" }}>&#x2192;</span>{b}
            </li>)}
          </ul>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"1.5rem" }}>
          <div className="card">
            <h3 style={{ color:"#f87171",fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"1rem" }}>Contraindications</h3>
            <ul style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
              {p.contraindications.map(c => <li key={c} style={{ fontSize:"0.875rem",color:"var(--text-soft)" }}>{c}</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ color:"var(--gold)",fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"1rem" }}>Side Effects</h3>
            <ul style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
              {p.sideEffects.map(s => <li key={s} style={{ fontSize:"0.875rem",color:"var(--text-soft)" }}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        <Link href="/protocols" className="btn-gold">View Protocols</Link>
        <Link href="/calculator" className="btn-outline">Open Calculator</Link>
      </div>
    </div><Footer /></>
  )
}
