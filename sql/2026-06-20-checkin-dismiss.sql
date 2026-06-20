-- ROC — soft-dismiss check-ins from the active queue.
-- Dismissed check-ins drop out of the Check-Ins queue + counts but stay on the
-- client profile (the per-client history query still returns them). Additive.

ALTER TABLE roc.checkins ADD COLUMN IF NOT EXISTS dismissed    boolean NOT NULL DEFAULT false;
ALTER TABLE roc.checkins ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;
