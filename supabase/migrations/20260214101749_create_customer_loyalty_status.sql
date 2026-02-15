-- =============================================
-- Loyalty Program: Customer Loyalty Status (1:1 with customers)
-- =============================================

CREATE TABLE IF NOT EXISTS public.customer_loyalty_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  current_tier_id INTEGER NOT NULL DEFAULT 1 REFERENCES public.loyalty_tiers(id),
  tier_reached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tier_locked_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 months'),
  turnover_12m_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_recalc_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cls_customer_id ON public.customer_loyalty_status(customer_id);
CREATE INDEX idx_cls_current_tier ON public.customer_loyalty_status(current_tier_id);

-- Auto-update updated_at
CREATE TRIGGER update_cls_updated_at
  BEFORE UPDATE ON public.customer_loyalty_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_loyalty_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "cls_select_authenticated"
  ON public.customer_loyalty_status FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cls_insert_non_demo"
  ON public.customer_loyalty_status FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());

CREATE POLICY "cls_update_non_demo"
  ON public.customer_loyalty_status FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

CREATE POLICY "cls_delete_admin"
  ON public.customer_loyalty_status FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.customer_loyalty_status IS 'Текущ loyalty статус за всеки клиент (1:1)';
