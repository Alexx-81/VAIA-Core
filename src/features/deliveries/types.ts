// Типове за доставки (Deliveries)

export interface Delivery {
  id: string;
  displayId: string; // "1", "1A", "2", etc.
  date: Date;
  qualityId: number;
  qualityName: string;
  kgIn: number; // Входни килограми
  unitCostPerKg: number; // EUR/kg доставна цена
  invoiceNumber?: string; // Номер на фактура (optional)
  note?: string; // Бележка (optional)
  createdAt: Date;
}

// Изчислени стойности за доставка
export interface DeliveryWithComputed extends Delivery {
  isInvoiced: boolean; // invoiceNumber не е празно
  totalCostEur: number; // kgIn * unitCostPerKg
  kgSoldReal: number; // Продадени kg (реални)
  kgRemainingReal: number; // kgIn - kgSoldReal
  kgSoldAccounting: number; // Продадени kg (счетоводни)
  kgRemainingAccounting: number; // kgIn - kgSoldAccounting
}

// Форма за създаване/редактиране
export interface DeliveryFormData {
  displayId: string;
  date: string; // ISO string за date input
  qualityId: string;
  kgIn: string;
  unitCostPerKg: string;
  invoiceNumber: string;
  note: string;
}

// Продажба от доставка (за детайлния изглед)
export interface SaleFromDelivery {
  id: string;
  dateTime: Date;
  saleNumber: string;
  articleName: string;
  quantity: number;
  kgSold: number;
  revenueEur: number;
  costEur: number;
  profitEur: number;
  accountingDeliveryId?: string; // Ако е "A" доставка
}

// Филтри за период
export type DateRangePreset = 'all' | 'this-month' | 'last-month' | 'this-year' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from?: Date;
  to?: Date;
}

// Филтри за типа доставка
export type DeliveryTypeFilter = 'all' | 'invoiced' | 'non-invoiced';

// Филтри за статус на наличност
export type StockStatusFilter = 'all' | 'in-stock' | 'depleted' | 'below-minimum';

// Всички филтри
export interface DeliveryFilters {
  dateRange: DateRange;
  search: string; // Търсене по displayId или invoiceNumber
  qualityId: string; // "all" или конкретен ID
  showInactiveQualities: boolean;
  deliveryType: DeliveryTypeFilter;
  stockStatus: StockStatusFilter;
}

// Екран на модула
export type DeliveryView = 'list' | 'detail' | 'form';

// Качество (за dropdown)
export interface Quality {
  id: number;
  name: string;
  isActive: boolean;
}

// Валидация
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Warning за формата
export interface DeliveryFormWarning {
  type: 'invoice-id-mismatch';
  message: string;
}

// Типове за импортиране от Excel
export interface DeliveryImportRow {
  deliveryId: number;
  date: string;
  quality: string;
  kilograms: number;
  pricePerKg: number;
  totalAmount: number;
  invoiceNumber: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  deliveries: Delivery[];
}
