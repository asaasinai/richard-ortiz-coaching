"use client"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ExternalLink } from "lucide-react"

const PEPTIDES = [
  { slug:"bpc-157",              name:"BPC-157",                              evidence:"Community consensus",     aliases:"Body Protection Compound 157, PL 14736",    summary:"Accelerates tissue healing, reduces inflammation, supports gut health and tendon/ligament repair." },
  { slug:"tb-500",               name:"TB-500",                               evidence:"Community consensus",     aliases:"Thymosin Beta-4, TB4",                      summary:"Actin-binding peptide for muscle repair, flexibility, cardiovascular recovery, and hair regrowth." },
  { slug:"ghk-cu",               name:"GHK-Cu",                               evidence:"Community consensus",     aliases:"Copper peptide, Glycyl-L-histidyl-L-lysine copper", summary:"Skin regeneration, hair growth, anti-inflammatory, wound healing — topical and injectable." },
  { slug:"semaglutide",          name:"Semaglutide",                          evidence:"Clinical / FDA-approved", aliases:"Ozempic, Wegovy, Rybelsus",                 summary:"GLP-1 receptor agonist for weight loss, blood sugar regulation, and appetite suppression." },
  { slug:"tirzepatide",          name:"Tirzepatide",                          evidence:"Clinical / FDA-approved", aliases:"Mounjaro, Zepbound",                        summary:"Dual GIP/GLP-1 agonist — superior weight loss, metabolic health, insulin sensitivity." },
  { slug:"retatrutide",          name:"Retatrutide",                          evidence:"Clinical / FDA-approved", aliases:"LY3437943",                                 summary:"Triple GIP/GLP-1/glucagon agonist — next-generation weight loss agent in Phase 3 trials." },
  { slug:"sermorelin",           name:"Sermorelin",                           evidence:"Community consensus",     aliases:"GRF 1-29, Geref",                           summary:"GHRH analogue — stimulates pituitary GH release, anti-aging, sleep quality, body composition." },
  { slug:"cjc-1295",             name:"CJC-1295",                             evidence:"Human observational",    aliases:"DAC:GRF, CJC1295",                          summary:"Modified GHRH analogue with extended half-life. Often stacked with Ipamorelin for GH optimization." },
  { slug:"ipamorelin",           name:"Ipamorelin",                           evidence:"Community consensus",     aliases:"IPA, NNC 26-0161",                          summary:"Selective GH secretagogue — clean GH pulse without cortisol or prolactin spikes." },
  { slug:"pt-141",               name:"PT-141 (Bremelanotide)",               evidence:"Clinical / FDA-approved", aliases:"Bremelanotide, Vyleesi",                    summary:"Central nervous system-acting libido enhancer. FDA-approved (Vyleesi) for female sexual dysfunction." },
  { slug:"nad-plus",             name:"NAD+",                                 evidence:"Human observational",    aliases:"Nicotinamide adenine dinucleotide, NAD",     summary:"Essential coenzyme for cellular energy, DNA repair, aging, and addiction recovery protocols." },
  { slug:"mots-c",               name:"MOTS-c",                               evidence:"Community consensus",     aliases:"Mitochondrial ORF of the 12S rRNA type-c",  summary:"Mitochondrial-derived peptide — metabolic regulation, insulin sensitivity, anti-aging." },
  { slug:"tesamorelin",          name:"Tesamorelin",                          evidence:"Clinical / FDA-approved", aliases:"Egrifta",                                   summary:"GHRH analogue FDA-approved for HIV lipodystrophy. Reduces visceral fat." },
  { slug:"aod-9604",             name:"AOD-9604",                             evidence:"Community consensus",     aliases:"Advanced Obesity Drug 9604",                summary:"GH fragment targeting fat metabolism without affecting blood sugar or IGF-1." },
  { slug:"epitalon",             name:"Epitalon",                             evidence:"Community consensus",     aliases:"Epithalon, Epithalone",                     summary:"Pineal gland peptide linked to telomere extension and anti-aging — primarily animal/in vitro data." },
  { slug:"selank",               name:"Selank",                               evidence:"Human observational",    aliases:"TP-7",                                      summary:"Russian nootropic anxiolytic with human trial data. Intranasal delivery for anxiety and cognition." },
  { slug:"semax",                name:"Semax",                                evidence:"Human observational",    aliases:"ACTH 4-7 Pro8-Gly9-Pro10",                  summary:"Russian nootropic — neuroprotection, cognitive enhancement, stroke recovery. Intranasal." },
  { slug:"melanotan-ii",         name:"Melanotan II",                         evidence:"Community consensus",     aliases:"MT-II, Melanotan 2",                        summary:"Melanocortin agonist — tanning, libido enhancement, appetite suppression." },
  { slug:"thymosin-alpha-1",     name:"Thymosin Alpha-1",                     evidence:"Human observational",    aliases:"Ta1, Zadaxin",                              summary:"Immune modulator approved in some countries for hepatitis and immune deficiencies." },
  { slug:"kisspeptin",           name:"Kisspeptin",                           evidence:"Human observational",    aliases:"Metastin, KP-54",                           summary:"Hypothalamic neuropeptide regulating reproductive hormones and sexual motivation." },
  { slug:"ll-37",                name:"LL-37",                                evidence:"Community consensus",     aliases:"Cathelicidin, CAMP",                        summary:"Antimicrobial peptide with immune modulation, wound healing, and anti-inflammatory properties." },
  { slug:"dsip",                 name:"DSIP",                                 evidence:"Community consensus",     aliases:"Delta sleep-inducing peptide",              summary:"Endogenous peptide linked to sleep regulation, stress reduction, and cortisol modulation." },
  { slug:"kpv",                  name:"KPV",                                  evidence:"Community consensus",     aliases:"Lys-Pro-Val",                               summary:"Anti-inflammatory tripeptide — gut health, IBD, Crohn's, skin conditions." },
  { slug:"5-amino-1mq",          name:"5-Amino-1MQ",                         evidence:"Community consensus",     aliases:"5-Amino-1-methylquinolinium",               summary:"NNMT inhibitor targeting fat cell metabolism and obesity — oral bioavailability." },
  { slug:"melanotan-i",          name:"Melanotan I",                          evidence:"Community consensus",     aliases:"Afamelanotide, MT-1",                       summary:"Melanocortin agonist for photoprotection and tanning. FDA-approved version for EPP (Scenesse)." },
  { slug:"oxytocin",             name:"Oxytocin",                             evidence:"Clinical / FDA-approved", aliases:"Pitocin, bonding hormone",                  summary:"Neuropeptide for social bonding, anxiety reduction, and metabolic support." },
  { slug:"ss-31",                name:"SS-31",                                evidence:"Community consensus",     aliases:"Elamipretide, Szeto-Schiller 31",           summary:"Mitochondria-targeting peptide — cardiovascular protection, anti-aging, oxidative stress." },
  { slug:"mgf",                  name:"MGF",                                  evidence:"Community consensus",     aliases:"Mechano Growth Factor, IGF-1Ec",            summary:"IGF-1 splice variant activated by exercise — muscle repair, satellite cell activation." },
  { slug:"cjc-1295-ipamorelin",  name:"CJC-1295 + Ipamorelin",               evidence:"Community consensus",     aliases:"CJC/Ipa blend",                             summary:"Popular GH stack combining GHRH + GHRP for synergistic GH pulse amplification." },
  { slug:"tesamorelin-ipamorelin",name:"Tesamorelin + Ipamorelin",            evidence:"Community consensus",     aliases:"Tesa/Ipa blend",                            summary:"Combination GHRH/GHRP stack for GH optimization and visceral fat reduction." },
  { slug:"wolverine",            name:"Wolverine",                            evidence:"Community consensus",     aliases:"BPC-157 + TB-500",                         summary:"Classic injury recovery stack combining BPC-157 and TB-500 for tissue healing." },
  { slug:"wolverine-plus",       name:"Wolverine+",                           evidence:"Community consensus",     aliases:"BPC-157 + TB-500 + MGF",                   summary:"Enhanced recovery stack adding MGF to the classic Wolverine blend." },
  { slug:"glow",                 name:"Glow",                                 evidence:"Community consensus",     aliases:"GHK-Cu + TB-500 + BPC-157",                summary:"Anti-aging and skin stack combining copper peptide, TB-500, and BPC-157." },
  { slug:"glow-kpv",             name:"Glow+",                                evidence:"Community consensus",     aliases:"GHK-Cu + TB-500 + BPC-157 + KPV",          summary:"Enhanced Glow stack with KPV for anti-inflammatory and gut-healing properties." },
  { slug:"selank-semax",         name:"Selank + Semax",                       evidence:"Human observational",    aliases:"Nootropic stack",                           summary:"Russian nootropic duo for anxiolysis + cognitive enhancement via intranasal delivery." },
]

