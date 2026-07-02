"use client"
import { useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { Camera, X, Lock } from "lucide-react"

export type PhotoSet = { front: string | null; side: string | null; back: string | null }
export const EMPTY_PHOTOS: PhotoSet = { front: null, side: null, back: null }

const KINDS = [
  { kind: "front" as const, label: "Front" },
  { kind: "side" as const, label: "Side" },
  { kind: "back" as const, label: "Back" },
]

// Downscale to ~1600px JPEG before upload so a 15MB phone original becomes
// ~400KB. If the browser can't decode the format (rare — iOS hands file
// inputs JPEG, not HEIC), fall back to uploading the original; the Blob
// token allows up to 50MB so nothing is rejected for size.
async function compressImage(file: File): Promise<{ blob: Blob; name: string }> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return { blob: file, name: file.name }
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.82))
    return blob ? { blob, name: "photo.jpg" } : { blob: file, name: file.name }
  } catch {
    return { blob: file, name: file.name }
  }
}

export default function PhotoUpload({ photos, onChange, consent, onConsent }: {
  photos: PhotoSet
  onChange: (p: PhotoSet) => void
  consent: boolean
  onConsent: (v: boolean) => void
}) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFile = async (kind: keyof PhotoSet, file: File | undefined) => {
    if (!file) return
    setErrors(p => ({ ...p, [kind]: "" }))
    setUploading(p => ({ ...p, [kind]: true }))
    try {
      const { blob, name } = await compressImage(file)
      const result = await upload(`progress/${kind}-${name}`, blob, {
        access: "public",
        handleUploadUrl: "/api/photos/upload",
        contentType: blob.type || file.type || "image/jpeg",
      })
      onChange({ ...photos, [kind]: result.url })
    } catch (err) {
      console.error("[photo-upload]", err)
      setErrors(p => ({ ...p, [kind]: "Upload failed — tap to retry." }))
    } finally {
      setUploading(p => ({ ...p, [kind]: false }))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
        {KINDS.map(({ kind, label }) => {
          const url = photos[kind]
          const busy = !!uploading[kind]
          return (
            <div key={kind} style={{ position: "relative" }}>
              <input
                ref={el => { inputs.current[kind] = el }}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { handleFile(kind, e.target.files?.[0]); e.target.value = "" }}
              />
              <button
                type="button"
                onClick={() => !busy && inputs.current[kind]?.click()}
                style={{
                  width: "100%", aspectRatio: "3 / 4", borderRadius: "var(--radius-sm)",
                  border: `1.5px ${url ? "solid rgba(212,175,90,0.55)" : "dashed var(--border)"}`,
                  background: url ? `url(${url}) center/cover no-repeat` : "var(--surface-2)",
                  cursor: busy ? "default" : "pointer", position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "0.4rem", color: "var(--text-mute)", padding: 0,
                }}
              >
                {!url && !busy && (
                  <>
                    <Camera size={22} style={{ color: "var(--gold)", opacity: 0.8 }} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "0.62rem", opacity: 0.7 }}>Tap to add</span>
                  </>
                )}
                {busy && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold)", background: "rgba(0,0,0,0.55)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-pill)" }}>
                    Uploading…
                  </span>
                )}
                {url && !busy && (
                  <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: "0.62rem", fontWeight: 700, background: "rgba(0,0,0,0.65)", color: "var(--gold)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-pill)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label} ✓
                  </span>
                )}
              </button>
              {url && !busy && (
                <button
                  type="button"
                  aria-label={`Remove ${label} photo`}
                  onClick={() => onChange({ ...photos, [kind]: null })}
                  style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
              {errors[kind] && <p style={{ color: "#f87171", fontSize: "0.68rem", marginTop: "0.3rem" }}>{errors[kind]}</p>}
            </div>
          )
        })}
      </div>

      {/* Privacy disclosure */}
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.8rem 0.9rem" }}>
        <Lock size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "0.15rem" }} />
        <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: "var(--text)" }}>Your photos are private.</strong> Progress photos are visible
          only to you and your coach and are used solely to track your transformation. They will never be shared,
          published, or used in any marketing without your explicit written consent.
        </p>
      </div>

      <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={e => onConsent(e.target.checked)}
          style={{ width: "auto", accentColor: "var(--gold)", marginTop: "0.2rem" }} />
        <span style={{ fontSize: "0.78rem", color: "var(--text-mute)", lineHeight: 1.55 }}>
          Optional: I&apos;m open to my progress photos being used as an anonymous before/after success story.
        </span>
      </label>
    </div>
  )
}
