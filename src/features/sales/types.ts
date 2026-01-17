// Типове за продажби (POS / Каса)

// Метод на плащане
export type PaymentMethod = 'cash' | 'card' | 'other';

// Статус на продажба
export type SaleStatus = 'draft' | 'finalized';

// Ред от продажба
export interface SaleLine {
  id: string;
  articleId: string;
  articleName: string;
  quantity: number; // Бройки (int)
  unitPriceEur: number; // Цена/бр (EUR)
  realDeliveryId: string;
  accountingDeliveryId?: string; // Само ако Real доставка е без фактура (A)
  
  // Snapshots (записват се при финализиране)
  kgPerPieceSnapshot: number;
  unitCostPerKgRealSnapshot: number;
  unitCostPerKgAccSnapshot?: number;
}

// Изчислени стойности за ред
export interface SaleLineWithComputed extends SaleLine {
  revenueEur: number; // quantity × unitPriceEur
  kgLine: number; // quantity × kgPerPieceSnapshot
  cogsRealEur: number; // kg × unitCostPerKgRealSnapshot
  cogsAccEur: number; // kg × unitCostPerKgAccSnapshot (или real ако няма acc)
  profitRealEur: number; // revenue - cogsReal
  profitAccEur: number; // revenue - cogsAcc
  marginRealPercent: number; // profitReal / revenue
  marginAccPercent: number; // profitAcc / revenue
}

// Продажба (header)
export interface Sale {
  id: string;
  saleNumber: string; // "S-2026-001"
  dateTime: Date;
  paymentMethod: PaymentMethod;
  note?: string;
  status: SaleStatus;
  lines: SaleLine[];
  createdAt: Date;
  finalizedAt?: Date;
}

// Изчислени стойности за цяла продажба
export interface SaleWithComputed extends Omit<Sale, 'lines'> {
  lines: SaleLineWithComputed[];
  totalPieces: number;
  totalKg: number;
  totalRevenueEur: number;
  totalCogsRealEur: number;
  totalCogsAccEur: number;
  totalProfitRealEur: number;
  totalProfitAccEur: number;
  totalMarginRealPercent: number;
  totalMarginAccPercent: number;
  linesCount: number;
}

// Форма за ред продажба (в редактора)
export interface SaleLineFormData {
  id: string;
  articleId: string;
  quantity: string;
  unitPriceEur: string;
  realDeliveryId: string;
  accountingDeliveryId: string;
}

// Форма за продажба
export interface SaleFormData {
  dateTime: string; // ISO string
  paymentMethod: PaymentMethod;
  note: string;
}

// Филтри за период
export type SalesDateRangePreset = 'all' | 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom';

export interface SalesDateRange {
  preset: SalesDateRangePreset;
  from?: Date;
  to?: Date;
}

// Филтри за списъка с продажби
export interface SalesFilters {
  dateRange: SalesDateRange;
  search: string; // По № продажба или бележка
  paymentMethod: PaymentMethod | 'all';
}

// Екран на модула
export type SalesView = 'list' | 'editor';

// Валидация за ред
export interface SaleLineValidation {
  isValid: boolean;
  errors: {
    articleId?: string;
    quantity?: string;
    unitPriceEur?: string;
    realDeliveryId?: string;
    accountingDeliveryId?: string;
    stockReal?: string;
    stockAccounting?: string;
  };
  warnings: {
    stockAccounting?: string;
  };
}

// Обобщение за списъка
export interface SalesListSummary {
  totalSales: number;
  totalPieces: number;
  totalKg: number;
  totalRevenueEur: number;
  totalProfitRealEur: number;
}

// Доставка за dropdown в POS
export interface DeliveryOption {
  id: string;
  displayId: string;
  qualityName: string;
  kgRemaining: number;
  unitCostPerKg: number;
  isInvoiced: boolean;
}

// Артикул за dropdown в POS
export interface ArticleOption {
  id: string;
  name: string;
  kgPerPiece: number;
  gramsPerPiece: number;
}
