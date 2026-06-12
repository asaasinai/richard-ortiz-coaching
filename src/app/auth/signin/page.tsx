"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn("email", { email, callbackUrl: "/dashboard" })
    setSent(true)
  }
  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <div className="card" style={{ maxWidth:400,width:"100%" }}>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.5rem",marginBottom:"0.5rem" }}>Client Login</h1>
        <p style={{ color:"var(--text-mute)",fontSize:"0.875rem",marginBottom:"1.5rem" }}>Enter your email and we will send a magic link.</p>
        {sent ? (
          <p style={{ color:"var(--gold)",fontWeight:600 }}>Check your email for a login link.</p>
        ) : (
          <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
            <div><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <button type="submit" className="btn-gold">Send Login Link</button>
          </form>
        )}
      </div>
    </div>
  )
}
