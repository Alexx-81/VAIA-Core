// API функции за настройки (Settings)
import { supabase } from '../supabase';
import type { AppSettings, AppSettingsUpdate } from '../supabase/types';

// Взима настройките
export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) throw error;
  return data;
}

// Обновява настройките
export async function updateSettings(updates: AppSettingsUpdate): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update(updates)
    .eq('id', 'default')
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Помощни функции за преобразуване на настройките към app формат
export function mapSettingsToApp(settings: AppSettings) {
  return {
    general: {
      currency: settings.currency as 'EUR',
      timezone: settings.timezone,
      saleNumberFormat: settings.sale_number_format as 'auto-mmyyyy' | 'uuid-short',
    },
    formatting: {
      decimalsEur: settings.decimals_eur as 0 | 2 | 3,
      decimalsKg: settings.decimals_kg as 2 | 3,
      kgRounding: settings.kg_rounding as 'none' | '0.01' | '0.05',
      costRounding: settings.cost_rounding as 'standard' | 'bankers',
    },
    inventory: {
      minKgThreshold: settings.min_kg_threshold,
      blockSaleOnInsufficientReal: settings.block_sale_on_insufficient_real,
      blockSaleOnInsufficientAccounting: settings.block_sale_on_insufficient_accounting,
      allowZeroPriceSales: settings.allow_zero_price_sales,
      deliveryEditMode: settings.delivery_edit_mode as 'forbidden' | 'note-only' | 'allow-all',
      allowArticleKgEdit: settings.allow_article_kg_edit,
    },
    export: {
      defaultFormat: settings.default_export_format as 'csv' | 'excel' | 'pdf',
      fileNameTemplateAccounting: settings.file_name_template_accounting,
      fileNameTemplateReal: settings.file_name_template_real,
      fileNameTemplateInventory: settings.file_name_template_inventory,
      csvSeparator: settings.csv_separator as ';' | ',',
      csvEncoding: settings.csv_encoding as 'utf-8' | 'utf-8-bom',
      excelIncludeSummary: settings.excel_include_summary,
      excelIncludeTransactions: settings.excel_include_transactions,
      excelAutoColumnWidth: settings.excel_auto_column_width,
      excelBoldHeader: settings.excel_bold_header,
      excelFreezeFirstRow: settings.excel_freeze_first_row,
      excelNumberFormats: settings.excel_number_formats,
      pdfOrientation: settings.pdf_orientation as 'portrait' | 'landscape',
      pdfPageSize: settings.pdf_page_size as 'a4' | 'letter',
      pdfIncludeLogo: settings.pdf_include_logo,
      pdfLogoUrl: settings.pdf_logo_url || undefined,
      pdfIncludeFooter: settings.pdf_include_footer,
      pdfFooterText: settings.pdf_footer_text,
      pdfIncludeTransactions: settings.pdf_include_transactions,
    },
    reportHeader: {
      companyName: settings.company_name,
      eik: settings.eik,
      address: settings.company_address,
      contactInfo: settings.contact_info,
      accountingReportTitle: settings.accounting_report_title,
      realReportTitle: settings.real_report_title,
      signature: settings.signature,
    },
  };
}

// Помощна функция за преобразуване от app формат към DB формат
export function mapAppToSettings(appSettings: ReturnType<typeof mapSettingsToApp>): AppSettingsUpdate {
  return {
    currency: appSettings.general.currency,
    timezone: appSettings.general.timezone,
    sale_number_format: appSettings.general.saleNumberFormat,
    decimals_eur: appSettings.formatting.decimalsEur,
    decimals_kg: appSettings.formatting.decimalsKg,
    kg_rounding: appSettings.formatting.kgRounding,
    cost_rounding: appSettings.formatting.costRounding,
    min_kg_threshold: appSettings.inventory.minKgThreshold,
    block_sale_on_insufficient_real: appSettings.inventory.blockSaleOnInsufficientReal,
    block_sale_on_insufficient_accounting: appSettings.inventory.blockSaleOnInsufficientAccounting,
    allow_zero_price_sales: appSettings.inventory.allowZeroPriceSales,
    delivery_edit_mode: appSettings.inventory.deliveryEditMode,
    allow_article_kg_edit: appSettings.inventory.allowArticleKgEdit,
    default_export_format: appSettings.export.defaultFormat,
    file_name_template_accounting: appSettings.export.fileNameTemplateAccounting,
    file_name_template_real: appSettings.export.fileNameTemplateReal,
    file_name_template_inventory: appSettings.export.fileNameTemplateInventory,
    csv_separator: appSettings.export.csvSeparator,
    csv_encoding: appSettings.export.csvEncoding,
    excel_include_summary: appSettings.export.excelIncludeSummary,
    excel_include_transactions: appSettings.export.excelIncludeTransactions,
    excel_auto_column_width: appSettings.export.excelAutoColumnWidth,
    excel_bold_header: appSettings.export.excelBoldHeader,
    excel_freeze_first_row: appSettings.export.excelFreezeFirstRow,
    excel_number_formats: appSettings.export.excelNumberFormats,
    pdf_orientation: appSettings.export.pdfOrientation,
    pdf_page_size: appSettings.export.pdfPageSize,
    pdf_include_logo: appSettings.export.pdfIncludeLogo,
    pdf_logo_url: appSettings.export.pdfLogoUrl || null,
    pdf_include_footer: appSettings.export.pdfIncludeFooter,
    pdf_footer_text: appSettings.export.pdfFooterText,
    pdf_include_transactions: appSettings.export.pdfIncludeTransactions,
    company_name: appSettings.reportHeader.companyName,
    eik: appSettings.reportHeader.eik,
    company_address: appSettings.reportHeader.address,
    contact_info: appSettings.reportHeader.contactInfo,
    accounting_report_title: appSettings.reportHeader.accountingReportTitle,
    real_report_title: appSettings.reportHeader.realReportTitle,
    signature: appSettings.reportHeader.signature,
  };
}
