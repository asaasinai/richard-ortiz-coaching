"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { MessageSquare } from "lucide-react"

export default function ContactPage() {
  const [data, setData] = useState({ name:"", email:"", message:"" })
  const [sent, setSent] = useState(false)
  const set = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setData(p => ({ ...p, [k]: e.target.value }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) })
    setSent(true)
  }
  return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-24 reveal">
        <h1 style={{ fontFamily:"var(--font-display)",fontWeight:700,fontSize:"clamp(2.4rem,5.5vw,3.4rem)",letterSpacing:"-0.035em",lineHeight:1.05 }}>Get In <span className="gold-text">Touch</span></h1>
        <p style={{ color:"var(--text-soft)",fontSize:"1.1rem",marginTop:"1rem",marginBottom:"2.75rem" }}>Questions before starting? Use the form below.</p>
        <div style={{ marginBottom:"2rem" }}>
          <div className="card" style={{ display:"flex",gap:"1rem",alignItems:"center" }}>
            <span style={{ width:44,height:44,borderRadius:13,background:"var(--gold-dim)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <MessageSquare size={20} style={{ color:"var(--gold)" }} />
            </span>
            <div><div style={{ fontSize:"0.7rem",color:"var(--text-mute)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600 }}>Response Time</div>
            <span style={{ color:"var(--text)",fontWeight:600,fontSize:"0.95rem" }}>Within 48 hours</span></div>
          </div>
        </div>
        {sent ? (
          <div className="card" style={{ position:"relative",overflow:"hidden",textAlign:"center",padding:"3.5rem 2rem",boxShadow:"var(--glow-gold)",borderColor:"rgba(212,175,90,0.3)" }}>
            <div style={{ position:"absolute",top:-50,left:"50%",transform:"translateX(-50%)",width:240,height:160,background:"radial-gradient(circle, rgba(212,175,90,0.16), transparent 70%)",pointerEvents:"none" }} />
            <p className="gold-text" style={{ fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.3rem",position:"relative" }}>Message sent ✓</p>
            <p style={{ color:"var(--text-soft)",marginTop:"0.5rem",position:"relative" }}>Richard will get back to you within 48 hours.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="card flex flex-col gap-4">
            <div><label>Name</label><input name="name" required value={data.name} onChange={set("name")} /></div>
            <div><label>Email</label><input name="email" type="email" required value={data.email} onChange={set("email")} /></div>
            <div><label>Message</label><textarea name="message" rows={5} required value={data.message} onChange={set("message")} /></div>
            <button type="submit" className="btn-gold" style={{ alignSelf:"flex-start" }}>Send Message</button>
          </form>
        )}
      </div>
      <Footer />
    </>
  )
}