"use client"
import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-fill email from URL param (e.g. from /checkin redirect)
  useEffect(() => {
    const e = params.get("email")
    if (e) setEmail(e)
  }, [params])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      sessionStorage.setItem("roc_dashboard_email", email)
      sessionStorage.setItem("roc_dashboard_name", data.name ?? "")
      router.push("/dashboard")
    } else {
      setError(data.error ?? "Invalid email or password.")
    }
  }

  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <span className="section-num">— Login</span>
        <h1 style={{ fontFamily:"Inter Tight,sans-serif", fontWeight:900, fontSize:"2rem", letterSpacing:"-0.02em", marginBottom:"0.5rem" }}>
          Client Login
        </h1>
        <p style={{ color:"var(--text-mute)", fontSize:"0.875rem", marginBottom:"1.75rem", lineHeight:1.6 }}>
          Sign in to view your protocols, progress, and check-in history.
        </p>
        <div className="card">
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && (
              <p style={{ color:"#f87171", fontSize:"0.85rem", margin:0 }}>{error}</p>
            )}
            <button type="submit" className="btn-gold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <>
      <Nav/>
      <Suspense>
        <SignInForm/>
      </Suspense>
      <Footer/>
    </>
  )
}
