"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
      <div className="card" style={{ maxWidth:360,width:"100%" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1.5rem" }}>
          <Lock size={18} style={{ color:"var(--gold)" }} />
          <span style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.1rem" }}>Admin Access</span>
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
          {error && <p style={{ color:"#f87171",fontSize:"0.85rem" }}>Incorrect password.</p>}
          <button type="submit" className="btn-gold">Enter Dashboard</button>
        </form>
      </div>
    </div>
  )
}
