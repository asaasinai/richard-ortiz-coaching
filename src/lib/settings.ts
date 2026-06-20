import { query } from "@/lib/db"
import { EMAIL_TEMPLATE_DEFAULTS } from "@/lib/email-templates"

const DEFAULTS: Record<string, string> = {
  notify_email_urgent_checkin: "true",
  notify_sms_urgent_checkin: "false",
  notify_email_new_intake: "true",
  notify_email_low_stock: "true",
  notify_email_ops_overdue: "true",
  urgent_threshold: "5",
  default_reorder_threshold: "2",
  auto_generate_ops_cards: "false",
  billing_cycle_day: "1",
  admin_name: "Richard Ortiz",
  admin_email: "",
  admin_phone: "",
  admin_avatar: "",
  // Editable email templates + TOS (see lib/email-templates.ts)
  ...EMAIL_TEMPLATE_DEFAULTS,
}

// Read all settings merged over defaults. Degrades to defaults pre-migration.
export async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await query<{ key: string; value: string }>(`SELECT key, value FROM roc.admin_settings`)
    const out = { ...DEFAULTS }
    for (const r of res.rows) out[r.key] = r.value ?? ""
    return out
  } catch {
    return { ...DEFAULTS }
  }
}

export async function getSetting(key: string): Promise<string> {
  try {
    const res = await query<{ value: string }>(`SELECT value FROM roc.admin_settings WHERE key = $1`, [key])
    return res.rows[0]?.value ?? DEFAULTS[key] ?? ""
  } catch {
    return DEFAULTS[key] ?? ""
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO roc.admin_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  )
}

export const SETTING_DEFAULTS = DEFAULTS
