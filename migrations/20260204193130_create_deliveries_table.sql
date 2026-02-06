-- Таблица за доставки
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL, -- "1", "1A", "2", etc. (визуален идентификатор)
  date DATE NOT NULL,
  quality_id INTEGER NOT NULL REFERENCES qualities(id) ON DELETE RESTRICT,
  kg_in NUMERIC(10, 3) NOT NULL CHECK (kg_in > 0), -- Входни килограми
  unit_cost_per_kg NUMERIC(10, 4) NOT NULL CHECK (unit_cost_per_kg >= 0), -- EUR/kg доставна цена
  invoice_number TEXT, -- Номер на фактура (optional)
  supplier_name TEXT, -- Име на доставчик (optional)
  note TEXT, -- Бележка (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекси за бързо търсене
CREATE INDEX idx_deliveries_display_id ON deliveries(display_id);
CREATE INDEX idx_deliveries_date ON deliveries(date);
CREATE INDEX idx_deliveries_quality_id ON deliveries(quality_id);
CREATE INDEX idx_deliveries_invoice_number ON deliveries(invoice_number);
CREATE INDEX idx_deliveries_supplier_name ON deliveries(supplier_name);

-- Тригер за автоматично обновяване на updated_at
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Коментар
COMMENT ON TABLE deliveries IS 'Входящи доставки с количества и цени';
COMMENT ON COLUMN deliveries.display_id IS 'Визуален ID като 1, 1A, 2 - за групиране на фактурирани/нефактурирани';
COMMENT ON COLUMN deliveries.kg_in IS 'Входящи килограми от доставката';
COMMENT ON COLUMN deliveries.unit_cost_per_kg IS 'Цена на килограм в EUR';
