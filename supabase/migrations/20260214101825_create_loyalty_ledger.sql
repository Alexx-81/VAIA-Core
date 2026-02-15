-- =============================================
-- Loyalty Program: Loyalty Ledger (turnover journal)
-- =============================================

-- Enum for ledger entry types
CREATE TYPE public.ledger_entry_type AS ENUM ('sale', 'refund', 'adjustment');

CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  entry_type public.ledger_entry_type NOT NULL,
  amount_eur NUMERIC(10, 2) NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast 12-month SUM queries
CREATE INDEX idx_ll_customer_posted ON public.loyalty_ledger(customer_id, posted_at);
CREATE INDEX idx_ll_sale_id ON public.loyalty_ledger(sale_id);

-- Enable RLS
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ll_select_authenticated"
  ON public.loyalty_ledger FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ll_insert_non_demo"
  ON public.loyalty_ledger FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());

CREATE POLICY "ll_delete_admin"
  ON public.loyalty_ledger FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.loyalty_ledger IS 'Дневник на оборота за програмата за лоялност';
