-- Премахваме SECURITY DEFINER от view-тата (те са SECURITY INVOKER по подразбиране)
-- Трябва да ги пресъздадем

-- Drop existing views
DROP VIEW IF EXISTS sales_summary CASCADE;
DROP VIEW IF EXISTS sale_lines_computed CASCADE;
DROP VIEW IF EXISTS delivery_inventory CASCADE;
DROP VIEW IF EXISTS delivery_sales_accounting CASCADE;
DROP VIEW IF EXISTS delivery_sales_real CASCADE;

-- Recreate views with explicit SECURITY INVOKER
CREATE VIEW delivery_sales_real 
WITH (security_invoker = on)
AS
SELECT 
  d.id as delivery_id,
  COALESCE(SUM(
    sl.quantity * sl.kg_per_piece_snapshot
  ), 0) as kg_sold_real
FROM deliveries d
LEFT JOIN sale_lines sl ON sl.real_delivery_id = d.id
LEFT JOIN sales s ON s.id = sl.sale_id AND s.status = 'finalized'
GROUP BY d.id;

CREATE VIEW delivery_sales_accounting
WITH (security_invoker = on)
AS
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

CREATE VIEW delivery_inventory
WITH (security_invoker = on)
AS
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

CREATE VIEW sale_lines_computed
WITH (security_invoker = on)
AS
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
  sl.quantity * sl.unit_price_eur as revenue_eur,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) as kg_line,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0) as cogs_real_eur,
  sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0) as cogs_acc_eur,
  sl.quantity * sl.unit_price_eur - 
    sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_real_snapshot, 0) as profit_real_eur,
  sl.quantity * sl.unit_price_eur - 
    sl.quantity * COALESCE(sl.kg_per_piece_snapshot, 0) * COALESCE(sl.unit_cost_per_kg_acc_snapshot, sl.unit_cost_per_kg_real_snapshot, 0) as profit_acc_eur
FROM sale_lines sl
JOIN articles a ON a.id = sl.article_id;

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
  s.created_at,
  s.updated_at
FROM sales s
LEFT JOIN sale_lines_computed slc ON slc.sale_id = s.id
GROUP BY s.id;

-- Fix functions search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  current_month INTEGER;
  next_num INTEGER;
  sale_prefix TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  current_month := EXTRACT(MONTH FROM NOW());
  sale_prefix := 'S-' || current_year || '-' || LPAD(current_month::TEXT, 2, '0') || '-';
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(sale_number FROM LENGTH(sale_prefix) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM sales
  WHERE sale_number LIKE sale_prefix || '%';
  
  RETURN sale_prefix || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_article_last_sold_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE articles
  SET last_sold_at = NOW()
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION finalize_sale(p_sale_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sale_lines sl
  SET 
    kg_per_piece_snapshot = a.grams_per_piece::NUMERIC / 1000,
    unit_cost_per_kg_real_snapshot = rd.unit_cost_per_kg,
    unit_cost_per_kg_acc_snapshot = COALESCE(ad.unit_cost_per_kg, rd.unit_cost_per_kg)
  FROM articles a
  JOIN deliveries rd ON rd.id = sl.real_delivery_id
  LEFT JOIN deliveries ad ON ad.id = sl.accounting_delivery_id
  WHERE sl.sale_id = p_sale_id
    AND sl.article_id = a.id;
  
  UPDATE sales
  SET status = 'finalized', finalized_at = NOW()
  WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql;
