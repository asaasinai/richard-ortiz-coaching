-- Manual "addressed it" dismissals for computed schedule items. Key is
-- client_id:type:due_date — same shape as the alert-notification ref_id —
-- so a dismissal hides exactly one cycle; the next cycle has a new date
-- and shows up fresh.
CREATE TABLE IF NOT EXISTS roc.schedule_dismissals (
  key text PRIMARY KEY,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);
