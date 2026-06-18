-- ROC Admin v2 — corrected Elixsir catalog (36 exact SKUs + wholesale COGS)
-- Safe to re-run. Replaces the old auto-generated 35×4 placeholder catalog.
-- Pre-verified: 0 client_protocols, 0 inventory_batches, 0 stock reference any SKU.

BEGIN;

-- 1a. Add wholesale cost (COGS) column
ALTER TABLE roc.inventory_skus
  ADD COLUMN IF NOT EXISTS wholesale_cost NUMERIC(10,2);

-- Drop placeholder catalog (no dependents) so reseed is exact, no duplicates
DELETE FROM roc.inventory_skus;

-- Enforce uniqueness so future seeds/POSTs can't create duplicate SKUs
ALTER TABLE roc.inventory_skus
  DROP CONSTRAINT IF EXISTS inventory_skus_peptide_strength_unit_key;
ALTER TABLE roc.inventory_skus
  ADD CONSTRAINT inventory_skus_peptide_strength_unit_key
  UNIQUE (peptide_name, strength, strength_unit);

-- Seed exact Elixsir catalog: 36 SKUs with real wholesale costs
INSERT INTO roc.inventory_skus (peptide_name, strength, strength_unit, reorder_qty, wholesale_cost, notes)
VALUES
  ('5-Amino-1MQ',                         10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('AOD-9604',                            10,  'mg', 10, 18.00, 'Elixsir catalog'),
  ('BPC-157',                             10,  'mg', 10, 14.00, 'Elixsir catalog'),
  ('CJC-1295 No DAC',                     10,  'mg', 10, 18.00, 'Elixsir catalog'),
  ('DSIP',                                 5,  'mg', 10, 15.00, 'Elixsir catalog'),
  ('DSIP',                                10,  'mg', 10, 20.00, 'Elixsir catalog'),
  ('Epitalon',                            10,  'mg', 10, 14.00, 'Elixsir catalog'),
  ('GHK-Cu',                              50,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('Ipamorelin',                          10,  'mg', 10, 16.00, 'Elixsir catalog'),
  ('Kisspeptin-10',                       10,  'mg', 10, 16.00, 'Elixsir catalog'),
  ('KPV',                                 10,  'mg', 10, 16.00, 'Elixsir catalog'),
  ('LL-37 (CAP-18)',                       5,  'mg', 10, 18.00, 'Elixsir catalog'),
  ('Melanotan 1',                         10,  'mg', 10, 15.00, 'Elixsir catalog'),
  ('Melanotan 2',                         10,  'mg', 10, 15.00, 'Elixsir catalog'),
  ('MOTS-C',                              10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('NAD+',                               500,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('Oxytocin',                            10,  'mg', 10, 10.00, 'Elixsir catalog'),
  ('PT-141',                              10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('Retatrutide',                         10,  'mg', 10, 15.00, 'Elixsir catalog'),
  ('Retatrutide',                         20,  'mg', 10, 25.00, 'Elixsir catalog'),
  ('Retatrutide',                         30,  'mg', 10, 30.00, 'Elixsir catalog'),
  ('Selank',                              10,  'mg', 10, 14.00, 'Elixsir catalog'),
  ('Semaglutide',                         10,  'mg', 10, 14.00, 'Elixsir catalog'),
  ('Semax',                               10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('Sermorelin',                          10,  'mg', 10, 20.00, 'Elixsir catalog'),
  ('SS-31',                               10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('TB-500 Fragmented (Short Chain)',     10,  'mg', 10, 13.00, 'Elixsir catalog'),
  ('TB-500 Thymosin Beta-4 (Long Chain)', 10,  'mg', 10, 14.00, 'Elixsir catalog'),
  ('Tesamorelin',                         10,  'mg', 10, 30.00, 'Elixsir catalog'),
  ('Tesamorelin',                         20,  'mg', 10, 48.00, 'Elixsir catalog'),
  ('Thymosin Alpha-1',                    10,  'mg', 10, 24.00, 'Elixsir catalog'),
  ('Tirzepatide',                         10,  'mg', 10, 12.00, 'Elixsir catalog'),
  ('Tirzepatide',                         30,  'mg', 10, 20.00, 'Elixsir catalog'),
  ('Tirzepatide',                         60,  'mg', 10, 28.00, 'Elixsir catalog'),
  ('IGF-LR3',                              1,  'mg', 10, 30.00, 'Elixsir catalog'),
  ('PEG-MGF',                              5,  'mg', 10, 28.00, 'Elixsir catalog')
ON CONFLICT (peptide_name, strength, strength_unit)
  DO UPDATE SET wholesale_cost = EXCLUDED.wholesale_cost,
                reorder_qty    = EXCLUDED.reorder_qty,
                notes          = EXCLUDED.notes;

COMMIT;
