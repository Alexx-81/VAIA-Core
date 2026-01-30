// Типове за наличности (Inventory)

// Под-таб в екрана
export type InventoryTab = 'all' | 'real' | 'accounting' | 'comparison';

// Филтър по тип доставка
export type InventoryDeliveryType = 'all' | 'invoiced' | 'non-invoiced';

// Филтър по статус на наличност
export type InventoryStockStatus = 'all' | 'in-stock' | 'below-minimum' | 'depleted' | 'negative';

// Филтри за наличностите
export interface InventoryFilters {
  search: string; // Търсене по Delivery ID, Фактура №, Качество
  qualityId: string; // "all" или конкретен ID
  supplierName: string; // "all" или конкретен доставчик
  deliveryType: InventoryDeliveryType;
  stockStatus: InventoryStockStatus;
  minKgThreshold: number; // Минимум kg за "под минимум" статус
}

// Ред за Real наличности
export interface InventoryRealRow {
  deliveryId: string;
  displayId: string;
  date: Date;
  qualityId: number;
  qualityName: string;
  invoiceNumber?: string;
  supplierName?: string;
  isInvoiced: boolean;
  kgIn: number;
  unitCostPerKg: number;
  
  // Изчислени стойности
  kgSoldReal: number;
  kgRemainingReal: number;
  percentRemaining: number; // kgRemainingReal / kgIn * 100
  totalCostEur: number; // kgIn × EUR/kg
  valueRemainingRealEur: number; // kgRemainingReal × EUR/kg
  revenueRealEur: number; // Оборот от продажби
  earnedRealEur: number; // revenue - totalCost
}

// Ред за Accounting наличности
export interface InventoryAccRow {
  deliveryId: string;
  displayId: string;
  date: Date;
  qualityId: number;
  qualityName: string;
  invoiceNumber?: string;
  supplierName?: string;
  isInvoiced: boolean;
  kgIn: number;
  unitCostPerKg: number;
  
  // Изчислени стойности
  kgSoldAcc: number;
  kgRemainingAcc: number;
  percentRemaining: number;
  totalCostEur: number;
  valueRemainingAccEur: number;
  revenueAccEur: number;
  earnedAccEur: number;
}

// Ред за сравнение Real vs Accounting
export interface InventoryComparisonRow {
  deliveryId: string;
  displayId: string;
  qualityName: string;
  kgRemainingReal: number;
  kgRemainingAcc: number;
  kgDifference: number; // Real - Acc
  revenueRealEur: number;
  revenueAccEur: number;
  earnedRealEur: number;
  earnedAccEur: number;
  status: 'ok' | 'warning' | 'critical';
}

// Статистики за header
export interface InventoryStats {
  totalDeliveries: number;
  inStock: number;
  belowMinimum: number;
  depleted: number;
  totalKgRemaining: number;
  totalValueRemaining: number;
}

// Качество (за dropdown)
export interface Quality {
  id: number;
  name: string;
  isActive: boolean;
}

// Export формат
export type ExportFormat = 'csv' | 'excel';
