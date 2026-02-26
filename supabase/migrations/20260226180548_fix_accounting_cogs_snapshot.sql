-- =============================================
-- Fix: Accounting COGS snapshot incorrect when real delivery is invoiced
-- =============================================
-- Issue: When a sale line's real_delivery is already invoiced (accounting_delivery_id IS NULL),
-- the frontend was storing unit_cost_per_kg_acc_snapshot = 0 instead of the real delivery cost.
-- This caused accounting profit to appear inflated (= full revenue) in Statistics.
--
-- Root cause: createSale() used `unitCostPerKgAccSnapshot || 0` which stored 0 when
-- the real delivery was invoiced (no accounting delivery needed).
--
-- Fix strategy:
-- 1. Repair existing bad data: set unit_cost_per_kg_acc_snapshot = unit_cost_per_kg_real_snapshot
--    for all sale_lines where accounting_delivery_id IS NULL and acc snapshot is wrong (0 or NULL).
-- 2. Recreate sale_lines_computed view with defensive logic:
--    when accounting_delivery_id IS NULL → use real cost for accounting cost.
-- 3. Recreate sales_summary to keep it consistent.
-- =============================================

-- Step 1: Fix existing bad data
UPDATE public.sale_lines
SET unit_cost_per_kg_acc_snapshot = unit_cost_per_kg_real_snapshot
WHERE accounting_delivery_id IS NULL
  AND (unit_cost_per_kg_acc_snapshot = 0 OR unit_cost_per_kg_acc_snapshot IS NULL)
  AND unit_cost_per_kg_real_snapshot IS NOT NULL;

-- Step 2: Recreate sale_lines_computed with the fix (CASCADE drops sales_summary too)
DROP VIEW IF EXISTS public.sale_lines_computed CASCADE;

CREATE VIEW public.sale_lines_computed
WITH (security_invoker = on)
AS
SELECT
  sl.id,
  sl.sale_id,
  sl.article_id,
  a.name AS article_name,
  sl.quantity,
  sl.unit_price_eur,
  sl.real_delivery_id,
  sl.accounting_delivery_id,
  sl.kg_per_piece_snapshot,
  sl.unit_cost_per_kg_real_snapshot,
  sl.unit_cost_per_kg_acc_snapshot,

  -- Revenue
  sl.quantity::numeric * sl.unit_price_eur AS revenue_eur,

  -- KG
  sl.quantity::numeric * COALESCE(sl.kg_per_piece_snapshot, 0::numeric) AS kg_line,

  -- Real COGS
  sl.quantity::numeric * COALESCE(sl.kg_per_piece_snapshot, 0::numeric)
    * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0::numeric) AS cogs_real_eur,

  -- Accounting COGS:
  -- FIX: when accounting_delivery_id IS NULL (real delivery is already invoiced),
  -- the accounting cost equals the real cost. Using CASE WHEN prevents 0 from
  -- being treated as a valid cost and avoids inflated accounting profit.
  sl.quantity::numeric * COALESCE(sl.kg_per_piece_snapshot, 0::numeric)
    * CASE
        WHEN sl.accounting_delivery_id IS NULL
          THEN COALESCE(sl.unit_cost_per_kg_real_snapshot, 0::numeric)
        ELSE COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0::numeric)
      END AS cogs_acc_eur,

  -- Real profit
  sl.quantity::numeric * sl.unit_price_eur
    - sl.quantity::numeric * COALESCE(sl.kg_per_piece_snapshot, 0::numeric)
      * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0::numeric) AS profit_real_eur,

  -- Accounting profit (same FIX as cogs_acc_eur)
  sl.quantity::numeric * sl.unit_price_eur
    - sl.quantity::numeric * COALESCE(sl.kg_per_piece_snapshot, 0::numeric)
      * CASE
          WHEN sl.accounting_delivery_id IS NULL
            THEN COALESCE(sl.unit_cost_per_kg_real_snapshot, 0::numeric)
          ELSE COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0::numeric)
        END AS profit_acc_eur

FROM public.sale_lines sl
JOIN public.articles a ON a.id = sl.article_id;

COMMENT ON VIEW public.sale_lines_computed IS 'Редове от продажби с изчислени стойности. Счетоводната себестойност използва реалната доставка когато няма отделна счетоводна (accounting_delivery_id IS NULL).';

-- Step 3: Recreate sales_summary (was dropped by CASCADE above)
CREATE VIEW public.sales_summary
WITH (security_invoker = on)
AS
SELECT
  s.id,
  s.sale_number,
  s.date_time,
  s.payment_method,
  s.customer_id,
  s.note,
  s.status,
  s.finalized_at,
  -- Loyalty fields
  s.loyalty_mode,
  s.regular_subtotal_eur,
  s.promo_subtotal_eur,
  s.tier_discount_percent,
  s.tier_discount_amount_eur,
  s.voucher_id,
  s.voucher_amount_applied_eur,
  s.total_paid_eur,
  -- Aggregated line data
  COUNT(slc.id) AS lines_count,
  COALESCE(SUM(slc.quantity), 0) AS total_pieces,
  COALESCE(SUM(slc.kg_line), 0) AS total_kg,
  COALESCE(SUM(slc.revenue_eur), 0) AS total_revenue_eur,
  COALESCE(SUM(slc.cogs_real_eur), 0) AS total_cogs_real_eur,
  COALESCE(SUM(slc.cogs_acc_eur), 0) AS total_cogs_acc_eur,

  -- Profit uses total_paid_eur (actual amount after discounts/vouchers) when available
  COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_real_eur), 0) AS total_profit_real_eur,
  COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_acc_eur), 0) AS total_profit_acc_eur,

  -- Margin (real)
  CASE
    WHEN COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) > 0
    THEN (
      (COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_real_eur), 0))
      / COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0))
    ) * 100
    ELSE 0
  END AS total_margin_real_percent,

  -- Margin (accounting)
  CASE
    WHEN COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) > 0
    THEN (
      (COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_acc_eur), 0))
      / COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0))
    ) * 100
    ELSE 0
  END AS total_margin_acc_percent,

  s.created_at,
  s.updated_at
FROM public.sales s
LEFT JOIN public.sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id, s.sale_number, s.date_time, s.payment_method, s.customer_id, s.note,
         s.status, s.finalized_at, s.loyalty_mode, s.regular_subtotal_eur,
         s.promo_subtotal_eur, s.tier_discount_percent, s.tier_discount_amount_eur,
         s.voucher_id, s.voucher_amount_applied_eur, s.total_paid_eur,
         s.created_at, s.updated_at;

COMMENT ON VIEW public.sales_summary IS 'Обобщение на продажби с loyalty полета и коректни изчисления на себестойност и печалба (включително fix за счетоводна себестойност).';
