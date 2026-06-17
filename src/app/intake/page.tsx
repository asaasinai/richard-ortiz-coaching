"use client"
import { useState, useCallback } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react"

// ─── Question definitions ─────────────────────────────────────────────────────

type Option = { label: string; value: string }
type Question =
  | { kind: "single"; id: string; num: number; text: string; options: Option[] }
  | { kind: "conditional"; id: string; num: number; text: string; options: Option[]; followUpId: string; followUpTrigger: string; followUpText: string; followUpOptions: Option[] }
  | { kind: "single"; id: string; num: number; text: string; options: Option[] }

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
    kind: "single",
    id: "primaryGoal",
    num: 3,
    text: "What is your primary goal?",
    options: [
      { label: "Fat loss",             value: "fat-loss" },
      { label: "Muscle / strength",    value: "muscle-strength" },
      { label: "Energy & focus",       value: "energy-focus" },
      { label: "Longevity / anti-aging", value: "longevity" },
      { label: "Hormone balance",      value: "hormone-balance" },
      { label: "Combination",          value: "combination" },
    ],
  },
  {
    kind: "single",
    id: "biggestStruggle",
    num: 4,
    text: "What's your biggest struggle?",
    options: [
      { label: "Hunger / cravings",      value: "hunger-cravings" },
      { label: "Lack of consistency",    value: "consistency" },
      { label: "Low energy / motivation", value: "low-energy" },
      { label: "Confusing info",         value: "confusing-info" },
      { label: "Plateau",                value: "plateau" },
      { label: "Time / busy schedule",   value: "time" },
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
  } as unknown as Question,
  {
    kind: "single",
    id: "injuries",
    num: 7,
    text: "Any injuries or medical considerations?",
    options: [
      { label: "None",               value: "none" },
      { label: "Yes (we'll discuss)", value: "yes" },
    ],
  },
  {
    kind: "single",
    id: "optimizationTools",
    num: 8,
    text: "Interest in optimization tools (recovery, peptides, GLP-1s)?",
    options: [
      { label: "Already using",     value: "already-using" },
      { label: "Interested",        value: "interested" },
      { label: "Curious but unsure", value: "curious" },
      { label: "Not right now",     value: "not-now" },
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
    kind: "single",
    id: "whyNow",
    num: 10,
    text: "Why now?",
    options: [
      { label: "Health wake-up call",     value: "health-wakeup" },
      { label: "Physical appearance",     value: "appearance" },
      { label: "Energy / performance",    value: "energy-performance" },
      { label: "Aging concerns",          value: "aging" },
      { label: "Life event or deadline",  value: "life-event" },
    ],
  },
]

// Build flat step list: each question is a step; Q6 injects a follow-up step if "yes"
function buildSteps(answers: Record<string, string>): Array<{ questionIdx: number; isFollowUp?: boolean }> {
  const steps: Array<{ questionIdx: number; isFollowUp?: boolean }> = []
  QUESTIONS.forEach((q, idx) => {
    steps.push({ questionIdx: idx })
    if ((q as any).followUpId && answers[q.id] === (q as any).followUpTrigger) {
      steps.push({ questionIdx: idx, isFollowUp: true })
    }
  })
  // Contact info is the final step
  return steps
}

const CONTACT_STEP = "contact"

type StepDef = { questionIdx: number; isFollowUp?: boolean } | typeof CONTACT_STEP

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntakePage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Steps = all questions + contact at end
  const quizSteps = buildSteps(answers)
  const allSteps: StepDef[] = [...quizSteps, CONTACT_STEP]
  const totalSteps = allSteps.length
  const currentStepDef = allSteps[step]

  // Rebuild steps whenever answers change so Q6 follow-up appears/disappears
  // (step index stays valid because we never remove a step the user is currently on)

  const pickAnswer = useCallback((id: string, value: string) => {
    setAnswers(prev => {
      const next = { ...prev, [id]: value }
      return next
    })
  }, [])

  const canAdvance = (): boolean => {
    if (currentStepDef === CONTACT_STEP) {
      return contact.firstName.trim() !== "" && contact.email.trim() !== ""
    }
    const { questionIdx, isFollowUp } = currentStepDef as { questionIdx: number; isFollowUp?: boolean }
    const q = QUESTIONS[questionIdx]
    if (isFollowUp) return !!(answers[(q as any).followUpId])
    return !!answers[q.id]
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      // Recalculate steps with latest answers to handle conditional injection
      const freshSteps: StepDef[] = [...buildSteps(answers), CONTACT_STEP]
      // If next step would be a follow-up but trigger no longer met, skip it
      const nextStep = step + 1
      if (nextStep < freshSteps.length) setStep(nextStep)
    }
  }

  const handleBack = () => { if (step > 0) setStep(s => s - 1) }

  const submit = async () => {
    setSaving(true)
    const payload = { ...contact, answers, submittedAt: new Date().toISOString() }
    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        ...answers,
        rawAnswers: answers,
      }),
    })
    setSaving(false)
    setSubmitted(true)
  }

  // ── Submitted screen ────────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <Nav />
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--gold)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1.5rem",
          }}>
            <CheckCircle size={36} color="#000" />
          </div>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,4vw,2.25rem)", letterSpacing: "-0.02em" }}>
            You&apos;re on deck.
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

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const progress = ((step + 1) / totalSteps) * 100

  // ── Current question render ──────────────────────────────────────────────────
  function renderQuestion() {
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
      const cq = q as any
      return (
        <OptionGrid
          options={cq.followUpOptions}
          selected={answers[cq.followUpId]}
          onSelect={v => pickAnswer(cq.followUpId, v)}
        />
      )
    }

    const cq = q as any
    return (
      <OptionGrid
        options={q.options}
        selected={answers[q.id]}
        onSelect={v => pickAnswer(q.id, v)}
      />
    )
  }

  function renderQuestionLabel() {
    if (currentStepDef === CONTACT_STEP) {
      return <span style={{ color: "var(--gold)", fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Contact Info</span>
    }
    const { questionIdx, isFollowUp } = currentStepDef as { questionIdx: number; isFollowUp?: boolean }
    const q = QUESTIONS[questionIdx]
    const cq = q as any
    const num = isFollowUp ? `${q.num}b` : `${q.num}`
    const text = isFollowUp ? cq.followUpText : q.text
    return (
      <>
        <span style={{ color: "var(--gold)", fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Question {num} / {QUESTIONS.length}
        </span>
        <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(1.25rem,3.5vw,1.6rem)", letterSpacing: "-0.02em", marginTop: "0.4rem", lineHeight: 1.25 }}>
          {text}
        </h2>
      </>
    )
  }

  const isLastStep = step === totalSteps - 1
  const ready = canAdvance()

  return (
    <>
      <Nav />

      {/* Hero strip */}
      <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)", padding: "2.5rem 1.5rem 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,4vw,2.25rem)", letterSpacing: "-0.02em" }}>
            Start Your Intake
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
            10 quick questions — takes under 2 minutes.
          </p>
          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--surface)", borderRadius: 2, margin: "1.25rem 0 0" }}>
            <div style={{ height: "100%", background: "var(--gold)", borderRadius: 2, width: `${progress}%`, transition: "width 0.35s ease" }} />
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
              width: i === step ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: i < step ? "var(--gold)" : i === step ? "var(--gold)" : "var(--surface)",
              transition: "all 0.25s ease",
              opacity: i > step ? 0.4 : 1,
            }} />
          ))}
        </div>
      </div>

      <Footer />
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OptionGrid({ options, selected, onSelect }: {
  options: Option[]
  selected: string | undefined
  onSelect: (v: string) => void
}) {
  const isTwoCol = options.length >= 4
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isTwoCol ? "repeat(auto-fit, minmax(min(100%,200px), 1fr))" : "1fr",
      gap: "0.6rem",
    }}>
      {options.map(opt => {
        const active = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius)",
              border: `1.5px solid ${active ? "var(--gold)" : "var(--border)"}`,
              background: active ? "rgba(201,168,76,0.12)" : "var(--surface)",
              color: active ? "var(--gold)" : "var(--text-soft)",
              fontWeight: active ? 700 : 500,
              fontSize: "0.9rem",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "all 0.15s ease",
              width: "100%",
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${active ? "var(--gold)" : "var(--border)"}`,
              background: active ? "var(--gold)" : "transparent",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
            </span>
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
        onChange={e => onChange(e.target.value)}
        style={{ marginTop: "0.35rem" }}
      />
    </div>
  )
}
