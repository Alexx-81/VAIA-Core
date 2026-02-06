-- Таблица за артикули (продуктов каталог)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  grams_per_piece INTEGER NOT NULL CHECK (grams_per_piece > 0), -- Тегло в грамове за точност
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sold_at TIMESTAMPTZ, -- Последна продажба
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекси за бързо търсене
CREATE INDEX idx_articles_name ON articles(name);
CREATE INDEX idx_articles_is_active ON articles(is_active);
CREATE INDEX idx_articles_last_sold_at ON articles(last_sold_at);

-- Тригер за автоматично обновяване на updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Коментар
COMMENT ON TABLE articles IS 'Артикули/продукти с тегло за калкулиране на kg';
