-- Таблица за настройки (key-value store с JSON)
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default', -- Може да има само един ред за сега
  
  -- Общи настройки
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Sofia',
  sale_number_format TEXT NOT NULL DEFAULT 'auto-mmyyyy' CHECK (sale_number_format IN ('auto-mmyyyy', 'uuid-short')),
  
  -- Форматиране и точност
  decimals_eur INTEGER NOT NULL DEFAULT 2 CHECK (decimals_eur IN (0, 2, 3)),
  decimals_kg INTEGER NOT NULL DEFAULT 2 CHECK (decimals_kg IN (2, 3)),
  kg_rounding TEXT NOT NULL DEFAULT 'none' CHECK (kg_rounding IN ('none', '0.01', '0.05')),
  cost_rounding TEXT NOT NULL DEFAULT 'standard' CHECK (cost_rounding IN ('standard', 'bankers')),
  
  -- Наличности и валидации
  min_kg_threshold NUMERIC(10, 3) NOT NULL DEFAULT 5.0,
  block_sale_on_insufficient_real BOOLEAN NOT NULL DEFAULT false,
  block_sale_on_insufficient_accounting BOOLEAN NOT NULL DEFAULT false,
  allow_zero_price_sales BOOLEAN NOT NULL DEFAULT false,
  delivery_edit_mode TEXT NOT NULL DEFAULT 'note-only' CHECK (delivery_edit_mode IN ('forbidden', 'note-only', 'allow-all')),
  allow_article_kg_edit BOOLEAN NOT NULL DEFAULT true,
  
  -- Export настройки
  default_export_format TEXT NOT NULL DEFAULT 'excel' CHECK (default_export_format IN ('csv', 'excel', 'pdf')),
  csv_separator TEXT NOT NULL DEFAULT ';' CHECK (csv_separator IN (';', ',')),
  csv_encoding TEXT NOT NULL DEFAULT 'utf-8-bom' CHECK (csv_encoding IN ('utf-8', 'utf-8-bom')),
  excel_include_summary BOOLEAN NOT NULL DEFAULT true,
  excel_include_transactions BOOLEAN NOT NULL DEFAULT true,
  excel_auto_column_width BOOLEAN NOT NULL DEFAULT true,
  excel_bold_header BOOLEAN NOT NULL DEFAULT true,
  excel_freeze_first_row BOOLEAN NOT NULL DEFAULT true,
  excel_number_formats BOOLEAN NOT NULL DEFAULT true,
  pdf_orientation TEXT NOT NULL DEFAULT 'landscape' CHECK (pdf_orientation IN ('portrait', 'landscape')),
  pdf_page_size TEXT NOT NULL DEFAULT 'a4' CHECK (pdf_page_size IN ('a4', 'letter')),
  pdf_include_logo BOOLEAN NOT NULL DEFAULT false,
  pdf_logo_url TEXT,
  pdf_include_footer BOOLEAN NOT NULL DEFAULT true,
  pdf_footer_text TEXT NOT NULL DEFAULT 'Генерирано от VAIA Core',
  pdf_include_transactions BOOLEAN NOT NULL DEFAULT true,
  
  -- Данни за отчет
  company_name TEXT NOT NULL DEFAULT '',
  eik TEXT NOT NULL DEFAULT '',
  company_address TEXT NOT NULL DEFAULT '',
  contact_info TEXT NOT NULL DEFAULT '',
  accounting_report_title TEXT NOT NULL DEFAULT 'Счетоводен отчет',
  real_report_title TEXT NOT NULL DEFAULT 'Реален отчет',
  signature TEXT NOT NULL DEFAULT '',
  
  -- File name templates
  file_name_template_accounting TEXT NOT NULL DEFAULT 'accounting-report-{date}',
  file_name_template_real TEXT NOT NULL DEFAULT 'real-report-{date}',
  file_name_template_inventory TEXT NOT NULL DEFAULT 'inventory-{date}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Вмъкваме default настройки
INSERT INTO app_settings (id) VALUES ('default');

-- Тригер за автоматично обновяване на updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Коментар
COMMENT ON TABLE app_settings IS 'Настройки на приложението (singleton)';
