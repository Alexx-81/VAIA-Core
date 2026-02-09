export type StatisticsTab = 'daily' | 'monthly' | 'yearly';

export type CostMode = 'real' | 'accounting';

export type PaymentMethodFilter = 'all' | 'cash' | 'card' | 'no-cash' | 'other';

export interface StatisticsFilters {
  costModes: CostMode[];
  paymentMethod: PaymentMethodFilter;
  dateFrom: string;
  dateTo: string;
}

export interface StatisticsRow {
  period: string; // Formatted date/month/year string
  periodDate: Date; // Original date for sorting
  revenue: number;
  costReal: number;
  costAcc: number;
  profitReal: number;
  profitAcc: number;
  kgSold: number;
  marginReal: number;
  marginAcc: number;
}

export interface StatisticsSummaryData {
  totalRevenue: number;
  totalCostReal: number;
  totalCostAcc: number;
  totalProfitReal: number;
  totalProfitAcc: number;
  totalKgSold: number;
  avgMarginReal: number;
  avgMarginAcc: number;
}
