"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { AlertTriangle, Download, RotateCcw } from "lucide-react"

type Level = "conservative"|"moderate"|"liberal"
const MULTIPLIERS: Record<Level,number> = { conservative: 0.8, moderate: 1.0, liberal: 1.2 }

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
          Enter your vial specs and desired dose. Results include exact + rounded syringe units and a printable PDF card.
        </p>
        <div className="card flex flex-col gap-5">
          <div>
            <label>Peptide Name</label>
            <input placeholder="e.g. BPC-157" value={inputs.peptideName} onChange={set("peptideName")} />
          </div>
          <div style={rowStyle}>
            <div><label>Vial (mg)</label><input type="number" placeholder="5" value={inputs.vialMg} onChange={set("vialMg")} /></div>
            <div><label>Reconstitution (mL)</label><input type="number" placeholder="2" value={inputs.reconMl} onChange={set("reconMl")} /></div>
          </div>
          <div style={rowStyle}>
            <div><label>Desired Dose</label><input type="number" placeholder="250" value={inputs.desiredDose} onChange={set("desiredDose")} /></div>
            <div><label>Unit</label>
              <select value={inputs.doseUnit} onChange={set("doseUnit")}>
                <option value="mcg">mcg</option>
                <option value="mg">mg</option>
              </select>
            </div>
          </div>
          <div style={rowStyle}>
            <div><label>Syringe Units/mL</label>
              <select value={inputs.syringeUnits} onChange={set("syringeUnits")}>
                <option value="100">100 U/mL (standard insulin)</option>
                <option value="40">40 U/mL</option>
              </select>
            </div>
            <div><label>Weight (kg, optional)</label><input type="number" placeholder="80" value={inputs.weightKg} onChange={set("weightKg")} /></div>
          </div>
          <div><label>Protocol Level</label>
            <select value={inputs.level} onChange={set("level")}>
              <option value="conservative">Conservative (×0.8)</option>
              <option value="moderate">Moderate (×1.0)</option>
              <option value="liberal">Liberal (×1.2)</option>
            </select>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-gold" onClick={run}>Calculate</button>
            <button className="btn-outline" onClick={reset} style={{ display:"flex",alignItems:"center",gap:"0.35rem" }}><RotateCcw size={14}/>Reset</button>
          </div>
        </div>

        {result && (
          <div className="card mt-6 flex flex-col gap-4">
            <h2 style={{ fontWeight:700,fontSize:"1rem",color:"var(--gold)" }}>Results — {inputs.peptideName || "Peptide"}</h2>
            {result.warnings.map(w => (
              <div key={w} style={{ background:"rgba(201,168,76,0.1)",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:"0.75rem 1rem",display:"flex",gap:"0.6rem",alignItems:"flex-start" }}>
                <AlertTriangle size={16} style={{ color:"var(--gold)",flexShrink:0,marginTop:2 }} />
                <span style={{ fontSize:"0.85rem",color:"var(--text-soft)" }}>{w}</span>
              </div>
            ))}
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.9rem" }}>
              <tbody>
                {[
                  ["Adjusted Dose",           `${result.adjustedDoseMcg.toFixed(2)} mcg`],
                  ["Concentration",            `${result.concMgPerMl.toFixed(3)} mg/mL (${result.concMcgPerMl.toFixed(1)} mcg/mL)`],
                  ["Syringe Units (exact)",    `${result.syringeUnitsExact.toFixed(2)} units`],
                  ["Syringe Units (rounded)",  `${result.syringeUnitsRounded} units ← draw to this mark`],
                  ["Doses per Vial",           `${result.dosesPerVial.toFixed(1)}`],
                ].map(([k,v]) => (
                  <tr key={k} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"0.6rem 0",color:"var(--text-mute)",width:"50%" }}>{k}</td>
                    <td style={{ padding:"0.6rem 0",fontWeight:600,color: k.includes("rounded") ? "var(--gold)" : "var(--text)" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-gold" style={{ alignSelf:"flex-start",display:"flex",alignItems:"center",gap:"0.5rem" }}
              onClick={handleExport} disabled={exporting}>
              <Download size={15}/>{exporting ? "Generating..." : "Export PDF Card"}
            </button>
            <p style={{ fontSize:"0.75rem",color:"var(--text-mute)",marginTop:"0.5rem" }}>
              For educational and coaching purposes only. Verify all doses with your prescribing physician.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
