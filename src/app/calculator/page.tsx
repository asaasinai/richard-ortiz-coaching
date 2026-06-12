"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { AlertTriangle, Download, RotateCcw } from "lucide-react"

type Level = "conservative"|"moderate"|"liberal"
const MULTIPLIERS: Record<Level,number> = { conservative: 0.8, moderate: 1.0, liberal: 1.2 }

const PEPTIDES = [
  { name: "BPC-157",           defaultVial: "5",   defaultRecon: "2",   defaultDose: "250",  unit: "mcg" as const },
  { name: "CJC-1295",          defaultVial: "2",   defaultRecon: "2",   defaultDose: "100",  unit: "mcg" as const },
  { name: "GHK-Cu",            defaultVial: "50",  defaultRecon: "5",   defaultDose: "1",    unit: "mg"  as const },
  { name: "Ipamorelin",        defaultVial: "5",   defaultRecon: "2",   defaultDose: "200",  unit: "mcg" as const },
  { name: "KPV",               defaultVial: "5",   defaultRecon: "2",   defaultDose: "500",  unit: "mcg" as const },
  { name: "Melanotan II",      defaultVial: "10",  defaultRecon: "2",   defaultDose: "250",  unit: "mcg" as const },
  { name: "PT-141",            defaultVial: "10",  defaultRecon: "2",   defaultDose: "1",    unit: "mg"  as const },
  { name: "Semaglutide",       defaultVial: "3",   defaultRecon: "1.5", defaultDose: "0.25", unit: "mg"  as const },
  { name: "Sermorelin",        defaultVial: "6",   defaultRecon: "2",   defaultDose: "200",  unit: "mcg" as const },
  { name: "TB-500",            defaultVial: "10",  defaultRecon: "2",   defaultDose: "5",    unit: "mg"  as const },
  { name: "Tesamorelin",       defaultVial: "1",   defaultRecon: "2.2", defaultDose: "2",    unit: "mg"  as const },
  { name: "Tirzepatide",       defaultVial: "5",   defaultRecon: "2",   defaultDose: "2.5",  unit: "mg"  as const },
]

interface Inputs {
  peptideName: string
  vialMg: string
  reconMl: string
  desiredDose: string
  doseUnit: "mcg"|"mg"
  syringeUnits: string
  weightKg: string
  level: Level
}

interface Result {
  concMgPerMl: number
  concMcgPerMl: number
  syringeUnitsExact: number
  syringeUnitsRounded: number
  dosesPerVial: number
  adjustedDoseMcg: number
  warnings: string[]
}

function roundToMark(v: number): number {
  const marks = [1,2,3,4,5,6,7,8,9,10,12,14,15,16,18,20,25,30,35,40,45,50,60,70,80,90,100]
  return marks.reduce((a,b) => Math.abs(b-v) < Math.abs(a-v) ? b : a)
}

function calculate(i: Inputs): Result | null {
  const vialMg = parseFloat(i.vialMg)
  const reconMl = parseFloat(i.reconMl)
  const desired = parseFloat(i.desiredDose)
  const units = parseFloat(i.syringeUnits)
  if (!vialMg || !reconMl || !desired || !units) return null
  const mult = MULTIPLIERS[i.level]
  const concMgPerMl = vialMg / reconMl
  const concMcgPerMl = concMgPerMl * 1000
  const baseDoseMcg = i.doseUnit === "mg" ? desired * 1000 : desired
  const adjustedDoseMcg = baseDoseMcg * mult
  const syringeUnitsExact = (adjustedDoseMcg / concMcgPerMl) * units
  const syringeUnitsRounded = roundToMark(syringeUnitsExact)
  const dosesPerVial = (vialMg * 1000) / adjustedDoseMcg
  const warnings: string[] = []
  if (syringeUnitsExact > 100) warnings.push("Calculated dose exceeds typical 100-unit syringe capacity.")
  if (dosesPerVial < 1) warnings.push("Desired dose exceeds vial contents — check inputs.")
  if (adjustedDoseMcg > 1000) warnings.push("High dose: verify with your practitioner before proceeding.")
  return { concMgPerMl, concMcgPerMl, syringeUnitsExact, syringeUnitsRounded, dosesPerVial, adjustedDoseMcg, warnings }
}

const defaultInputs: Inputs = {
  peptideName:"", vialMg:"", reconMl:"", desiredDose:"", doseUnit:"mcg",
  syringeUnits:"100", weightKg:"", level:"moderate"
}

