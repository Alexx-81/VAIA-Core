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

// Форматира процентни колони в Excel worksheet
const formatPercentageColumns = (XLSX: any, ws: any, percentColumnIndexes: number[], startRow: number = 1) => {
  if (!ws['!ref']) return;
  
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  percentColumnIndexes.forEach(colIdx => {
    for (let rowIdx = startRow; rowIdx <= range.e.r; rowIdx++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = ws[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        // Делим на 100, защото Excel очаква 0.10 за 10%
        cell.v = cell.v / 100;
        // Задаваме процентен формат с 2 знака след запетаята
        cell.z = '0.00%';
        cell.t = 'n'; // Тип number
      }
    }
  });
};

// Форматира числови колони с 2 десетични знака в Excel worksheet
const formatNumberColumns = (XLSX: any, ws: any, numberColumnIndexes: number[], startRow: number = 1) => {
  if (!ws['!ref']) return;
  
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  numberColumnIndexes.forEach(colIdx => {
    for (let rowIdx = startRow; rowIdx <= range.e.r; rowIdx++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = ws[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        // Задаваме числов формат с 2 знака след запетаята
        cell.z = '0.00';
        cell.t = 'n'; // Тип number
      }
    }
  });
};

// Export to Excel
export const exportToExcel = async (
  data: InventoryRealRow[] | InventoryAccRow[],
  type: 'real' | 'accounting',
  filename: string
): Promise<void> => {
  // Динамично зареждаме xlsx библиотеката
  const XLSX = await import('xlsx');
  
  const wb = XLSX.utils.book_new();

  // Подготвяме данните
  let headers: string[];
  let worksheetData: (string | number)[][];

  if (type === 'real') {
    headers = [
      'Delivery ID',
      'Дата',
      'Качество',
      'Фактура №',
      'Фактурна',
      'Доставчик',
      'kg вход',
      'kg продадени (Real)',
      'kg налични (Real)',
      '% оставащи',
      'EUR/kg',
      'Обща сума (EUR)',
      'Оборот Real (EUR)',
      'Пари изкарани Real (EUR)',
      'Стойност остатък Real (EUR)',
    ];
    worksheetData = (data as InventoryRealRow[]).map(row => [
      row.displayId,
      formatDate(row.date),
      row.qualityName,
      row.invoiceNumber || '',
      row.isInvoiced ? 'Да' : 'Не',
      row.supplierName || '',
      row.kgIn,
      row.kgSoldReal,
      row.kgRemainingReal,
      row.percentRemaining,
      row.unitCostPerKg,
      row.totalCostEur,
      row.revenueRealEur,
      row.earnedRealEur,
      row.valueRemainingRealEur,
    ]);
  } else {
    headers = [
      'Delivery ID',
      'Дата',
      'Качество',
      'Фактура №',
      'Фактурна',
      'Доставчик',
      'kg вход',
      'kg продадени (Acc)',
      'kg налични (Acc)',
      '% оставащи',
      'EUR/kg',
      'Обща сума (EUR)',
      'Оборот Acc (EUR)',
      'Пари изкарани Acc (EUR)',
      'Стойност остатък Acc (EUR)',
    ];
    worksheetData = (data as InventoryAccRow[]).map(row => [
      row.displayId,
      formatDate(row.date),
      row.qualityName,
      row.invoiceNumber || '',
      row.isInvoiced ? 'Да' : 'Не',
      row.supplierName || '',
      row.kgIn,
      row.kgSoldAcc,
      row.kgRemainingAcc,
      row.percentRemaining,
      row.unitCostPerKg,
      row.totalCostEur,
      row.revenueAccEur,
      row.earnedAccEur,
      row.valueRemainingAccEur,
    ]);
  }

  // Създаваме worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);

  // Форматираме процентната колона "% оставащи" (индекс 9)
  formatPercentageColumns(XLSX, ws, [9], 1);
  
  // Форматираме числовата колона "EUR/kg" (индекс 10)
  formatNumberColumns(XLSX, ws, [10], 1);

  // Добавяме worksheet към workbook
  XLSX.utils.book_append_sheet(wb, ws, type === 'real' ? 'Real Наличности' : 'Acc Наличности');

  // Записваме файла
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export comparison to Excel
export const exportComparisonToExcel = async (
  data: InventoryComparisonRow[],
  filename: string
): Promise<void> => {
  // Динамично зареждаме xlsx библиотеката
  const XLSX = await import('xlsx');
  
  const wb = XLSX.utils.book_new();

  // Подготвяме данните
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

  const worksheetData = data.map(row => [
    row.displayId,
    row.qualityName,
    row.kgRemainingReal,
    row.kgRemainingAcc,
    row.kgDifference,
    row.revenueRealEur,
    row.revenueAccEur,
    row.earnedRealEur,
    row.earnedAccEur,
    row.status === 'ok' ? 'OK' : row.status === 'warning' ? 'Внимание' : 'Критично',
  ]);

  // Създаваме worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);

  // Добавяме worksheet към workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Сравнение');

  // Записваме файла
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
