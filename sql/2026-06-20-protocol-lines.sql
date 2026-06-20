-- ROC — multiple protocols per client (line items) that aggregate into a proposal.
-- Each row is one saved protocol. The builder appends rows; the proposal generator
-- snapshots them all into a single client agreement. Additive; client_protocols is
-- kept in sync (summed monthly_rate + primary line) so Revenue/Ops keep working.

CREATE TABLE IF NOT EXISTS roc.protocol_lines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      TEXT NOT NULL,
  peptide        TEXT NOT NULL,
  sku_id         TEXT,
  strength       NUMERIC,
  strength_unit  TEXT,
  dose_amount    TEXT,
  dose_unit      TEXT,
  frequency_days JSONB DEFAULT '[]'::jsonb,
  duration_weeks INTEGER,
  monthly_rate   NUMERIC(10,2),
  coach_notes    TEXT,
  secondary_peptide TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS protocol_lines_client_idx ON roc.protocol_lines (client_id, sort_order);
