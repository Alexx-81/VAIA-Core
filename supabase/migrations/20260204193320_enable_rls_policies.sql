-- Активираме Row Level Security за всички таблици
ALTER TABLE qualities ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Политики за анонимен достъп (за development - после ще се промени за auth)
-- Qualities
CREATE POLICY "Allow all access to qualities" ON qualities
  FOR ALL USING (true) WITH CHECK (true);

-- Articles
CREATE POLICY "Allow all access to articles" ON articles
  FOR ALL USING (true) WITH CHECK (true);

-- Deliveries
CREATE POLICY "Allow all access to deliveries" ON deliveries
  FOR ALL USING (true) WITH CHECK (true);

-- Sales
CREATE POLICY "Allow all access to sales" ON sales
  FOR ALL USING (true) WITH CHECK (true);

-- Sale Lines
CREATE POLICY "Allow all access to sale_lines" ON sale_lines
  FOR ALL USING (true) WITH CHECK (true);

-- App Settings
CREATE POLICY "Allow all access to app_settings" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);
