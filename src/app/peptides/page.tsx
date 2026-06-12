import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { PEPTIDES } from "@/lib/peptides-data"

const EVIDENCE_COLORS: Record<string,{bg:string,color:string}> = {
  "Clinical / FDA-approved": { bg:"rgba(74,222,128,0.1)",  color:"#4ade80" },
  "Human observational":     { bg:"rgba(96,165,250,0.1)",  color:"#60a5fa" },
  "Community consensus":     { bg:"rgba(201,168,76,0.1)",  color:"var(--gold)" },
}

export default function PeptidesPage() {
  return (
    <>
      <Nav/>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <span className="section-num">03 — Peptide Library</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em",marginBottom:"0.5rem" }}>
          Peptide Library
        </h1>
        <p style={{ color:"var(--text-soft)",maxWidth:600,marginBottom:"0.75rem",lineHeight:1.7 }}>
          Evidence-graded summaries for the 10 peptides in our coaching catalogue.
          Full protocol data sourced from{" "}
          <a href="https://thepeptidepedia.com" target="_blank" rel="noopener"
            style={{ color:"var(--gold)",fontWeight:600 }}>thepeptidepedia.com</a>.
        </p>

        <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap",marginBottom:"2.5rem" }}>
          {Object.entries(EVIDENCE_COLORS).map(([label,c])=>(
            <span key={label} style={{ fontSize:"0.75rem",fontWeight:700,padding:"0.25rem 0.75rem",borderRadius:99,
              background:c.bg,color:c.color,border:`1px solid ${c.color}40` }}>
              {label}
            </span>
          ))}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"1.25rem" }}>
          {PEPTIDES.map(p => {
            const ec = EVIDENCE_COLORS[p.evidence] ?? EVIDENCE_COLORS["Community consensus"]
            return (
              <Link key={p.slug} href={`/peptides/${p.slug}`} style={{ textDecoration:"none" }}>
                <div className="card" style={{ cursor:"pointer",height:"100%",display:"flex",flexDirection:"column",gap:"0.75rem" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div>
                      <h2 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.05rem",marginBottom:"0.2rem" }}>{p.name}</h2>
                      {p.aliases.length>0 && (
                        <p style={{ fontSize:"0.72rem",color:"var(--text-mute)" }}>{p.aliases.slice(0,2).join(", ")}</p>
                      )}
                    </div>
                    <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:99,
                      background:ec.bg,color:ec.color,border:`1px solid ${ec.color}40`,flexShrink:0,marginTop:"0.15rem" }}>
                      {p.evidence}
                    </span>
                  </div>

                  <p style={{ fontSize:"0.82rem",color:"var(--text-soft)",lineHeight:1.65,flex:1 }}>
                    {p.reviewerNote.length>160 ? p.reviewerNote.slice(0,157)+"..." : p.reviewerNote}
                  </p>

                  <div style={{ display:"flex",gap:"1.25rem",fontSize:"0.75rem",color:"var(--text-mute)",flexWrap:"wrap",borderTop:"1px solid var(--border)",paddingTop:"0.6rem" }}>
                    <span>Vials: {p.commonVialMg.join(" / ")} mg</span>
                    <span>Routes: {p.routes}</span>
                    <span>{p.regimens.length} regimen{p.regimens.length!==1?"s":""}</span>
                  </div>

                  <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.78rem",color:"var(--gold)",fontWeight:600 }}>View details</span>
                    <a href={`https://thepeptidepedia.com/dose/${p.slug}`} target="_blank" rel="noopener"
                      onClick={e=>e.stopPropagation()}
                      style={{ fontSize:"0.78rem",color:"var(--text-mute)",display:"inline-flex",alignItems:"center",gap:"0.25rem",textDecoration:"none" }}>
                      <ExternalLink size={11}/> Dosing calc
                    </a>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p style={{ fontSize:"0.78rem",color:"var(--text-mute)",marginTop:"3rem",lineHeight:1.6 }}>
          Educational use only. Richard Ortiz Coaching does not prescribe peptides or provide medical advice.
          All protocols require a licensed physician.
        </p>
      </div>
      <Footer/>
    </>
  )
}
