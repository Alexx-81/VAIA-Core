// Типове за импорт на продажби
export interface SaleImportRow {
  date: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  deliveryId: number | string;
  accountingDeliveryId?: number | string; // Попълва се само когато Real дост. съдържа буква "A"
  paymentMethod: 'cash' | 'no-cash';
}

export interface ImportValidationResult {
  valid: SaleImportRow[];
  errors: string[];
}

/**
 * Парсва дата от Excel формат
 */
async function parseDate(value: string | number | undefined): Promise<string> {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') {
    // Excel serial date
    const XLSX = await import('xlsx');
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  // Parse DD.MM.YYYY format
  const parts = String(value).split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  return String(value);
}

/**
 * Парсва цена от различни формати (с € символ, запетая и др.)
 */
function parsePrice(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  // Remove currency symbol and parse
  const cleaned = value.replace(/[€\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Парсва метод на плащане от Excel стойност
 */
function parsePaymentMethod(value?: string): 'cash' | 'no-cash' {
  if (!value) return 'cash';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'без каса' || normalized === 'no-cash' || normalized === 'no_cash' || normalized === 'безкаса') {
    return 'no-cash';
  }
  return 'cash';
}

/**
 * Парсва Excel файл и връща редове за импорт
 *
 * Очаквани колони (по ред): Дата | Артикул | Брой | Единична продажна цена на бройка | Доставка ID | Плащане
 * Търси ги по точно съвпадение на нормализираното заглавие, после по позиция ако не намери.
 */
export function parseExcelFile(file: File): Promise<SaleImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Четем като масив от масиви — row[0] = хедъри, row[1..] = данни
        const raw = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

        if (raw.length < 2) {
          resolve([]);
          return;
        }

        const headerRow = (raw[0] as unknown[]).map(h => String(h ?? '').trim());

        // Намери индекс на колона по нормализирано частично съвпадение
        const col = (keywords: string[]): number => {
          for (const kw of keywords) {
            const nkw = kw.toLowerCase().replace(/\s+/g, '');
            const idx = headerRow.findIndex(h =>
              h.toLowerCase().replace(/\s+/g, '') === nkw ||
              h.toLowerCase().replace(/\s+/g, '').startsWith(nkw) ||
              h.toLowerCase().replace(/\s+/g, '').includes(nkw)
            );
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colDate       = col(['Дата', 'Date']);
        const colArticle    = col(['Артикул', 'Article']);
        const colQty        = col(['Брой', 'Qty', 'Quantity']);
        const colPrice      = col(['Единична', 'Unit', 'Цена', 'Price']);
        const colDelivery   = col(['Realdост', 'Realдост', 'ДоставкаID', 'Realdoст', 'Реалдост', 'Real', 'Доставка', 'Delivery']);
        const colAccDelivery = col(['Accдоставка', 'Accdoставка', 'Accдост', 'Acc.доставка', 'Acc', 'Счет.дост', 'AccountingDelivery']);
        const colPayment    = col(['Плащане', 'Payment']);

        // Ако колоната „Артикул" не е намерена — покажи откритите хедъри
        if (colArticle === -1) {
          reject(new Error(
            `Не е открита колона "Артикул". Открити хедъри: [${headerRow.join(' | ')}]`
          ));
          return;
        }

        const dataRows = raw.slice(1) as unknown[][];
        const rowPromises = dataRows
          .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
          .map(async (row) => {
            const rawDate       = colDate       !== -1 ? row[colDate]       : '';
            const rawQty        = colQty        !== -1 ? row[colQty]        : 0;
            const rawPrice      = colPrice      !== -1 ? row[colPrice]      : 0;
            const rawDeliv      = colDelivery   !== -1 ? row[colDelivery]   : 0;
            const rawAccDeliv   = colAccDelivery !== -1 ? row[colAccDelivery] : '';
            const rawPayment    = colPayment    !== -1 ? row[colPayment]    : '';

            const deliveryIdStr = String(rawDeliv ?? '').trim();
            const accDeliveryIdStr = String(rawAccDeliv ?? '').trim();

            return {
              date: await parseDate(rawDate as string | number | undefined),
              articleName: String(row[colArticle] ?? '').trim(),
              quantity: Number(rawQty) || 0,
              unitPrice: parsePrice(rawPrice as string | number),
              deliveryId: deliveryIdStr || 0,
              // Acc. доставка се попълва само ако е попълнена в Excel-а (т.е. Real дост. съдържа "A")
              accountingDeliveryId: accDeliveryIdStr !== '' ? accDeliveryIdStr : undefined,
              paymentMethod: parsePaymentMethod(String(rawPayment ?? '').trim()),
            };
          });

        const rows = await Promise.all(rowPromises);
        resolve(rows);
      } catch (err) {
        reject(new Error(`Грешка при четене на файла: ${err instanceof Error ? err.message : err}`));
      }
    };

    reader.onerror = () => reject(new Error('Грешка при зареждане на файла'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Валидира импортираните редове
 * @param rows - редове за валидация
 * @param existingArticles - списък със съществуващи артикули (празен = без проверка)
 * @param skipArticleValidation - ако е true, не проверява дали артикулите съществуват
 */
export function validateImportRows(
  rows: SaleImportRow[],
  existingArticles: string[],
  skipArticleValidation = false
): ImportValidationResult {
  const valid: SaleImportRow[] = [];
  const errors: string[] = [];
  
  // Нормализирани имена на артикули (trim + lowercase) за по-гъвкаво сравнение
  const normalizedArticles = existingArticles.map(a => a.trim().toLowerCase());
  
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header and 0-index
    
    // Trim article name to remove leading/trailing whitespace
    row.articleName = row.articleName.trim();
    
    if (!row.date) {
      errors.push(`Ред ${rowNum}: Липсва дата`);
      return;
    }
    
    if (!row.articleName) {
      errors.push(`Ред ${rowNum}: Липсва артикул (дата="${row.date}", брой=${row.quantity}, цена=${row.unitPrice})`);
      return;
    }
    
    if (row.quantity <= 0) {
      errors.push(`Ред ${rowNum}: Невалиден брой`);
      return;
    }
    
    if (row.unitPrice <= 0) {
      errors.push(`Ред ${rowNum}: Невалидна цена`);
      return;
    }
    
    // Check if article exists (skip if no articles provided or validation disabled)
    if (!skipArticleValidation && existingArticles.length > 0) {
      const normalizedRowArticle = row.articleName.toLowerCase();
      if (!normalizedArticles.includes(normalizedRowArticle)) {
        errors.push(`Ред ${rowNum}: Непознат артикул "${row.articleName}"`);
        return;
      }
    }
    
    valid.push(row);
  });
  
  return { valid, errors };
}

/**
 * Групира редове по дата и метод на плащане за създаване на продажби
 */
export function groupRowsByDateAndPayment(rows: SaleImportRow[]): Map<string, SaleImportRow[]> {
  const grouped = new Map<string, SaleImportRow[]>();
  
  rows.forEach((row) => {
    const key = `${row.date}|${row.paymentMethod}`;
    const existing = grouped.get(key) || [];
    existing.push(row);
    grouped.set(key, existing);
  });
  
  return grouped;
}
