import type { 
  InventoryRealRow, 
  InventoryAccRow, 
  InventoryComparisonRow 
} from '../types';

// Форматиране на kg
export const formatKg = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
};

// Форматиране на EUR
export const formatEur = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Форматиране на процент
export const formatPercent = (value: number): string => {
  return value.toLocaleString('bg-BG', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
};

// Форматиране на дата
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// CSS клас за stock status
export const getStockStatusClass = (kgRemaining: number, minThreshold: number): string => {
  if (kgRemaining < 0) return 'negative';
  if (kgRemaining === 0) return 'depleted';
  if (kgRemaining <= minThreshold) return 'below-minimum';
  return 'in-stock';
};

// CSS клас за earned (пари изкарани)
export const getEarnedClass = (earned: number): string => {
  if (earned < 0) return 'negative';
  if (earned === 0) return 'neutral';
  return 'positive';
};

// Label за stock status
export const getStockStatusLabel = (kgRemaining: number, minThreshold: number): string => {
  if (kgRemaining < 0) return 'Критично';
  if (kgRemaining === 0) return 'Изчерпано';
  if (kgRemaining <= minThreshold) return 'Под минимум';
  return 'Налично';
};

// Export to CSV
export const exportToCSV = (
  data: InventoryRealRow[] | InventoryAccRow[],
  type: 'real' | 'accounting',
  filename: string
): void => {
  const headers = [
    'Delivery ID',
    'Дата',
    'Качество',
    'Фактура №',
    'Фактурна',
    'kg вход',
    `kg продадени (${type === 'real' ? 'Real' : 'Acc'})`,
    `kg налични (${type === 'real' ? 'Real' : 'Acc'})`,
    '% оставащи',
    'EUR/kg',
    'Обща сума (EUR)',
    `Оборот (${type === 'real' ? 'Real' : 'Acc'}) EUR`,
    `Пари изкарани (${type === 'real' ? 'Real' : 'Acc'}) EUR`,
    `Стойност остатък (${type === 'real' ? 'Real' : 'Acc'}) EUR`,
  ];

  const rows = data.map(row => {
    if (type === 'real') {
      const r = row as InventoryRealRow;
      return [
        r.displayId,
        formatDate(r.date),
        r.qualityName,
        r.invoiceNumber || '',
        r.isInvoiced ? 'Да' : 'Не',
        formatKg(r.kgIn),
        formatKg(r.kgSoldReal),
        formatKg(r.kgRemainingReal),
        formatPercent(r.percentRemaining),
        formatEur(r.unitCostPerKg),
        formatEur(r.totalCostEur),
        formatEur(r.revenueRealEur),
        formatEur(r.earnedRealEur),
        formatEur(r.valueRemainingRealEur),
      ];
    } else {
      const r = row as InventoryAccRow;
      return [
        r.displayId,
        formatDate(r.date),
        r.qualityName,
        r.invoiceNumber || '',
        r.isInvoiced ? 'Да' : 'Не',
        formatKg(r.kgIn),
        formatKg(r.kgSoldAcc),
        formatKg(r.kgRemainingAcc),
        formatPercent(r.percentRemaining),
        formatEur(r.unitCostPerKg),
        formatEur(r.totalCostEur),
        formatEur(r.revenueAccEur),
        formatEur(r.earnedAccEur),
        formatEur(r.valueRemainingAccEur),
      ];
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export comparison to CSV
export const exportComparisonToCSV = (
  data: InventoryComparisonRow[],
  filename: string
): void => {
  const headers = [
    'Delivery ID',
    'Качество',
    'kg налични (Real)',
    'kg налични (Acc)',
    'Разлика kg',
    'Оборот Real (EUR)',
    'Оборот Acc (EUR)',
    'Пари изкарани Real (EUR)',
    'Пари изкарани Acc (EUR)',
    'Статус',
  ];

  const rows = data.map(row => [
    row.displayId,
    row.qualityName,
    formatKg(row.kgRemainingReal),
    formatKg(row.kgRemainingAcc),
    formatKg(row.kgDifference),
    formatEur(row.revenueRealEur),
    formatEur(row.revenueAccEur),
    formatEur(row.earnedRealEur),
    formatEur(row.earnedAccEur),
    row.status === 'ok' ? 'OK' : row.status === 'warning' ? 'Внимание' : 'Критично',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
