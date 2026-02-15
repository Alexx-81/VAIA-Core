-- View за изчислени стойности на редове от продажби
CREATE VIEW sale_lines_computed AS
SELECT 
  sl.id,
  sl.sale_id,
  sl.article_id,
  a.name as article_name,
  sl.quantity,
  sl.unit_price_eur,
  sl.real_delivery_id,
  sl.accounting_delivery_id,
  sl.kg_per_piece_snapshot,
  sl.unit_cost_per_kg_real_snapshot,
  sl.unit_cost_per_kg_acc_snapshot,
  
  -- Изчислени стойности
  sl.quantity * sl.unit_price_eur as revenue_eur,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) as kg_line,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0) as cogs_real_eur,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0) as cogs_acc_eur,
  
  -- Profit
  sl.quantity * sl.unit_price_eur - 
    sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0) as profit_real_eur,
  sl.quantity * sl.unit_price_eur - 
    sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0) as profit_acc_eur
    
FROM sale_lines sl
JOIN articles a ON a.id = sl.article_id;

-- View за обобщение на продажби
CREATE VIEW sales_summary AS
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
  s.created_at,
  s.updated_at
FROM sales s
LEFT JOIN sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id;

-- Коментари
COMMENT ON VIEW sale_lines_computed IS 'Редове от продажби с изчислени стойности';
COMMENT ON VIEW sales_summary IS 'Обобщение на продажби с totals';
