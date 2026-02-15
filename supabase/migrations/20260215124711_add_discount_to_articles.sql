-- =============================================
-- Add discount fields to articles table
-- =============================================

-- Add discount columns
ALTER TABLE public.articles
  ADD COLUMN discount_percent NUMERIC(5, 2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN discount_fixed_eur NUMERIC(10, 2) DEFAULT 0 CHECK (discount_fixed_eur >= 0);

-- Comments
COMMENT ON COLUMN public.articles.discount_percent IS 'Процент отстъпка (0-100%)';
COMMENT ON COLUMN public.articles.discount_fixed_eur IS 'Фиксирана отстъпка в EUR';
