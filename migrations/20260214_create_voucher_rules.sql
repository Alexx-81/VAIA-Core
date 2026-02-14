-- =============================================
-- Loyalty Program: Voucher Rules Configuration
-- =============================================

CREATE TABLE IF NOT EXISTS public.voucher_rules (
  id SERIAL PRIMARY KEY,
  trigger_turnover_12m_eur NUMERIC(10, 2) NOT NULL,
  voucher_amount_eur NUMERIC(10, 2) NOT NULL,
  valid_days INTEGER NOT NULL DEFAULT 30,
  min_purchase_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_voucher_rules_trigger ON public.voucher_rules(trigger_turnover_12m_eur);

-- Auto-update updated_at
CREATE TRIGGER update_voucher_rules_updated_at
  BEFORE UPDATE ON public.voucher_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default rules
INSERT INTO public.voucher_rules (trigger_turnover_12m_eur, voucher_amount_eur, valid_days, min_purchase_eur) VALUES
  (150.00,  5.00, 30, 20.00),
  (300.00, 10.00, 30, 35.00);

-- Enable RLS
ALTER TABLE public.voucher_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "voucher_rules_select_authenticated"
  ON public.voucher_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "voucher_rules_insert_admin"
  ON public.voucher_rules FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "voucher_rules_update_admin"
  ON public.voucher_rules FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "voucher_rules_delete_admin"
  ON public.voucher_rules FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.voucher_rules IS 'Правила за издаване на ваучери при достигане на оборот';
