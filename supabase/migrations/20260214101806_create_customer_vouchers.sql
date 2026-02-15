-- =============================================
-- Loyalty Program: Customer Vouchers
-- =============================================

-- Enum for voucher status
CREATE TYPE public.voucher_status AS ENUM ('issued', 'redeemed', 'expired', 'void');

CREATE TABLE IF NOT EXISTS public.customer_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES public.voucher_rules(id) ON DELETE SET NULL,
  amount_eur NUMERIC(10, 2) NOT NULL,
  min_purchase_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status public.voucher_status NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_from_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  cycle_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Anti-duplicate: one voucher per rule per cycle per customer
  UNIQUE(customer_id, rule_id, cycle_key)
);

-- Indexes
CREATE INDEX idx_cv_customer_id ON public.customer_vouchers(customer_id);
CREATE INDEX idx_cv_status ON public.customer_vouchers(status);
CREATE INDEX idx_cv_expires_at ON public.customer_vouchers(expires_at);
CREATE INDEX idx_cv_redeemed_sale_id ON public.customer_vouchers(redeemed_sale_id);

-- Auto-update updated_at
CREATE TRIGGER update_cv_updated_at
  BEFORE UPDATE ON public.customer_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "cv_select_authenticated"
  ON public.customer_vouchers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cv_insert_non_demo"
  ON public.customer_vouchers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());

CREATE POLICY "cv_update_non_demo"
  ON public.customer_vouchers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

CREATE POLICY "cv_delete_admin"
  ON public.customer_vouchers FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.customer_vouchers IS 'Издадени ваучери на клиенти с snapshot на условията';
