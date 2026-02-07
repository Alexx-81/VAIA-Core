import type { ReportData, ReportMode } from '../types';

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('bg-BG');
};

const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'В брой';
    case 'card': return 'Карта';
    case 'other': return 'Друго';
    default: return method;
  }
};

// Генериране на име на файл
const getFileName = (mode: ReportMode, type: string, format: string): string => {
  const modeLabel = mode === 'real' ? 'Real' : 'Accounting';
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${modeLabel}_Report_${type}_${dateStr}.${format}`;
};

// Изтегляне на файл
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob(['\ufeff' + content], { type: mimeType }); // BOM за UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============ CSV EXPORT ============

const arrayToCSV = (headers: string[], rows: string[][]): string => {
  const headerLine = headers.join(';');
  const dataLines = rows.map(row => row.map(cell => `"${cell}"`).join(';'));
  return [headerLine, ...dataLines].join('\n');
};

export const exportToCSV = (data: ReportData) => {
  const mode = data.filters.mode;
  
  // 1. Summary CSV
  const summaryCSV = arrayToCSV(
    ['Показател', 'Стойност'],
    [
      ['Период', data.periodLabel],
      ['Режим', mode === 'real' ? 'Реален' : 'Счетоводен'],
      ['Оборот (EUR)', data.summary.revenueEur.toFixed(2)],
      ['Себестойност (EUR)', data.summary.cogsEur.toFixed(2)],
      ['Печалба (EUR)', data.summary.profitEur.toFixed(2)],
      ['Марж %', data.summary.marginPercent.toFixed(1)],
      ['Продадени kg', data.summary.totalKg.toFixed(2)],
      ['Бройки', String(data.summary.totalPieces)],
      ['Брой продажби', String(data.summary.salesCount)],
      ['Генерирано на', formatDateTime(data.generatedAt)],
    ]
  );
  downloadFile(summaryCSV, getFileName(mode, 'Summary', 'csv'), 'text/csv;charset=utf-8');

  // 2. Deliveries CSV
  if (mode === 'real') {
    const deliveriesCSV = arrayToCSV(
      ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'],
      data.deliveryRows.map(r => [
        r.deliveryId,
        r.deliveryDisplayId,
        formatDate(r.deliveryDate),
        r.qualityName,
        r.isInvoiced ? 'Да' : 'Не',
        r.invoiceNumber,
        r.kgIn.toFixed(2),
        r.eurPerKgDelivery.toFixed(2),
        r.totalDeliveryCostEur.toFixed(2),
        r.kgSold.toFixed(2),
        String(r.piecesSold),
        r.revenueEur.toFixed(2),
        r.cogsEur.toFixed(2),
        r.profitEur.toFixed(2),
        r.marginPercent.toFixed(1),
        r.avgPricePerKgEur.toFixed(2),
        r.earnedFromDeliveryEur.toFixed(2),
      ])
    );
    downloadFile(deliveriesCSV, getFileName(mode, 'ByDeliveries', 'csv'), 'text/csv;charset=utf-8');
  } else {
    const deliveriesCSV = arrayToCSV(
      ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg дост.', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'],
      data.deliveryRows.map(r => [
        r.deliveryId,
        r.deliveryDisplayId,
        formatDate(r.deliveryDate),
        r.qualityName,
        r.isInvoiced ? 'Да' : 'Не',
        r.invoiceNumber,
        r.kgIn.toFixed(2),
        r.eurPerKgDelivery.toFixed(2),
        r.totalDeliveryCostEur.toFixed(2),
        r.kgSold.toFixed(2),
        String(r.piecesSold),
        r.revenueEur.toFixed(2),
        r.cogsEur.toFixed(2),
        r.profitEur.toFixed(2),
        r.marginPercent.toFixed(1),
        r.avgPricePerKgEur.toFixed(2),
        r.earnedFromDeliveryEur.toFixed(2),
      ])
    );
    downloadFile(deliveriesCSV, getFileName(mode, 'ByDeliveries', 'csv'), 'text/csv;charset=utf-8');
  }

  // 3. Qualities CSV (само за Real)
  if (mode === 'real') {
    const qualitiesCSV = arrayToCSV(
      ['Quality ID', 'Качество', 'kg', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg'],
      data.qualityRows.map(r => [
        String(r.qualityId),
        r.qualityName,
        r.kgSold.toFixed(2),
        String(r.piecesSold),
        r.revenueEur.toFixed(2),
        r.cogsEur.toFixed(2),
        r.profitEur.toFixed(2),
        r.marginPercent.toFixed(1),
        r.avgPricePerKgEur.toFixed(2),
      ])
    );
    downloadFile(qualitiesCSV, getFileName(mode, 'ByQualities', 'csv'), 'text/csv;charset=utf-8');
  }

  // 4. Articles CSV
  const articlesCSV = arrayToCSV(
    ['Article ID', 'Артикул', 'Бройки', 'kg', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/бр'],
    data.articleRows.map(r => [
      r.articleId,
      r.articleName,
      String(r.piecesSold),
      r.kgSold.toFixed(2),
      r.revenueEur.toFixed(2),
      r.cogsEur.toFixed(2),
      r.profitEur.toFixed(2),
      r.marginPercent.toFixed(1),
      r.avgPricePerPieceEur.toFixed(2),
    ])
  );
  downloadFile(articlesCSV, getFileName(mode, 'ByArticles', 'csv'), 'text/csv;charset=utf-8');

  // 5. Transactions CSV
  const transactionsCSV = arrayToCSV(
    mode === 'real' 
      ? ['Дата/час', '№ продажба', 'Плащане', 'Артикул', 'Бройки', 'kg', 'Цена/бр (EUR)', 'Оборот (EUR)', 'Real Delivery ID', 'Real доставка', 'Acc Delivery ID', 'Accounting доставка', 'EUR/kg (R)', 'Себестойност (EUR)', 'Печалба (EUR)']
      : ['Дата/час', '№ продажба', 'Плащане', 'Артикул', 'Бройки', 'kg', 'Цена/бр (EUR)', 'Оборот (EUR)', 'Real Delivery ID', 'Real доставка', 'Acc Delivery ID', 'Accounting доставка', 'EUR/kg (A)', 'Себестойност (EUR)', 'Печалба (EUR)'],
    data.transactionRows.map(r => mode === 'real' 
      ? [
          formatDateTime(r.saleDateTime),
          r.saleNumber,
          getPaymentMethodLabel(r.paymentMethod),
          r.articleName,
          String(r.pieces),
          r.kg.toFixed(3),
          r.pricePerPieceEur.toFixed(2),
          r.revenueEur.toFixed(2),
          r.realDeliveryId,
          r.realDeliveryDisplayId,
          r.accountingDeliveryId,
          r.accountingDeliveryDisplayId,
          r.eurPerKgRealSnapshot.toFixed(2),
          r.cogsRealEur.toFixed(2),
          r.profitRealEur.toFixed(2),
        ]
      : [
          formatDateTime(r.saleDateTime),
          r.saleNumber,
          getPaymentMethodLabel(r.paymentMethod),
          r.articleName,
          String(r.pieces),
          r.kg.toFixed(3),
          r.pricePerPieceEur.toFixed(2),
          r.revenueEur.toFixed(2),
          r.realDeliveryId,
          r.realDeliveryDisplayId,
          r.accountingDeliveryId,
          r.accountingDeliveryDisplayId,
          r.eurPerKgAccSnapshot.toFixed(2),
          r.cogsAccEur.toFixed(2),
          r.profitAccEur.toFixed(2),
        ]
    )
  );
  downloadFile(transactionsCSV, getFileName(mode, 'Transactions', 'csv'), 'text/csv;charset=utf-8');
};

// ============ EXCEL EXPORT ============

export const exportToExcel = async (data: ReportData) => {
  // Динамично зареждаме xlsx библиотеката
  const XLSX = await import('xlsx');
  
  const mode = data.filters.mode;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Месечен отчет', mode === 'real' ? 'Реален' : 'Счетоводен'],
    [''],
    ['Период', data.periodLabel],
    ['Генерирано на', formatDateTime(data.generatedAt)],
    [''],
    ['Показател', 'Стойност'],
    ['Оборот (EUR)', data.summary.revenueEur],
    ['Себестойност (EUR)', data.summary.cogsEur],
    ['Печалба (EUR)', data.summary.profitEur],
    ['Марж %', data.summary.marginPercent],
    ['Продадени kg', data.summary.totalKg],
    ['Бройки', data.summary.totalPieces],
    ['Брой продажби', data.summary.salesCount],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: By Deliveries
  let deliveriesHeaders: string[];
  let deliveriesData: (string | number)[][];
  
  if (mode === 'real') {
    deliveriesHeaders = ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'];
    deliveriesData = data.deliveryRows.map(r => [
      r.deliveryId,
      r.deliveryDisplayId,
      formatDate(r.deliveryDate),
      r.qualityName,
      r.isInvoiced ? 'Да' : 'Не',
      r.invoiceNumber,
      r.kgIn,
      r.eurPerKgDelivery,
      r.totalDeliveryCostEur,
      r.kgSold,
      r.piecesSold,
      r.revenueEur,
      r.cogsEur,
      r.profitEur,
      r.marginPercent,
      r.avgPricePerKgEur,
      r.earnedFromDeliveryEur,
    ]);
  } else {
    deliveriesHeaders = ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg дост.', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'];
    deliveriesData = data.deliveryRows.map(r => [
      r.deliveryId,
      r.deliveryDisplayId,
      formatDate(r.deliveryDate),
      r.qualityName,
      r.isInvoiced ? 'Да' : 'Не',
      r.invoiceNumber,
      r.kgIn,
      r.eurPerKgDelivery,
      r.totalDeliveryCostEur,
      r.kgSold,
      r.piecesSold,
      r.revenueEur,
      r.cogsEur,
      r.profitEur,
      r.marginPercent,
      r.avgPricePerKgEur,
      r.earnedFromDeliveryEur,
    ]);
  }
  
  const wsDeliveries = XLSX.utils.aoa_to_sheet([deliveriesHeaders, ...deliveriesData]);
  XLSX.utils.book_append_sheet(wb, wsDeliveries, 'By Deliveries');

  // Sheet 3: By Qualities (само за Real)
  if (mode === 'real') {
    const qualitiesHeaders = ['Quality ID', 'Качество', 'kg', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg'];
    const qualitiesData = data.qualityRows.map(r => [
      r.qualityId,
      r.qualityName,
      r.kgSold,
      r.piecesSold,
      r.revenueEur,
      r.cogsEur,
      r.profitEur,
      r.marginPercent,
      r.avgPricePerKgEur,
    ]);
    const wsQualities = XLSX.utils.aoa_to_sheet([qualitiesHeaders, ...qualitiesData]);
    XLSX.utils.book_append_sheet(wb, wsQualities, 'By Qualities');
  }

  // Sheet 4: By Articles
  const articlesHeaders = ['Article ID', 'Артикул', 'Бройки', 'kg', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/бр'];
  const articlesData = data.articleRows.map(r => [
    r.articleId,
    r.articleName,
    r.piecesSold,
    r.kgSold,
    r.revenueEur,
    r.cogsEur,
    r.profitEur,
    r.marginPercent,
    r.avgPricePerPieceEur,
  ]);
  const wsArticles = XLSX.utils.aoa_to_sheet([articlesHeaders, ...articlesData]);
  XLSX.utils.book_append_sheet(wb, wsArticles, 'By Articles');

  // Sheet 5 (or 4 for Accounting): Transactions
  let transHeaders: string[];
  let transData: (string | number)[][];
  
  if (mode === 'real') {
    transHeaders = ['Дата/час', '№ продажба', 'Плащане', 'Артикул', 'Бройки', 'kg', 'Цена/бр (EUR)', 'Оборот (EUR)', 'Real Delivery ID', 'Real доставка', 'Acc Delivery ID', 'Accounting доставка', 'EUR/kg (R)', 'Себестойност (EUR)', 'Печалба (EUR)'];
    transData = data.transactionRows.map(r => [
      formatDateTime(r.saleDateTime),
      r.saleNumber,
      getPaymentMethodLabel(r.paymentMethod),
      r.articleName,
      r.pieces,
      r.kg,
      r.pricePerPieceEur,
      r.revenueEur,
      r.realDeliveryId,
      r.realDeliveryDisplayId,
      r.accountingDeliveryId,
      r.accountingDeliveryDisplayId,
      r.eurPerKgRealSnapshot,
      r.cogsRealEur,
      r.profitRealEur,
    ]);
  } else {
    transHeaders = ['Дата/час', '№ продажба', 'Плащане', 'Артикул', 'Бройки', 'kg', 'Цена/бр (EUR)', 'Оборот (EUR)', 'Real Delivery ID', 'Real доставка', 'Acc Delivery ID', 'Accounting доставка', 'EUR/kg (A)', 'Себестойност (EUR)', 'Печалба (EUR)'];
    transData = data.transactionRows.map(r => [
      formatDateTime(r.saleDateTime),
      r.saleNumber,
      getPaymentMethodLabel(r.paymentMethod),
      r.articleName,
      r.pieces,
      r.kg,
      r.pricePerPieceEur,
      r.revenueEur,
      r.realDeliveryId,
      r.realDeliveryDisplayId,
      r.accountingDeliveryId,
      r.accountingDeliveryDisplayId,
      r.eurPerKgAccSnapshot,
      r.cogsAccEur,
      r.profitAccEur,
    ]);
  }
  
  const wsTrans = XLSX.utils.aoa_to_sheet([transHeaders, ...transData]);
  XLSX.utils.book_append_sheet(wb, wsTrans, 'Transactions');

  // Записваме файла
  XLSX.writeFile(wb, getFileName(mode, 'Report', 'xlsx'));
};

// ============ PDF EXPORT ============

export const exportToPDF = async (data: ReportData) => {
  // Динамично зареждаме jspdf
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  
  const mode = data.filters.mode;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Заглавие
  doc.setFontSize(18);
  doc.text(mode === 'real' ? 'Реален месечен отчет' : 'Счетоводен месечен отчет', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Период: ${data.periodLabel}`, 14, 32);
  doc.text(`Генерирано: ${formatDateTime(data.generatedAt)}`, 14, 38);
  
  // Summary
  doc.setFontSize(12);
  doc.text('Обобщение', 14, 50);
  
  const summaryBody = [
    ['Оборот (EUR)', data.summary.revenueEur.toFixed(2)],
    ['Себестойност (EUR)', data.summary.cogsEur.toFixed(2)],
    ['Печалба (EUR)', data.summary.profitEur.toFixed(2)],
    ['Марж %', data.summary.marginPercent.toFixed(1) + '%'],
    ['Продадени kg', data.summary.totalKg.toFixed(2)],
    ['Бройки', String(data.summary.totalPieces)],
    ['Брой продажби', String(data.summary.salesCount)],
  ];
  
  (doc as any).autoTable({
    startY: 55,
    head: [['Показател', 'Стойност']],
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 122, 0] },
    margin: { left: 14 },
    tableWidth: 80,
  });
  
  // Deliveries table
  let deliveriesHead: string[];
  let deliveriesBody: (string | number)[][];
  
  if (mode === 'real') {
    deliveriesHead = ['Доставка', 'Дата', 'Качество', 'Фактура', 'kg прод.', 'Бройки', 'Оборот', 'COGS', 'Печалба', 'Марж%', 'Изкарани'];
    deliveriesBody = data.deliveryRows.map(r => [
      r.deliveryDisplayId,
      formatDate(r.deliveryDate),
      r.qualityName.substring(0, 20),
      r.invoiceNumber || '-',
      r.kgSold.toFixed(1),
      r.piecesSold,
      r.revenueEur.toFixed(2),
      r.cogsEur.toFixed(2),
      r.profitEur.toFixed(2),
      r.marginPercent.toFixed(1),
      r.earnedFromDeliveryEur.toFixed(2),
    ]);
  } else {
    deliveriesHead = ['Доставка', 'Дата', 'Качество', 'Фактура', 'kg прод.', 'Бройки', 'Оборот', 'COGS', 'Печалба', 'Марж%'];
    deliveriesBody = data.deliveryRows.map(r => [
      r.deliveryDisplayId,
      formatDate(r.deliveryDate),
      r.qualityName.substring(0, 20),
      r.invoiceNumber,
      r.kgSold.toFixed(1),
      r.piecesSold,
      r.revenueEur.toFixed(2),
      r.cogsEur.toFixed(2),
      r.profitEur.toFixed(2),
      r.marginPercent.toFixed(1),
    ]);
  }
  
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  
  doc.setFontSize(12);
  doc.text('Отчет по доставки', 14, finalY + 15);
  
  (doc as any).autoTable({
    startY: finalY + 20,
    head: [deliveriesHead],
    body: deliveriesBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 122, 0], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14 },
  });

  // Articles table
  const finalY2 = (doc as any).lastAutoTable?.finalY || 200;
  
  doc.setFontSize(12);
  doc.text('Отчет по артикули', 14, finalY2 + 15);
  
  const articlesHead = ['Артикул', 'Бройки', 'kg', 'Оборот', 'COGS', 'Печалба', 'Марж%'];
  const articlesBody = data.articleRows.map(r => [
    r.articleName.substring(0, 30),
    r.piecesSold,
    r.kgSold.toFixed(1),
    r.revenueEur.toFixed(2),
    r.cogsEur.toFixed(2),
    r.profitEur.toFixed(2),
    r.marginPercent.toFixed(1),
  ]);
  
  (doc as any).autoTable({
    startY: finalY2 + 20,
    head: [articlesHead],
    body: articlesBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 122, 0], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14 },
  });
  
  // Записваме файла
  doc.save(getFileName(mode, 'Report', 'pdf'));
};
