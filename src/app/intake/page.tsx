"use client"
import { useState, useCallback } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react"
import PhotoUpload, { EMPTY_PHOTOS, type PhotoSet } from "@/components/PhotoUpload"

// ─── Question definitions ─────────────────────────────────────────────────────

type Option = { label: string; value: string }

interface SingleQuestion {
  kind: "single"
  id: string; num: number; text: string; options: Option[]
}
interface MultiQuestion {
  kind: "multi"
  id: string; num: number; text: string; options: Option[]
}
interface ConditionalQuestion {
  kind: "conditional"
  id: string; num: number; text: string; options: Option[]
  followUpId: string; followUpTrigger: string; followUpText: string; followUpOptions: Option[]
}

type Question = SingleQuestion | MultiQuestion | ConditionalQuestion

// Questions 3, 4, 10 are multi-select
const QUESTIONS: Question[] = [
  {
    kind: "single",
    id: "ageRange",
    num: 1,
    text: "What is your age range?",
    options: [
      { label: "20–29", value: "20-29" },
      { label: "30–39", value: "30-39" },
      { label: "40–49", value: "40-49" },
      { label: "50–59", value: "50-59" },
      { label: "60+",   value: "60+" },
    ],
  },
  {
    kind: "single",
    id: "gender",
    num: 2,
    text: "Gender",
    options: [
      { label: "Male",   value: "male" },
      { label: "Female", value: "female" },
    ],
  },
  {
    kind: "multi",
    id: "primaryGoal",
    num: 3,
    text: "What are your primary goals?",
    options: [
      { label: "Fat loss",               value: "fat-loss" },
      { label: "Muscle / strength",      value: "muscle-strength" },
      { label: "Energy & focus",         value: "energy-focus" },
      { label: "Longevity / anti-aging", value: "longevity" },
      { label: "Hormone balance",        value: "hormone-balance" },
      { label: "Combination",            value: "combination" },
    ],
  },
  {
    kind: "multi",
    id: "biggestStruggle",
    num: 4,
    text: "What are your biggest struggles?",
    options: [
      { label: "Hunger / cravings",       value: "hunger-cravings" },
      { label: "Lack of consistency",     value: "consistency" },
      { label: "Low energy / motivation", value: "low-energy" },
      { label: "Confusing info",          value: "confusing-info" },
      { label: "Plateau",                 value: "plateau" },
      { label: "Time / busy schedule",    value: "time" },
    ],
  },
  {
    kind: "single",
    id: "trainingExperience",
    num: 5,
    text: "What is your training experience?",
    options: [
      { label: "New",        value: "new" },
      { label: "On & off",   value: "on-off" },
      { label: "Consistent", value: "consistent" },
    ],
  },
  {
    kind: "conditional",
    id: "currentlyTrains",
    num: 6,
    text: "Do you currently train?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no" },
    ],
    followUpId: "trainingDays",
    followUpTrigger: "yes",
    followUpText: "How many days per week?",
    followUpOptions: [
      { label: "1–2 days", value: "1-2" },
      { label: "3–4 days", value: "3-4" },
      { label: "5+ days",  value: "5+" },
    ],
  },
  {
    kind: "single",
    id: "injuries",
    num: 7,
    text: "Any injuries or medical considerations?",
    options: [
      { label: "None",                value: "none" },
      { label: "Yes (we'll discuss)", value: "yes" },
    ],
  },
  {
    kind: "single",
    id: "optimizationTools",
    num: 8,
    text: "Interest in optimization tools (recovery, peptides, GLP-1s)?",
    options: [
      { label: "Already using",      value: "already-using" },
      { label: "Interested",         value: "interested" },
      { label: "Curious but unsure", value: "curious" },
      { label: "Not right now",      value: "not-now" },
    ],
  },
  {
    kind: "single",
    id: "commitmentLevel",
    num: 9,
    text: "What is your commitment level?",
    options: [
      { label: "5–6 out of 10",  value: "5-6" },
      { label: "7–8 out of 10",  value: "7-8" },
      { label: "9–10 out of 10", value: "9-10" },
    ],
  },
  {
    kind: "multi",
    id: "whyNow",
    num: 10,
    text: "Why now?",
    options: [
      { label: "Health wake-up call",    value: "health-wakeup" },
      { label: "Physical appearance",    value: "appearance" },
      { label: "Energy / performance",   value: "energy-performance" },
      { label: "Aging concerns",         value: "aging" },
      { label: "Life event or deadline", value: "life-event" },
    ],
  },
]

