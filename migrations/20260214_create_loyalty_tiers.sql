-- =============================================
-- Loyalty Program: Tiers Configuration
-- =============================================

CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  min_turnover_12m_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for sorting
CREATE INDEX idx_loyalty_tiers_sort_order ON public.loyalty_tiers(sort_order);

-- Auto-update updated_at
CREATE TRIGGER update_loyalty_tiers_updated_at
  BEFORE UPDATE ON public.loyalty_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default tiers
INSERT INTO public.loyalty_tiers (name, sort_order, min_turnover_12m_eur, discount_percent) VALUES
  ('START',  0,   0.00,  3.00),
  ('SILVER', 1, 120.00,  5.00),
  ('GOLD',   2, 240.00,  8.00),
  ('VIP',    3, 420.00, 12.00),
  ('ELITE',  4, 600.00, 15.00);

-- Enable RLS
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "loyalty_tiers_select_authenticated"
  ON public.loyalty_tiers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "loyalty_tiers_insert_admin"
  ON public.loyalty_tiers FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "loyalty_tiers_update_admin"
  ON public.loyalty_tiers FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "loyalty_tiers_delete_admin"
  ON public.loyalty_tiers FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.loyalty_tiers IS 'Конфигурация на нива в програмата за лоялност';
