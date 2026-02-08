// Типове за настройки (Settings)

// ============ 1) Общи настройки ============
export type SaleNumberFormat = 'auto-mmyyyy' | 'uuid-short';

export interface GeneralSettings {
  currency: 'EUR'; // read-only
  timezone: string;
  saleNumberFormat: SaleNumberFormat;
}

// ============ 2) Форматиране и точност ============
export type DecimalsEur = 0 | 2 | 3;
export type DecimalsKg = 2 | 3;
export type KgRounding = 'none' | '0.01' | '0.05';
export type CostRounding = 'standard' | 'bankers';

export interface FormattingSettings {
  decimalsEur: DecimalsEur;
  decimalsKg: DecimalsKg;
  kgRounding: KgRounding;
  costRounding: CostRounding;
}

// ============ 3) Наличности и валидации ============
export type DeliveryEditMode = 'forbidden' | 'note-only' | 'allow-all';

export interface InventorySettings {
  minKgThreshold: number;
  blockSaleOnInsufficientReal: boolean;
  blockSaleOnInsufficientAccounting: boolean;
  allowZeroPriceSales: boolean;
  deliveryEditMode: DeliveryEditMode;
  allowArticleKgEdit: boolean;
}

// ============ 4) Експорт настройки ============
export type ExportDefaultFormat = 'csv' | 'excel' | 'pdf';
export type CsvSeparator = ';' | ',';
export type CsvEncoding = 'utf-8' | 'utf-8-bom';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfPageSize = 'a4' | 'letter';

export interface ExportSettings {
  // Общи
  defaultFormat: ExportDefaultFormat;
  fileNameTemplateAccounting: string;
  fileNameTemplateReal: string;
  fileNameTemplateInventory: string;
  csvSeparator: CsvSeparator;
  csvEncoding: CsvEncoding;
  
  // Excel
  excelIncludeSummary: boolean;
  excelIncludeTransactions: boolean;
  excelAutoColumnWidth: boolean;
  excelBoldHeader: boolean;
  excelFreezeFirstRow: boolean;
  excelNumberFormats: boolean;
  
  // PDF
  pdfOrientation: PdfOrientation;
  pdfPageSize: PdfPageSize;
  pdfIncludeLogo: boolean;
  pdfLogoUrl?: string;
  pdfIncludeFooter: boolean;
  pdfFooterText: string;
  pdfIncludeTransactions: boolean;
}

// ============ 5) Данни за отчет ============
export interface ReportHeaderSettings {
  companyName: string;
  eik: string;
  address: string;
  contactInfo: string;
  accountingReportTitle: string;
  realReportTitle: string;
  signature: string;
}

// ============ Всички настройки ============
export interface AppSettings {
  general: GeneralSettings;
  formatting: FormattingSettings;
  inventory: InventorySettings;
  export: ExportSettings;
  reportHeader: ReportHeaderSettings;
}

// Стойности по подразбиране
export const defaultSettings: AppSettings = {
  general: {
    currency: 'EUR',
    timezone: 'Europe/Sofia',
    saleNumberFormat: 'auto-mmyyyy',
  },
  formatting: {
    decimalsEur: 2,
    decimalsKg: 2,
    kgRounding: '0.01',
    costRounding: 'standard',
  },
  inventory: {
    minKgThreshold: 5.0,
    blockSaleOnInsufficientReal: true,
    blockSaleOnInsufficientAccounting: true,
    allowZeroPriceSales: false,
    deliveryEditMode: 'note-only',
    allowArticleKgEdit: true,
  },
  export: {
    defaultFormat: 'excel',
    fileNameTemplateAccounting: 'Accounting_Report_{YYYY-MM}',
    fileNameTemplateReal: 'Real_Report_{YYYY-MM}',
    fileNameTemplateInventory: 'Inventory_{ledger}_{YYYY-MM-DD}',
    csvSeparator: ';',
    csvEncoding: 'utf-8-bom',
    excelIncludeSummary: true,
    excelIncludeTransactions: false,
    excelAutoColumnWidth: true,
    excelBoldHeader: true,
    excelFreezeFirstRow: true,
    excelNumberFormats: true,
    pdfOrientation: 'landscape',
    pdfPageSize: 'a4',
    pdfIncludeLogo: false,
    pdfIncludeFooter: true,
    pdfFooterText: 'Генерирано на {date}',
    pdfIncludeTransactions: false,
  },
  reportHeader: {
    companyName: 'VAIA Boutique',
    eik: '',
    address: '',
    contactInfo: '',
    accountingReportTitle: 'Месечен отчет за счетоводство',
    realReportTitle: 'Реален месечен отчет',
    signature: 'Предоставено за счетоводни цели.',
  },
};

// Секция в настройките (за accordion)
export type SettingsSection = 
  | 'general' 
  | 'formatting' 
  | 'inventory' 
  | 'export' 
  | 'reportHeader' 
  | 'backup'
  | 'dataBackup'
  | 'data';
