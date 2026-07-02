"use client"
import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"
import PhotoUpload, { EMPTY_PHOTOS, type PhotoSet } from "@/components/PhotoUpload"

const SIDE_EFFECTS = ["Injection site redness","Nausea","Fatigue","Headache","Water retention","Elevated heart rate","Flushing","Hunger changes","Sleep disturbance","None","Other"]
const STEPS = ["You","Progress","Photos","Side Effects","Adherence","Notes"]

export default function CheckInPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    clientName:"", clientEmail:"",
    weight:"", bodyFat:"", musclePct:"",
    energyScore:5, moodScore:5,
    sideEffects:[] as string[],
    sideEffectsOther:"",
    missedDoses:"0", reason:"",
    notes:"",
    urgentFlag:false,
  })
  const [photos, setPhotos] = useState<PhotoSet>(EMPTY_PHOTOS)
  const [photoConsent, setPhotoConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Prefill email if the client happens to be logged into the dashboard — but
  // login is NOT required: the default link asks for name + email and we match
  // it to the client record server-side.
  useEffect(() => {
    const email = typeof window !== "undefined" ? sessionStorage.getItem("roc_dashboard_email") : null
    if (email) setData(p => ({ ...p, clientEmail: email }))
  }, [])

  const set = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setData(p => ({...p, [k]: e.target.type==="checkbox" ? (e.target as HTMLInputElement).checked : e.target.value}))
  const setNum = (k: "energyScore"|"moodScore") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(p => ({...p, [k]: Number(e.target.value)}))
  const toggleSE = (s: string) =>
    setData(p => ({...p, sideEffects: p.sideEffects.includes(s) ? p.sideEffects.filter(x=>x!==s) : [...p.sideEffects, s]}))

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.clientEmail.trim())
  const canAdvance = step !== 0 || (data.clientName.trim().length > 1 && emailOk)

  const submit = async () => {
    await fetch("/api/checkin", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-user-email": data.clientEmail.trim()},
      body: JSON.stringify({ ...data, clientEmail: data.clientEmail.trim(), clientName: data.clientName.trim(), photos, photoConsent })
    })
    setSubmitted(true)
  }

  const slider = (label: string, key: "energyScore"|"moodScore") => (
    <div key={key}>
      <label>{label}: <span style={{color:"var(--gold)",fontWeight:700}}>{data[key]}/10</span></label>
      <input type="range" min={1} max={10} value={data[key]} onChange={setNum(key)} style={{marginTop:"0.5rem"}}/>
    </div>
  )

  const steps = [
    <div key="you" className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem",lineHeight:1.6}}>
        Enter your name and the email on file so we can match this check-in to your record.
      </p>
      <div>
        <label>Full Name *</label>
        <input type="text" placeholder="First and last name" value={data.clientName}
          autoComplete="name" data-1p-ignore data-lpignore="true" onChange={set("clientName")}/>
      </div>
      <div>
        <label>Email *</label>
        <input type="email" placeholder="you@email.com" value={data.clientEmail}
          autoComplete="email" data-1p-ignore data-lpignore="true" onChange={set("clientEmail")}/>
        {data.clientEmail.trim() && !emailOk && (
          <p style={{color:"#f87171",fontSize:"0.78rem",marginTop:"0.35rem"}}>Enter a valid email.</p>
        )}
      </div>
    </div>,

    <div key="progress" className="flex flex-col gap-5">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
        {(["weight","bodyFat","musclePct"] as const).map(k=>(
          <div key={k}>
            <label>{k==="weight"?"Weight (lbs)":k==="bodyFat"?"Body Fat % (opt)":"Muscle % (opt)"}</label>
            <input type="number" placeholder="—" value={data[k]} onChange={set(k)}/>
          </div>
        ))}
      </div>
      {slider("Energy Level","energyScore")}
      {slider("Mood & Wellbeing","moodScore")}
    </div>,

    <div key="photos" className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem",lineHeight:1.6}}>
        Snap your progress photos — front, side, and back, same lighting and angle as last time
        if you can. <strong style={{color:"var(--text)"}}>Optional</strong> — skip if you&apos;d rather not this round.
      </p>
      <PhotoUpload photos={photos} onChange={setPhotos} consent={photoConsent} onConsent={setPhotoConsent}/>
    </div>,

    <div key="se" className="flex flex-col gap-4">
      <p style={{color:"var(--text-soft)",fontSize:"0.9rem"}}>Check any you experienced in the past 2 weeks:</p>
      <div className="flex flex-wrap gap-2">
        {SIDE_EFFECTS.map(s=>(
          <button key={s} type="button" onClick={()=>toggleSE(s)} style={{
            padding:"0.4rem 0.9rem",borderRadius:"var(--radius)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",
            background:data.sideEffects.includes(s)?"var(--gold)":"var(--surface-2)",
            color:data.sideEffects.includes(s)?"#000":"var(--text-soft)",
            border:`1px solid ${data.sideEffects.includes(s)?"var(--gold)":"var(--border)"}`
          }}>{s}</button>
        ))}
      </div>
      {data.sideEffects.includes("Other")&&(
        <div>
          <label>Describe other side effects</label>
          <textarea rows={2} placeholder="Describe what you experienced..." value={data.sideEffectsOther} onChange={set("sideEffectsOther")}/>
        </div>
      )}
    </div>,

    <div key="adh" className="flex flex-col gap-4">
      <div>
        <label>Missed doses in past 2 weeks</label>
        <select value={data.missedDoses} onChange={set("missedDoses")}>
          <option value="0">0 — perfect adherence</option>
          <option value="1">1 dose</option>
          <option value="2">2 doses</option>
          <option value="3">3+ doses</option>
        </select>
      </div>
      {data.missedDoses!=="0"&&(
        <div><label>Reason for missed doses</label><textarea rows={2} value={data.reason} onChange={set("reason")}/></div>
      )}
      <label style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",cursor:"pointer",marginTop:"1rem"}}>
        <input type="checkbox" checked={data.urgentFlag} onChange={set("urgentFlag")}
          style={{width:"auto",accentColor:"red",marginTop:"0.2rem"}}/>
        <span style={{fontSize:"0.9rem",lineHeight:1.6}}>
          <span style={{color:"#f87171",fontWeight:700}}>Request urgent follow-up</span> — I have a concern that needs prompt attention.
        </span>
      </label>
    </div>,

    <div key="notes">
      <label>Anything else to share with your coach?</label>
      <textarea rows={5} placeholder="Changes in lifestyle, observations, questions..." value={data.notes} onChange={set("notes")}/>
    </div>
  ]

  if (submitted) return (
    <>
      <Nav/>
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} style={{color:"var(--gold)",margin:"0 auto 1.5rem"}}/>
        <h1 style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:"2rem"}}>Check-In Submitted</h1>
        <p style={{color:"var(--text-soft)",marginTop:"1rem",lineHeight:1.7}}>
          Your 2-week check-in has been received. Richard will review it and follow up within 24 hours.
        </p>
        <a href="/" className="btn-gold" style={{display:"inline-block",marginTop:"1.5rem"}}>Done</a>
      </div>
      <Footer/>
    </>
  )

  return (
    <>
      <Nav/>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:"2rem",letterSpacing:"-0.02em"}}>2-Week Check-In</h1>
        <p style={{color:"var(--text-soft)",fontSize:"0.9rem",marginTop:"0.5rem"}}>Step {step+1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>
        <div style={{height:3,background:"var(--surface)",borderRadius:2,margin:"1.25rem 0 2rem"}}>
          <div style={{height:"100%",background:"var(--gold)",borderRadius:2,width:`${((step+1)/STEPS.length)*100}%`,transition:"width 0.3s"}}/>
        </div>
        <div className="card">
          {steps[step]}
          <div className="flex justify-between mt-8">
            <button className="btn-outline" onClick={()=>setStep(p=>p-1)} disabled={step===0}
              style={{display:"flex",alignItems:"center",gap:"0.35rem",opacity:step===0?0.3:1}}>
              <ChevronLeft size={15}/> Back
            </button>
            {step<STEPS.length-1
              ?<button className="btn-gold" onClick={()=>setStep(p=>p+1)} disabled={!canAdvance}
                style={{display:"flex",alignItems:"center",gap:"0.35rem",opacity:canAdvance?1:0.4}}>
                Next <ChevronRight size={15}/>
              </button>
              :<button className="btn-gold" onClick={submit}>Submit Check-In</button>
            }
          </div>
        </div>
      </div>
      <Footer/>
    </>
  )
}
