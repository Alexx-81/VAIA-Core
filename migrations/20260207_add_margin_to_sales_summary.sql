-- Пресъздаване на sales_summary view с марж калкулации
DROP VIEW IF EXISTS sales_summary CASCADE;

CREATE VIEW sales_summary
WITH (security_invoker = on)
AS
SELECT 
  s.id,
  s.sale_number,
  s.date_time,
  s.payment_method,
  s.note,
  s.status,
  s.finalized_at,
  COUNT(slc.id) as lines_count,
  COALESCE(SUM(slc.quantity), 0) as total_pieces,
  COALESCE(SUM(slc.kg_line), 0) as total_kg,
  COALESCE(SUM(slc.revenue_eur), 0) as total_revenue_eur,
  COALESCE(SUM(slc.cogs_real_eur), 0) as total_cogs_real_eur,
  COALESCE(SUM(slc.cogs_acc_eur), 0) as total_cogs_acc_eur,
  COALESCE(SUM(slc.profit_real_eur), 0) as total_profit_real_eur,
  COALESCE(SUM(slc.profit_acc_eur), 0) as total_profit_acc_eur,
  -- Изчисляване на марж (real)
  CASE 
    WHEN COALESCE(SUM(slc.revenue_eur), 0) > 0 
    THEN (COALESCE(SUM(slc.profit_real_eur), 0) / COALESCE(SUM(slc.revenue_eur), 0)) * 100
    ELSE 0
  END as total_margin_real_percent,
  -- Изчисляване на марж (accounting)
  CASE 
    WHEN COALESCE(SUM(slc.revenue_eur), 0) > 0 
    THEN (COALESCE(SUM(slc.profit_acc_eur), 0) / COALESCE(SUM(slc.revenue_eur), 0)) * 100
    ELSE 0
  END as total_margin_acc_percent,
  s.created_at,
  s.updated_at
FROM sales s
LEFT JOIN sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id;

COMMENT ON VIEW sales_summary IS 'Обобщение на продажби с изчислени стойности и марж';
