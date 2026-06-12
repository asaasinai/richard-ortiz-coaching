"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Mail, MessageSquare } from "lucide-react"

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
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"2.5rem",letterSpacing:"-0.03em" }}>Get In Touch</h1>
        <p style={{ color:"var(--text-soft)",marginTop:"0.75rem",marginBottom:"2.5rem" }}>Questions before starting? Use the form below or email directly.</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"2rem" }}>
          <div className="card" style={{ display:"flex",gap:"1rem",alignItems:"center" }}>
            <Mail size={20} style={{ color:"var(--gold)" }} />
            <div><div style={{ fontSize:"0.75rem",color:"var(--text-mute)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Email</div>
            <a href="mailto:richard@richardortizcoaching.com" style={{ color:"var(--text)",fontWeight:600,fontSize:"0.9rem" }}>richard@richardortizcoaching.com</a></div>
          </div>
          <div className="card" style={{ display:"flex",gap:"1rem",alignItems:"center" }}>
            <MessageSquare size={20} style={{ color:"var(--gold)" }} />
            <div><div style={{ fontSize:"0.75rem",color:"var(--text-mute)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Response Time</div>
            <span style={{ color:"var(--text)",fontWeight:600,fontSize:"0.9rem" }}>Within 48 hours</span></div>
          </div>
        </div>
        {sent ? (
          <div className="card" style={{ textAlign:"center",padding:"3rem" }}>
            <p style={{ color:"var(--gold)",fontWeight:700,fontSize:"1.1rem" }}>Message sent ✓</p>
            <p style={{ color:"var(--text-soft)",marginTop:"0.5rem" }}>Richard will get back to you within 48 hours.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="card flex flex-col gap-4">
            <div><label>Name</label><input required value={data.name} onChange={set("name")} /></div>
            <div><label>Email</label><input type="email" required value={data.email} onChange={set("email")} /></div>
            <div><label>Message</label><textarea rows={5} required value={data.message} onChange={set("message")} /></div>
            <button type="submit" className="btn-gold" style={{ alignSelf:"flex-start" }}>Send Message</button>
          </form>
        )}
      </div>
      <Footer />
    </>
  )
}