-- Тип за метод на плащане
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'other');

-- Тип за статус на продажба
CREATE TYPE sale_status AS ENUM ('draft', 'finalized');

-- Таблица за продажби (header)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE, -- "S-2026-001"
  date_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method payment_method NOT NULL DEFAULT 'cash',
  note TEXT,
  status sale_status NOT NULL DEFAULT 'draft',
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекси
CREATE INDEX idx_sales_sale_number ON sales(sale_number);
CREATE INDEX idx_sales_date_time ON sales(date_time);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Тригер за автоматично обновяване на updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Коментар
COMMENT ON TABLE sales IS 'Продажби (header) с номер, дата и метод на плащане';
