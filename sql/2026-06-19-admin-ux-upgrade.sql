-- ROC Admin — UX/UI Upgrade schema (Sprints 1–4)
-- Idempotent. Safe to re-run. Run manually against Neon `neondb` schema `roc`.
-- Cross-reference columns are TEXT (no hard FK) to stay agnostic to the
-- existing id column types (uuid/serial/text) and match the raw-SQL codebase.
-- Joins in app code cast both sides to ::text.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. CHECK-INS — read / resolution / follow-up state (Sprint 1)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE roc.checkins
  ADD COLUMN IF NOT EXISTS read              BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resolved          BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS follow_up_action  TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_notes   TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by       TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at       TIMESTAMPTZ;

-- Existing urgent flag column is `urgent_flag` (boolean) — kept as the source of truth.

CREATE INDEX IF NOT EXISTS checkins_read_idx     ON roc.checkins (read);
CREATE INDEX IF NOT EXISTS checkins_urgent_idx   ON roc.checkins (urgent_flag);
CREATE INDEX IF NOT EXISTS checkins_resolved_idx ON roc.checkins (resolved);

-- ─────────────────────────────────────────────────────────────
-- 2. NOTIFICATIONS — cross-module alert feed (Sprint 2)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roc.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,           -- urgent_checkin | new_intake | low_stock | ops_overdue | checkin_submitted
  ref_id      TEXT,                           -- id of the related checkin / intake / sku / ops record
  ref_type    TEXT,                           -- checkin | intake | inventory | ops
  message     TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  admin_id    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_read_idx       ON roc.notifications (read);
CREATE INDEX IF NOT EXISTS notifications_created_idx    ON roc.notifications (created_at DESC);
-- Dedupe guard: at most one unresolved notification per (type, ref_id)
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unresolved_uniq
  ON roc.notifications (type, ref_id) WHERE resolved = FALSE;

-- ─────────────────────────────────────────────────────────────
-- 3. OPS QUEUE — fulfillment pipeline cards (Sprint 2)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roc.ops_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       TEXT,                       -- -> roc.intakes.id (::text)
  client_email    TEXT,
  client_name     TEXT,
  protocol_id     TEXT,                       -- -> roc.client_protocols (client_id) reference
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','packed','shipped','delivered','cancelled')),
  line_items      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- [{sku_id,peptide,strength,dosage,qty,cost_per_unit,line_total,lot_ids:[]}]
  total_cogs      NUMERIC(10,2) NOT NULL DEFAULT 0,
  tracking_number TEXT,
  notes           TEXT,
  due_date        DATE,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ops_cards_status_idx   ON roc.ops_cards (status);
CREATE INDEX IF NOT EXISTS ops_cards_due_idx       ON roc.ops_cards (due_date);
CREATE INDEX IF NOT EXISTS ops_cards_client_idx    ON roc.ops_cards (client_id);

-- ─────────────────────────────────────────────────────────────
-- 4. INVENTORY LOTS — extend existing roc.inventory_batches as the
--    FIFO lot ledger (do NOT create a duplicate table). (Sprint 2)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE roc.inventory_batches
  ADD COLUMN IF NOT EXISTS lot_identifier TEXT,
  ADD COLUMN IF NOT EXISTS received_by    TEXT;

-- Backfill a lot identifier for legacy batches missing one
UPDATE roc.inventory_batches
  SET lot_identifier = 'LOT-' || UPPER(SUBSTRING(id::text, 1, 8))
  WHERE lot_identifier IS NULL OR lot_identifier = '';

-- ─────────────────────────────────────────────────────────────
-- 5. LOT TRANSACTIONS — FIFO deduction / adjustment / return log (Sprint 2)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roc.lot_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id           TEXT        NOT NULL,      -- -> roc.inventory_batches.id (::text)
  sku_id           TEXT,                      -- -> roc.inventory_skus.id (::text)
  ops_card_id      TEXT,                      -- -> roc.ops_cards.id (::text)
  client_id        TEXT,
  qty_deducted     NUMERIC(12,3) NOT NULL,
  transaction_type TEXT        NOT NULL DEFAULT 'fulfillment'
                   CHECK (transaction_type IN ('fulfillment','adjustment','return')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lot_tx_lot_idx  ON roc.lot_transactions (lot_id);
CREATE INDEX IF NOT EXISTS lot_tx_ops_idx  ON roc.lot_transactions (ops_card_id);
CREATE INDEX IF NOT EXISTS lot_tx_sku_idx  ON roc.lot_transactions (sku_id);

-- ─────────────────────────────────────────────────────────────
-- 6. ADMIN SETTINGS — key/value store for alert toggles, thresholds (Sprint 4)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roc.admin_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roc.admin_settings (key, value) VALUES
  ('notify_email_urgent_checkin', 'true'),
  ('notify_sms_urgent_checkin',   'false'),
  ('notify_email_new_intake',     'true'),
  ('notify_email_low_stock',      'true'),
  ('notify_email_ops_overdue',    'true'),
  ('urgent_threshold',            '5'),
  ('default_reorder_threshold',   '2'),
  ('auto_generate_ops_cards',     'false'),
  ('billing_cycle_day',           '1'),
  ('admin_name',                  'Richard Ortiz'),
  ('admin_email',                 ''),
  ('admin_phone',                 ''),
  ('admin_avatar',                '')
ON CONFLICT (key) DO NOTHING;

COMMIT;