const MULTI_IDS = new Set(QUESTIONS.filter(q => q.kind === "multi").map(q => q.id))

// ─── State types ──────────────────────────────────────────────────────────────

// single-select → string, multi-select → string[]
type Answers = Record<string, string | string[]>

function buildSteps(answers: Answers): Array<{ questionIdx: number; isFollowUp?: boolean }> {
  const steps: Array<{ questionIdx: number; isFollowUp?: boolean }> = []
  QUESTIONS.forEach((q, idx) => {
    steps.push({ questionIdx: idx })
    const cq = q as ConditionalQuestion
    if (cq.followUpId && answers[q.id] === cq.followUpTrigger) {
      steps.push({ questionIdx: idx, isFollowUp: true })
    }
  })
  return steps
}

const STATS_STEP = "stats" as const
const PHOTO_STEP = "photos" as const
const CONTACT_STEP = "contact" as const
type StepDef = { questionIdx: number; isFollowUp?: boolean } | typeof STATS_STEP | typeof PHOTO_STEP | typeof CONTACT_STEP

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntakePage() {
  const [answers, setAnswers] = useState<Answers>({})
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [stats, setStats] = useState({ currentWeight: "", goalWeight: "", heightFt: "", heightIn: "", bodyFat: "" })
  const [photos, setPhotos] = useState<PhotoSet>(EMPTY_PHOTOS)
  const [photoConsent, setPhotoConsent] = useState(false)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const quizSteps = buildSteps(answers)
  const allSteps: StepDef[] = [...quizSteps, STATS_STEP, PHOTO_STEP, CONTACT_STEP]
  const totalSteps = allSteps.length
  const currentStepDef = allSteps[step]

  const pickSingle = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }, [])

  const toggleMulti = useCallback((id: string, value: string) => {
    setAnswers(prev => {
      const cur = (prev[id] as string[] | undefined) ?? []
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]
      return { ...prev, [id]: next }
    })
  }, [])

  const canAdvance = (): boolean => {
    if (currentStepDef === STATS_STEP) {
      const num = (s: string) => s.trim() !== "" && !isNaN(Number(s)) && Number(s) > 0
      return num(stats.currentWeight) && num(stats.goalWeight) && num(stats.heightFt) // body fat optional
    }
    if (currentStepDef === PHOTO_STEP) return true // photos are optional
    if (currentStepDef === CONTACT_STEP) {
      return contact.firstName.trim() !== "" && contact.email.trim() !== ""
    }
    const { questionIdx, isFollowUp } = currentStepDef as { questionIdx: number; isFollowUp?: boolean }
    const q = QUESTIONS[questionIdx]
    if (isFollowUp) {
      const cq = q as ConditionalQuestion
      return !!(answers[cq.followUpId] as string | undefined)
    }
    if (q.kind === "multi") {
      const sel = (answers[q.id] as string[] | undefined) ?? []
      return sel.length > 0
    }
    return !!(answers[q.id] as string | undefined)
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      const freshSteps: StepDef[] = [...buildSteps(answers), STATS_STEP, PHOTO_STEP, CONTACT_STEP]
      const nextStep = step + 1
      if (nextStep < freshSteps.length) setStep(nextStep)
    }
  }

  const handleBack = () => { if (step > 0) setStep(s => s - 1) }

  const submit = async () => {
    setSaving(true)
    // Flatten multi arrays to comma-joined strings for storage compatibility
    const flatAnswers: Record<string, string> = {}
    for (const [k, v] of Object.entries(answers)) {
      flatAnswers[k] = Array.isArray(v) ? v.join(", ") : v
    }
    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        ...flatAnswers,
        rawAnswers: answers,
        currentWeight: stats.currentWeight,
        goalWeight: stats.goalWeight,
        height: stats.heightFt ? `${stats.heightFt}'${stats.heightIn || 0}"` : "",
        bodyFat: stats.bodyFat,
        photos,
        photoConsent,
      }),
    })
    setSaving(false)
    setSubmitted(true)
  }

  // ── Submitted ───────────────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <Nav />
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div className="reveal" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 76, height: 76, borderRadius: "50%",
            background: "var(--gold-grad)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1.75rem",
            boxShadow: "0 0 0 8px rgba(212,175,90,0.1), 0 14px 40px rgba(212,175,90,0.3)",
          }}>
            <CheckCircle size={38} color="#1A1400" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.9rem,4.5vw,2.6rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            You&apos;re <span className="gold-text">on deck.</span>
          </h1>
          <p style={{ color: "var(--text-soft)", marginTop: "1rem", lineHeight: 1.75, fontSize: "1rem" }}>
            Richard will review your intake within 48 hours and reach out to schedule your initial consult.
            Check your email for a confirmation.
          </p>
          <a href="/" className="btn-gold" style={{ display: "inline-block", marginTop: "2rem" }}>
            Back to Home
          </a>
        </div>
      </div>
      <Footer />
    </>
  )

  const progress = ((step + 1) / totalSteps) * 100

  // ── Current question ────────────────────────────────────────────────────────
  function renderQuestion() {
    if (currentStepDef === STATS_STEP) {
      const setStat = (k: keyof typeof stats) => (v: string) => setStats(p => ({ ...p, [k]: v }))
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            These numbers set your baseline so your protocol targets real, measurable progress.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <ContactField label="Current Weight (lbs) *" id="currentWeight" type="number" value={stats.currentWeight} onChange={setStat("currentWeight")} />
            <ContactField label="Goal Weight (lbs) *" id="goalWeight" type="number" value={stats.goalWeight} onChange={setStat("goalWeight")} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Height *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.35rem" }}>
              <input id="heightFt" type="number" placeholder="ft" min={3} max={8} value={stats.heightFt}
                data-1p-ignore data-lpignore="true" data-form-type="other"
                onChange={e => setStat("heightFt")(e.target.value)} />
              <input id="heightIn" type="number" placeholder="in" min={0} max={11} value={stats.heightIn}
                data-1p-ignore data-lpignore="true" data-form-type="other"
                onChange={e => setStat("heightIn")(e.target.value)} />
            </div>
          </div>
          <ContactField label="Body Fat % (optional)" id="bodyFat" type="number" value={stats.bodyFat} onChange={setStat("bodyFat")} />
        </div>
      )
    }
    if (currentStepDef === PHOTO_STEP) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Baseline photos help your coach measure real progress. Take them in good lighting —
            front, side, and back. <strong style={{ color: "var(--text)" }}>Optional</strong> — you can skip
            this step and add them later.
          </p>
          <PhotoUpload photos={photos} onChange={setPhotos} consent={photoConsent} onConsent={setPhotoConsent} />
        </div>
      )
    }
    if (currentStepDef === CONTACT_STEP) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Almost done — just need a way to reach you.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <ContactField label="First Name *" id="firstName" value={contact.firstName}
              onChange={v => setContact(p => ({ ...p, firstName: v }))} autoComplete="given-name" />
            <ContactField label="Last Name" id="lastName" value={contact.lastName}
              onChange={v => setContact(p => ({ ...p, lastName: v }))} autoComplete="family-name" />
          </div>
          <ContactField label="Email *" id="email" type="email" value={contact.email}
            onChange={v => setContact(p => ({ ...p, email: v }))} autoComplete="email" />
          <ContactField label="Phone" id="phone" type="tel" value={contact.phone}
            onChange={v => setContact(p => ({ ...p, phone: v }))} autoComplete="tel" />
        </div>
      )
    }

    const { questionIdx, isFollowUp } = currentStepDef as { questionIdx: number; isFollowUp?: boolean }
    const q = QUESTIONS[questionIdx]

    if (isFollowUp) {
      const cq = q as ConditionalQuestion
      return (
        <OptionGrid
          options={cq.followUpOptions}
          selected={answers[cq.followUpId] as string | undefined}
          onSelect={v => pickSingle(cq.followUpId, v)}
          multi={false}
        />
      )
    }

    if (q.kind === "multi") {
      return (
        <OptionGrid
          options={q.options}
          selectedMany={(answers[q.id] as string[] | undefined) ?? []}
          onToggle={v => toggleMulti(q.id, v)}
          multi={true}
        />
      )
    }

    return (
      <OptionGrid
        options={q.options}
        selected={answers[q.id] as string | undefined}
        onSelect={v => pickSingle(q.id, v)}
        multi={false}
      />
    )
  }

  function renderQuestionLabel() {
    if (currentStepDef === STATS_STEP) {
      return (
        <span style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Your Stats
        </span>
      )
    }
    if (currentStepDef === PHOTO_STEP) {
      return (
        <span style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Progress Photos <span style={{ color: "var(--text-mute)", fontWeight: 600 }}>· Optional</span>
        </span>
      )
    }
    if (currentStepDef === CONTACT_STEP) {
      return (
        <span style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Contact Info
        </span>
      )
    }
    const { questionIdx, isFollowUp } = currentStepDef as { questionIdx: number; isFollowUp?: boolean }
    const q = QUESTIONS[questionIdx]
    const cq = q as ConditionalQuestion
    const num = isFollowUp ? `${q.num}b` : `${q.num}`
    const text = isFollowUp ? cq.followUpText : q.text
    const isMulti = !isFollowUp && q.kind === "multi"
    return (
      <>
        <span style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Question {num} / {QUESTIONS.length}
        </span>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.25rem,3.5vw,1.6rem)", letterSpacing: "-0.02em", marginTop: "0.4rem", lineHeight: 1.25 }}>
          {text}
        </h2>
        {isMulti && (
          <p style={{ color: "var(--text-mute)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
            Select all that apply
          </p>
        )}
      </>
    )
  }

  const isLastStep = step === totalSteps - 1
  const ready = canAdvance()

  return (
    <>
      <Nav />

      {/* Hero strip */}
      <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.012), transparent)", borderBottom: "1px solid var(--border)", padding: "3.5rem 1.5rem 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.9rem,4.5vw,2.6rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Start Your <span className="gold-text">Intake</span>
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.98rem", marginTop: "0.5rem" }}>
            10 quick questions — takes under 2 minutes.
          </p>
          <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 4, margin: "1.5rem 0 0", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--gold-grad)", borderRadius: 4, width: `${progress}%`, transition: "width 0.35s ease", boxShadow: "0 0 12px rgba(212,175,90,0.5)" }} />
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <div className="card" style={{ padding: "clamp(1.25rem, 4vw, 2rem)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            {renderQuestionLabel()}
          </div>

          {renderQuestion()}

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", gap: "0.75rem" }}>
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", opacity: step === 0 ? 0.3 : 1, minWidth: 80 }}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {isLastStep ? (
              <button
                onClick={submit}
                disabled={!ready || saving}
                className="btn-gold"
                style={{ opacity: (!ready || saving) ? 0.5 : 1, minWidth: 140 }}
              >
                {saving ? "Submitting…" : "Submit Intake"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!ready}
                className="btn-gold"
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", opacity: ready ? 1 : 0.45, minWidth: 100 }}
              >
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          {allSteps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= step ? "var(--gold-grad)" : "var(--surface-2)",
              transition: "all 0.25s ease",
              opacity: i > step ? 0.5 : 1,
            }} />
          ))}
        </div>
      </div>

      <Footer />
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type OptionGridProps =
  | { multi: false; options: Option[]; selected: string | undefined; onSelect: (v: string) => void; selectedMany?: never; onToggle?: never }
  | { multi: true;  options: Option[]; selectedMany: string[];        onToggle: (v: string) => void; selected?: never;  onSelect?: never }

