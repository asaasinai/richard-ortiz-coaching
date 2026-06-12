"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react"

const STEPS = ["Basic Info","Vitals","Health History","Lifestyle","Goals","Screening","Consent"]

const initialData = {
  firstName:"",lastName:"",email:"",phone:"",dob:"",
  heightFt:"",heightIn:"",weight:"",bodyFat:"",musclePct:"",
  conditions:"",medications:"",surgeries:"",allergies:"",
  sleepHrs:"",stressLvl:5,exerciseFreq:"",dietDesc:"",
  goals:[] as string[],goalsOther:"",
  screenQ1:"",screenQ2:"",
  consentGeneral:false,consentData:false,consentDisclaimer:false
}

const goalOptions = ["Fat Loss","Muscle Gain","Recovery & Healing","Anti-Aging","Energy & Performance","Sleep Quality","Libido","Gut Health","Other"]

export default function IntakePage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setData(p => ({ ...p, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }))

  const toggleGoal = (g: string) =>
    setData(p => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter(x=>x!==g) : [...p.goals, g] }))

  const submit = async () => {
    setSaving(true)
    const payload = {
      ...data,
      height: data.heightFt && data.heightIn !== undefined
        ? `${data.heightFt}'${data.heightIn}"`
        : data.heightFt ? `${data.heightFt}'0"` : ""
    }
    await fetch("/api/intake", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) })
    setSaving(false)
    setSubmitted(true)
  }

  const inp = (label: string, key: keyof typeof data, type="text", placeholder="") => (
    <div key={key}><label>{label}</label>
      <input type={type} placeholder={placeholder} value={data[key] as string} onChange={set(key)} /></div>
  )

  const steps = [
    /* 0 Basic Info */
    <div key={0} className="flex flex-col gap-4">
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
        {inp("First Name","firstName","text","Richard")}
        {inp("Last Name","lastName","text","Ortiz")}
      </div>
      {inp("Email","email","email","you@example.com")}
      {inp("Phone","phone","tel","+1 (555) 000-0000")}
      {inp("Date of Birth","dob","date")}
    </div>,
    /* 1 Vitals */
    <div key={1} className="flex flex-col gap-4">
      <div>
        <label>Height</label>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem" }}>
          <div style={{ position:"relative" }}>
            <input type="number" min={0} max={8} placeholder="5" value={data.heightFt} onChange={set("heightFt")}
              style={{ paddingRight:"2rem" }} />
            <span style={{ position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--text-mute)",fontSize:"0.85rem",pointerEvents:"none" }}>ft</span>
          </div>
          <div style={{ position:"relative" }}>
            <input type="number" min={0} max={11} placeholder="10" value={data.heightIn} onChange={set("heightIn")}
              style={{ paddingRight:"2rem" }} />
            <span style={{ position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--text-mute)",fontSize:"0.85rem",pointerEvents:"none" }}>in</span>
          </div>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
        {inp("Weight (lbs)","weight","text","180")}
        {inp("Body Fat % (optional)","bodyFat","text","20")}
        {inp("Muscle Mass % (optional)","musclePct","text","40")}
      </div>
    </div>,
    /* 2 Health History */
    <div key={2} className="flex flex-col gap-4">
      <div><label>Current Medical Conditions (or "None")</label><textarea rows={3} value={data.conditions} onChange={set("conditions")} /></div>
      <div><label>Current Medications & Dosages</label><textarea rows={3} value={data.medications} onChange={set("medications")} /></div>
      <div><label>Past Surgeries or Procedures</label><textarea rows={2} value={data.surgeries} onChange={set("surgeries")} /></div>
      <div><label>Known Allergies</label><input value={data.allergies} onChange={set("allergies")} /></div>
    </div>,
    /* 3 Lifestyle */
    <div key={3} className="flex flex-col gap-4">
      {inp("Average Sleep (hours/night)","sleepHrs","number","7")}
      <div>
        <label>Stress Level (1 = low, 10 = high): <span style={{color:"var(--gold)"}}>{data.stressLvl}</span></label>
        <input type="range" min={1} max={10} value={data.stressLvl} onChange={set("stressLvl")} style={{marginTop:"0.5rem"}} />
      </div>
      <div><label>Exercise Frequency</label>
        <select value={data.exerciseFreq} onChange={set("exerciseFreq")}>
          <option value="">Select...</option>
          <option>Sedentary (0x/week)</option><option>Light (1-2x/week)</option>
          <option>Moderate (3-4x/week)</option><option>Active (5+x/week)</option>
        </select>
      </div>
      <div><label>Diet Description</label><textarea rows={2} placeholder="Keto, high-protein, no restrictions..." value={data.dietDesc} onChange={set("dietDesc")} /></div>
    </div>,
    /* 4 Goals */
    <div key={4} className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem"}}>Select all that apply:</p>
      <div className="flex flex-wrap gap-2">
        {goalOptions.map(g => (
          <button key={g} type="button" onClick={() => toggleGoal(g)}
            style={{
              padding:"0.4rem 0.9rem",borderRadius:"var(--radius)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",
              background: data.goals.includes(g) ? "var(--gold)" : "var(--surface-2)",
              color: data.goals.includes(g) ? "#000" : "var(--text-soft)",
              border: `1px solid ${data.goals.includes(g) ? "var(--gold)" : "var(--border)"}`
            }}>{g}</button>
        ))}
      </div>
      {data.goals.includes("Other") && <div><label>Describe your goal</label><textarea rows={2} value={data.goalsOther} onChange={set("goalsOther")} /></div>}
    </div>,
    /* 5 Screening */
    <div key={5} className="flex flex-col gap-4">
      <div><label>Have you used peptides before? If yes, describe.</label><textarea rows={2} value={data.screenQ1} onChange={set("screenQ1")} /></div>
      <div><label>Do you have any active cancer diagnosis or history? Please describe.</label><textarea rows={2} value={data.screenQ2} onChange={set("screenQ2")} /></div>
    </div>,
    /* 6 Consent */
    <div key={6} className="flex flex-col gap-4">
      {[
        ["consentGeneral","I understand that Richard Ortiz provides wellness coaching, not medical advice."],
        ["consentData","I consent to my intake data being stored securely and reviewed by the coach."],
        ["consentDisclaimer","I confirm I have consulted or will consult a licensed physician before starting any protocol."]
      ].map(([k,txt]) => (
        <label key={k} style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",cursor:"pointer"}}>
          <input type="checkbox" checked={data[k as keyof typeof data] as boolean} onChange={set(k as keyof typeof data)}
            style={{width:"auto",marginTop:"0.2rem",accentColor:"var(--gold)"}} />
          <span style={{fontSize:"0.9rem",color:"var(--text-soft)",lineHeight:1.6}}>{txt}</span>
        </label>
      ))}
    </div>
  ]

  if (submitted) return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} style={{color:"var(--gold)",margin:"0 auto 1.5rem"}} />
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem"}}>Intake Submitted!</h1>
        <p style={{color:"var(--text-soft)",marginTop:"1rem",lineHeight:1.7}}>
          Thank you. Richard will review your intake within 48 hours and reach out to schedule your initial consult.
          Check your email for a confirmation.
        </p>
      </div>
      <Footer />
    </>
  )

  const allConsented = data.consentGeneral && data.consentData && data.consentDisclaimer

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <span className="section-num">04 — Intake</span>
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem",letterSpacing:"-0.02em"}}>Client Intake Form</h1>
        <p style={{color:"var(--text-soft)",fontSize:"0.9rem",marginTop:"0.5rem"}}>Step {step+1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>

        {/* Progress bar */}
        <div style={{height:3,background:"var(--surface)",borderRadius:2,margin:"1.25rem 0 2rem"}}>
          <div style={{height:"100%",background:"var(--gold)",borderRadius:2,width:`${((step+1)/STEPS.length)*100}%`,transition:"width 0.3s"}} />
        </div>

        <div className="card">
          {steps[step]}
          <div className="flex justify-between mt-8">
            <button className="btn-outline" onClick={() => setStep(p=>p-1)} disabled={step===0}
              style={{display:"flex",alignItems:"center",gap:"0.35rem",opacity:step===0?0.3:1}}>
              <ChevronLeft size={15}/> Back
            </button>
            {step < STEPS.length-1
              ? <button className="btn-gold" onClick={() => setStep(p=>p+1)} style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
                  Next <ChevronRight size={15}/>
                </button>
              : <button className="btn-gold" onClick={submit} disabled={!allConsented||saving}>
                  {saving ? "Submitting..." : "Submit Intake"}
                </button>
            }
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
