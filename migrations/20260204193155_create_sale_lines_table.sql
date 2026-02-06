-- Таблица за редове от продажби
CREATE TABLE sale_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0), -- Бройки (int)
  unit_price_eur NUMERIC(10, 4) NOT NULL CHECK (unit_price_eur >= 0), -- Цена/бр (EUR)
  real_delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE RESTRICT,
  accounting_delivery_id UUID REFERENCES deliveries(id) ON DELETE RESTRICT, -- Само ако Real е без фактура
  
  -- Snapshots (записват се при финализиране за исторически данни)
  kg_per_piece_snapshot NUMERIC(10, 6), -- gramsPerPiece / 1000
  unit_cost_per_kg_real_snapshot NUMERIC(10, 4),
  unit_cost_per_kg_acc_snapshot NUMERIC(10, 4),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекси
CREATE INDEX idx_sale_lines_sale_id ON sale_lines(sale_id);
CREATE INDEX idx_sale_lines_article_id ON sale_lines(article_id);
CREATE INDEX idx_sale_lines_real_delivery_id ON sale_lines(real_delivery_id);
CREATE INDEX idx_sale_lines_accounting_delivery_id ON sale_lines(accounting_delivery_id);

-- Тригер за автоматично обновяване на updated_at
CREATE TRIGGER update_sale_lines_updated_at
  BEFORE UPDATE ON sale_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Коментар
COMMENT ON TABLE sale_lines IS 'Редове от продажби с артикул, количество и цена';
COMMENT ON COLUMN sale_lines.real_delivery_id IS 'Реална доставка от която се изважда стока';
COMMENT ON COLUMN sale_lines.accounting_delivery_id IS 'Счетоводна доставка (ако реалната е без фактура)';
COMMENT ON COLUMN sale_lines.kg_per_piece_snapshot IS 'Snapshot на kg/бр при финализиране';
