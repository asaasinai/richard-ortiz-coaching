import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ExternalLink, ArrowLeft, AlertTriangle, Beaker } from "lucide-react"
import { PEPTIDES } from "@/lib/peptides-data"

const EC: Record<string,{bg:string,color:string}> = {
  "Clinical / FDA-approved": { bg:"rgba(74,222,128,0.1)",  color:"#4ade80" },
  "Human observational":     { bg:"rgba(96,165,250,0.1)",  color:"#60a5fa" },
  "Community consensus":     { bg:"rgba(201,168,76,0.1)",  color:"var(--gold)" },
}

export function generateStaticParams() {
  return PEPTIDES.map(p => ({ slug: p.slug }))
}

export default function PeptideDetailPage({ params }: { params: { slug: string } }) {
  const p = PEPTIDES.find(x => x.slug === params.slug) ?? null
  if (!p) return (
    <><Nav/>
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p style={{color:"var(--text-mute)"}}>Peptide not found.</p>
      <Link href="/peptides" style={{color:"var(--gold)",marginTop:"1rem",display:"inline-block"}}>Back to Library</Link>
    </div><Footer/></>
  )

  const ec = EC[p.evidence] ?? EC["Community consensus"]

  return (
    <><Nav/>
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/peptides" style={{color:"var(--text-mute)",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:"0.3rem",marginBottom:"1.5rem",textDecoration:"none"}}>
        <ArrowLeft size={13}/> Peptide Library
      </Link>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.75rem",marginBottom:"0.5rem"}}>
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em"}}>{p.name}</h1>
        <span style={{fontSize:"0.78rem",fontWeight:700,padding:"0.3rem 0.9rem",borderRadius:99,
          background:ec.bg,color:ec.color,border:`1px solid ${ec.color}40`}}>{p.evidence}</span>
      </div>
      {p.aliases.length>0 && <p style={{color:"var(--text-mute)",fontSize:"0.85rem",marginBottom:"0.75rem"}}>Also known as: {p.aliases.join(", ")}</p>}
      <p style={{color:"var(--text-soft)",fontSize:"1rem",lineHeight:1.75,maxWidth:680,marginBottom:"0.75rem"}}>{p.reviewerNote}</p>
      <p style={{fontSize:"0.75rem",color:"var(--text-mute)",marginBottom:"2rem"}}>Last reviewed: {p.lastReviewed}</p>

      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",marginBottom:"2.5rem"}}>
        <a href={`https://thepeptidepedia.com/peptides/${p.slug}`} target="_blank" rel="noopener"
          style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",color:"var(--gold)",fontSize:"0.85rem",
            border:"1px solid var(--border)",padding:"0.45rem 1rem",borderRadius:"var(--radius)",textDecoration:"none"}}>
          <ExternalLink size={13}/> Full profile on PeptidePedia
        </a>
        <a href={`https://thepeptidepedia.com/dose/${p.slug}`} target="_blank" rel="noopener"
          style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",color:"var(--text-soft)",fontSize:"0.85rem",
            border:"1px solid var(--border)",padding:"0.45rem 1rem",borderRadius:"var(--radius)",textDecoration:"none"}}>
          <ExternalLink size={13}/> Dosing calculator
        </a>
        <Link href="/intake"
          style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",color:"var(--text-soft)",fontSize:"0.85rem",
            border:"1px solid var(--border)",padding:"0.45rem 1rem",borderRadius:"var(--radius)",textDecoration:"none"}}>
          Start Intake
        </Link>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

          {p.contraindications.length>0 && (
            <div className="card">
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
                <AlertTriangle size={15} style={{color:"#f87171"}}/>
                <span style={{fontWeight:700,fontSize:"0.85rem",color:"#f87171"}}>Contraindications</span>
              </div>
              <ul style={{margin:0,paddingLeft:"1.1rem",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                {p.contraindications.map((c,i)=>(
                  <li key={i} style={{fontSize:"0.82rem",color:"var(--text-soft)",lineHeight:1.55}}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
              <Beaker size={15} style={{color:"var(--gold)"}}/>
              <span style={{fontWeight:700,fontSize:"0.85rem"}}>Vial & Reconstitution</span>
            </div>
            <div style={{display:"flex",gap:"1.5rem",marginBottom:"0.75rem",fontSize:"0.82rem",color:"var(--text-mute)"}}>
              <span>Vials: {p.commonVialMg.join(" / ")} mg</span>
              <span>BAC water: {p.recommendedReconstitutionMl.join(" / ")} mL</span>
            </div>
            <p style={{fontSize:"0.82rem",color:"var(--text-soft)",lineHeight:1.65,marginBottom:"0.6rem"}}>{p.reconstitutionNote}</p>
            <p style={{fontSize:"0.78rem",color:"var(--text-mute)"}}><strong>Storage:</strong> {p.storageNote}</p>
            {p.syringeNote && <p style={{fontSize:"0.78rem",color:"var(--text-mute)",marginTop:"0.4rem"}}><strong>Syringe:</strong> {p.syringeNote}</p>}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={{fontWeight:700,fontSize:"0.85rem",color:"var(--text-mute)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.25rem"}}>Regimens</div>
          {p.regimens.map((r,i)=>{
            const rec = EC[r.evidenceTag] ?? EC["Community consensus"]
            return (
              <div key={i} className="card" style={{padding:"0.875rem 1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.4rem"}}>
                  <span style={{fontWeight:700,fontSize:"0.88rem"}}>{r.label}</span>
                  <span style={{fontSize:"0.65rem",padding:"0.15rem 0.5rem",borderRadius:99,
                    background:rec.bg,color:rec.color,border:`1px solid ${rec.color}40`}}>{r.evidenceTag}</span>
                </div>
                <div style={{fontSize:"0.8rem",color:"var(--text-mute)",display:"flex",gap:"1rem",flexWrap:"wrap",marginBottom:"0.3rem"}}>
                  <span>{r.dosePerInjection_mg} mg</span>
                  <span>{r.frequencyPerWeek}x/week</span>
                  <span>{r.route}</span>
                </div>
                {r.timingNote && <p style={{fontSize:"0.76rem",color:"var(--text-soft)",marginBottom:"0.3rem"}}>{r.timingNote}</p>}
                {r.maxDurationDays && <p style={{fontSize:"0.75rem",color:"var(--text-mute)"}}>Max {r.maxDurationDays} days</p>}
                {r.warnings && r.warnings.length>0 && (
                  <div style={{marginTop:"0.5rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
                    {r.warnings.slice(0,3).map((w,j)=>(
                      <div key={j} style={{fontSize:"0.73rem",color:"#f87171",display:"flex",gap:"0.3rem"}}>
                        <span style={{flexShrink:0}}>•</span>{w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p style={{fontSize:"0.75rem",color:"var(--text-mute)",marginTop:"2.5rem",lineHeight:1.6}}>
        Educational use only. Richard Ortiz Coaching does not prescribe peptides or provide medical advice.
        Data sourced from thepeptidepedia.com.
      </p>
    </div>
    <Footer/></>
  )
}
