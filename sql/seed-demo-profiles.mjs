// ROC Admin — purge client data + seed 5 full demo profiles.
// Backup is taken separately (backups/). Idempotent: deletes demo rows by known ids first.
// Run: set -a; source .vercel/.env.production.local; set +a; node sql/seed-demo-profiles.mjs
const NEON_URL = process.env.DATABASE_URL, HOST = process.env.NEON_HOST
if (!NEON_URL || !HOST) { console.error("Missing DATABASE_URL/NEON_HOST"); process.exit(1) }
async function q(query, params) {
  const r = await fetch(HOST + "/sql", { method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": NEON_URL },
    body: JSON.stringify(params?.length ? { query, params } : { query }) })
  if (!r.ok) throw new Error(await r.text())
  return (await r.json()).rows
}
const SKU = {
  tirz10: "fd011efd-42d1-4af2-af02-54d87c225150",
  bpc:    "397597c0-cc10-498e-9cb1-9c98c463e92c",
  ghkcu:  "3414b804-e5ef-459f-97be-bf2a91e82ec0",
  nad:    "334b2d74-a49d-4f6b-8a17-c1356c9b80f9",
  tb500:  "43014d95-4aa1-4670-aced-f982087c45e4",
  sema:   "a877dbf4-99a0-4dc6-9fb9-a9ab36ab253a",
  cjc:    "c1617839-7524-4baa-a287-6186e3d0f8e6",
  ipa:    "99be9d10-5135-4aef-af8a-ffaff41044bf",
}
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString() }
const dateOnly = (n) => day(n).slice(0, 10)

