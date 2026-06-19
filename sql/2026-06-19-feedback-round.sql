-- ROC Admin — feedback round (2026-06-19)
-- Per-peptide duration (secondary peptide gets its own duration), idempotent.
BEGIN;

ALTER TABLE roc.client_protocols
  ADD COLUMN IF NOT EXISTS secondary_duration_weeks INTEGER;

COMMIT;
