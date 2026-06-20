-- ROC — per-SKU retail (sell) price for proposals + revenue
-- Additive + idempotent. wholesale_cost already exists (COGS); this adds the
-- price the client is charged per vial. Drives the suggested monthly rate in the
-- protocol builder and the planned-margin math on the Pricing tab.

ALTER TABLE roc.inventory_skus
  ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2);