// ── 5 demo clients (fixed ids so re-runs are idempotent) ──
const C = [
  { id: "demo-marcus-bennett", first: "Marcus", last: "Bennett", email: "marcus.bennett@demo.roc",
    phone: "+13105551042", gender: "male", age: "35-44", startDaysAgo: 42, weeks: 6,
    goals: ["fat-loss","muscle-strength"], why: ["appearance","energy-performance"],
    struggle: ["plateau","low-energy"], commitment: "9-10", training: "consistent", days: "5-6",
    primary: { sku: SKU.tirz10, peptide: "Tirzepatide", dose: "5", unit: "mg", freq: "[7]", weeks: 12 },
    secondary: { sku: SKU.bpc, peptide: "BPC-157", weeks: 8 },
    rate: 349, billing: "active",
    rec: "Marcus is a consistent 35-44 male training 5-6 days/week chasing fat loss with muscle retention. Tirzepatide drives meaningful appetite control and weight loss while BPC-157 protects connective tissue under his high training load. Weekly Tirzepatide with daily BPC-157 directly targets his plateau and recovery.",
    checkins: [ { wk:1,w:228,bf:27,mood:7,energy:6,missed:0,se:["None"] },
                { wk:2,w:224,bf:26,mood:8,energy:7,missed:0,se:["Mild nausea"] },
                { wk:4,w:218,bf:24,mood:8,energy:8,missed:1,se:["None"] },
                { wk:6,w:213,bf:23,mood:9,energy:9,missed:0,se:["None"],notes:"Best I've felt in years." } ],
    proposal: "signed", ops: "delivered" },

  { id: "demo-sarah-chen", first: "Sarah", last: "Chen", email: "sarah.chen@demo.roc",
    phone: "+14155550199", gender: "female", age: "30-39", startDaysAgo: 21, weeks: 3,
    goals: ["longevity","skin-hair"], why: ["aging","appearance"],
    struggle: ["aging","recovery"], commitment: "7-8", training: "consistent", days: "3-4",
    primary: { sku: SKU.ghkcu, peptide: "GHK-Cu", dose: "2", unit: "mg", freq: "[1,3,5]", weeks: 12 },
    secondary: { sku: SKU.nad, peptide: "NAD+", weeks: 12 },
    rate: 399, billing: "active",
    rec: "Sarah is a 30-39 female prioritizing longevity and skin quality. GHK-Cu supports collagen synthesis, skin remodeling and tissue repair, paired with NAD+ for cellular energy and healthy aging. A gentle 3x/week cadence fits her lifestyle while compounding anti-aging benefits.",
    checkins: [ { wk:1,w:138,bf:24,mood:7,energy:7,missed:0,se:["None"] },
                { wk:2,w:137,bf:24,mood:8,energy:8,missed:0,se:["Injection site redness"] },
                { wk:3,w:137,bf:23,mood:8,energy:8,missed:0,se:["None"],notes:"Skin looks brighter already." } ],
    proposal: "signed", ops: "shipped" },

  { id: "demo-david-rodriguez", first: "David", last: "Rodriguez", email: "david.rodriguez@demo.roc",
    phone: "+13235550173", gender: "male", age: "45-54", startDaysAgo: 56, weeks: 8,
    goals: ["recovery","injury"], why: ["energy-performance","recovery"],
    struggle: ["injury","recovery"], commitment: "9-10", training: "returning", days: "3-4",
    primary: { sku: SKU.bpc, peptide: "BPC-157", dose: "500", unit: "mcg", freq: "[1,2,3,4,5,6,7]", weeks: 8 },
    secondary: { sku: SKU.tb500, peptide: "TB-500", weeks: 6 },
    rate: 379, billing: "active",
    rec: "David is a 45-54 male returning from a shoulder injury. The BPC-157 + TB-500 systemic-repair stack is the gold standard for soft-tissue and tendon healing, accelerating recovery so he can return to training. Daily BPC-157 with twice-weekly TB-500 maximizes repair.",
    checkins: [ { wk:2,w:201,bf:22,mood:6,energy:6,missed:0,se:["None"] },
                { wk:4,w:199,bf:21,mood:7,energy:7,missed:1,se:["None"] },
                { wk:6,w:198,bf:21,mood:7,energy:7,missed:0,se:["Fatigue"] },
                { wk:8,w:197,bf:20,mood:4,energy:5,missed:0,se:["Joint pain","Swelling"],urgent:true,
                  reason:"Sharp return of shoulder joint pain after increasing load this week — want to check if I should pause.",
                  notes:"Pain flared up again, 7/10." } ],
    proposal: "signed", ops: "delivered" },

  { id: "demo-emily-watson", first: "Emily", last: "Watson", email: "emily.watson@demo.roc",
    phone: "+16195550128", gender: "female", age: "25-34", startDaysAgo: 5, weeks: 1,
    goals: ["fat-loss"], why: ["appearance","energy-performance"],
    struggle: ["low-energy","plateau"], commitment: "7-8", training: "beginner", days: "1-2",
    primary: { sku: SKU.sema, peptide: "Semaglutide", dose: "0.25", unit: "mg", freq: "[7]", weeks: 12 },
    secondary: null,
    rate: 249, billing: "active",
    rec: "Emily is a 25-34 female new to optimization, focused on fat loss. Semaglutide titrated from a conservative 0.25mg weekly provides strong appetite regulation with a gentle on-ramp, ideal for a beginner building consistency.",
    checkins: [],  // brand new — no check-in yet
    proposal: "sent", ops: "pending" },

  { id: "demo-james-park", first: "James", last: "Park", email: "james.park@demo.roc",
    phone: "+12135550155", gender: "male", age: "50-59", startDaysAgo: 84, weeks: 12,
    goals: ["longevity","muscle-strength"], why: ["aging","energy-performance"],
    struggle: ["aging","low-energy"], commitment: "9-10", training: "consistent", days: "3-4",
    primary: { sku: SKU.cjc, peptide: "CJC-1295 No DAC", dose: "100", unit: "mcg", freq: "[1,3,5]", weeks: 16 },
    secondary: { sku: SKU.ipa, peptide: "Ipamorelin", weeks: 16 },
    rate: 449, billing: "active",
    rec: "James is a 50-59 male optimizing GH pulsatility for anti-aging and lean mass. CJC-1295 No DAC + Ipamorelin is the gold-standard GHRH/GHRP stack, amplifying natural GH pulses without desensitization — supporting recovery, body composition and vitality on a 3x/week pre-sleep cadence.",
    checkins: [ { wk:2,w:189,bf:21,mood:7,energy:7,missed:0,se:["None"] },
                { wk:4,w:187,bf:20,mood:8,energy:8,missed:0,se:["None"] },
                { wk:8,w:184,bf:18,mood:9,energy:9,missed:0,se:["None"] },
                { wk:12,w:181,bf:17,mood:9,energy:10,missed:0,se:["None"],notes:"Sleeping deeper, leaner, more energy than at 40."} ],
    proposal: "signed", ops: "delivered" },
]