async function exportPDF(inputs: Inputs, result: Result) {
  const res = await fetch("/api/pdf", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      peptideName: inputs.peptideName || "Peptide",
      vialMg: inputs.vialMg,
      reconMl: inputs.reconMl,
      desiredDoseMcg: result.adjustedDoseMcg,
      syringeUnitsExact: result.syringeUnitsExact,
      syringeUnitsRounded: result.syringeUnitsRounded,
      dosesPerVial: result.dosesPerVial,
      concMgPerMl: result.concMgPerMl,
      concMcgPerMl: result.concMcgPerMl,
      protocolLevel: inputs.level.charAt(0).toUpperCase() + inputs.level.slice(1),
      coachContact: "richard@richardortizcoaching.com"
    })
  })
  const html = await res.text()
  const win = window.open("","_blank")
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600) }
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs)
  const [result, setResult] = useState<Result | null>(null)
  const [exporting, setExporting] = useState(false)

  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setInputs(p => ({ ...p, [k]: e.target.value }))

  // When peptide is selected, auto-fill defaults
  const selectPeptide = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    const p = PEPTIDES.find(x => x.name === name)
    if (p) {
      setInputs(prev => ({
        ...prev,
        peptideName: p.name,
        vialMg: p.defaultVial,
        reconMl: p.defaultRecon,
        desiredDose: p.defaultDose,
        doseUnit: p.unit,
      }))
    } else {
      setInputs(prev => ({ ...prev, peptideName: "" }))
    }
    setResult(null)
  }

  const run = () => setResult(calculate(inputs))
  const reset = () => { setInputs(defaultInputs); setResult(null) }

  const handleExport = async () => {
    if (!result) return
    setExporting(true)
    await exportPDF(inputs, result)
    setExporting(false)
  }

  const rowStyle = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }

  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <span className="section-num">05 — Calculator</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.25rem",letterSpacing:"-0.03em" }}>Dosage Calculator</h1>
        <p style={{ color:"var(--text-soft)",marginTop:"0.6rem",marginBottom:"2rem" }}>
          Select a peptide — fields auto-fill with standard values. Adjust as needed, then calculate.
        </p>

        <div className="card flex flex-col gap-5">
          {/* Peptide selector */}
          <div>
            <label>Peptide</label>
            <select value={inputs.peptideName} onChange={selectPeptide}>
              <option value="">— Select a peptide —</option>
              {PEPTIDES.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Vial + recon */}
          <div style={rowStyle}>
            <div><label>Vial Size (mg)</label><input type="number" placeholder="5" value={inputs.vialMg} onChange={set("vialMg")} /></div>
            <div><label>Reconstitution (mL BAC water)</label><input type="number" placeholder="2" value={inputs.reconMl} onChange={set("reconMl")} /></div>
          </div>

          {/* Dose */}
          <div style={rowStyle}>
            <div><label>Desired Dose</label><input type="number" placeholder="250" value={inputs.desiredDose} onChange={set("desiredDose")} /></div>
            <div><label>Unit</label>
              <select value={inputs.doseUnit} onChange={set("doseUnit")}>
                <option value="mcg">mcg</option>
                <option value="mg">mg</option>
              </select>
            </div>
          </div>

          {/* Syringe + weight */}
          <div style={rowStyle}>
            <div><label>Syringe Type</label>
              <select value={inputs.syringeUnits} onChange={set("syringeUnits")}>
                <option value="100">100 U/mL — standard insulin syringe</option>
                <option value="40">40 U/mL</option>
              </select>
            </div>
            <div><label>Body Weight (kg, optional)</label><input type="number" placeholder="80" value={inputs.weightKg} onChange={set("weightKg")} /></div>
          </div>

          {/* Protocol level */}
          <div><label>Protocol Level</label>
            <select value={inputs.level} onChange={set("level")}>
              <option value="conservative">Conservative (×0.8) — starting out / sensitive</option>
              <option value="moderate">Moderate (×1.0) — standard protocol</option>
              <option value="liberal">Liberal (×1.2) — experienced / coach-directed</option>
            </select>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button className="btn-gold" onClick={run} disabled={!inputs.peptideName || !inputs.vialMg}>Calculate</button>
            <button className="btn-outline" onClick={reset} style={{ display:"flex",alignItems:"center",gap:"0.35rem" }}><RotateCcw size={14}/>Reset</button>
          </div>
        </div>

        {result && (
          <div className="card mt-6 flex flex-col gap-4">
            <h2 style={{ fontWeight:700,fontSize:"1rem",color:"var(--gold)" }}>
              Results — {inputs.peptideName} ({inputs.level})
            </h2>

            {result.warnings.map(w => (
              <div key={w} style={{ background:"rgba(201,168,76,0.1)",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:"0.75rem 1rem",display:"flex",gap:"0.6rem",alignItems:"flex-start" }}>
                <AlertTriangle size={16} style={{ color:"var(--gold)",flexShrink:0,marginTop:2 }} />
                <span style={{ fontSize:"0.85rem",color:"var(--text-soft)" }}>{w}</span>
              </div>
            ))}

            {/* Highlight box — the number they actually need */}
            <div style={{ background:"rgba(201,168,76,0.08)",border:"2px solid var(--gold)",borderRadius:"var(--radius)",padding:"1rem 1.25rem",textAlign:"center" }}>
              <div style={{ fontSize:"0.75rem",color:"var(--gold)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.25rem" }}>Draw to this mark</div>
              <div style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"3rem",color:"var(--gold)",lineHeight:1 }}>{result.syringeUnitsRounded}</div>
              <div style={{ fontSize:"0.85rem",color:"var(--text-soft)",marginTop:"0.25rem" }}>units on your syringe</div>
            </div>

            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.9rem" }}>
              <tbody>
                {[
                  ["Adjusted Dose",          `${result.adjustedDoseMcg.toFixed(2)} mcg`],
                  ["Concentration",          `${result.concMgPerMl.toFixed(3)} mg/mL  (${result.concMcgPerMl.toFixed(1)} mcg/mL)`],
                  ["Syringe Units (exact)",  `${result.syringeUnitsExact.toFixed(2)} units`],
                  ["Doses per Vial",         `${result.dosesPerVial.toFixed(1)}`],
                ].map(([k,v]) => (
                  <tr key={k} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"0.6rem 0",color:"var(--text-mute)",width:"50%" }}>{k}</td>
                    <td style={{ padding:"0.6rem 0",fontWeight:600,color:"var(--text)" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="btn-gold" style={{ alignSelf:"flex-start",display:"flex",alignItems:"center",gap:"0.5rem" }}
              onClick={handleExport} disabled={exporting}>
              <Download size={15}/>{exporting ? "Generating..." : "Export PDF Card"}
            </button>
            <p style={{ fontSize:"0.75rem",color:"var(--text-mute)" }}>
              For educational and coaching purposes only. Verify all doses with your prescribing physician.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
