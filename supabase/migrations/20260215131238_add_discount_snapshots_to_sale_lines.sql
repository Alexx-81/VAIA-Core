-- Add discount snapshot columns to sale_lines table
-- These columns store the article's discount at the time of sale (frozen snapshots)

ALTER TABLE sale_lines
  ADD COLUMN IF NOT EXISTS article_discount_percent_snapshot NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS article_discount_fixed_eur_snapshot NUMERIC(10,2);

COMMENT ON COLUMN sale_lines.article_discount_percent_snapshot IS 'Discount percentage from article at time of sale (0-100)';
COMMENT ON COLUMN sale_lines.article_discount_fixed_eur_snapshot IS 'Fixed discount amount in EUR from article at time of sale';