async function main() {
  // ── 1. PURGE client data (inventory/settings/users kept) ──
  const purge = ["checkins","nextday_checkins","proposals","ops_cards","lot_transactions",
                 "dosage_calculations","client_protocols","intakes","notifications"]
  for (const t of purge) { await q(`DELETE FROM roc.${t}`); }
  await q(`DELETE FROM roc.activity_log WHERE admin_id IS NULL OR admin_id <> 'system-keep'`)
  console.log("Purged client tables.")

  // ── 2. SEED ──
  let totalCheckins = 0, totalProtocols = 0, totalProposals = 0, totalOps = 0
  for (const c of C) {
    const data = {
      email: c.email, phone: c.phone, gender: c.gender, ageRange: c.age,
      firstName: c.first, lastName: c.last, injuries: c.goals.includes("injury") ? "shoulder" : "none",
      whyNow: c.why.join(", "), primaryGoal: c.goals.join(", "),
      trainingDays: c.days, biggestStruggle: c.struggle.join(", "),
      commitmentLevel: c.commitment, currentlyTrains: "yes",
      optimizationTools: "new", trainingExperience: c.training,
      rawAnswers: { gender: c.gender, whyNow: c.why, ageRange: c.age, injuries: "none",
        primaryGoal: c.goals, trainingDays: c.days, biggestStruggle: c.struggle,
        commitmentLevel: c.commitment, currentlyTrains: "yes", optimizationTools: "new",
        trainingExperience: c.training },
    }
    const aiRec = { rationale: c.rec, primaryPeptide: c.primary.peptide,
      secondaryPeptide: c.secondary?.peptide ?? null, confidence: "high" }

    await q(`INSERT INTO roc.intakes (id,user_id,status,data,submitted_at,reviewed_at,email,first_name,last_name,ai_recommendation,ai_rec_generated_at)
             VALUES ($1,$1,'APPROVED',$2::jsonb,$3,$4,$5,$6,$7,$8::jsonb,$4)`,
      [c.id, JSON.stringify(data), day(c.startDaysAgo + 2), day(c.startDaysAgo + 1),
       c.email, c.first, c.last, JSON.stringify(aiRec)])

    await q(`INSERT INTO roc.client_protocols
             (client_id,peptide,protocol,coach_notes,assigned_at,dose_amount,dose_unit,frequency_days,
              protocol_start_date,followup_sent,sku_id,monthly_rate,billing_status,duration_weeks,
              secondary_peptide,secondary_sku_id,secondary_duration_weeks,internal_notes)
             VALUES ($1,$2,'custom',$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [c.id, c.primary.peptide, `${c.primary.peptide} protocol for ${c.first}.`, day(c.startDaysAgo),
       c.primary.dose, c.primary.unit, c.primary.freq, dateOnly(c.startDaysAgo), c.primary.sku,
       c.rate, c.billing, c.primary.weeks,
       c.secondary?.peptide ?? null, c.secondary?.sku ?? null, c.secondary?.weeks ?? null,
       `Demo profile — ${c.goals.join("/")}.`])
    totalProtocols++

    for (const ck of c.checkins) {
      const daysAgo = c.startDaysAgo - (ck.wk - 1) * 7
      const cdata = { weight: String(ck.w), bodyFat: String(ck.bf), musclePct: "",
        moodScore: ck.mood, energyScore: ck.energy, missedDoses: String(ck.missed),
        sideEffects: ck.se, sideEffectsOther: "", urgentFlag: !!ck.urgent,
        reason: ck.reason ?? "", notes: ck.notes ?? "", clientEmail: c.email }
      await q(`INSERT INTO roc.checkins (id,user_id,week_number,data,submitted_at,urgent_flag,client_email,read,resolved)
               VALUES (gen_random_uuid()::text,$1,$2,$3::jsonb,$4,$5,$6,$7,false)`,
        [c.id, ck.wk, JSON.stringify(cdata), day(daysAgo), !!ck.urgent, c.email,
         ck.urgent ? false : (ck.wk < c.weeks)])  // older ones read, urgent unread
      totalCheckins++
    }

    if (c.proposal) {
      const snap = { client: `${c.first} ${c.last}`, peptide: c.primary.peptide,
        monthly_rate: c.rate, duration_weeks: c.primary.weeks }
      const signed = c.proposal === "signed"
      await q(`INSERT INTO roc.proposals (id,intake_id,protocol_snapshot,tos_text,status,proposal_token,created_at,sent_at,signed_at,signed_name)
               VALUES (gen_random_uuid(),$1,$2::jsonb,$3,$4,$5,$6,$6,$7,$8)`,
        [c.id, JSON.stringify(snap), "Standard coaching terms of service.",
         signed ? "signed" : "sent", `demo-prop-${c.id}`, day(c.startDaysAgo + 1),
         signed ? day(c.startDaysAgo) : null, signed ? `${c.first} ${c.last}` : null])
      totalProposals++
    }

    if (c.ops) {
      const lineItems = [{ sku_id: c.primary.sku, peptide: c.primary.peptide,
        qty: 1, cost_per_unit: 14, line_total: 14, lot_ids: [] }]
      await q(`INSERT INTO roc.ops_cards (id,client_id,client_email,client_name,protocol_id,status,line_items,total_cogs,due_date,created_at)
               VALUES (gen_random_uuid(),$1,$2,$3,$1,$4,$5::jsonb,$6,$7,$8)`,
        [c.id, c.email, `${c.first} ${c.last}`, c.ops, JSON.stringify(lineItems), 14,
         dateOnly(c.ops === "pending" ? -3 : c.startDaysAgo - 5), day(c.startDaysAgo - 1)])
      totalOps++
    }
  }

  // ── 3. VERIFY ──
  const counts = {}
  for (const t of ["intakes","client_protocols","checkins","proposals","ops_cards"]) {
    counts[t] = Number((await q(`SELECT COUNT(*) n FROM roc.${t}`))[0].n)
  }
  const urgent = Number((await q(`SELECT COUNT(*) n FROM roc.checkins WHERE urgent_flag=true AND COALESCE(resolved,false)=false`))[0].n)
  const active = Number((await q(`SELECT COUNT(*) n FROM roc.intakes WHERE status='APPROVED'`))[0].n)
  console.log("Seeded:", { ...counts, urgentFlags: urgent, activeClients: active })
  console.log(`(protocols=${totalProtocols} checkins=${totalCheckins} proposals=${totalProposals} ops=${totalOps})`)
}
main().catch(e => { console.error("SEED ERROR:", e.message); process.exit(1) })
