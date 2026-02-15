-- =============================================
-- Fix profit calculations to account for loyalty discounts and vouchers
-- =============================================
-- Issue: When a sale has voucher or loyalty discount (total_paid_eur < total_revenue_eur),
-- the profit calculation was inconsistent:
-- - Individual lines showed profit based on full price
-- - Totals used discounted price (total_paid_eur)
-- - Database view didn't account for discounts at all
-- =============================================

-- Drop existing view
DROP VIEW IF EXISTS public.sales_summary CASCADE;

-- Recreate with corrected profit calculations
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
  COUNT(slc.id) as lines_count,
  COALESCE(SUM(slc.quantity), 0) as total_pieces,
  COALESCE(SUM(slc.kg_line), 0) as total_kg,
  COALESCE(SUM(slc.revenue_eur), 0) as total_revenue_eur,
  COALESCE(SUM(slc.cogs_real_eur), 0) as total_cogs_real_eur,
  COALESCE(SUM(slc.cogs_acc_eur), 0) as total_cogs_acc_eur,
  
  -- FIXED: Profit calculations now use total_paid_eur (actual amount paid after discounts)
  -- If total_paid_eur is NULL (no discount), falls back to total_revenue_eur
  COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_real_eur), 0) as total_profit_real_eur,
  COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_acc_eur), 0) as total_profit_acc_eur,
  
  -- FIXED: Margin calculations now use total_paid_eur (actual amount paid after discounts)
  CASE 
    WHEN COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) > 0 
    THEN (
      (COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_real_eur), 0)) 
      / COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0))
    ) * 100
    ELSE 0
  END as total_margin_real_percent,
  
  CASE 
    WHEN COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) > 0 
    THEN (
      (COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0)) - COALESCE(SUM(slc.cogs_acc_eur), 0)) 
      / COALESCE(s.total_paid_eur, COALESCE(SUM(slc.revenue_eur), 0))
    ) * 100
    ELSE 0
  END as total_margin_acc_percent,
  
  s.created_at,
  s.updated_at
FROM public.sales s
LEFT JOIN public.sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id, s.sale_number, s.date_time, s.payment_method, s.customer_id, s.note, 
         s.status, s.finalized_at, s.loyalty_mode, s.regular_subtotal_eur, 
         s.promo_subtotal_eur, s.tier_discount_percent, s.tier_discount_amount_eur,
         s.voucher_id, s.voucher_amount_applied_eur, s.total_paid_eur,
         s.created_at, s.updated_at;

COMMENT ON VIEW public.sales_summary IS 'Обобщение на продажби с loyalty полета и КОРЕКТНИ изчисления на печалба (с отстъпки)';
