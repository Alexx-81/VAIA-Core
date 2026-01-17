import type { 
  Sale, 
  SaleWithComputed, 
  SaleLine, 
  SaleLineWithComputed,
  SalesDateRange,
  PaymentMethod 
} from '../types';

// Изчисляване на computed стойности за ред
export const computeSaleLine = (line: SaleLine): SaleLineWithComputed => {
  const revenueEur = line.quantity * line.unitPriceEur;
  const kgLine = line.quantity * line.kgPerPieceSnapshot;
  const cogsRealEur = kgLine * line.unitCostPerKgRealSnapshot;
  const cogsAccEur = line.unitCostPerKgAccSnapshot 
    ? kgLine * line.unitCostPerKgAccSnapshot 
    : cogsRealEur;
  const profitRealEur = revenueEur - cogsRealEur;
  const profitAccEur = revenueEur - cogsAccEur;
  const marginRealPercent = revenueEur > 0 ? (profitRealEur / revenueEur) * 100 : 0;
  const marginAccPercent = revenueEur > 0 ? (profitAccEur / revenueEur) * 100 : 0;

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
  const computedLines = sale.lines.map(computeSaleLine);
  
  const totalPieces = computedLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalKg = computedLines.reduce((sum, l) => sum + l.kgLine, 0);
  const totalRevenueEur = computedLines.reduce((sum, l) => sum + l.revenueEur, 0);
  const totalCogsRealEur = computedLines.reduce((sum, l) => sum + l.cogsRealEur, 0);
  const totalCogsAccEur = computedLines.reduce((sum, l) => sum + l.cogsAccEur, 0);
  const totalProfitRealEur = totalRevenueEur - totalCogsRealEur;
  const totalProfitAccEur = totalRevenueEur - totalCogsAccEur;
  const totalMarginRealPercent = totalRevenueEur > 0 ? (totalProfitRealEur / totalRevenueEur) * 100 : 0;
  const totalMarginAccPercent = totalRevenueEur > 0 ? (totalProfitAccEur / totalRevenueEur) * 100 : 0;

  return {
    ...sale,
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
  return date.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    cash: 'Кеш',
    card: 'Карта',
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
