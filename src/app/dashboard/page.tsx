"use client"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import Link from "next/link"
import { FileText, Activity, Download, Calendar, Lock } from "lucide-react"

const cards = [
  { icon: FileText, title: "My Protocols",      desc: "View your assigned peptide protocols and reconstitution instructions.", href: "/protocols" },
  { icon: Activity, title: "Check-In History",  desc: "Review your past 2-week progress submissions.", href: "/checkin" },
  { icon: Download, title: "PDF Downloads",     desc: "Access your personalized dosage calculation cards.", href: "/calculator" },
  { icon: Calendar, title: "Book a Session",    desc: "Schedule your next coaching call with Richard.", href: "/contact" },
]

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <span className="section-num">08 — Dashboard</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em" }}>
          Client Dashboard
        </h1>
        <div style={{ background:"rgba(201,168,76,0.08)",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:"1rem 1.25rem",marginTop:"1.5rem",display:"flex",gap:"0.75rem",alignItems:"center" }}>
          <Lock size={16} style={{ color:"var(--gold)" }} />
          <span style={{ color:"var(--text-soft)",fontSize:"0.9rem" }}>
            Authentication coming soon. Your coach will send you a login link after intake approval.
          </span>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginTop:"2.5rem" }}>
          {cards.map(item => (
            <Link key={item.title} href={item.href} style={{ textDecoration:"none" }}>
              <div className="card" style={{ cursor:"pointer" }}>
                <item.icon size={20} style={{ color:"var(--gold)",marginBottom:"0.75rem" }} />
                <h3 style={{ fontWeight:700,marginBottom:"0.4rem" }}>{item.title}</h3>
                <p style={{ color:"var(--text-mute)",fontSize:"0.875rem",lineHeight:1.65 }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
