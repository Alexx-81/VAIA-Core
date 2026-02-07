// Типове за импорт на продажби
export interface SaleImportRow {
  date: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  deliveryId: number;
}

export interface ImportValidationResult {
  valid: SaleImportRow[];
  errors: string[];
}

interface ExcelRow {
  'Дата': string | number;
  'Артикул': string;
  'Брой': number;
  'Единична продажна цена на бройка': string | number;
  'Доставка ID': number;
}

/**
 * Парсва дата от Excel формат
 */
async function parseDate(value: string | number): Promise<string> {
  if (typeof value === 'number') {
    // Excel serial date
    const XLSX = await import('xlsx');
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  // Parse DD.MM.YYYY format
  const parts = value.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  return value;
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
 * Парсва Excel файл и връща редове за импорт
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
        
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        
        const rowPromises = jsonData.map(async (row) => ({
          date: await parseDate(row['Дата']),
          articleName: row['Артикул'] || '',
          quantity: row['Брой'] || 0,
          unitPrice: parsePrice(row['Единична продажна цена на бройка']),
          deliveryId: row['Доставка ID'] || 0,
        }));        
        const rows = await Promise.all(rowPromises);        
        resolve(rows);
      } catch {
        reject(new Error('Грешка при четене на файла'));
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
      errors.push(`Ред ${rowNum}: Липсва артикул`);
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
 * Групира редове по дата за създаване на продажби
 */
export function groupRowsByDate(rows: SaleImportRow[]): Map<string, SaleImportRow[]> {
  const grouped = new Map<string, SaleImportRow[]>();
  
  rows.forEach((row) => {
    const existing = grouped.get(row.date) || [];
    existing.push(row);
    grouped.set(row.date, existing);
  });
  
  return grouped;
}
