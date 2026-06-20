"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock } from "lucide-react"

export default function AdminLoginPage() {
  const [pass, setPass] = useState("")
  const [error, setError] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    })
    if (res.ok) {
      router.push("/admin")
      router.refresh()
    } else {
      setError(true)
      setPass("")
    }
  }

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <div className="card" style={{ maxWidth:380,width:"100%" }}>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",marginBottom:"1.75rem" }}>
          <div style={{ width:52,height:52,borderRadius:16,background:"var(--gold-dim)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem" }}>
            <Lock size={22} style={{ color:"var(--gold)" }} />
          </div>
          <span style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.01em" }}>Welcome back</span>
          <span style={{ color:"var(--text-mute)",fontSize:"0.85rem",marginTop:"0.3rem" }}>Sign in to your coaching dashboard.</span>
        </div>
        <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false) }}
              autoFocus
              placeholder="Enter admin password"
            />
          </div>
          {error && <p style={{ color:"var(--bad)",fontSize:"0.85rem" }}>Incorrect password. Try again.</p>}
          <button type="submit" className="btn-gold" style={{ justifyContent:"center" }}>Enter dashboard</button>
        </form>
        <div style={{ textAlign:"center",marginTop:"1.25rem" }}>
          <Link href="/" style={{ color:"var(--text-mute)",fontSize:"0.8rem",textDecoration:"none" }}>← Back to site</Link>
        </div>
      </div>
    </div>
  )
}
