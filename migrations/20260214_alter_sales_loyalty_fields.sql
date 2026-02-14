-- =============================================
-- Add loyalty-related columns to sales and sale_lines
-- =============================================

-- Sales: loyalty mode and computed amounts
ALTER TABLE public.sales
  ADD COLUMN loyalty_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (loyalty_mode IN ('none', 'tier', 'voucher')),
  ADD COLUMN regular_subtotal_eur NUMERIC(10, 2),
  ADD COLUMN promo_subtotal_eur NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN tier_discount_percent NUMERIC(5, 2),
  ADD COLUMN tier_discount_amount_eur NUMERIC(10, 2),
  ADD COLUMN voucher_id UUID REFERENCES public.customer_vouchers(id) ON DELETE SET NULL,
  ADD COLUMN voucher_amount_applied_eur NUMERIC(10, 2),
  ADD COLUMN total_paid_eur NUMERIC(10, 2);

-- Sale lines: regular vs promo marker
ALTER TABLE public.sale_lines
  ADD COLUMN is_regular_price BOOLEAN NOT NULL DEFAULT true;

-- Index on voucher_id for lookups
CREATE INDEX idx_sales_voucher_id ON public.sales(voucher_id);

COMMENT ON COLUMN public.sales.loyalty_mode IS 'Режим на лоялност: none, tier или voucher';
COMMENT ON COLUMN public.sales.regular_subtotal_eur IS 'Сума на редовете с редовна цена';
COMMENT ON COLUMN public.sales.promo_subtotal_eur IS 'Сума на промо редовете';
COMMENT ON COLUMN public.sales.tier_discount_percent IS 'Процент отстъпка по ниво (ако loyalty_mode=tier)';
COMMENT ON COLUMN public.sales.tier_discount_amount_eur IS 'Сума отстъпка по ниво';
COMMENT ON COLUMN public.sales.total_paid_eur IS 'Крайна сума за плащане след отстъпки/ваучери';
COMMENT ON COLUMN public.sale_lines.is_regular_price IS 'true=редовна цена, false=промо/намалена';
