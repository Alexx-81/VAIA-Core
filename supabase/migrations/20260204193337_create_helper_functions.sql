-- Функция за генериране на следващ номер на продажба
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
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

-- Тригер за автоматично попълване на sale_number при INSERT
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sale_number
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_number();

-- Тригер за обновяване на last_sold_at на артикул при продажба
CREATE OR REPLACE FUNCTION update_article_last_sold_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles
  SET last_sold_at = NOW()
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_last_sold
  AFTER INSERT ON sale_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_article_last_sold_at();

-- Функция за snapshot на sale_line при финализиране
CREATE OR REPLACE FUNCTION finalize_sale(p_sale_id UUID)
RETURNS void AS $$
BEGIN
  -- Обновяваме snapshots за всички линии
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
  
  -- Маркираме продажбата като финализирана
  UPDATE sales
  SET status = 'finalized', finalized_at = NOW()
  WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql;

-- Коментари
COMMENT ON FUNCTION generate_sale_number() IS 'Генерира следващ номер на продажба във формат S-YYYY-MM-NNN';
COMMENT ON FUNCTION finalize_sale(UUID) IS 'Финализира продажба и записва snapshots на цени';
