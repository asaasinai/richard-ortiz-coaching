import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const {
    peptideName, vialMg, reconMl, desiredDoseMcg,
    syringeUnitsExact, syringeUnitsRounded, dosesPerVial,
    concMgPerMl, concMcgPerMl, protocolLevel, coachContact
  } = await req.json()

  const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${peptideName} Dosage Card</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Inter+Tight:wght@900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Inter,sans-serif; background:#fff; color:#000; padding:32px; max-width:680px; margin:0 auto; }
  .header { border-bottom:3px solid #C9A84C; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end; }
  .title { font-family:"Inter Tight",sans-serif; font-weight:900; font-size:28px; letter-spacing:-0.02em; }
  .subtitle { color:#666; font-size:13px; margin-top:4px; }
  .badge { background:#C9A84C; color:#000; font-weight:700; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; border-radius:3px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
  .row { border:1px solid #e5e5e5; border-radius:4px; padding:12px 14px; }
  .row-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; margin-bottom:4px; }
  .row-value { font-size:18px; font-weight:700; color:#000; }
  .highlight { background:#fffbf0; border-color:#C9A84C; }
  .highlight .row-value { color:#a07830; font-size:22px; }
  .section { margin-bottom:20px; }
  .section-title { font-size:11px; color:#C9A84C; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; border-bottom:1px solid #f0e8d0; padding-bottom:6px; }
  .disclaimer { background:#f9f9f9; border:1px solid #e5e5e5; border-radius:4px; padding:12px; font-size:11px; color:#888; line-height:1.6; margin-top:24px; }
  .footer { margin-top:20px; display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
  @media print { body { padding:0; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="title">${peptideName}</div>
    <div class="subtitle">Dosage Calculation Card — Richard Ortiz Coaching</div>
  </div>
  <div class="badge">${protocolLevel || "Moderate"}</div>
</div>

<div class="section">
  <div class="section-title">Calculation Results</div>
  <div class="grid">
    <div class="row highlight">
      <div class="row-label">Draw to this mark</div>
      <div class="row-value">${syringeUnitsRounded} units</div>
    </div>
    <div class="row">
      <div class="row-label">Exact units</div>
      <div class="row-value">${Number(syringeUnitsExact).toFixed(2)} units</div>
    </div>
    <div class="row">
      <div class="row-label">Doses per vial</div>
      <div class="row-value">${Number(dosesPerVial).toFixed(1)}</div>
    </div>
    <div class="row">
      <div class="row-label">Desired dose</div>
      <div class="row-value">${desiredDoseMcg} mcg</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Vial Specifications</div>
  <div class="grid">
    <div class="row">
      <div class="row-label">Vial size</div>
      <div class="row-value">${vialMg} mg</div>
    </div>
    <div class="row">
      <div class="row-label">Reconstitution volume</div>
      <div class="row-value">${reconMl} mL BAC water</div>
    </div>
    <div class="row">
      <div class="row-label">Concentration</div>
      <div class="row-value">${Number(concMgPerMl).toFixed(3)} mg/mL</div>
    </div>
    <div class="row">
      <div class="row-label">Concentration (mcg)</div>
      <div class="row-value">${Number(concMcgPerMl).toFixed(1)} mcg/mL</div>
    </div>
  </div>
</div>

<div class="disclaimer">
  <strong>Safe Use Reminder:</strong> Store reconstituted peptide in the refrigerator (2–8°C). Use within 30 days. Inject subcutaneously with a clean insulin syringe. Rotate injection sites. This card is for coaching reference only — not a prescription or medical directive. Verify all protocols with your prescribing physician before use.
</div>

<div class="footer">
  <span>Generated: ${date}</span>
  <span>${coachContact || "richard@richardortizcoaching.com"}</span>
  <span>richardortizcoaching.com</span>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="${peptideName.replace(/\s+/g,"-")}-dosage-card.html"`,
    }
  })
}
