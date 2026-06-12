"use client"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ExternalLink } from "lucide-react"

const PEPTIDES = [
  { slug:"bpc-157",               name:"BPC-157",                             aliases:"Body Protection Compound 157, PL 14736",                 summary:"Accelerates tissue healing, reduces inflammation, supports gut health and tendon/ligament repair." },
  { slug:"tb-500",                name:"TB-500",                              aliases:"Thymosin Beta-4, TB4",                                   summary:"Actin-binding peptide for muscle repair, flexibility, cardiovascular recovery, and hair regrowth." },
  { slug:"ghk-cu",                name:"GHK-Cu",                             aliases:"Copper peptide, Glycyl-L-histidyl-L-lysine copper",       summary:"Skin regeneration, hair growth, anti-inflammatory, wound healing — topical and injectable." },
  { slug:"semaglutide",           name:"Semaglutide",                        aliases:"Ozempic, Wegovy, Rybelsus",                              summary:"GLP-1 receptor agonist for weight loss, blood sugar regulation, and appetite suppression." },
  { slug:"tirzepatide",           name:"Tirzepatide",                        aliases:"Mounjaro, Zepbound",                                     summary:"Dual GIP/GLP-1 agonist — superior weight loss, metabolic health, insulin sensitivity." },
  { slug:"retatrutide",           name:"Retatrutide",                        aliases:"LY3437943",                                              summary:"Triple GIP/GLP-1/glucagon agonist — next-generation weight loss agent in Phase 3 trials." },
  { slug:"sermorelin",            name:"Sermorelin",                         aliases:"GRF 1-29, Geref",                                        summary:"GHRH analogue — stimulates pituitary GH release, anti-aging, sleep quality, body composition." },
  { slug:"cjc-1295",              name:"CJC-1295",                           aliases:"DAC:GRF, CJC1295",                                       summary:"Modified GHRH analogue with extended half-life. Often stacked with Ipamorelin for GH optimization." },
  { slug:"ipamorelin",            name:"Ipamorelin",                         aliases:"IPA, NNC 26-0161",                                       summary:"Selective GH secretagogue — clean GH pulse without cortisol or prolactin spikes." },
  { slug:"pt-141",                name:"PT-141 (Bremelanotide)",             aliases:"Bremelanotide, Vyleesi",                                 summary:"Central nervous system-acting libido enhancer. FDA-approved (Vyleesi) for female sexual dysfunction." },
  { slug:"nad-plus",              name:"NAD+",                               aliases:"Nicotinamide adenine dinucleotide, NAD",                  summary:"Essential coenzyme for cellular energy, DNA repair, aging, and addiction recovery protocols." },
  { slug:"mots-c",                name:"MOTS-c",                             aliases:"Mitochondrial ORF of the 12S rRNA type-c",               summary:"Mitochondrial-derived peptide — metabolic regulation, insulin sensitivity, anti-aging." },
  { slug:"tesamorelin",           name:"Tesamorelin",                        aliases:"Egrifta",                                                summary:"GHRH analogue FDA-approved for HIV lipodystrophy. Reduces visceral fat." },
  { slug:"aod-9604",              name:"AOD-9604",                           aliases:"Advanced Obesity Drug 9604",                             summary:"GH fragment targeting fat metabolism without affecting blood sugar or IGF-1." },
  { slug:"epitalon",              name:"Epitalon",                           aliases:"Epithalon, Epithalone",                                  summary:"Pineal gland peptide linked to telomere extension and anti-aging — primarily animal/in vitro data." },
  { slug:"selank",                name:"Selank",                             aliases:"TP-7",                                                   summary:"Nootropic anxiolytic with human trial data. Intranasal delivery for anxiety and cognition." },
  { slug:"semax",                 name:"Semax",                              aliases:"ACTH 4-7 Pro8-Gly9-Pro10",                               summary:"Nootropic — neuroprotection, cognitive enhancement, stroke recovery. Intranasal." },
  { slug:"melanotan-ii",          name:"Melanotan II",                       aliases:"MT-II, Melanotan 2",                                     summary:"Melanocortin agonist — tanning, libido enhancement, appetite suppression." },
  { slug:"thymosin-alpha-1",      name:"Thymosin Alpha-1",                   aliases:"Ta1, Zadaxin",                                           summary:"Immune modulator approved in some countries for hepatitis and immune deficiencies." },
  { slug:"kisspeptin",            name:"Kisspeptin",                         aliases:"Metastin, KP-54",                                        summary:"Hypothalamic neuropeptide regulating reproductive hormones and sexual motivation." },
  { slug:"ll-37",                 name:"LL-37",                              aliases:"Cathelicidin, CAMP",                                     summary:"Antimicrobial peptide with immune modulation, wound healing, and anti-inflammatory properties." },
  { slug:"dsip",                  name:"DSIP",                               aliases:"Delta sleep-inducing peptide",                           summary:"Endogenous peptide linked to sleep regulation, stress reduction, and cortisol modulation." },
  { slug:"kpv",                   name:"KPV",                                aliases:"Lys-Pro-Val",                                            summary:"Anti-inflammatory tripeptide — gut health, IBD, skin conditions." },
  { slug:"5-amino-1mq",           name:"5-Amino-1MQ",                       aliases:"5-Amino-1-methylquinolinium",                            summary:"NNMT inhibitor targeting fat cell metabolism and obesity — oral bioavailability." },
  { slug:"melanotan-i",           name:"Melanotan I",                        aliases:"Afamelanotide, MT-1",                                    summary:"Melanocortin agonist for photoprotection and tanning. FDA-approved version for EPP (Scenesse)." },
  { slug:"oxytocin",              name:"Oxytocin",                           aliases:"Pitocin, bonding hormone",                               summary:"Neuropeptide for social bonding, anxiety reduction, and metabolic support." },
  { slug:"ss-31",                 name:"SS-31",                              aliases:"Elamipretide, Szeto-Schiller 31",                        summary:"Mitochondria-targeting peptide — cardiovascular protection, anti-aging, oxidative stress." },
  { slug:"mgf",                   name:"MGF",                                aliases:"Mechano Growth Factor, IGF-1Ec",                         summary:"IGF-1 splice variant activated by exercise — muscle repair, satellite cell activation." },
  { slug:"cjc-1295-ipamorelin",   name:"CJC-1295 + Ipamorelin",             aliases:"CJC/Ipa blend",                                          summary:"Popular GH stack combining GHRH + GHRP for synergistic GH pulse amplification." },
  { slug:"tesamorelin-ipamorelin", name:"Tesamorelin + Ipamorelin",          aliases:"Tesa/Ipa blend",                                         summary:"Combination GHRH/GHRP stack for GH optimization and visceral fat reduction." },
  { slug:"wolverine",             name:"Wolverine",                          aliases:"BPC-157 + TB-500",                                       summary:"Classic injury recovery stack combining BPC-157 and TB-500 for tissue healing." },
  { slug:"wolverine-plus",        name:"Wolverine+",                         aliases:"BPC-157 + TB-500 + MGF",                                 summary:"Enhanced recovery stack adding MGF to the classic Wolverine blend." },
  { slug:"glow",                  name:"Glow",                               aliases:"GHK-Cu + TB-500 + BPC-157",                              summary:"Anti-aging and skin stack combining copper peptide, TB-500, and BPC-157." },
  { slug:"glow-kpv",              name:"Glow+",                              aliases:"GHK-Cu + TB-500 + BPC-157 + KPV",                        summary:"Enhanced Glow stack with KPV for anti-inflammatory and gut-healing properties." },
  { slug:"selank-semax",          name:"Selank + Semax",                     aliases:"Nootropic stack",                                        summary:"Nootropic duo for anxiolysis and cognitive enhancement via intranasal delivery." },
]

