import type { Customer } from '../../../lib/supabase/types';
import type { CustomerFilters } from '../types';

// Филтрира клиенти според зададените критерии
export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  let filtered = [...customers];

  // Търсене по име, фирма, телефон, имейл, баркод
  if (filters.search.trim()) {
    const searchLower = filters.search.trim().toLowerCase();
    filtered = filtered.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.company_name?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.barcode?.toLowerCase().includes(searchLower)
      );
    });
  }

  // Филтър по съгласие за лични данни
  if (filters.gdprConsent !== 'all') {
    const wantConsent = filters.gdprConsent === 'yes';
    filtered = filtered.filter((customer) => customer.gdpr_consent === wantConsent);
  }

  // Филтър по наличие на фирмени данни
  if (filters.hasCompanyData !== 'all') {
    const wantCompanyData = filters.hasCompanyData === 'yes';
    filtered = filtered.filter((customer) => {
      const hasData = !!(
        customer.company_name ||
        customer.company_address ||
        customer.tax_number ||
        customer.bulstat ||
        customer.vat_number
      );
      return hasData === wantCompanyData;
    });
  }

  return filtered;
}

// Форматира дата в DD.MM.YYYY формат
function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Изтегляне на файл
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// Експорт на клиенти в Excel формат
export async function exportCustomersToExcel(customers: Customer[]): Promise<void> {
  try {
    // Динамично зареждане на xlsx библиотека
    const XLSX = await import('xlsx');

    // Подготовка на данни за експорт
    const data = customers.map((customer) => ({
      'Име': customer.name || '',
      'Баркод': customer.barcode || '',
      'Телефон': customer.phone || '',
      'Имейл': customer.email || '',
      'Адрес': customer.address || '',
      'GDPR съгласие': customer.gdpr_consent ? 'Да' : 'Не',
      'Фирма': customer.company_name || '',
      'Адрес на фирма': customer.company_address || '',
      'Данъчен номер': customer.tax_number || '',
      'Булстат': customer.bulstat || '',
      'МОЛ': customer.mol_name || '',
      'Получател': customer.recipient_name || '',
      'ЕГН на получател': customer.recipient_egn || '',
      'ИН по ДДС': customer.vat_number || '',
      'Забележка': customer.notes || '',
      'Създаден на': formatDate(customer.created_at),
    }));

    // Създаване на работна книга
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Клиенти');

    // Настройка на ширина на колони
    const colWidths = [
      { wch: 25 }, // Име
      { wch: 15 }, // Баркод
      { wch: 15 }, // Телефон
      { wch: 25 }, // Имейл
      { wch: 30 }, // Адрес
      { wch: 12 }, // GDPR съгласие
      { wch: 25 }, // Фирма
      { wch: 30 }, // Адрес на фирма
      { wch: 15 }, // Данъчен номер
      { wch: 15 }, // Булстат
      { wch: 25 }, // МОЛ
      { wch: 25 }, // Получател
      { wch: 15 }, // ЕГН на получател
      { wch: 15 }, // ИН по ДДС
      { wch: 30 }, // Забележка
      { wch: 12 }, // Създаден на
    ];
    ws['!cols'] = colWidths;

    // Генериране на файл
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `Klienti_${dateStr}.xlsx`;
    
    downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Грешка при експорт в Excel');
  }
}

// Експорт на клиенти в PDF формат
export async function exportCustomersToPDF(customers: Customer[]): Promise<void> {
  try {
    // Динамично зареждане на pdfmake
    const pdfMakeLib = await import('pdfmake/build/pdfmake');
    const pdfFontsLib = await import('pdfmake/build/vfs_fonts');
    
    const pdfMake: any = (pdfMakeLib as any).default || pdfMakeLib;
    const pdfFonts: any = (pdfFontsLib as any).default || pdfFontsLib;

    if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts.vfs) {
      pdfMake.vfs = pdfFonts.vfs;
    }

    const now = new Date();
    const dateStr = formatDate(now);

    // Подготовка на таблица
    const tableBody = [
      // Заглавие
      [
        { text: 'Име', style: 'tableHeader' },
        { text: 'Баркод', style: 'tableHeader' },
        { text: 'Телефон', style: 'tableHeader' },
        { text: 'Имейл', style: 'tableHeader' },
        { text: 'Фирма', style: 'tableHeader' },
        { text: 'GDPR', style: 'tableHeader' },
      ],
      // Редове с данни
      ...customers.map((customer) => [
        customer.name || '—',
        customer.barcode || '—',
        customer.phone || '—',
        customer.email || '—',
        customer.company_name || '—',
        customer.gdpr_consent ? 'Да' : 'Не',
      ]),
    ];

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape' as const,
      pageMargins: [40, 60, 40, 40],
      content: [
        {
          text: 'Клиентска база',
          style: 'header',
          margin: [0, 0, 0, 10],
        },
        {
          text: `Дата: ${dateStr}`,
          style: 'subheader',
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', '*', 'auto'],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#FF7A00' : rowIndex % 2 === 0 ? '#f9f9f9' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
          },
        },
        {
          text: `Общо клиенти: ${customers.length}`,
          style: 'footer',
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#0B4F8A',
        },
        subheader: {
          fontSize: 12,
          color: '#666',
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'white',
          fillColor: '#FF7A00',
        },
        footer: {
          fontSize: 10,
          bold: true,
          color: '#0B4F8A',
        },
      },
      defaultStyle: {
        fontSize: 9,
      },
    };

    const filename = `Klienti_${dateStr.replace(/\./g, '-')}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Грешка при експорт в PDF');
  }
}
