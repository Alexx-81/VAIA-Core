-- Таблица за качества (категории продукти)
CREATE TABLE qualities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс за бързо търсене по име
CREATE INDEX idx_qualities_name ON qualities(name);
CREATE INDEX idx_qualities_is_active ON qualities(is_active);

-- Тригер за автоматично обновяване на updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qualities_updated_at
  BEFORE UPDATE ON qualities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Добавяме коментар
COMMENT ON TABLE qualities IS 'Качества/категории на продуктите за доставки';
