// PDF export helper — called from calculator page
export async function exportPDF(params: {
  peptideName: string
  vialMg: string
  reconMl: string
  desiredDoseMcg: number
  syringeUnitsExact: number
  syringeUnitsRounded: number
  dosesPerVial: number
  concMgPerMl: number
  concMcgPerMl: number
  protocolLevel: string
}) {
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, coachContact: "richard@richardortizcoaching.com" })
  })
  const html = await res.text()
  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}
