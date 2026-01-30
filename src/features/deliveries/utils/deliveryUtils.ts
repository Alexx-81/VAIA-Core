import type {
  Delivery,
  DeliveryWithComputed,
  DeliveryFilters,
  DateRange,
  ValidationResult,
  DeliveryFormWarning,
  DeliveryFormData,
} from '../types';
import { mockSalesData } from '../data/mockDeliveries';

// ===== ИЗЧИСЛЕНИЯ =====

/**
 * Добавя изчислени стойности към доставка
 */
export const computeDeliveryValues = (delivery: Delivery): DeliveryWithComputed => {
  const salesData = mockSalesData[delivery.id] || { realKgSold: 0, accKgSold: 0 };
  
  // Ensure date is a Date object (might be string from localStorage)
  const date = delivery.date instanceof Date ? delivery.date : new Date(delivery.date);
  const createdAt = delivery.createdAt instanceof Date ? delivery.createdAt : new Date(delivery.createdAt);
  
  return {
    ...delivery,
    date,
    createdAt,
    isInvoiced: !!delivery.invoiceNumber && delivery.invoiceNumber.trim() !== '',
    totalCostEur: roundToTwo(delivery.kgIn * delivery.unitCostPerKg),
    kgSoldReal: salesData.realKgSold,
    kgRemainingReal: roundToTwo(delivery.kgIn - salesData.realKgSold),
    kgSoldAccounting: salesData.accKgSold,
    kgRemainingAccounting: roundToTwo(delivery.kgIn - salesData.accKgSold),
  };
};

/**
 * Закръгляне до 2 знака
 */
export const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100;
};

// ===== ФИЛТРИРАНЕ =====

/**
 * Проверява дали датата е в периода
 */
export const isDateInRange = (date: Date, range: DateRange): boolean => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);
  const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  switch (range.preset) {
    case 'all':
      return true;
    case 'this-month':
      return date >= startOfThisMonth && date <= endOfThisMonth;
    case 'last-month':
      return date >= startOfLastMonth && date <= endOfLastMonth;
    case 'this-year':
      return date >= startOfThisYear && date <= endOfThisYear;
    case 'custom':
      if (range.from && range.to) {
        const from = new Date(range.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(range.to);
        to.setHours(23, 59, 59, 999);
        return date >= from && date <= to;
      }
      return true;
    default:
      return true;
  }
};

/**
 * Филтрира и сортира доставки
 */
export const filterDeliveries = (
  deliveries: DeliveryWithComputed[],
  filters: DeliveryFilters,
  minKgThreshold: number = 10
): DeliveryWithComputed[] => {
  return deliveries.filter((delivery) => {
    // Филтър по период
    if (!isDateInRange(delivery.date, filters.dateRange)) {
      return false;
    }

    // Търсене по displayId или invoiceNumber
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesDisplayId = delivery.displayId.toLowerCase().includes(searchLower);
      const matchesInvoice = delivery.invoiceNumber?.toLowerCase().includes(searchLower);
      if (!matchesDisplayId && !matchesInvoice) {
        return false;
      }
    }

    // Филтър по качество
    if (filters.qualityId !== 'all') {
      if (delivery.qualityId !== parseInt(filters.qualityId, 10)) {
        return false;
      }
    }

    // Филтър по тип доставка
    if (filters.deliveryType !== 'all') {
      if (filters.deliveryType === 'invoiced' && !delivery.isInvoiced) {
        return false;
      }
      if (filters.deliveryType === 'non-invoiced' && delivery.isInvoiced) {
        return false;
      }
    }

    // Филтър по статус на наличност
    if (filters.stockStatus !== 'all') {
      switch (filters.stockStatus) {
        case 'in-stock':
          if (delivery.kgRemainingReal <= 0) return false;
          break;
        case 'depleted':
          if (delivery.kgRemainingReal > 0) return false;
          break;
        case 'below-minimum':
          if (delivery.kgRemainingReal > minKgThreshold || delivery.kgRemainingReal <= 0) return false;
          break;
      }
    }

    return true;
  }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Сортиране по дата (най-нови първо)
};

// ===== ВАЛИДАЦИЯ =====

