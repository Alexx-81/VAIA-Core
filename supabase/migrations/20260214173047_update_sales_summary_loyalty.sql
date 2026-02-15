-- =============================================
-- Update sales_summary view to include loyalty fields
-- =============================================

DROP VIEW IF EXISTS public.sales_summary CASCADE;

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
  COALESCE(SUM(slc.profit_real_eur), 0) as total_profit_real_eur,
  COALESCE(SUM(slc.profit_acc_eur), 0) as total_profit_acc_eur,
  -- Margin calculations
  CASE 
    WHEN COALESCE(SUM(slc.revenue_eur), 0) > 0 
    THEN (COALESCE(SUM(slc.profit_real_eur), 0) / COALESCE(SUM(slc.revenue_eur), 0)) * 100
    ELSE 0
  END as total_margin_real_percent,
  CASE 
    WHEN COALESCE(SUM(slc.revenue_eur), 0) > 0 
    THEN (COALESCE(SUM(slc.profit_acc_eur), 0) / COALESCE(SUM(slc.revenue_eur), 0)) * 100
    ELSE 0
  END as total_margin_acc_percent,
  s.created_at,
  s.updated_at
FROM public.sales s
LEFT JOIN public.sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id;

COMMENT ON VIEW public.sales_summary IS 'Обобщение на продажби с loyalty полета, изчислени стойности и марж';
