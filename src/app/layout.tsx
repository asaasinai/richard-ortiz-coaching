import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Richard Ortiz Coaching | Peptide Therapy & Wellness",
  description: "Evidence-based peptide therapy guidance, dosage protocols, and personalized coaching with Richard Ortiz.",
  openGraph: {
    title: "Richard Ortiz Coaching",
    description: "Peptide therapy guidance and wellness coaching.",
    url: "https://richardortizcoaching.com",
    siteName: "Richard Ortiz Coaching",
    type: "website",
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}