/**
 * Валидира display ID
 */
export const validateDisplayId = (
  displayId: string,
  existingIds: string[],
  currentId?: string
): ValidationResult => {
  const trimmed = displayId.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'ID на доставката е задължително.' };
  }

  // Проверка за дубликат
  const isDuplicate = existingIds.some(
    (id) => id.toLowerCase() === trimmed.toLowerCase() && id !== currentId
  );
  
  if (isDuplicate) {
    return { isValid: false, error: 'Вече съществува доставка с този ID.' };
  }

  return { isValid: true };
};

/**
 * Валидира килограми
 */
export const validateKg = (kg: string): ValidationResult => {
  const num = parseFloat(kg);
  
  if (!kg || isNaN(num)) {
    return { isValid: false, error: 'Килограмите са задължителни.' };
  }
  
  if (num <= 0) {
    return { isValid: false, error: 'Килограмите трябва да са положително число.' };
  }

  return { isValid: true };
};

/**
 * Валидира EUR/kg
 */
export const validateUnitCost = (cost: string): ValidationResult => {
  const num = parseFloat(cost);
  
  if (!cost || isNaN(num)) {
    return { isValid: false, error: 'Доставната цена е задължителна.' };
  }
  
  if (num < 0) {
    return { isValid: false, error: 'Доставната цена не може да е отрицателна.' };
  }

  return { isValid: true };
};

/**
 * Валидира качество
 */
export const validateQuality = (qualityId: string): ValidationResult => {
  if (!qualityId || qualityId === '') {
    return { isValid: false, error: 'Качеството е задължително.' };
  }

  return { isValid: true };
};

/**
 * Валидира дата
 */
export const validateDate = (date: string): ValidationResult => {
  if (!date) {
    return { isValid: false, error: 'Датата е задължителна.' };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Невалидна дата.' };
  }

  return { isValid: true };
};

/**
 * Генерира предупреждения за формата
 */
export const getFormWarnings = (formData: DeliveryFormData): DeliveryFormWarning[] => {
  const warnings: DeliveryFormWarning[] = [];
  const displayId = formData.displayId.trim();
  const invoiceNumber = formData.invoiceNumber.trim();
  const endsWithA = /[aAаА]$/.test(displayId);

  // Ако няма фактура и ID НЕ завършва на "A"
  if (!invoiceNumber && !endsWithA && displayId) {
    warnings.push({
      type: 'invoice-id-mismatch',
      message: 'Доставката няма фактура. Препоръчително е ID-то да завършва на "A" (напр. "1A").',
    });
  }

  // Ако има фактура и ID завършва на "A"
  if (invoiceNumber && endsWithA) {
    warnings.push({
      type: 'invoice-id-mismatch',
      message: 'ID-то завършва на "A", но има въведена фактура. Обикновено "A" се използва за доставки без фактура.',
    });
  }

  return warnings;
};

/**
 * Проверява дали доставка може да се редактира
 */
export const canEditDelivery = (delivery: DeliveryWithComputed): { canEdit: boolean; reason?: string } => {
  if (delivery.kgSoldReal > 0 || delivery.kgSoldAccounting > 0) {
    return {
      canEdit: false,
      reason: 'Доставката има продажби и не може да бъде редактирана. Можете да промените само бележката.',
    };
  }
  return { canEdit: true };
};

// ===== ФОРМАТИРАНЕ =====

/**
 * Форматира дата за показване
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Форматира дата и час за показване
 */
export const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Форматира число като EUR
 */
export const formatEur = (amount: number): string => {
  return amount.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Форматира kg
 */
export const formatKg = (kg: number): string => {
  return kg.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Форматира дата за input[type="date"]
 */
export const toDateInputValue = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Генерира уникален ID
 */
export const generateId = (): string => {
  return `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Връща етикет за периода
 */
export const getDateRangeLabel = (preset: string): string => {
  const labels: Record<string, string> = {
    'all': 'Всички',
    'this-month': 'Този месец',
    'last-month': 'Миналия месец',
    'this-year': 'Тази година',
    'custom': 'Персонализиран',
  };
  return labels[preset] || preset;
};
