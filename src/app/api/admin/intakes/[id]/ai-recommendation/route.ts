import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

const DEFAULT_TOS = `COACHING SERVICES AGREEMENT

This agreement is between Richard Ortiz Coaching ("Coach") and the client named above ("Client").

1. SERVICES
Coach will provide personalized peptide optimization coaching including protocol design using 
manufacturer peptide products, progress check-in review, and ongoing protocol adjustments based 
on Client's results.

2. PAYMENT
Client agrees to pay the monthly coaching fee listed in this agreement. Payment is due on 
the 1st of each month. Service continues month-to-month until either party cancels in writing.

3. CANCELLATION
Either party may cancel with 7 days written notice via email. No refunds for partial months 
already billed.

4. HEALTH DISCLAIMER
Coaching services are educational and informational in nature. They do not constitute medical 
advice, diagnosis, or treatment. Client should consult a licensed physician before beginning 
any peptide protocol. Richard Ortiz is not a licensed medical professional.

5. CLIENT RESPONSIBILITIES
Client agrees to: (a) follow the assigned protocol as instructed, (b) complete weekly 
check-ins honestly and on time, (c) notify Coach immediately of any adverse reactions, 
(d) disclose all relevant health conditions and medications, and (e) maintain communication 
for protocol adjustments.

6. PRODUCT SOURCE
All peptides are sourced exclusively from the manufacturer. Client acknowledges that peptide products 
are for research and personal optimization purposes.

7. CONFIDENTIALITY
Coach will keep all client health information confidential and will not share it with third 
parties without written consent, except as required by law.

8. LIMITATION OF LIABILITY
Coach's total liability is limited to the monthly coaching fee paid for the month in which 
any claim arises. Coach is not liable for outcomes resulting from Client's failure to follow 
the protocol, failure to disclose relevant health information, or misuse of products.

9. ENTIRE AGREEMENT
This agreement, together with the protocol summary above, constitutes the entire agreement 
between the parties and supersedes all prior discussions.`

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const intakeRes = await query(
      `SELECT id, first_name, last_name, email, data, ai_recommendation, ai_rec_generated_at
       FROM roc.intakes WHERE id = $1`,
      [id]
    )
    if (!intakeRes.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const intake = intakeRes.rows[0] as {
      id: string; first_name: string; last_name: string; email: string
      data: Record<string, unknown>; ai_recommendation: unknown; ai_rec_generated_at: string | null
    }

    // Check cache — return if < 7 days old
    const forceRegen = new URL(req.url).searchParams.get("regen") === "1"
    if (!forceRegen && intake.ai_recommendation && intake.ai_rec_generated_at) {
      const age = Date.now() - new Date(intake.ai_rec_generated_at).getTime()
      if (age < 7 * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ recommendation: intake.ai_recommendation, cached: true })
      }
    }

    // Call Claude
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 })
    }

    // Build the available-products list from the live manufacturer catalog so the
    // model can only recommend (peptide, vial size) pairs that resolve to a SKU.
    const catalogRes = await query<{ peptide_name: string; strength: string; strength_unit: string }>(
      `SELECT peptide_name, strength, strength_unit FROM roc.inventory_skus ORDER BY peptide_name, strength`
    )
    const sizesByPeptide = new Map<string, string[]>()
    for (const r of catalogRes.rows) {
      const arr = sizesByPeptide.get(r.peptide_name) ?? []
      arr.push(`${r.strength}${r.strength_unit}`)
      sizesByPeptide.set(r.peptide_name, arr)
    }
    const catalogLines = Array.from(sizesByPeptide.entries())
      .map(([name, sizes]) => `- ${name}: ${sizes.join(", ")}`)
      .join("\n")

    const systemPrompt = `You are an expert peptide optimization consultant for the manufacturer, a peptide manufacturer.
Based on the client intake below, recommend an optimal protocol from the manufacturer catalog.
You MUST only choose a peptide + vial size that appears in this exact catalog (use the peptide name verbatim):
${catalogLines}

Respond ONLY with valid JSON matching this exact schema:
{
  "primary_peptide": "string (exact name from the catalog above)",
  "primary_vial_size_mg": number (the numeric mg of a vial size offered for that peptide),
  "primary_dose_amount": "string",
  "primary_dose_unit": "string (mg|mcg|IU|mL)",
  "primary_frequency": ["Mon","Wed","Fri"],
  "secondary_peptide": "string or null",
  "secondary_vial_size_mg": "number or null",
  "secondary_dose_amount": "string or null",
  "secondary_dose_unit": "string or null",
  "secondary_frequency": "array or null",
  "duration_weeks": number,
  "rationale": "2-4 sentences",
  "contraindications_noted": ["string"] or [],
  "confidence": "number between 0 and 1",
  "alternatives": [
    { "peptide": "string", "vial_size_mg": number, "rationale": "1 sentence" }
  ]
}`

    const userMessage = `Client: ${intake.first_name} ${intake.last_name}
Email: ${intake.email}
Intake data: ${JSON.stringify(intake.data, null, 2)}`

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error("[ai-rec] Claude error:", errText)
      return NextResponse.json({ error: "Claude API error" }, { status: 500 })
    }

    const claudeData = await claudeRes.json() as { content: { type: string; text: string }[] }
    const rawText = claudeData.content?.[0]?.text ?? ""

    let recommendation: unknown
    try {
      // Extract JSON from response (might have markdown fences)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found in response")
      recommendation = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error("[ai-rec] Parse error:", parseErr, rawText)
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 500 })
    }

    // Cache in DB
    await query(
      `UPDATE roc.intakes SET ai_recommendation = $1, ai_rec_generated_at = NOW() WHERE id = $2`,
      [JSON.stringify(recommendation), id]
    )

    return NextResponse.json({ recommendation, cached: false })
  } catch (e) {
    console.error("[ai-rec]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Force regeneration
  const url = new URL(req.url)
  url.searchParams.set("regen", "1")
  return GET(new NextRequest(url.toString(), { method: "GET", headers: req.headers }), { params })
}
