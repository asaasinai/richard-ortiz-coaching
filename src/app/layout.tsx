import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Richard Ortiz Coaching | Transformation & Performance Coaching",
  description:
    "Personalized coaching to lose body fat, build lean muscle, improve performance, and create sustainable results. Train. Recover. Optimize.",
  openGraph: {
    title: "Richard Ortiz Coaching",
    description:
      "Transformation and performance coaching — fat loss, lean muscle, strength, nutrition, recovery, and accountability.",
    url: "https://richardortizcoaching.com",
    siteName: "Richard Ortiz Coaching",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
