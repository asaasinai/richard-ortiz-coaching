-- Track when a signed proposal has been paid. Paid proposals count as
-- collected (realized) revenue on the overview + revenue dashboards.
ALTER TABLE roc.proposals ADD COLUMN IF NOT EXISTS paid_at timestamptz;
