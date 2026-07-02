-- Progress photos (front/side/back) uploaded at intake + each 2-week check-in.
-- Files live in Vercel Blob (store roc-photos); this table is the index.
-- Cross-ref cols are TEXT to match the rest of the schema (join with ::text casts).
CREATE TABLE IF NOT EXISTS roc.client_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email text NOT NULL,
  client_id text,
  checkin_id text,
  source text NOT NULL DEFAULT 'checkin' CHECK (source IN ('intake','checkin')),
  kind text NOT NULL CHECK (kind IN ('front','side','back')),
  url text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_photos_email_idx
  ON roc.client_photos (lower(client_email), created_at DESC);
