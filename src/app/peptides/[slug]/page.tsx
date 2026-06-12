"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Nav from "@/components/Nav"

export default function PeptideDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  useEffect(() => {
    window.location.href = `https://thepeptidepedia.com/peptides/${params.slug}`
  }, [params.slug])
  return (
    <>
      <Nav/>
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p style={{color:"var(--text-mute)"}}>Redirecting to PeptidePedia...</p>
      </div>
    </>
  )
}
