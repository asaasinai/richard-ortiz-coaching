"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"

const SIDE_EFFECTS = ["Injection site redness","Nausea","Fatigue","Headache","Water retention","Elevated heart rate","Flushing","Hunger changes","Sleep disturbance","None"]
const STEPS = ["Progress","Side Effects","Adherence","Notes"]

export default function CheckInPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    weight:"", bodyFat:"", musclePct:"",
    progressScore:5, energyScore:5, moodScore:5,
    sideEffects:[] as string[],
    missedDoses:"0", reason:"",
    notes:"",
    urgentFlag:false
  })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setData(p => ({...p, [k]: e.target.type==="checkbox" ? (e.target as HTMLInputElement).checked : e.target.value}))

  const setNum = (k: "progressScore"|"energyScore"|"moodScore") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(p => ({...p, [k]: Number(e.target.value)}))

  const toggleSE = (s: string) =>
    setData(p => ({...p, sideEffects: p.sideEffects.includes(s) ? p.sideEffects.filter(x=>x!==s) : [...p.sideEffects, s]}))

  const submit = async () => {
    await fetch("/api/checkin", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})
    setSubmitted(true)
  }

  const slider = (label: string, key: "progressScore"|"energyScore"|"moodScore") => (
    <div key={key}>
      <label>{label}: <span style={{color:"var(--gold)",fontWeight:700}}>{data[key]}/10</span></label>
      <input type="range" min={1} max={10} value={data[key]} onChange={setNum(key)} style={{marginTop:"0.5rem"}} />
    </div>
  )

  const steps = [
    <div key={0} className="flex flex-col gap-5">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
        {(["weight","bodyFat","musclePct"] as const).map(k => (
          <div key={k}>
            <label>{k==="weight"?"Weight (lbs)":k==="bodyFat"?"Body Fat % (opt)":"Muscle % (opt)"}</label>
            <input type="number" placeholder="—" value={data[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      {slider("Overall Progress","progressScore")}
      {slider("Energy Level","energyScore")}
      {slider("Mood & Wellbeing","moodScore")}
    </div>,

    <div key={1} className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem"}}>Check any you experienced in the past 2 weeks:</p>
      <div className="flex flex-wrap gap-2">
        {SIDE_EFFECTS.map(s => (
          <button key={s} type="button" onClick={() => toggleSE(s)} style={{
            padding:"0.4rem 0.9rem",borderRadius:"var(--radius)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",
            background: data.sideEffects.includes(s) ? "var(--gold)" : "var(--surface-2)",
            color: data.sideEffects.includes(s) ? "#000" : "var(--text-soft)",
            border:`1px solid ${data.sideEffects.includes(s)?"var(--gold)":"var(--border)"}`
          }}>{s}</button>
        ))}
      </div>
    </div>,

    <div key={2} className="flex flex-col gap-4">
      <div>
        <label>Missed doses in past 2 weeks</label>
        <select value={data.missedDoses} onChange={set("missedDoses")}>
          <option value="0">0 — perfect adherence</option>
          <option value="1">1 dose</option>
          <option value="2">2 doses</option>
          <option value="3">3+ doses</option>
        </select>
      </div>
      {data.missedDoses !== "0" && (
        <div><label>Reason for missed doses</label><textarea rows={2} value={data.reason} onChange={set("reason")} /></div>
      )}
      <label style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",cursor:"pointer",marginTop:"1rem"}}>
        <input type="checkbox" checked={data.urgentFlag} onChange={set("urgentFlag")}
          style={{width:"auto",accentColor:"red",marginTop:"0.2rem"}} />
        <span style={{fontSize:"0.9rem",lineHeight:1.6}}>
          <span style={{color:"#f87171",fontWeight:700}}>Request urgent follow-up</span> — I have a concern that needs prompt attention.
        </span>
      </label>
    </div>,

    <div key={3}>
      <label>Anything else to share with your coach?</label>
      <textarea rows={5} placeholder="Changes in lifestyle, observations, questions..." value={data.notes} onChange={set("notes")} />
    </div>
  ]

  if (submitted) return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} style={{color:"var(--gold)",margin:"0 auto 1.5rem"}} />
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem"}}>Check-In Submitted</h1>
        <p style={{color:"var(--text-soft)",marginTop:"1rem",lineHeight:1.7}}>
          Your 2-week check-in has been received. Richard will review it and follow up within 24 hours.
        </p>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <span className="section-num">06 — Check-In</span>
        <h1 style={{fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2rem",letterSpacing:"-0.02em"}}>2-Week Check-In</h1>
        <p style={{color:"var(--text-soft)",fontSize:"0.9rem",marginTop:"0.5rem"}}>
          Step {step+1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
        </p>
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
              : <button className="btn-gold" onClick={submit}>Submit Check-In</button>
            }
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