function OptionGrid(props: OptionGridProps) {
  const { options, multi } = props
  const isTwoCol = options.length >= 4

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isTwoCol ? "repeat(auto-fit, minmax(min(100%,200px), 1fr))" : "1fr",
      gap: "0.6rem",
    }}>
      {options.map(opt => {
        const active = multi
          ? props.selectedMany.includes(opt.value)
          : props.selected === opt.value

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => multi ? props.onToggle(opt.value) : props.onSelect(opt.value)}
            style={{
              padding: "0.85rem 1.1rem",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${active ? "rgba(212,175,90,0.55)" : "var(--border)"}`,
              background: active ? "var(--gold-dim)" : "var(--surface-2)",
              color: active ? "var(--gold-light)" : "var(--text-soft)",
              fontWeight: active ? 700 : 500,
              fontSize: "0.92rem",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              boxShadow: active ? "0 0 0 1px rgba(212,175,90,0.15)" : "none",
              transition: "all 0.15s ease",
              width: "100%",
            }}
          >
            {/* Radio circle for single, checkbox square for multi */}
            {multi ? (
              <span style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${active ? "var(--gold)" : "var(--border)"}`,
                background: active ? "var(--gold)" : "transparent",
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
            ) : (
              <span style={{
                width: 18, height: 18, borderRadius: "50%",
                border: `2px solid ${active ? "var(--gold)" : "var(--border)"}`,
                background: active ? "var(--gold)" : "transparent",
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
              </span>
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ContactField({ label, id, type = "text", value, onChange, autoComplete }: {
  label: string; id: string; type?: string; value: string
  onChange: (v: string) => void; autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input
        id={id} name={id} type={type}
        value={value}
        autoComplete={autoComplete}
        // Stop password managers (1Password/LastPass) + Chrome saved-credential
        // autofill from injecting an overlay on this passwordless contact form.
        data-1p-ignore data-lpignore="true" data-form-type="other"
        onChange={e => onChange(e.target.value)}
        style={{ marginTop: "0.35rem" }}
      />
    </div>
  )
}
