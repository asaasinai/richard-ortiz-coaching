"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, Printer, RotateCcw, Info } from "lucide-react"

// ── Peptide data ────────────────────────────────────────────────────────────────
const PEPTIDE_DATA = [
  {
    name: "BPC-157",
    aliases: "Body Protection Compound 157, PL 14736",
    evidence: "Community consensus",
    evidenceNote: "No published human RCT data. Regimens derived from community use reports and compounding pharmacy documentation. Treat all values as experimental.",
    vialOptions: [5, 10],
    unit: "mcg" as const,
    routes: "Subcutaneous",
    contraindications: ["Known malignancy (theoretical angiogenesis concern)", "Active infection at injection site", "Pregnancy / breastfeeding — no safety data", "Competitive athletes — WADA prohibited (S0)"],
    regimens: [
      { label: "Starter", dose: 250, freq: "Once daily", duration: "4 weeks", note: "Low-end intro dose for new users" },
      { label: "Typical",  dose: 500, freq: "Once daily", duration: "6 weeks", note: "Most commonly reported protocol" },
      { label: "Aggressive", dose: 1000, freq: "Once daily", duration: "8 weeks", note: "High-end — coach supervision recommended" },
    ],
  },
  {
    name: "CJC-1295",
    aliases: "DAC:GRF, CJC1295",
    evidence: "Human observational",
    evidenceNote: "Human observational data available. No large RCTs. Use with caution and medical oversight.",
    vialOptions: [2, 5],
    unit: "mcg" as const,
    routes: "Subcutaneous",
    contraindications: ["Active malignancy", "Pregnancy / breastfeeding", "Uncontrolled diabetes"],
    regimens: [
      { label: "Starter",    dose: 100, freq: "2x/week subQ", duration: "8 weeks", note: "Intro dose" },
      { label: "Typical",    dose: 200, freq: "2x/week subQ", duration: "12 weeks", note: "Standard protocol" },
    ],
  },
  {
    name: "GHK-Cu",
    aliases: "Copper peptide, Glycyl-L-histidyl-L-lysine copper",
    evidence: "Community consensus",
    evidenceNote: "Limited human data. Regimens based on community use and topical research extrapolation.",
    vialOptions: [50, 100, 200],
    unit: "mg" as const,
    routes: "Topical, Subcutaneous",
    contraindications: ["Copper allergy", "Wilson's disease"],
    regimens: [
      { label: "Starter",    dose: 1,   freq: "Once daily",    duration: "4 weeks",  note: "Topical or subQ" },
      { label: "Typical",    dose: 2,   freq: "Once daily",    duration: "6 weeks",  note: "Standard dose" },
      { label: "Aggressive", dose: 3,   freq: "Once daily",    duration: "8 weeks",  note: "Upper range — monitor copper levels" },
    ],
  },
  {
    name: "Ipamorelin",
    aliases: "IPA, NNC 26-0161",
    evidence: "Community consensus",
    evidenceNote: "No published human RCT data. Community-derived dosing. Treat as experimental.",
    vialOptions: [2, 5, 10],
    unit: "mcg" as const,
    routes: "Subcutaneous",
    contraindications: ["Active malignancy", "Pregnancy / breastfeeding", "Competitive athletes (WADA S2)"],
    regimens: [
      { label: "Starter",    dose: 100, freq: "3x/week pre-bed", duration: "8 weeks",  note: "Starting dose" },
      { label: "Typical",    dose: 200, freq: "5x/week pre-bed", duration: "12 weeks", note: "Most common protocol" },
      { label: "Aggressive", dose: 300, freq: "Daily pre-bed",   duration: "16 weeks", note: "Max commonly reported" },
    ],
  },
  {
    name: "NAD+",
    aliases: "Nicotinamide adenine dinucleotide",
    evidence: "Human observational",
    evidenceNote: "Human observational data available. IV/IM protocols vary widely. Consult provider.",
    vialOptions: [100, 250, 500, 750],
    unit: "mg" as const,
    routes: "Intramuscular",
    contraindications: ["Active malignancy", "Pregnancy / breastfeeding"],
    regimens: [
      { label: "Starter", dose: 100, freq: "Once daily IM × 5 days", duration: "1 week loading", note: "Slow IV or IM" },
      { label: "Typical", dose: 250, freq: "Once daily IM × 5 days", duration: "1 week loading", note: "Standard loading protocol" },
    ],
  },
  {
    name: "PT-141",
    aliases: "Bremelanotide, Vyleesi",
    evidence: "Clinical / FDA-approved",
    evidenceNote: "FDA-approved (Vyleesi) for HSDD in premenopausal women. Off-label use in men also documented.",
    vialOptions: [1.75, 2, 10],
    unit: "mg" as const,
    routes: "Subcutaneous",
    contraindications: ["Cardiovascular disease", "Uncontrolled hypertension", "Pregnancy", "Use with erectile dysfunction drugs"],
    regimens: [
      { label: "Starter",    dose: 0.5, freq: "PRN (45–60 min before)",  duration: "As needed", note: "Low test dose" },
      { label: "Typical",    dose: 1.0, freq: "PRN (45–60 min before)",  duration: "As needed", note: "Standard FDA-aligned dose" },
      { label: "Aggressive", dose: 1.75,freq: "PRN (45–60 min before)",  duration: "As needed", note: "Upper approved range" },
    ],
  },
  {
    name: "Semaglutide",
    aliases: "Ozempic, Wegovy",
    evidence: "Clinical / FDA-approved",
    evidenceNote: "FDA-approved for T2DM and chronic weight management. Follow titration schedule to minimize GI side effects.",
    vialOptions: [1, 2, 5],
    unit: "mg" as const,
    routes: "Subcutaneous",
    contraindications: ["Personal/family history of medullary thyroid carcinoma", "MEN 2 syndrome", "Pregnancy", "Pancreatitis history"],
    regimens: [
      { label: "Starter",    dose: 0.25, freq: "Weekly subQ × 4 wks",   duration: "4 weeks (titration)", note: "Required titration start" },
      { label: "Typical",    dose: 0.5,  freq: "Weekly subQ",            duration: "Ongoing",             note: "Standard maintenance" },
      { label: "Aggressive", dose: 2.0,  freq: "Weekly subQ",            duration: "Ongoing",             note: "Max dose — physician supervised" },
    ],
  },
  {
    name: "Sermorelin",
    aliases: "GRF 1-29, Geref",
    evidence: "Community consensus",
    evidenceNote: "Older GHRH analogue. Community-derived dosing. Originally approved for pediatric GHD — adult use is off-label.",
    vialOptions: [3, 6, 9],
    unit: "mcg" as const,
    routes: "Subcutaneous",
    contraindications: ["Active malignancy", "Pregnancy / breastfeeding", "Hypothyroidism (treat first)"],
    regimens: [
      { label: "Starter",    dose: 100, freq: "Daily subQ pre-bed", duration: "8 weeks",  note: "Intro dose" },
      { label: "Typical",    dose: 200, freq: "Daily subQ pre-bed", duration: "12 weeks", note: "Standard protocol" },
    ],
  },
  {
    name: "TB-500",
    aliases: "Thymosin Beta-4, TB4",
    evidence: "Community consensus",
    evidenceNote: "No human RCT data. Animal and in-vitro data only. Community use reports form the basis of dosing. Experimental.",
    vialOptions: [5, 10],
    unit: "mg" as const,
    routes: "Subcutaneous",
    contraindications: ["Known malignancy (theoretical angiogenesis concern)", "Pregnancy / breastfeeding", "Competitive athletes — WADA prohibited (S2)"],
    regimens: [
      { label: "Starter",    dose: 2.5, freq: "Weekly subQ",       duration: "4 weeks",  note: "Loading phase" },
      { label: "Typical",    dose: 5.0, freq: "Weekly subQ",       duration: "6 weeks",  note: "Standard loading + maintenance" },
    ],
  },
  {
    name: "Tirzepatide",
    aliases: "Mounjaro, Zepbound",
    evidence: "Clinical / FDA-approved",
    evidenceNote: "FDA-approved for T2DM (Mounjaro) and obesity (Zepbound). Dual GIP/GLP-1 agonist. Titrate slowly.",
    vialOptions: [2.5, 5, 7.5, 10, 12.5, 15],
    unit: "mg" as const,
    routes: "Subcutaneous",
    contraindications: ["Personal/family history of medullary thyroid carcinoma", "MEN 2 syndrome", "Pregnancy", "Pancreatitis history"],
    regimens: [
      { label: "Starter",    dose: 2.5, freq: "Weekly subQ × 4 wks",  duration: "4 weeks (titration)", note: "Required titration start" },
      { label: "Typical",    dose: 5.0, freq: "Weekly subQ",           duration: "Ongoing",             note: "First maintenance step" },
      { label: "Aggressive", dose: 10,  freq: "Weekly subQ",           duration: "Ongoing",             note: "Higher maintenance — physician supervised" },
    ],
  },
]

