import type { ReportData, ReportMode } from '../types';
import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';

// Вземаме правилните референции
const pdfMake: any = (pdfMakeLib as any).default || pdfMakeLib;
const pdfFonts: any = (pdfFontsLib as any).default || pdfFontsLib;

// Настройваме vfs шрифтовете веднъж при зареждане на модула
if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

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
  
  // Освобождаваме URL-а след 1 секунда, за да даде време на браузъра да стартира изтеглянето
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

// ============ CSV EXPORT ============

const arrayToCSV = (headers: string[], rows: string[][]): string => {
  const headerLine = headers.join(';');
  const dataLines = rows.map(row => row.map(cell => `"${cell}"`).join(';'));
  return [headerLine, ...dataLines].join('\n');
};

const sectionToCSV = (title: string, headers: string[], rows: string[][]): string => {
  const titleLine = `"${title}"`;
  const emptyLine = '';
  const csvData = arrayToCSV(headers, rows);
  return [titleLine, emptyLine, csvData, emptyLine].join('\n');
};

export const exportToCSV = async (data: ReportData) => {
  const mode = data.filters.mode;
  const sections: string[] = [];
  
  // 1. Summary Section
  sections.push(sectionToCSV(
    '═══════════ РЕЗЮМЕ ═══════════',
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
  ));

  // 2. Deliveries Section
  sections.push(sectionToCSV(
    '═══════════ ПО ДОСТАВКИ ═══════════',
    mode === 'real' 
      ? ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)']
      : ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg дост.', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'],
    data.deliveryRows.map(r => [
      r.deliveryId || '',
      r.deliveryDisplayId || '',
      formatDate(r.deliveryDate),
      r.qualityName || '',
      r.isInvoiced ? 'Да' : 'Не',
      r.invoiceNumber || '',
      (r.kgIn || 0).toFixed(2),
      (r.eurPerKgDelivery || 0).toFixed(2),
      (r.totalDeliveryCostEur || 0).toFixed(2),
      (r.kgSold || 0).toFixed(2),
      String(r.piecesSold || 0),
      (r.revenueEur || 0).toFixed(2),
      (r.cogsEur || 0).toFixed(2),
      (r.profitEur || 0).toFixed(2),
      (r.marginPercent || 0).toFixed(1),
      (r.avgPricePerKgEur || 0).toFixed(2),
      (r.earnedFromDeliveryEur || 0).toFixed(2),
    ])
  ));

  // 3. Qualities Section (само за Real)
  if (mode === 'real') {
    sections.push(sectionToCSV(
      '═══════════ ПО КАЧЕСТВА ═══════════',
      ['Quality ID', 'Качество', 'kg', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg'],
      data.qualityRows.map(r => [
        String(r.qualityId || ''),
        r.qualityName || '',
        (r.kgSold || 0).toFixed(2),
        String(r.piecesSold || 0),
        (r.revenueEur || 0).toFixed(2),
        (r.cogsEur || 0).toFixed(2),
        (r.profitEur || 0).toFixed(2),
        (r.marginPercent || 0).toFixed(1),
        (r.avgPricePerKgEur || 0).toFixed(2),
      ])
    ));
  }

  // 4. Articles Section
  sections.push(sectionToCSV(
    '═══════════ ПО АРТИКУЛИ ═══════════',
    ['Article ID', 'Артикул', 'Бройки', 'kg', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/бр'],
    data.articleRows.map(r => [
      r.articleId || '',
      r.articleName || '',
      String(r.piecesSold || 0),
      (r.kgSold || 0).toFixed(2),
      (r.revenueEur || 0).toFixed(2),
      (r.cogsEur || 0).toFixed(2),
      (r.profitEur || 0).toFixed(2),
      (r.marginPercent || 0).toFixed(1),
      (r.avgPricePerPieceEur || 0).toFixed(2),
    ])
  ));

  // 5. Transactions Section
  sections.push(sectionToCSV(
    '═══════════ ДЕТАЙЛНИ ТРАНЗАКЦИИ ═══════════',
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
  ));

  // Обединяваме всички секции в един файл
  const fullCSV = sections.join('\n');
  
  // Генерираме име на файла
  const modeLabel = mode === 'real' ? 'Real' : 'Accounting';
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `${modeLabel}_Report_Complete_${dateStr}.csv`;
  
  downloadFile(fullCSV, filename, 'text/csv;charset=utf-8');
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
      r.deliveryId || '',
      r.deliveryDisplayId || '',
      formatDate(r.deliveryDate),
      r.qualityName || '',
      r.isInvoiced ? 'Да' : 'Не',
      r.invoiceNumber || '',
      r.kgIn || 0,
      r.eurPerKgDelivery || 0,
      r.totalDeliveryCostEur || 0,
      r.kgSold || 0,
      r.piecesSold || 0,
      r.revenueEur || 0,
      r.cogsEur || 0,
      r.profitEur || 0,
      r.marginPercent || 0,
      r.avgPricePerKgEur || 0,
      r.earnedFromDeliveryEur || 0,
    ]);
  } else {
    deliveriesHeaders = ['Delivery ID', 'Доставка', 'Дата', 'Качество', 'Фактурна', 'Фактура №', 'kg_in', 'EUR/kg дост.', 'Цена доставка (EUR)', 'kg продадени', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg прод.', 'Изкарани (EUR)'];
    deliveriesData = data.deliveryRows.map(r => [
      r.deliveryId || '',
      r.deliveryDisplayId || '',
      formatDate(r.deliveryDate),
      r.qualityName || '',
      r.isInvoiced ? 'Да' : 'Не',
      r.invoiceNumber || '',
      r.kgIn || 0,
      r.eurPerKgDelivery || 0,
      r.totalDeliveryCostEur || 0,
      r.kgSold || 0,
      r.piecesSold || 0,
      r.revenueEur || 0,
      r.cogsEur || 0,
      r.profitEur || 0,
      r.marginPercent || 0,
      r.avgPricePerKgEur || 0,
      r.earnedFromDeliveryEur || 0,
    ]);
  }
  
  const wsDeliveries = XLSX.utils.aoa_to_sheet([deliveriesHeaders, ...deliveriesData]);
  XLSX.utils.book_append_sheet(wb, wsDeliveries, 'By Deliveries');

  // Sheet 3: By Qualities (само за Real)
  if (mode === 'real') {
    const qualitiesHeaders = ['Quality ID', 'Качество', 'kg', 'Бройки', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/kg'];
    const qualitiesData = data.qualityRows.map(r => [
      r.qualityId || '',
      r.qualityName || '',
      r.kgSold || 0,
      r.piecesSold || 0,
      r.revenueEur || 0,
      r.cogsEur || 0,
      r.profitEur || 0,
      r.marginPercent || 0,
      r.avgPricePerKgEur || 0,
    ]);
    const wsQualities = XLSX.utils.aoa_to_sheet([qualitiesHeaders, ...qualitiesData]);
    XLSX.utils.book_append_sheet(wb, wsQualities, 'By Qualities');
  }

  // Sheet 4: By Articles
  const articlesHeaders = ['Article ID', 'Артикул', 'Бройки', 'kg', 'Оборот (EUR)', 'Себестойност (EUR)', 'Печалба (EUR)', 'Марж %', 'EUR/бр'];
  const articlesData = data.articleRows.map(r => [
    r.articleId || '',
    r.articleName || '',
    r.piecesSold || 0,
    r.kgSold || 0,
    r.revenueEur || 0,
    r.cogsEur || 0,
    r.profitEur || 0,
    r.marginPercent || 0,
    r.avgPricePerPieceEur || 0,
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
  try {
    const mode = data.filters.mode;
    
    // Подготвяме таблица със summary данни
    const summaryTable = {
      table: {
        widths: [150, 100],
        body: [
          [
            { text: 'Показател', fillColor: '#FF7A00', color: '#FFFFFF', bold: true },
            { text: 'Стойност', fillColor: '#FF7A00', color: '#FFFFFF', bold: true }
          ],
          ['Оборот (EUR)', data.summary.revenueEur.toFixed(2)],
          ['Себестойност (EUR)', data.summary.cogsEur.toFixed(2)],
          ['Печалба (EUR)', data.summary.profitEur.toFixed(2)],
          ['Марж %', data.summary.marginPercent.toFixed(1) + '%'],
          ['Продадени kg', data.summary.totalKg.toFixed(2)],
          ['Бройки', String(data.summary.totalPieces)],
          ['Брой продажби', String(data.summary.salesCount)],
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#CCCCCC',
        vLineColor: () => '#CCCCCC'
      }
    };
    
    // Подготвяме таблица с доставки
    let deliveriesTable;
    if (mode === 'real') {
      // Изчисляваме сумите за реален режим
      const totalKg = data.deliveryRows.reduce((sum, r) => sum + (r.kgSold || 0), 0);
      const totalPieces = data.deliveryRows.reduce((sum, r) => sum + (r.piecesSold || 0), 0);
      const totalRevenue = data.deliveryRows.reduce((sum, r) => sum + (r.revenueEur || 0), 0);
      const totalCogs = data.deliveryRows.reduce((sum, r) => sum + (r.cogsEur || 0), 0);
      const totalProfit = data.deliveryRows.reduce((sum, r) => sum + (r.profitEur || 0), 0);
      const totalEarned = data.deliveryRows.reduce((sum, r) => sum + (r.earnedFromDeliveryEur || 0), 0);
      const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
      
      deliveriesTable = {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Доставка', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Дата', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Качество', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Фактура', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'kg прод.', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Бройки', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Оборот', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Себестойност', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 8 },
              { text: 'Печалба', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Марж%', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Изкарани', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 }
            ],
            ...data.deliveryRows.map(r => [
              { text: r.deliveryDisplayId || '', fontSize: 8 },
              { text: formatDate(r.deliveryDate), fontSize: 8 },
              { text: (r.qualityName || '').substring(0, 20), fontSize: 8 },
              { text: r.invoiceNumber || '-', fontSize: 8 },
              { text: (r.kgSold || 0).toFixed(1), fontSize: 8 },
              { text: String(r.piecesSold || 0), fontSize: 8 },
              { text: (r.revenueEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.cogsEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.profitEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.marginPercent || 0).toFixed(1), fontSize: 8 },
              { text: (r.earnedFromDeliveryEur || 0).toFixed(2), fontSize: 8 }
            ]),
            [
              { text: 'ОБЩО:', bold: true, fontSize: 9, colSpan: 4, alignment: 'right' },
              {},
              {},
              {},
              { text: totalKg.toFixed(1), bold: true, fontSize: 9 },
              { text: String(totalPieces), bold: true, fontSize: 9 },
              { text: totalRevenue.toFixed(2), bold: true, fontSize: 9 },
              { text: totalCogs.toFixed(2), bold: true, fontSize: 9 },
              { text: totalProfit.toFixed(2), bold: true, fontSize: 9 },
              { text: avgMargin.toFixed(1), bold: true, fontSize: 9 },
              { text: totalEarned.toFixed(2), bold: true, fontSize: 9 }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: any, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#CCCCCC',
          vLineColor: () => '#CCCCCC'
        },
        fontSize: 8
      };
    } else {
      // Изчисляваме сумите за счетоводен режим
      const totalKg = data.deliveryRows.reduce((sum, r) => sum + (r.kgSold || 0), 0);
      const totalPieces = data.deliveryRows.reduce((sum, r) => sum + (r.piecesSold || 0), 0);
      const totalRevenue = data.deliveryRows.reduce((sum, r) => sum + (r.revenueEur || 0), 0);
      const totalCogs = data.deliveryRows.reduce((sum, r) => sum + (r.cogsEur || 0), 0);
      const totalProfit = data.deliveryRows.reduce((sum, r) => sum + (r.profitEur || 0), 0);
      const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
      
      deliveriesTable = {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Доставка', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Дата', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Качество', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Фактура', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'kg прод.', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Бройки', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Оборот', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Себестойност', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 8 },
              { text: 'Печалба', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
              { text: 'Марж%', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 }
            ],
            ...data.deliveryRows.map(r => [
              { text: r.deliveryDisplayId || '', fontSize: 8 },
              { text: formatDate(r.deliveryDate), fontSize: 8 },
              { text: (r.qualityName || '').substring(0, 20), fontSize: 8 },
              { text: r.invoiceNumber || '-', fontSize: 8 },
              { text: (r.kgSold || 0).toFixed(1), fontSize: 8 },
              { text: String(r.piecesSold || 0), fontSize: 8 },
              { text: (r.revenueEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.cogsEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.profitEur || 0).toFixed(2), fontSize: 8 },
              { text: (r.marginPercent || 0).toFixed(1), fontSize: 8 }
            ]),
            [
              { text: 'ОБЩО:', bold: true, fontSize: 9, colSpan: 4, alignment: 'right' },
              {},
              {},
              {},
              { text: totalKg.toFixed(1), bold: true, fontSize: 9 },
              { text: String(totalPieces), bold: true, fontSize: 9 },
              { text: totalRevenue.toFixed(2), bold: true, fontSize: 9 },
              { text: totalCogs.toFixed(2), bold: true, fontSize: 9 },
              { text: totalProfit.toFixed(2), bold: true, fontSize: 9 },
              { text: avgMargin.toFixed(1), bold: true, fontSize: 9 }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: any, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#CCCCCC',
          vLineColor: () => '#CCCCCC'
        },
        fontSize: 8
      };
    }
    
    // Подготвяме таблица с артикули (ако има данни)
    const articlesTable = data.articleRows && data.articleRows.length > 0 ? {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'Артикул', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
            { text: 'Бройки', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
            { text: 'kg', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
            { text: 'Оборот', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
            { text: 'Себестойност', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 8 },
            { text: 'Печалба', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 },
            { text: 'Марж%', fillColor: '#FF7A00', color: '#FFFFFF', bold: true, fontSize: 9 }
          ],
          ...data.articleRows.map(r => [
            { text: (r.articleName || '').substring(0, 30), fontSize: 8 },
            { text: String(r.piecesSold || 0), fontSize: 8 },
            { text: (r.kgSold || 0).toFixed(1), fontSize: 8 },
            { text: (r.revenueEur || 0).toFixed(2), fontSize: 8 },
            { text: (r.cogsEur || 0).toFixed(2), fontSize: 8 },
            { text: (r.profitEur || 0).toFixed(2), fontSize: 8 },
            { text: (r.marginPercent || 0).toFixed(1), fontSize: 8 }
          ])
        ]
      },
      layout: {
        hLineWidth: (i: any) => (i === 0 || i === 1) ? 1 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#CCCCCC',
        vLineColor: () => '#CCCCCC'
      },
      fontSize: 8
    } : null;
    
    // Създаваме document definition
    const content: any[] = [
      { text: mode === 'real' ? 'Реален месечен отчет' : 'Счетоводен месечен отчет', fontSize: 20, bold: true, margin: [0, 0, 0, 10] },
      { text: `Период: ${data.periodLabel}`, fontSize: 11, margin: [0, 0, 0, 5] },
      { text: `Генерирано: ${formatDateTime(data.generatedAt)}`, fontSize: 11, margin: [0, 0, 0, 20] },
      { text: 'Обобщение', fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
      summaryTable,
      { text: 'Отчет по доставки', fontSize: 14, bold: true, margin: [0, 20, 0, 10] },
      deliveriesTable
    ];
    
    if (articlesTable) {
      content.push({ text: 'Отчет по артикули', fontSize: 14, bold: true, margin: [0, 20, 0, 10], pageBreak: 'before' });
      content.push(articlesTable);
    }
    
    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      content,
      defaultStyle: {
        font: 'Roboto'
      }
    };
    
    // Генерираме и изтегляме PDF
    pdfMake.createPdf(docDefinition).download(getFileName(mode, 'Report', 'pdf'));
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Грешка при генериране на PDF файл');
  }
};