const EC: Record<string,{bg:string,border:string,color:string}> = {
  "Clinical / FDA-approved": { bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.3)",  color:"#4ade80" },
  "Human observational":     { bg:"rgba(96,165,250,0.08)",  border:"rgba(96,165,250,0.3)",  color:"#60a5fa" },
  "Community consensus":     { bg:"rgba(201,168,76,0.08)",  border:"rgba(201,168,76,0.3)",  color:"var(--gold)" },
}

export default function PeptidesPage() {
  return (
    <>
      <Nav/>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em",marginBottom:"0.5rem" }}>
          Peptide Library
        </h1>
        <p style={{ color:"var(--text-soft)",maxWidth:620,marginBottom:"0.75rem",lineHeight:1.7 }}>
          {PEPTIDES.length} peptides in our coaching catalogue. Evidence grades and full protocol data sourced from{" "}
          <a href="https://thepeptidepedia.com" target="_blank" rel="noopener noreferrer"
            style={{ color:"var(--gold)",fontWeight:600 }}>thepeptidepedia.com</a>.
        </p>

        {/* Evidence legend */}
        <div style={{ display:"flex",gap:"0.6rem",flexWrap:"wrap",marginBottom:"2.5rem" }}>
          {Object.entries(EC).map(([label,c])=>(
            <span key={label} style={{ fontSize:"0.72rem",fontWeight:700,padding:"0.2rem 0.7rem",borderRadius:99,
              background:c.bg,color:c.color,border:`1px solid ${c.border}` }}>
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem" }}>
          {PEPTIDES.map(p => {
            const ec = EC[p.evidence] ?? EC["Community consensus"]
            return (
              <div key={p.slug} className="card" style={{ display:"flex",flexDirection:"column",gap:"0.6rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <h2 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"0.95rem",marginBottom:"0.15rem" }}>{p.name}</h2>
                    <p style={{ fontSize:"0.68rem",color:"var(--text-mute)",lineHeight:1.4 }}>{p.aliases}</p>
                  </div>
                  <span style={{ fontSize:"0.62rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:99,flexShrink:0,marginTop:"0.1rem",
                    background:ec.bg,color:ec.color,border:`1px solid ${ec.border}`,whiteSpace:"nowrap",marginLeft:"0.5rem" }}>
                    {p.evidence}
                  </span>
                </div>
                <p style={{ fontSize:"0.82rem",color:"var(--text-soft)",lineHeight:1.6,flex:1 }}>{p.summary}</p>
                <div style={{ display:"flex",gap:"0.6rem",paddingTop:"0.4rem",borderTop:"1px solid var(--border)" }}>
                  <a href={`https://thepeptidepedia.com/peptides/${p.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:"0.75rem",color:"var(--gold)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:"0.25rem",textDecoration:"none" }}>
                    <ExternalLink size={11}/> Profile
                  </a>
                  <a href={`https://thepeptidepedia.com/dose/${p.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:"0.75rem",color:"var(--text-mute)",display:"inline-flex",alignItems:"center",gap:"0.25rem",textDecoration:"none" }}>
                    <ExternalLink size={11}/> Dosing calc
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <p style={{ fontSize:"0.75rem",color:"var(--text-mute)",marginTop:"3rem",lineHeight:1.6 }}>
          Educational use only. Richard Ortiz Coaching does not prescribe peptides or provide medical advice. All protocols require a licensed physician.
        </p>
      </div>
      <Footer/>
    </>
  )
}
