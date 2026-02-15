import type { 
  Sale, 
  SaleWithComputed, 
  SaleLine, 
  SaleLineWithComputed,
  SalesDateRange,
  PaymentMethod 
} from '../types';

// Изчисляване на computed стойности за ред (базово - без отстъпка)
export const computeSaleLine = (line: SaleLine, discountFactor: number = 1): SaleLineWithComputed => {
  const revenueEur = line.quantity * line.unitPriceEur;
  const kgLine = line.quantity * line.kgPerPieceSnapshot;
  const cogsRealEur = kgLine * line.unitCostPerKgRealSnapshot;
  const cogsAccEur = line.unitCostPerKgAccSnapshot 
    ? kgLine * line.unitCostPerKgAccSnapshot 
    : cogsRealEur;
  
  // Прилагаме пропорционалната отстъпка към оборота на реда
  const discountedRevenueEur = revenueEur * discountFactor;
  
  // Изчисляваме печалба базирано на отстъпнатия оборот
  const profitRealEur = discountedRevenueEur - cogsRealEur;
  const profitAccEur = discountedRevenueEur - cogsAccEur;
  const marginRealPercent = discountedRevenueEur > 0 ? (profitRealEur / discountedRevenueEur) * 100 : 0;
  const marginAccPercent = discountedRevenueEur > 0 ? (profitAccEur / discountedRevenueEur) * 100 : 0;

  return {
    ...line,
    revenueEur,
    kgLine,
    cogsRealEur,
    cogsAccEur,
    profitRealEur,
    profitAccEur,
    marginRealPercent,
    marginAccPercent,
  };
};

// Изчисляване на computed стойности за цяла продажба
export const computeSale = (sale: Sale): SaleWithComputed => {
  // Първо изчисляваме реда без отстъпка за да получим общия оборот
  const tempLines = sale.lines.map(l => computeSaleLine(l, 1));
  const totalRevenueEur = tempLines.reduce((sum, l) => sum + l.revenueEur, 0);
  
  // Изчисляваме фактор на отстъпка (ако има totalPaidEur)
  const actualRevenueEur = sale.totalPaidEur ?? totalRevenueEur;
  const discountFactor = totalRevenueEur > 0 ? actualRevenueEur / totalRevenueEur : 1;
  
  // Преизчисляваме редовете с приложена отстъпка
  const computedLines = sale.lines.map(l => computeSaleLine(l, discountFactor));
  
  const totalPieces = computedLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalKg = computedLines.reduce((sum, l) => sum + l.kgLine, 0);
  const totalCogsRealEur = computedLines.reduce((sum, l) => sum + l.cogsRealEur, 0);
  const totalCogsAccEur = computedLines.reduce((sum, l) => sum + l.cogsAccEur, 0);
  const totalProfitRealEur = computedLines.reduce((sum, l) => sum + l.profitRealEur, 0);
  const totalProfitAccEur = computedLines.reduce((sum, l) => sum + l.profitAccEur, 0);
  
  const totalMarginRealPercent = actualRevenueEur > 0 ? (totalProfitRealEur / actualRevenueEur) * 100 : 0;
  const totalMarginAccPercent = actualRevenueEur > 0 ? (totalProfitAccEur / actualRevenueEur) * 100 : 0;

  // Ensure dateTime is a Date object (might be string from localStorage)
  const dateTime = sale.dateTime instanceof Date ? sale.dateTime : new Date(sale.dateTime);

  return {
    ...sale,
    dateTime,
    lines: computedLines,
    totalPieces,
    totalKg,
    totalRevenueEur,
    totalCogsRealEur,
    totalCogsAccEur,
    totalProfitRealEur,
    totalProfitAccEur,
    totalMarginRealPercent,
    totalMarginAccPercent,
    linesCount: computedLines.length,
  };
};

// Форматиране на дата/час
export const formatDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Форматиране на дата за input
export const formatDateTimeForInput = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Форматиране на EUR
export const formatEur = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Форматиране на kg
export const formatKg = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
};

// Форматиране на процент
export const formatPercent = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
};

// Изчисляване на период от preset
export const getDateRangeFromPreset = (preset: SalesDateRange['preset']): { from: Date; to: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: today, to: tomorrow };
    }
    case 'this-week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return { from: monday, to: nextMonday };
    }
    case 'this-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { from: firstDay, to: lastDay };
    }
    case 'last-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: firstDay, to: lastDay };
    }
    default:
      return { from: today, to: now };
  }
};

// Label за метод на плащане
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'По каса',
    card: 'Карта',
    'no-cash': 'Без каса',
    other: 'Друго',
  };
  return labels[method];
};

// CSS клас за profit (положителен/отрицателен)
export const getProfitClass = (profit: number): string => {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'neutral';
};

// CSS клас за margin
export const getMarginClass = (margin: number): string => {
  if (margin >= 30) return 'high';
  if (margin >= 15) return 'medium';
  if (margin > 0) return 'low';
  return 'negative';
};

// Генериране на уникално ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
