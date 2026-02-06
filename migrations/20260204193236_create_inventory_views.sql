-- View за изчисляване на продадени kg от всяка доставка (Real)
CREATE VIEW delivery_sales_real AS
SELECT 
  d.id as delivery_id,
  COALESCE(SUM(
    sl.quantity * sl.kg_per_piece_snapshot
  ), 0) as kg_sold_real
FROM deliveries d
LEFT JOIN sale_lines sl ON sl.real_delivery_id = d.id
LEFT JOIN sales s ON s.id = sl.sale_id AND s.status = 'finalized'
GROUP BY d.id;

-- View за изчисляване на продадени kg от всяка доставка (Accounting)
CREATE VIEW delivery_sales_accounting AS
SELECT 
  d.id as delivery_id,
  COALESCE(SUM(
    CASE 
      WHEN sl.accounting_delivery_id = d.id THEN sl.quantity * sl.kg_per_piece_snapshot
      WHEN sl.accounting_delivery_id IS NULL AND sl.real_delivery_id = d.id THEN sl.quantity * sl.kg_per_piece_snapshot
      ELSE 0
    END
  ), 0) as kg_sold_acc
FROM deliveries d
LEFT JOIN sale_lines sl ON sl.real_delivery_id = d.id OR sl.accounting_delivery_id = d.id
LEFT JOIN sales s ON s.id = sl.sale_id AND s.status = 'finalized'
GROUP BY d.id;

-- Пълен view за наличности на доставки
CREATE VIEW delivery_inventory AS
SELECT 
  d.id,
  d.display_id,
  d.date,
  d.quality_id,
  q.name as quality_name,
  d.invoice_number,
  d.supplier_name,
  d.invoice_number IS NOT NULL AND d.invoice_number != '' as is_invoiced,
  d.kg_in,
  d.unit_cost_per_kg,
  d.kg_in * d.unit_cost_per_kg as total_cost_eur,
  COALESCE(dsr.kg_sold_real, 0) as kg_sold_real,
  d.kg_in - COALESCE(dsr.kg_sold_real, 0) as kg_remaining_real,
  COALESCE(dsa.kg_sold_acc, 0) as kg_sold_acc,
  d.kg_in - COALESCE(dsa.kg_sold_acc, 0) as kg_remaining_acc,
  d.note,
  d.created_at,
  d.updated_at
FROM deliveries d
JOIN qualities q ON q.id = d.quality_id
LEFT JOIN delivery_sales_real dsr ON dsr.delivery_id = d.id
LEFT JOIN delivery_sales_accounting dsa ON dsa.delivery_id = d.id;

-- Коментари
COMMENT ON VIEW delivery_sales_real IS 'Изчислява продадените kg (Real) за всяка доставка';
COMMENT ON VIEW delivery_sales_accounting IS 'Изчислява продадените kg (Accounting) за всяка доставка';
COMMENT ON VIEW delivery_inventory IS 'Пълна информация за наличности на доставки';
