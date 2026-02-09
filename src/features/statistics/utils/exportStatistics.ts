import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import type { StatisticsRow, StatisticsSummaryData, CostMode } from '../types';

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
    pageOrientation: 'landscape',
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

