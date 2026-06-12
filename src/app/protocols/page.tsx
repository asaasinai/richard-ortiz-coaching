import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { Download } from "lucide-react"

const protocols = [
  {
    peptide: "BPC-157",
    slug: "bpc-157",
    conservative: { dose: "250 mcg", freq: "Once daily", duration: "4 weeks" },
    moderate:     { dose: "500 mcg", freq: "Once daily", duration: "6 weeks" },
    liberal:      { dose: "1000 mcg", freq: "Once daily", duration: "8 weeks" },
    reconstitution: "Add 2 mL bacteriostatic water to 5 mg vial → 2500 mcg/mL",
    supplies: "5 mg vial, 2 mL BAC water, 1 mL insulin syringe (100U), alcohol swabs",
  },
  {
    peptide: "Ipamorelin",
    slug: "ipamorelin",
    conservative: { dose: "100 mcg", freq: "3× weekly, pre-bed", duration: "8 weeks" },
    moderate:     { dose: "200 mcg", freq: "5× weekly, pre-bed", duration: "12 weeks" },
    liberal:      { dose: "300 mcg", freq: "Daily, pre-bed", duration: "16 weeks" },
    reconstitution: "Add 2 mL BAC water to 5 mg vial → 2500 mcg/mL",
    supplies: "5 mg vial, 2 mL BAC water, insulin syringe, alcohol swabs",
  },
  {
    peptide: "Semaglutide",
    slug: "semaglutide",
    conservative: { dose: "0.25 mg", freq: "Weekly SubQ", duration: "4 weeks (titration)" },
    moderate:     { dose: "0.5–1 mg", freq: "Weekly SubQ", duration: "12 weeks" },
    liberal:      { dose: "2 mg", freq: "Weekly SubQ", duration: "Ongoing (physician supervised)" },
    reconstitution: "Add 1.5 mL BAC water to 3 mg vial → 2 mg/mL",
    supplies: "3 mg vial, 1.5 mL BAC water, 0.5 mL insulin syringe, alcohol swabs",
  },
  {
    peptide: "TB-500",
    slug: "tb-500",
    conservative: { dose: "2.5 mg", freq: "Weekly SubQ", duration: "4 weeks" },
    moderate:     { dose: "5 mg", freq: "Weekly SubQ", duration: "6 weeks" },
    liberal:      { dose: "7.5 mg", freq: "Twice weekly", duration: "8 weeks" },
    reconstitution: "Add 2 mL BAC water to 10 mg vial → 5 mg/mL",
    supplies: "10 mg vial, 2 mL BAC water, 1 mL syringe, alcohol swabs",
  },
]

const levelStyle = (level: string) => ({
  conservative: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", label: "Conservative", color: "#4ade80" },
  moderate:     { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)", label: "Moderate",     color: "#C9A84C" },
  liberal:      { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",  label: "Liberal",      color: "#f87171" },
}[level] ?? { bg: "", border: "", label: level, color: "#fff" })

export default function ProtocolsPage() {
  return (
    <>
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <span className="section-num">04 — Protocols</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em" }}>Dosage Protocols</h1>
        <p style={{ color:"var(--text-soft)",marginTop:"0.75rem",marginBottom:"3rem",maxWidth:600 }}>
          Conservative / Moderate / Liberal tiers for each peptide. Use the{" "}
          <Link href="/calculator" style={{ color:"var(--gold)" }}>Dosage Calculator</Link> to convert to exact syringe units.
          These are coaching reference protocols — confirm with your physician.
        </p>

        <div className="flex flex-col gap-10">
          {protocols.map(p => (
            <div key={p.slug} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
              <div style={{ borderBottom:"1px solid var(--border)",padding:"1rem 1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <h2 style={{ fontWeight:700,fontSize:"1.1rem" }}>{p.peptide}</h2>
                <div style={{ display:"flex",gap:"0.75rem" }}>
                  <Link href={`/calculator`} style={{ fontSize:"0.75rem",color:"var(--gold)",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                    Open Calculator →
                  </Link>
                  <button style={{ fontSize:"0.75rem",color:"var(--text-mute)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                    <Download size={12}/> PDF
                  </button>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0 }}>
                {(["conservative","moderate","liberal"] as const).map((lvl,i) => {
                  const s = levelStyle(lvl)
                  const d = p[lvl]
                  return (
                    <div key={lvl} style={{ background:s.bg,borderRight: i<2?"1px solid var(--border)":undefined,padding:"1.25rem 1.5rem" }}>
                      <span style={{ fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:s.color }}>{s.label}</span>
                      <div style={{ marginTop:"0.75rem",display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                        <div><span style={{ color:"var(--text-mute)",fontSize:"0.8rem" }}>Dose: </span><span style={{ fontWeight:600,fontSize:"0.9rem" }}>{d.dose}</span></div>
                        <div><span style={{ color:"var(--text-mute)",fontSize:"0.8rem" }}>Frequency: </span><span style={{ fontWeight:600,fontSize:"0.9rem" }}>{d.freq}</span></div>
                        <div><span style={{ color:"var(--text-mute)",fontSize:"0.8rem" }}>Duration: </span><span style={{ fontWeight:600,fontSize:"0.9rem" }}>{d.duration}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ borderTop:"1px solid var(--border)",padding:"1rem 1.5rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                <div><span style={{ fontSize:"0.75rem",color:"var(--gold)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>Reconstitution</span><p style={{ color:"var(--text-soft)",fontSize:"0.85rem",marginTop:"0.3rem" }}>{p.reconstitution}</p></div>
                <div><span style={{ fontSize:"0.75rem",color:"var(--gold)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>Supplies</span><p style={{ color:"var(--text-soft)",fontSize:"0.85rem",marginTop:"0.3rem" }}>{p.supplies}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}