export default function PeptidesPage() {
  return (
    <>
      <Nav/>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em",marginBottom:"0.5rem" }}>
          Peptide Library
        </h1>
        <p style={{ color:"var(--text-soft)",maxWidth:620,marginBottom:"2.5rem",lineHeight:1.7 }}>
          {PEPTIDES.length} peptides in our coaching catalogue. Tap any card to view the full profile and dosing calculator on PeptidePedia.
        </p>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem" }}>
          {PEPTIDES.map(p => (
            <div key={p.slug} className="card" style={{ display:"flex",flexDirection:"column",gap:"0.6rem" }}>
              <div>
                <h2 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"0.95rem",marginBottom:"0.15rem" }}>{p.name}</h2>
                <p style={{ fontSize:"0.68rem",color:"var(--text-mute)",lineHeight:1.4 }}>{p.aliases}</p>
              </div>
              <p style={{ fontSize:"0.82rem",color:"var(--text-soft)",lineHeight:1.6,flex:1 }}>{p.summary}</p>
              <div style={{ display:"flex",gap:"0.6rem",paddingTop:"0.4rem",borderTop:"1px solid var(--border)" }}>
                <a href={`https://thepeptidepedia.com/peptides/${p.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:"0.75rem",color:"var(--gold)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:"0.25rem",textDecoration:"none" }}>
                  <ExternalLink size={11}/> Full profile
                </a>
                <a href={`https://thepeptidepedia.com/dose/${p.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:"0.75rem",color:"var(--text-mute)",display:"inline-flex",alignItems:"center",gap:"0.25rem",textDecoration:"none" }}>
                  <ExternalLink size={11}/> Dosing calc
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  )
}
