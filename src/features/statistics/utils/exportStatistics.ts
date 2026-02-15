import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import type { StatisticsRow, StatisticsSummaryData, CostMode } from '../types';
import type { 
  LoyaltyTierDistribution, 
  LoyaltyVoucherMonthlyStats, 
  LoyaltyROIStats, 
  LoyaltyTopCustomer 
} from '../../../lib/api/loyalty';

// Setup pdfMake
const pdfMake: any = (pdfMakeLib as any).default || pdfMakeLib;
const pdfFonts: any = (pdfFontsLib as any).default || pdfFontsLib;

if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

export const exportStatisticsToCSV = (
  rows: StatisticsRow[],
  costModes: CostMode[],
  title: string
) => {
  const showReal = costModes.includes('real');
  const showAcc = costModes.includes('accounting');
  const showBoth = showReal && showAcc;

  // Build header
  const headers = ['Период', 'Оборот (€)'];
  
  if (showReal) {
    headers.push(
      `Себестойност ${showBoth ? '(реална)' : ''} (€)`,
      `Печалба ${showBoth ? '(реална)' : ''} (€)`
    );
  }
  
  if (showAcc) {
    headers.push(
      `Себестойност ${showBoth ? '(счет.)' : ''} (€)`,
      `Печалба ${showBoth ? '(счет.)' : ''} (€)`
    );
  }
  
  headers.push('Продадени кг');
  
  if (showReal) {
    headers.push(`Марж ${showBoth ? '(реален)' : ''} (%)`);
  }
  
  if (showAcc) {
    headers.push(`Марж ${showBoth ? '(счет.)' : ''} (%)`);
  }

  // Build rows
  const csvRows = rows.map(row => {
    const data = [row.period, row.revenue.toFixed(2)];
    
    if (showReal) {
      data.push(row.costReal.toFixed(2), row.profitReal.toFixed(2));
    }
    
    if (showAcc) {
      data.push(row.costAcc.toFixed(2), row.profitAcc.toFixed(2));
    }
    
    data.push(row.kgSold.toFixed(1));
    
    if (showReal) {
      data.push(row.marginReal.toFixed(1));
    }
    
    if (showAcc) {
      data.push(row.marginAcc.toFixed(1));
    }
    
    return data;
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(',')),
  ].join('\n');

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportStatisticsToExcel = (
  rows: StatisticsRow[],
  costModes: CostMode[],
  title: string
) => {
  const showReal = costModes.includes('real');
  const showAcc = costModes.includes('accounting');
  const showBoth = showReal && showAcc;

  // Build header
  const headers = ['Период', 'Оборот (€)'];
  
  if (showReal) {
    headers.push(
      `Себестойност ${showBoth ? '(реална)' : ''} (€)`,
      `Печалба ${showBoth ? '(реална)' : ''} (€)`
    );
  }
  
  if (showAcc) {
    headers.push(
      `Себестойност ${showBoth ? '(счет.)' : ''} (€)`,
      `Печалба ${showBoth ? '(счет.)' : ''} (€)`
    );
  }
  
  headers.push('Продадени кг');
  
  if (showReal) {
    headers.push(`Марж ${showBoth ? '(реален)' : ''} (%)`);
  }
  
  if (showAcc) {
    headers.push(`Марж ${showBoth ? '(счет.)' : ''} (%)`);
  }

  // Build data rows
  const data = rows.map(row => {
    const rowData: any[] = [row.period, row.revenue];
    
    if (showReal) {
      rowData.push(row.costReal, row.profitReal);
    }
    
    if (showAcc) {
      rowData.push(row.costAcc, row.profitAcc);
    }
    
    rowData.push(row.kgSold);
    
    if (showReal) {
      rowData.push(row.marginReal);
    }
    
    if (showAcc) {
      rowData.push(row.marginAcc);
    }
    
    return rowData;
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Format percentage columns (Марж колони)
  const percentColumnIndexes: number[] = [];
  let currentColIndex = 2; // Start after "Период" and "Оборот"
  
  if (showReal) {
    currentColIndex += 2; // Skip "Себестойност (реална)" and "Печалба (реална)"
  }
  
  if (showAcc) {
    currentColIndex += 2; // Skip "Себестойност (счет.)" and "Печалба (счет.)"
  }
  
  currentColIndex += 1; // Skip "Продадени кг"
  
  if (showReal) {
    percentColumnIndexes.push(currentColIndex);
    currentColIndex += 1;
  }
  
  if (showAcc) {
    percentColumnIndexes.push(currentColIndex);
  }

  // Apply percentage formatting
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    percentColumnIndexes.forEach(colIdx => {
      for (let rowIdx = 1; rowIdx <= range.e.r; rowIdx++) { // Start from row 1 (skip header)
        const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        const cell = ws[cellAddress];
        
        if (cell && typeof cell.v === 'number') {
          // Divide by 100 because Excel expects 0.10 for 10%
          cell.v = cell.v / 100;
          // Set percentage format with 2 decimal places
          cell.z = '0.00%';
          cell.t = 'n'; // Number type
        }
      }
    });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Статистика');

  // Download
  XLSX.writeFile(wb, `${title}.xlsx`);
};

export const exportStatisticsToPDF = (
  rows: StatisticsRow[],
  summary: StatisticsSummaryData,
  costModes: CostMode[],
  title: string
) => {
  const showReal = costModes.includes('real');
  const showAcc = costModes.includes('accounting');
  const showBoth = showReal && showAcc;

  // Build table headers
  const headers: string[] = ['Период', 'Оборот (€)'];
  
  if (showReal) {
    headers.push(
      `Себест. ${showBoth ? '(реал.)' : ''} (€)`,
      `Печалба ${showBoth ? '(реал.)' : ''} (€)`
    );
  }
  
  if (showAcc) {
    headers.push(
      `Себест. ${showBoth ? '(счет.)' : ''} (€)`,
      `Печалба ${showBoth ? '(счет.)' : ''} (€)`
    );
  }
  
  headers.push('кг');
  
  if (showReal) {
    headers.push(`Марж ${showBoth ? '(реал.)' : ''} %`);
  }
  
  if (showAcc) {
    headers.push(`Марж ${showBoth ? '(счет.)' : ''} %`);
  }

  // Build table data
  const tableData = rows.map(row => {
    const rowData: string[] = [row.period, row.revenue.toFixed(2)];
    
    if (showReal) {
      rowData.push(row.costReal.toFixed(2), row.profitReal.toFixed(2));
    }
    
    if (showAcc) {
      rowData.push(row.costAcc.toFixed(2), row.profitAcc.toFixed(2));
    }
    
    rowData.push(row.kgSold.toFixed(1));
    
    if (showReal) {
      rowData.push(row.marginReal.toFixed(1));
    }
    
    if (showAcc) {
      rowData.push(row.marginAcc.toFixed(1));
    }
    
    return rowData;
  });

  // Build summary content
  const summaryContent = [
    `Общ оборот: ${summary.totalRevenue.toFixed(2)} €`,
  ];
  
  if (showReal) {
    summaryContent.push(
      `Обща печалба (реална): ${summary.totalProfitReal.toFixed(2)} €`,
      `Среден марж (реален): ${summary.avgMarginReal.toFixed(1)}%`
    );
  }
  
  if (showAcc) {
    summaryContent.push(
      `Обща печалба (счет.): ${summary.totalProfitAcc.toFixed(2)} €`,
      `Среден марж (счет.): ${summary.avgMarginAcc.toFixed(1)}%`
    );
  }
  
  summaryContent.push(`Общо килограми: ${summary.totalKgSold.toFixed(1)} kg`);

  // Create PDF document definition
  const docDefinition: any = {
    pageOrientation: 'portrait',
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        text: title,
        style: 'header',
        margin: [0, 0, 0, 20],
      },
      {
        text: summaryContent.join('\n'),
        style: 'summary',
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          headerRows: 1,
          widths: Array(headers.length).fill('auto'),
          body: [
            headers.map(h => ({ text: h, style: 'tableHeader' })),
            ...tableData.map(row => row.map(cell => ({ text: cell, style: 'tableCell' }))),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0B4F8A' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      summary: {
        fontSize: 10,
        margin: [0, 5, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: 'white',
        alignment: 'center',
      },
      tableCell: {
        fontSize: 8,
        alignment: 'right',
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };

  // Download
  pdfMake.createPdf(docDefinition).download(`${title}.pdf`);
};

// =============================================================================
// LOYALTY EXPORTS
// =============================================================================

export interface LoyaltyExportData {
  tierDistribution: LoyaltyTierDistribution[];
  vouchersMonthly: LoyaltyVoucherMonthlyStats[];
  roi: LoyaltyROIStats | null;
  topCustomers: LoyaltyTopCustomer[];
}

export const exportLoyaltyToCSV = (data: LoyaltyExportData, title: string) => {
  const sections: string[] = [];

  // ROI Metrics Section
  if (data.roi) {
    sections.push('=== ROI МЕТРИКИ ===');
    sections.push(`Обща отстъпка (нива),${data.roi.total_tier_discounts_eur.toFixed(2)}`);
    sections.push(`Обща отстъпка (ваучери),${data.roi.total_voucher_discounts_eur.toFixed(2)}`);
    sections.push(`Обща отстъпка,${data.roi.total_discounts_eur.toFixed(2)}`);
    sections.push(`Клиенти с лоялност,${data.roi.customers_with_loyalty}`);
    sections.push(`Общо клиенти,${data.roi.total_customers}`);
    sections.push(`Процент участие,${data.roi.loyalty_participation_rate.toFixed(1)}%`);
    sections.push(`Средна отстъпка на продажба,${data.roi.avg_discount_per_sale_eur.toFixed(2)}`);
    sections.push(`Продажби с лоялност,${data.roi.sales_with_loyalty_count}`);
    sections.push(`Общо продажби,${data.roi.total_sales_count}`);
    sections.push('');
  }

  // Tier Distribution Section
  sections.push('=== РАЗПРЕДЕЛЕНИЕ ПО НИВА ===');
  sections.push('Ниво,Клиенти,Среден оборот (€),Общ оборот (€)');
  data.tierDistribution.forEach(tier => {
    sections.push(
      `${tier.tier_name},${tier.customer_count},${tier.avg_turnover_12m_eur.toFixed(2)},${tier.total_turnover_12m_eur.toFixed(2)}`
    );
  });
  sections.push('');

  // Vouchers Section
  sections.push('=== ВАУЧЕРИ ПО МЕСЕЦИ ===');
  sections.push('Месец,Издадени (бр),Издадени (€),Изплатени (бр),Изплатени (€)');
  data.vouchersMonthly.forEach(vm => {
    sections.push(
      `${vm.month},${vm.issued_count},${vm.issued_amount_eur.toFixed(2)},${vm.redeemed_count},${vm.redeemed_amount_eur.toFixed(2)}`
    );
  });
  sections.push('');

  // Top Customers Section
  sections.push('=== ТОП КЛИЕНТИ ===');
  sections.push('Клиент,Ниво,Оборот 12м (€),Отстъпка ниво (€),Отстъпка ваучери (€),Издадени ваучери,Изплатени ваучери');
  data.topCustomers.forEach(customer => {
    sections.push(
      `${customer.customer_name},${customer.current_tier_name},${customer.turnover_12m_eur.toFixed(2)},${customer.tier_discount_total_eur.toFixed(2)},${customer.voucher_discount_total_eur.toFixed(2)},${customer.total_vouchers_issued},${customer.total_vouchers_redeemed}`
    );
  });

  const csvContent = sections.join('\n');
  
  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportLoyaltyToExcel = (data: LoyaltyExportData, title: string) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: ROI Metrics
  if (data.roi) {
    const roiData = [
      ['Метрика', 'Стойност'],
      ['Обща отстъпка (нива)', data.roi.total_tier_discounts_eur],
      ['Обща отстъпка (ваучери)', data.roi.total_voucher_discounts_eur],
      ['Обща отстъпка', data.roi.total_discounts_eur],
      ['Клиенти с лоялност', data.roi.customers_with_loyalty],
      ['Общо клиенти', data.roi.total_customers],
      ['Процент участие (%)', data.roi.loyalty_participation_rate],
      ['Средна отстъпка на продажба (€)', data.roi.avg_discount_per_sale_eur],
      ['Продажби с лоялност', data.roi.sales_with_loyalty_count],
      ['Общо продажби', data.roi.total_sales_count],
    ];
    const wsROI = XLSX.utils.aoa_to_sheet(roiData);
    XLSX.utils.book_append_sheet(wb, wsROI, 'ROI Метрики');
  }

  // Sheet 2: Tier Distribution
  const tierData = [
    ['Ниво', 'Клиенти', 'Среден оборот (€)', 'Общ оборот (€)'],
    ...data.tierDistribution.map(tier => [
      tier.tier_name,
      tier.customer_count,
      tier.avg_turnover_12m_eur,
      tier.total_turnover_12m_eur,
    ]),
  ];
  const wsTiers = XLSX.utils.aoa_to_sheet(tierData);
  XLSX.utils.book_append_sheet(wb, wsTiers, 'Нива');

  // Sheet 3: Vouchers
  const voucherData = [
    ['Месец', 'Издадени (бр)', 'Издадени (€)', 'Изплатени (бр)', 'Изплатени (€)'],
    ...data.vouchersMonthly.map(vm => [
      vm.month,
      vm.issued_count,
      vm.issued_amount_eur,
      vm.redeemed_count,
      vm.redeemed_amount_eur,
    ]),
  ];
  const wsVouchers = XLSX.utils.aoa_to_sheet(voucherData);
  XLSX.utils.book_append_sheet(wb, wsVouchers, 'Ваучери');

  // Sheet 4: Top Customers
  const customerData = [
    ['Клиент', 'Ниво', 'Оборот 12м (€)', 'Отстъпка ниво (€)', 'Отстъпка ваучери (€)', 'Издадени ваучери', 'Изплатени ваучери'],
    ...data.topCustomers.map(customer => [
      customer.customer_name,
      customer.current_tier_name,
      customer.turnover_12m_eur,
      customer.tier_discount_total_eur,
      customer.voucher_discount_total_eur,
      customer.total_vouchers_issued,
      customer.total_vouchers_redeemed,
    ]),
  ];
  const wsCustomers = XLSX.utils.aoa_to_sheet(customerData);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Топ клиенти');

  // Download
  XLSX.writeFile(wb, `${title}.xlsx`);
};

export const exportLoyaltyToPDF = (data: LoyaltyExportData, title: string) => {
  const content: any[] = [
    {
      text: title,
      style: 'header',
      margin: [0, 0, 0, 20],
    },
  ];

  // ROI Metrics Section
  if (data.roi) {
    content.push(
      { text: 'ROI Метрики', style: 'sectionHeader', margin: [0, 10, 0, 10] },
      {
        table: {
          headerRows: 0,
          widths: ['*', 'auto'],
          body: [
            ['Обща отстъпка (нива):', `€${data.roi.total_tier_discounts_eur.toFixed(2)}`],
            ['Обща отстъпка (ваучери):', `€${data.roi.total_voucher_discounts_eur.toFixed(2)}`],
            ['Обща отстъпка:', `€${data.roi.total_discounts_eur.toFixed(2)}`],
            ['Клиенти с лоялност:', `${data.roi.customers_with_loyalty} от ${data.roi.total_customers}`],
            ['Процент участие:', `${data.roi.loyalty_participation_rate.toFixed(1)}%`],
            ['Средна отстъпка на продажба:', `€${data.roi.avg_discount_per_sale_eur.toFixed(2)}`],
            ['Продажби с лоялност:', `${data.roi.sales_with_loyalty_count} от ${data.roi.total_sales_count}`],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15],
      }
    );
  }

  // Tier Distribution Section
  if (data.tierDistribution.length > 0) {
    content.push(
      { text: 'Разпределение по нива', style: 'sectionHeader', margin: [0, 10, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Ниво', style: 'tableHeader' },
              { text: 'Клиенти', style: 'tableHeader' },
              { text: 'Среден оборот (€)', style: 'tableHeader' },
              { text: 'Общ оборот (€)', style: 'tableHeader' },
            ],
            ...data.tierDistribution.map(tier => [
              tier.tier_name,
              tier.customer_count.toString(),
              tier.avg_turnover_12m_eur.toFixed(2),
              tier.total_turnover_12m_eur.toFixed(2),
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0B4F8A' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
        margin: [0, 0, 0, 15],
      }
    );
  }

  // Vouchers Section
  if (data.vouchersMonthly.length > 0) {
    content.push(
      { text: 'Ваучери по месеци', style: 'sectionHeader', margin: [0, 10, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Месец', style: 'tableHeader' },
              { text: 'Издадени (бр)', style: 'tableHeader' },
              { text: 'Издадени (€)', style: 'tableHeader' },
              { text: 'Изплатени (бр)', style: 'tableHeader' },
              { text: 'Изплатени (€)', style: 'tableHeader' },
            ],
            ...data.vouchersMonthly.map(vm => [
              vm.month,
              vm.issued_count.toString(),
              vm.issued_amount_eur.toFixed(2),
              vm.redeemed_count.toString(),
              vm.redeemed_amount_eur.toFixed(2),
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0B4F8A' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
        margin: [0, 0, 0, 15],
      }
    );
  }

  // Top Customers Section
  if (data.topCustomers.length > 0) {
    content.push(
      { text: 'Топ клиенти', style: 'sectionHeader', margin: [0, 10, 0, 10], pageBreak: 'before' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Клиент', style: 'tableHeader' },
              { text: 'Ниво', style: 'tableHeader' },
              { text: 'Оборот 12м (€)', style: 'tableHeader' },
              { text: 'От. ниво (€)', style: 'tableHeader' },
              { text: 'От. ваучери (€)', style: 'tableHeader' },
              { text: 'Ваучери', style: 'tableHeader' },
            ],
            ...data.topCustomers.map(customer => [
              customer.customer_name,
              customer.current_tier_name,
              customer.turnover_12m_eur.toFixed(2),
              customer.tier_discount_total_eur.toFixed(2),
              customer.voucher_discount_total_eur.toFixed(2),
              `${customer.total_vouchers_redeemed}/${customer.total_vouchers_issued}`,
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0B4F8A' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
      }
    );
  }

  const docDefinition: any = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#0B4F8A',
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: 'white',
        alignment: 'center',
      },
      tableCell: {
        fontSize: 8,
        alignment: 'right',
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
  };

  // Download
  pdfMake.createPdf(docDefinition).download(`${title}.pdf`);
};