const SYRINGE_TYPES = [
  { label: "U-100 insulin syringe (100 units/mL)", units: 100, volumeOnly: false },
  { label: "U-40 insulin syringe (40 units/mL)",   units: 40,  volumeOnly: false },
  { label: "Volume only (mL)",                      units: 0,   volumeOnly: true  },
]

const EVIDENCE_COLORS: Record<string,string> = {
  "Clinical / FDA-approved": "#4ade80",
  "Human observational":     "#60a5fa",
  "Community consensus":     "var(--gold)",
}

const STEPS = ["Peptide", "Vial Setup", "Regimen", "Review"]

// ── Maths ─────────────────────────────────────────────────────────────────────
function concMgPerMl(vialMg: number, reconMl: number) { return vialMg / reconMl }

function drawVolumeMl(doseMg: number, concMg: number) { return doseMg / concMg }

function syringeUnits(volMl: number, syringeType: typeof SYRINGE_TYPES[0]) {
  if (syringeType.volumeOnly) return null
  return volMl * syringeType.units
}

function dosesPerVial(vialMg: number, doseMg: number) { return vialMg / doseMg }

function precisionFlag(volMl: number): string | null {
  if (volMl < 0.02) return "Volume < 0.02 mL — impractically small. Consider lower concentration (less BAC water)."
  if (volMl > 1.0)  return "Volume > 1 mL — large draw. Consider higher concentration or splitting the dose."
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    // Same client-session pattern as /dashboard (sessionStorage, set at sign-in)
    if (!sessionStorage.getItem("roc_dashboard_email")) {
      router.replace("/auth/signin")
    } else {
      setAuthed(true)
    }
  }, [router])

  const [step, setStep]                 = useState(0)
  const [peptide, setPeptide]           = useState<typeof PEPTIDE_DATA[0] | null>(null)
  const [vialMg, setVialMg]             = useState<number | null>(null)
  const [reconMl, setReconMl]           = useState<string>("2")
  const [regimenIdx, setRegimenIdx]     = useState<number>(1)  // default "Typical"
  const [customDoseMg, setCustomDoseMg] = useState<string>("")
  const [isCustom, setIsCustom]         = useState(false)
  const [syringeIdx, setSyringeIdx]     = useState(0) // U-100 default
  const [consented, setConsented]       = useState(false)

  const reset = () => {
    setStep(0); setPeptide(null); setVialMg(null); setReconMl("2")
    setRegimenIdx(1); setCustomDoseMg(""); setIsCustom(false); setSyringeIdx(0); setConsented(false)
  }

  // ── Derived calculations ───────────────────────────────────────────────────
  const recon = parseFloat(reconMl) || 0
  const conc  = vialMg && recon ? concMgPerMl(vialMg, recon) : null

  const selectedRegimen = peptide && !isCustom ? peptide.regimens[regimenIdx] : null
  const doseMgRaw = isCustom
    ? (parseFloat(customDoseMg) || 0) * (peptide?.unit === "mcg" ? 0.001 : 1)
    : selectedRegimen
      ? selectedRegimen.dose * (peptide?.unit === "mcg" ? 0.001 : 1)
      : 0

  const volMl  = conc && doseMgRaw ? drawVolumeMl(doseMgRaw, conc) : null
  const sType  = SYRINGE_TYPES[syringeIdx]
  const units  = volMl !== null ? syringeUnits(volMl, sType) : null
  const dpv    = vialMg && doseMgRaw ? dosesPerVial(vialMg, doseMgRaw) : null
  const flag   = volMl !== null ? precisionFlag(volMl) : null

  const doseLabelRaw = isCustom ? customDoseMg : selectedRegimen?.dose?.toString() ?? ""
  const doseLabel    = `${doseLabelRaw} ${peptide?.unit ?? ""}`

  // ── Step renders ──────────────────────────────────────────────────────────
  const stepPeptide = (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="peptideSelect">Select Peptide</label>
        <select id="peptideSelect" value={peptide?.name ?? ""}
          onChange={e => { const p = PEPTIDE_DATA.find(x => x.name === e.target.value) ?? null; setPeptide(p); setVialMg(p?.vialOptions[0] ?? null); setRegimenIdx(Math.min(1, (p?.regimens.length ?? 1)-1)) }}>
          <option value="">— Choose a peptide —</option>
          {PEPTIDE_DATA.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {peptide && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
              color: EVIDENCE_COLORS[peptide.evidence] ?? "var(--gold)",
              background: "rgba(255,255,255,0.05)", border:`1px solid ${EVIDENCE_COLORS[peptide.evidence]}`,
              borderRadius:3, padding:"0.2rem 0.6rem" }}>
              {peptide.evidence}
            </span>
            <span style={{ fontSize:"0.78rem", color:"var(--text-mute)" }}>{peptide.aliases}</span>
          </div>

          <div style={{ background:"var(--surface-2)", borderRadius:"var(--radius)", padding:"0.875rem 1rem",
            border:"1px solid var(--border)", fontSize:"0.85rem", color:"var(--text-soft)", lineHeight:1.65 }}>
            <div style={{ display:"flex", gap:"0.4rem", marginBottom:"0.4rem" }}>
              <Info size={13} style={{ color:"var(--gold)", flexShrink:0, marginTop:2 }}/>
              <span style={{ color:"var(--text-mute)", fontSize:"0.75rem" }}>{peptide.evidenceNote}</span>
            </div>
          </div>



          <div style={{ fontSize:"0.8rem", color:"var(--text-mute)" }}>
            <span style={{ fontWeight:600 }}>Routes: </span>{peptide.routes} &nbsp;|&nbsp;
            <span style={{ fontWeight:600 }}>Regimens: </span>{peptide.regimens.length}
          </div>
        </div>
      )}
    </div>
  )

  const stepVial = peptide ? (
    <div className="flex flex-col gap-5">
      {/* Vial size */}
      <div>
        <label>Vial Size</label>
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginTop:"0.4rem" }}>
          {peptide.vialOptions.map(v => (
            <button key={v} type="button" onClick={() => setVialMg(v)} style={{
              padding:"0.45rem 1rem", borderRadius:"var(--radius)", fontSize:"0.875rem", fontWeight:600, cursor:"pointer",
              background: vialMg===v ? "var(--gold)" : "var(--surface-2)",
              color:      vialMg===v ? "#000"        : "var(--text-soft)",
              border:    `1px solid ${vialMg===v ? "var(--gold)" : "var(--border)"}`
            }}>{v} mg</button>
          ))}
        </div>
      </div>

      {/* BAC water */}
      <div style={{ maxWidth:280 }}>
        <label htmlFor="reconMl">Bacteriostatic Water to Add (mL)</label>
        <input id="reconMl" type="number" min={0.5} max={10} step={0.5} value={reconMl}
          onChange={e => setReconMl(e.target.value)} style={{ marginTop:"0.4rem" }}/>
      </div>

      {/* Live concentration */}
      {conc !== null && (
        <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid var(--gold)", borderRadius:"var(--radius)",
          padding:"1rem 1.25rem" }}>
          <div style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em",
            color:"var(--gold)", marginBottom:"0.5rem" }}>Resulting Concentration</div>
          <div style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.75rem", color:"var(--text)", lineHeight:1 }}>
            {conc.toFixed(3)} mg/mL
          </div>
          <div style={{ fontSize:"0.82rem", color:"var(--text-mute)", marginTop:"0.25rem" }}>
            {(conc * 1000).toFixed(1)} mcg/mL
          </div>
        </div>
      )}

      {/* Step-by-step reconstitution */}
      {vialMg && (
        <div>
          <div style={{ fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
            color:"var(--text-mute)", marginBottom:"0.6rem" }}>Reconstitution Steps</div>
          {[
            `Draw ${reconMl} mL of bacteriostatic water into a clean syringe.`,
            `Wipe the vial septum of your ${vialMg} mg vial with an alcohol swab and let dry 10 seconds.`,
            `Insert needle at an angle and inject BAC water slowly down the inside wall of the vial — do not aim directly at the powder.`,
            `Gently swirl (do not shake) until fully dissolved. Solution should be clear and colorless.`,
            `Label vial with peptide name, concentration (${conc?.toFixed(3) ?? "?"} mg/mL), and date reconstituted.`,
            `Store in refrigerator (2–8°C). Use within 28–30 days or per compounding pharmacy guidance.`,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:"0.75rem", marginBottom:"0.5rem", alignItems:"flex-start" }}>
              <span style={{ width:20, height:20, borderRadius:"50%", background:"var(--gold)", color:"#000",
                fontSize:"0.7rem", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {i+1}
              </span>
              <span style={{ fontSize:"0.85rem", color:"var(--text-soft)", lineHeight:1.6 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : <p style={{color:"var(--text-mute)"}}>Select a peptide first.</p>

  const stepRegimen = peptide ? (
    <div className="flex flex-col gap-5">
      {/* Referral note */}
      <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid var(--gold)", borderRadius:"var(--radius)",
        padding:"0.75rem 1rem", display:"flex", gap:"0.6rem", alignItems:"flex-start" }}>
        <Info size={13} style={{ color:"var(--gold)", flexShrink:0, marginTop:2 }}/>
        <span style={{ fontSize:"0.82rem", color:"var(--text-soft)", lineHeight:1.6 }}>
          For full protocol references visit{" "}
          <a href="https://thepeptidepedia.com/dose" target="_blank" rel="noopener noreferrer"
            style={{ color:"var(--gold)", fontWeight:700 }}>thepeptidepedia.com/dose</a>.
          The regimens below are Richard&apos;s coaching recommendations — confirm all doses with your physician.
        </span>
      </div>

      {/* Regimen picker */}
      <div>
        <label>Select Regimen</label>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"0.4rem" }}>
          {peptide.regimens.map((r,i) => (
            <button key={r.label} type="button" onClick={() => { setRegimenIdx(i); setIsCustom(false) }} style={{
              textAlign:"left", padding:"0.75rem 1rem", borderRadius:"var(--radius)", cursor:"pointer",
              background: !isCustom && regimenIdx===i ? "rgba(201,168,76,0.12)" : "var(--surface-2)",
              border:    `1px solid ${!isCustom && regimenIdx===i ? "var(--gold)" : "var(--border)"}`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:"0.9rem",
                  color: !isCustom && regimenIdx===i ? "var(--gold)" : "var(--text)" }}>{r.label}</span>
                <span style={{ fontWeight:700, fontSize:"1rem", color:"var(--text)" }}>{r.dose} {peptide.unit}</span>
              </div>
              <div style={{ fontSize:"0.78rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>{r.freq} · {r.duration}</div>
              <div style={{ fontSize:"0.76rem", color:"var(--text-soft)", marginTop:"0.15rem" }}>{r.note}</div>
            </button>
          ))}
          {/* Custom */}
          <button type="button" onClick={() => setIsCustom(true)} style={{
            textAlign:"left", padding:"0.75rem 1rem", borderRadius:"var(--radius)", cursor:"pointer",
            background: isCustom ? "rgba(201,168,76,0.12)" : "var(--surface-2)",
            border:`1px solid ${isCustom ? "var(--gold)" : "var(--border)"}`,
          }}>
            <span style={{ fontWeight:700, fontSize:"0.9rem", color: isCustom ? "var(--gold)" : "var(--text)" }}>Custom</span>
            <div style={{ fontSize:"0.76rem", color:"var(--text-soft)", marginTop:"0.15rem" }}>Enter your own dose</div>
          </button>
        </div>
      </div>

      {isCustom && (
        <div style={{ maxWidth:240 }}>
          <label>Custom Dose ({peptide.unit})</label>
          <input type="number" min={0} value={customDoseMg} onChange={e => setCustomDoseMg(e.target.value)}
            placeholder={`e.g. ${peptide.regimens[0].dose}`} style={{ marginTop:"0.4rem" }}/>
        </div>
      )}

      {/* Syringe type */}
      <div>
        <label>Syringe Type</label>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem", marginTop:"0.4rem" }}>
          {SYRINGE_TYPES.map((s,i) => (
            <button key={s.label} type="button" onClick={() => setSyringeIdx(i)} style={{
              textAlign:"left", padding:"0.55rem 1rem", borderRadius:"var(--radius)", cursor:"pointer",
              background: syringeIdx===i ? "rgba(201,168,76,0.12)" : "var(--surface-2)",
              border:`1px solid ${syringeIdx===i ? "var(--gold)" : "var(--border)"}`,
              fontSize:"0.85rem", fontWeight: syringeIdx===i ? 700 : 500,
              color: syringeIdx===i ? "var(--gold)" : "var(--text-soft)",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Live result box */}
      {conc !== null && doseMgRaw > 0 && volMl !== null && (
        <div style={{ background:"rgba(201,168,76,0.08)", border:"2px solid var(--gold)", borderRadius:"var(--radius)", padding:"1.1rem 1.25rem" }}>
          <div style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--gold)", marginBottom:"0.75rem" }}>
            Your Draw
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.75rem" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"1.5rem", fontWeight:900, fontFamily:"Inter Tight,sans-serif", color:"var(--text)", lineHeight:1 }}>{doseLabel}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>dose</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"1.5rem", fontWeight:900, fontFamily:"Inter Tight,sans-serif", color:"var(--text)", lineHeight:1 }}>{volMl.toFixed(3)}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>mL</div>
            </div>
            {units !== null ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.5rem", fontWeight:900, fontFamily:"Inter Tight,sans-serif", color:"var(--gold)", lineHeight:1 }}>{units.toFixed(1)}</div>
                <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>syringe units</div>
              </div>
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-mute)", lineHeight:1, paddingTop:"0.4rem" }}>—</div>
                <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.2rem" }}>vol only</div>
              </div>
            )}
          </div>
          {dpv !== null && (
            <div style={{ marginTop:"0.75rem", fontSize:"0.8rem", color:"var(--text-mute)", borderTop:"1px solid var(--border)", paddingTop:"0.6rem" }}>
              {dpv.toFixed(1)} doses per vial
            </div>
          )}
          {flag && (
            <div style={{ marginTop:"0.6rem", display:"flex", gap:"0.4rem", alignItems:"flex-start" }}>
              <AlertTriangle size={13} style={{ color:"var(--gold)", flexShrink:0, marginTop:2 }}/>
              <span style={{ fontSize:"0.78rem", color:"var(--gold)" }}>{flag}</span>
            </div>
          )}
        </div>
      )}
    </div>
  ) : <p style={{color:"var(--text-mute)"}}>Select a peptide first.</p>

  const stepReview = peptide && conc !== null && volMl !== null ? (
    <div className="flex flex-col gap-5">
      {/* Safety warnings */}
      <div style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.4)", borderRadius:"var(--radius)", padding:"1rem 1.1rem" }}>
        <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#f87171", marginBottom:"0.6rem" }}>
          Before proceeding — review safety flags
        </div>
        <ul style={{ margin:0, paddingLeft:"1.1rem", display:"flex", flexDirection:"column", gap:"0.3rem" }}>
          {peptide.contraindications.map(c => (
            <li key={c} style={{ fontSize:"0.82rem", color:"var(--text-soft)", lineHeight:1.5 }}>{c}</li>
          ))}
        </ul>
      </div>

      {/* Dosing card */}
      <div id="dosing-card" style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem" }}>
        <div style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"1.1rem", marginBottom:"0.25rem" }}>{peptide.name} Dosing Card</div>
        <div style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginBottom:"1rem" }}>Richard Ortiz Coaching</div>
        {[
          ["Peptide",        peptide.name],
          ["Also known as",  peptide.aliases],
          ["Evidence",       peptide.evidence],
          ["Vial",           `${vialMg} mg`],
          ["BAC Water",      `${reconMl} mL`],
          ["Concentration",  `${conc.toFixed(3)} mg/mL (${(conc*1000).toFixed(1)} mcg/mL)`],
          ["Regimen",        isCustom ? "Custom" : (selectedRegimen?.label ?? "")],
          ["Dose",           doseLabel],
          ["Draw volume",    `${volMl.toFixed(3)} mL`],
          ["Syringe units",  units !== null ? `${units.toFixed(1)} units (${sType.label})` : "Volume-only"],
          ["Doses per vial", dpv !== null ? dpv.toFixed(1) : "—"],
          ["Frequency",      isCustom ? "—" : (selectedRegimen?.freq ?? "—")],
          ["Duration",       isCustom ? "—" : (selectedRegimen?.duration ?? "—")],
          ["Route",          peptide.routes],
        ].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--border)", padding:"0.45rem 0", fontSize:"0.85rem" }}>
            <span style={{ color:"var(--text-mute)" }}>{k}</span>
            <span style={{ fontWeight:600, color:"var(--text)", textAlign:"right", maxWidth:"55%" }}>{v}</span>
          </div>
        ))}
        {flag && (
          <div style={{ marginTop:"0.75rem", display:"flex", gap:"0.4rem", alignItems:"flex-start", background:"rgba(201,168,76,0.08)", padding:"0.6rem 0.75rem", borderRadius:"var(--radius)" }}>
            <AlertTriangle size={13} style={{ color:"var(--gold)", flexShrink:0, marginTop:2 }}/>
            <span style={{ fontSize:"0.78rem", color:"var(--gold)" }}>{flag}</span>
          </div>
        )}
        <div style={{ marginTop:"1rem", fontSize:"0.72rem", color:"var(--text-mute)", lineHeight:1.6, fontStyle:"italic" }}>        </div>
      </div>

      {/* Consent checkbox */}
      <label style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", cursor:"pointer" }}>
        <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)}
          style={{ width:"auto", marginTop:"0.2rem", accentColor:"var(--gold)" }}/>
        <span style={{ fontSize:"0.875rem", color:"var(--text-soft)", lineHeight:1.6 }}>
          I confirm I have reviewed the contraindications and safety information above.
        </span>
      </label>

      {/* Print button */}
      <button
        disabled={!consented}
        onClick={() => window.print()}
        style={{ display:"flex", alignItems:"center", gap:"0.5rem", alignSelf:"flex-start",
          padding:"0.65rem 1.4rem", borderRadius:"var(--radius)", fontWeight:700, fontSize:"0.875rem", cursor: consented ? "pointer" : "not-allowed",
          background: consented ? "var(--gold)" : "var(--surface-2)", color: consented ? "#000" : "var(--text-mute)",
          border: `1px solid ${consented ? "var(--gold)" : "var(--border)"}` }}>
        <Printer size={15}/> Print Dosing Card
      </button>
    </div>
  ) : <p style={{color:"var(--text-mute)"}}>Complete previous steps first.</p>

  const stepContent = [stepPeptide, stepVial, stepRegimen, stepReview]

  const canAdvance = [
    !!peptide,
    !!(peptide && vialMg && parseFloat(reconMl) > 0),
    !!(conc && doseMgRaw > 0 && volMl !== null),
    consented,
  ]

  if (!authed) return null

  return (
    <>
      <Nav/>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"2rem", letterSpacing:"-0.03em" }}>Dosage Calculator</h1>
          <button onClick={reset} style={{ display:"flex", alignItems:"center", gap:"0.35rem", background:"none",
            border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"0.4rem 0.9rem",
            color:"var(--text-mute)", fontSize:"0.8rem", cursor:"pointer" }}>
            <RotateCcw size={13}/> Reset
          </button>
        </div>
        <p style={{ color:"var(--text-soft)", fontSize:"0.875rem", marginBottom:"2rem" }}>
          Step-by-step: peptide selection, vial setup, regimen, and printable dosing card.
        </p>

        {/* Step indicator */}
        <div style={{ display:"flex", gap:"0", marginBottom:"2rem", borderRadius:"var(--radius)", overflow:"hidden", border:"1px solid var(--border)" }}>
          {STEPS.map((s,i) => (
            <button key={s} type="button"
              onClick={() => { if (i < step || canAdvance[i-1] !== false) setStep(i) }}
              style={{ flex:1, padding:"0.6rem 0.25rem", textAlign:"center", fontSize:"0.72rem", fontWeight:700,
                letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", border:"none",
                borderRight: i<STEPS.length-1 ? "1px solid var(--border)" : "none",
                background: i===step ? "var(--gold)" : i<step ? "rgba(201,168,76,0.12)" : "var(--surface)",
                color:       i===step ? "#000"        : i<step ? "var(--gold)"            : "var(--text-mute)" }}>
              <span style={{ display:"block", fontSize:"0.65rem", fontWeight:400, marginBottom:"0.1rem", opacity:0.7 }}>{i+1}</span>
              {s}
            </button>
          ))}
        </div>

        <div className="card">
          {stepContent[step]}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"2rem", paddingTop:"1.25rem", borderTop:"1px solid var(--border)" }}>
            <button onClick={() => setStep(p => p-1)} disabled={step===0} className="btn-outline"
              style={{ display:"flex", alignItems:"center", gap:"0.35rem", opacity:step===0?0.3:1 }}>
              <ChevronLeft size={15}/> Back
            </button>
            {step < STEPS.length-1 ? (
              <button onClick={() => setStep(p => p+1)} disabled={!canAdvance[step]} className="btn-gold"
                style={{ display:"flex", alignItems:"center", gap:"0.35rem", opacity:canAdvance[step]?1:0.4 }}>
                Next <ChevronRight size={15}/>
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                {consented && <CheckCircle size={15} style={{ color:"#4ade80" }}/>}
                <span style={{ fontSize:"0.8rem", color: consented ? "#4ade80" : "var(--text-mute)" }}>
                  {consented ? "Ready to print" : "Acknowledge above to complete"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  )
}
