// Типове за отчети (Reports)

// Режим на отчета
export type ReportMode = 'real' | 'accounting';

// Тип на групиране
export type ReportType = 'by-deliveries' | 'by-qualities' | 'by-articles' | 'detailed';

// Период за отчет
export type ReportPeriodPreset = 'this-month' | 'last-month' | 'custom';

export interface ReportPeriod {
  preset: ReportPeriodPreset;
  from?: Date;
  to?: Date;
}

// Филтри за отчетите
export interface ReportFilters {
  period: ReportPeriod;
  mode: ReportMode;
  reportType: ReportType;
  qualityIds: string[]; // Празен = всички
  deliveryId: string; // Празен = всички
  supplierName: string; // \"all\" или конкретен доставчик
  paymentMethod: 'all' | 'cash' | 'card' | 'other';
}

// Summary статистики
export interface ReportSummary {
  revenueEur: number;
  cogsEur: number;
  profitEur: number;
  marginPercent: number;
  totalKg: number;
  totalPieces: number;
  salesCount: number;
}

// Ред за отчет "По доставки"
export interface DeliveryReportRow {
  deliveryId: string;
  deliveryDisplayId: string;
  deliveryDate: Date;
  qualityName: string;
  invoiceNumber: string;
  isInvoiced: boolean;
  kgIn: number;
  eurPerKgDelivery: number;
  totalDeliveryCostEur: number; // kg_in × EUR/kg
  kgSold: number;
  piecesSold: number;
  revenueEur: number;
  cogsEur: number;
  profitEur: number;
  marginPercent: number;
  avgPricePerKgEur: number; // revenue / kg
  earnedFromDeliveryEur: number; // revenue - totalDeliveryCostEur
}

// Ред за отчет "По качества"
export interface QualityReportRow {
  qualityId: number;
  qualityName: string;
  kgSold: number;
  piecesSold: number;
  revenueEur: number;
  cogsEur: number;
  profitEur: number;
  marginPercent: number;
  avgPricePerKgEur: number;
}

// Ред за отчет "По артикули"
export interface ArticleReportRow {
  articleId: string;
  articleName: string;
  piecesSold: number;
  kgSold: number;
  revenueEur: number;
  cogsEur: number;
  profitEur: number;
  marginPercent: number;
  avgPricePerPieceEur: number; // revenue / pieces
}

// Ред за детайлен отчет (транзакции)
export interface TransactionReportRow {
  saleDateTime: Date;
  saleNumber: string;
  paymentMethod: 'cash' | 'card' | 'other';
  articleName: string;
  pieces: number;
  kg: number;
  pricePerPieceEur: number;
  revenueEur: number;
  realDeliveryId: string;
  realDeliveryDisplayId: string;
  accountingDeliveryId: string;
  accountingDeliveryDisplayId: string;
  eurPerKgRealSnapshot: number;
  eurPerKgAccSnapshot: number;
  cogsRealEur: number;
  cogsAccEur: number;
  profitRealEur: number;
  profitAccEur: number;
}

// Данни за отчета
export interface ReportData {
  filters: ReportFilters;
  summary: ReportSummary;
  deliveryRows: DeliveryReportRow[];
  qualityRows: QualityReportRow[];
  articleRows: ArticleReportRow[];
  transactionRows: TransactionReportRow[];
  generatedAt: Date;
  periodLabel: string;
}

// Формат за експорт
export type ExportFormat = 'csv' | 'excel' | 'pdf';

// Опции за експорт
export interface ExportOptions {
  format: ExportFormat;
  includeTransactions: boolean; // За PDF - дали да включи детайли
}

// Настройки за филтрите
export interface QualityOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DeliveryOption {
  id: string;
  displayId: string;
  qualityName: string;
  isInvoiced: boolean;
}
