"use client"
import { useState, useCallback } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronRight, ChevronLeft, CheckCircle, Plus, Minus } from "lucide-react"

const STEPS = ["Basic Info","Vitals","Health History","Lifestyle","Goals","Screening","Consent"]

const initialData = {
  firstName:"", lastName:"", email:"", phone:"", dob:"",
  heightFt:"", heightIn:"",
  weight:"", bodyFat:"", musclePct:"",
  conditions:"", medications:"", surgeries:"", allergies:"",
  sleepHrs: 7, stressLvl: 5, exerciseFreq:"", dietDesc:"",
  goals: [] as string[], goalsOther:"",
  screenQ1:"", screenQ2:"",
  consentGeneral: false, consentData: false, consentDisclaimer: false,
}

const goalOptions = ["Fat Loss","Muscle Gain","Recovery & Healing","Anti-Aging","Energy & Performance","Sleep Quality","Libido","Gut Health","Other"]

export default function IntakePage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const setField = useCallback(<K extends keyof typeof initialData>(k: K, v: (typeof initialData)[K]) => {
    setData(p => ({ ...p, [k]: v }))
  }, [])

  const handleText = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setData(p => ({ ...p, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }))

  const toggleGoal = (g: string) =>
    setData(p => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter(x => x !== g) : [...p.goals, g] }))

  const submit = async () => {
    setSaving(true)
    const payload = { ...data, height: data.heightFt ? `${data.heightFt}'${data.heightIn || 0}"` : "" }
    await fetch("/api/intake", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) })
    setSaving(false)
    setSubmitted(true)
  }

  // Labelled text input — id+name ensures browser doesn't lose cursor
  function TF({ label, id, type="text", placeholder="", value, autoComplete="off" }: {
    label: string; id: keyof typeof data; type?: string; placeholder?: string; value: string; autoComplete?: string
  }) {
    return (
      <div>
        <label htmlFor={String(id)}>{label}</label>
        <input id={String(id)} name={String(id)} type={type} placeholder={placeholder}
          value={value} autoComplete={autoComplete}
          onChange={handleText(id)} />
      </div>
    )
  }

  function TA({ label, id, rows=3, placeholder="" }: { label: string; id: keyof typeof data; rows?: number; placeholder?: string }) {
    return (
      <div>
        <label htmlFor={String(id)}>{label}</label>
        <textarea id={String(id)} name={String(id)} rows={rows} placeholder={placeholder}
          value={data[id] as string} onChange={handleText(id)} />
      </div>
    )
  }

  function SleepStepper() {
    return (
      <div>
        <label>Average Sleep (hours/night)</label>
        <div style={{ display:"flex", alignItems:"center", marginTop:"0.4rem", width:"fit-content",
          border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
          <button type="button" onClick={() => setField("sleepHrs", Math.max(1, data.sleepHrs - 1))}
            style={{ width:"2.75rem", height:"2.75rem", background:"var(--surface-2)", border:"none",
              color:"var(--text)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Minus size={14}/>
          </button>
          <span style={{ width:"3.25rem", textAlign:"center", fontWeight:700, fontSize:"1.1rem",
            color:"var(--text)", userSelect:"none", lineHeight:"2.75rem", background:"var(--surface)" }}>
            {data.sleepHrs}
          </span>
          <button type="button" onClick={() => setField("sleepHrs", Math.min(20, data.sleepHrs + 1))}
            style={{ width:"2.75rem", height:"2.75rem", background:"var(--surface-2)", border:"none",
              color:"var(--text)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Plus size={14}/>
          </button>
        </div>
        <p style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginTop:"0.35rem" }}>1–20 hours</p>
      </div>
    )
  }

  const steps = [
    /* 0 Basic Info */
    <div key={0} className="flex flex-col gap-4">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <TF label="First Name" id="firstName" placeholder="Richard" value={data.firstName} autoComplete="given-name"/>
        <TF label="Last Name"  id="lastName"  placeholder="Ortiz"   value={data.lastName}  autoComplete="family-name"/>
      </div>
      <TF label="Email"         id="email" type="email" placeholder="you@example.com"       value={data.email}  autoComplete="email"/>
      <TF label="Phone"         id="phone" type="tel"   placeholder="+1 (555) 000-0000"     value={data.phone}  autoComplete="tel"/>
      <TF label="Date of Birth" id="dob"   type="date"                                       value={data.dob}    autoComplete="bday"/>
    </div>,

    /* 1 Vitals */
    <div key={1} className="flex flex-col gap-5">
      <div>
        <label>Height</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginTop:"0.4rem" }}>
          <div style={{ position:"relative" }}>
            <input id="heightFt" name="heightFt" type="number" min={0} max={8} placeholder="5"
              value={data.heightFt} onChange={handleText("heightFt")} style={{ paddingRight:"2.25rem" }}/>
            <span style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)",
              color:"var(--text-mute)", fontSize:"0.85rem", pointerEvents:"none" }}>ft</span>
          </div>
          <div style={{ position:"relative" }}>
            <input id="heightIn" name="heightIn" type="number" min={0} max={11} placeholder="10"
              value={data.heightIn} onChange={handleText("heightIn")} style={{ paddingRight:"2.25rem" }}/>
            <span style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)",
              color:"var(--text-mute)", fontSize:"0.85rem", pointerEvents:"none" }}>in</span>
          </div>
        </div>
      </div>
      <TF label="Weight (lbs)" id="weight" placeholder="180" value={data.weight}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
        <TF label="Body Fat % (optional)"    id="bodyFat"  placeholder="20" value={data.bodyFat}/>
        <TF label="Muscle Mass % (optional)" id="musclePct" placeholder="40" value={data.musclePct}/>
      </div>
    </div>,

    /* 2 Health History */
    <div key={2} className="flex flex-col gap-4">
      <TA label='Current Medical Conditions (or "None")' id="conditions" rows={3}/>
      <TA label="Current Medications & Dosages"           id="medications" rows={3}/>
      <TA label="Past Surgeries or Procedures"            id="surgeries"   rows={2}/>
      <TF label="Known Allergies"                         id="allergies"   value={data.allergies}/>
    </div>,

    /* 3 Lifestyle */
    <div key={3} className="flex flex-col gap-5">
      <SleepStepper/>
      <div>
        <label>Stress Level (1 = low, 10 = high): <span style={{color:"var(--gold)",fontWeight:700}}>{data.stressLvl}</span></label>
        <input type="range" min={1} max={10} value={data.stressLvl} onChange={handleText("stressLvl")} style={{marginTop:"0.5rem"}}/>
      </div>
      <div>
        <label htmlFor="exerciseFreq">Exercise Frequency</label>
        <select id="exerciseFreq" value={data.exerciseFreq} onChange={handleText("exerciseFreq")}>
          <option value="">Select...</option>
          <option>Sedentary (0x/week)</option>
          <option>Light (1-2x/week)</option>
          <option>Moderate (3-4x/week)</option>
          <option>Active (5+x/week)</option>
        </select>
      </div>
      <TA label="Diet Description" id="dietDesc" rows={2} placeholder="Keto, high-protein, no restrictions..."/>
    </div>,

    /* 4 Goals */
    <div key={4} className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem"}}>Select all that apply:</p>
      <div className="flex flex-wrap gap-2">
        {goalOptions.map(g => (
          <button key={g} type="button" onClick={() => toggleGoal(g)} style={{
            padding:"0.4rem 0.9rem", borderRadius:"var(--radius)", fontSize:"0.8rem", fontWeight:600, cursor:"pointer",
            background: data.goals.includes(g) ? "var(--gold)" : "var(--surface-2)",
            color:      data.goals.includes(g) ? "#000"         : "var(--text-soft)",
            border:    `1px solid ${data.goals.includes(g) ? "var(--gold)" : "var(--border)"}`
          }}>{g}</button>
        ))}
      </div>
      {data.goals.includes("Other") && <TA label="Describe your goal" id="goalsOther" rows={2}/>}
    </div>,

    /* 5 Screening */
    <div key={5} className="flex flex-col gap-4">
      <TA label="Have you used peptides before? If yes, describe."                 id="screenQ1" rows={2}/>
      <TA label="Do you have any active cancer diagnosis or history? Please describe." id="screenQ2" rows={2}/>
    </div>,

    /* 6 Consent */
    <div key={6} className="flex flex-col gap-4">
      {([
        ["consentGeneral",    "I understand that Richard Ortiz provides wellness coaching services."],
        ["consentData",       "I consent to my intake data being stored securely and reviewed by the coach."],
        ["consentDisclaimer", "I confirm I have reviewed the information and agree to the coaching terms."],
      ] as [keyof typeof initialData, string][]).map(([k, txt]) => (
        <label key={k} style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",cursor:"pointer"}}>
          <input type="checkbox" id={String(k)} checked={data[k] as boolean} onChange={handleText(k)}
            style={{width:"auto",marginTop:"0.2rem",accentColor:"var(--gold)"}}/>
          <span style={{fontSize:"0.9rem",color:"var(--text-soft)",lineHeight:1.6}}>{txt}</span>
        </label>
      ))}
    </div>,
  ]

  if (submitted) return (
    <>
      <Nav/>
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} style={{color:"var(--gold)",margin:"0 auto 1.5rem"}}/>
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem"}}>Intake Submitted!</h1>
        <p style={{color:"var(--text-soft)",marginTop:"1rem",lineHeight:1.7}}>
          Thank you. Richard will review your intake within 48 hours and reach out to schedule your initial consult.
          Check your email for a confirmation.
        </p>
      </div>
      <Footer/>
    </>
  )

  const allConsented = data.consentGeneral && data.consentData && data.consentDisclaimer

  return (
    <>
      <Nav/>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem",letterSpacing:"-0.02em"}}>Client Intake Form</h1>
        <p style={{color:"var(--text-soft)",fontSize:"0.9rem",marginTop:"0.5rem"}}>
          Step {step+1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
        </p>
        <div style={{height:3,background:"var(--surface)",borderRadius:2,margin:"1.25rem 0 2rem"}}>
          <div style={{height:"100%",background:"var(--gold)",borderRadius:2,width:`${((step+1)/STEPS.length)*100}%`,transition:"width 0.3s"}}/>
        </div>
        <div className="card">
          {steps[step]}
          <div className="flex justify-between mt-8">
            <button className="btn-outline" onClick={() => setStep(p => p-1)} disabled={step===0}
              style={{display:"flex",alignItems:"center",gap:"0.35rem",opacity:step===0?0.3:1}}>
              <ChevronLeft size={15}/> Back
            </button>
            {step < STEPS.length-1
              ? <button className="btn-gold" onClick={() => setStep(p => p+1)} style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
                  Next <ChevronRight size={15}/>
                </button>
              : <button className="btn-gold" onClick={submit} disabled={!allConsented||saving}>
                  {saving ? "Submitting..." : "Submit Intake"}
                </button>
            }
          </div>
        </div>
      </div>
      <Footer/>
    </>
  )
}
