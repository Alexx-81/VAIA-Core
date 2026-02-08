import type { Article, ArticleImportRow, ImportResult } from '../types';
import { piecesPerKgToGrams } from './articleUtils';

/**
 * Парсва число от стойност
 */
function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Мапва ред от Excel към ArticleImportRow
 */
function mapRowToArticle(row: Record<string, unknown>): ArticleImportRow | null {
  // Възможни имена на колони
  const columnMappings = {
    name: ['Артикул', 'Name', 'Article', 'Име', 'название'],
    piecesPerKg: ['Броя в кг', 'Брой в кг', 'Pieces per Kg', 'Pieces/Kg', 'piecesPerKg', 'броя'],
  };

  const getValue = (mappings: string[]): unknown => {
    for (const key of mappings) {
      if (row[key] !== undefined) return row[key];
    }
    return undefined;
  };

  const name = getValue(columnMappings.name);
  const piecesPerKg = getValue(columnMappings.piecesPerKg);

  // Валидация - трябва да има име и бройки
  if (!name || !piecesPerKg) {
    return null;
  }

  const piecesNum = parseNumber(piecesPerKg);
  if (piecesNum <= 0) {
    return null;
  }

  return {
    name: String(name).trim(),
    piecesPerKg: piecesNum,
  };
}

/**
 * Валидира и конвертира импортиран ред
 */
function validateAndConvertImportRow(
  importRow: ArticleImportRow,
  existingArticles: Article[]
): { isValid: boolean; error?: string; article?: Partial<Article> } {
  // Проверка за празно име
  if (!importRow.name || importRow.name.trim() === '') {
    return { isValid: false, error: 'Празно име на артикул' };
  }

  // Проверка дали вече съществува
  const exists = existingArticles.some(
    (a) => a.name.toLowerCase() === importRow.name.toLowerCase()
  );
  if (exists) {
    return { isValid: false, error: `Артикул "${importRow.name}" вече съществува` };
  }

  // Проверка за валиден брой
  if (importRow.piecesPerKg <= 0) {
    return { isValid: false, error: 'Невалиден брой бройки на килограм' };
  }

  // Конвертиране
  const gramsPerPiece = piecesPerKgToGrams(importRow.piecesPerKg);

  return {
    isValid: true,
    article: {
      name: importRow.name,
      gramsPerPiece,
      isActive: true,
    },
  };
}

/**
 * Импортира артикули от Excel файл
 */
export async function importArticlesFromExcel(
  file: File,
  existingArticles: Article[]
): Promise<ImportResult> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Вземи първия sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Конвертирай в JSON с header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) {
      return {
        success: false,
        error: 'Файлът е празен или няма данни',
        validRecords: [],
        invalidRecords: [],
      };
    }

    // Първият ред е header
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as unknown[][];

    const validRecords: Partial<Article>[] = [];
    const invalidRecords: Array<{ row: number; error: string; data: Record<string, unknown> }> = [];

    // Обработка на всеки ред
    dataRows.forEach((row, index) => {
      // Създай обект от ред
      const rowObj: Record<string, unknown> = {};
      headers.forEach((header, colIndex) => {
        rowObj[header] = row[colIndex];
      });

      // Пропусни празни редове
      const hasData = Object.values(rowObj).some(val => val !== undefined && val !== '');
      if (!hasData) {
        return;
      }

      // Мапвай към импорт ред
      const importRow = mapRowToArticle(rowObj);

      if (!importRow) {
        invalidRecords.push({
          row: index + 2, // +2 защото index е 0-based и има header
          error: 'Липсващи данни (име или броя в кг)',
          data: rowObj,
        });
        return;
      }

      // Валидирай
      const validation = validateAndConvertImportRow(
        importRow,
        [...existingArticles, ...validRecords as Article[]]
      );

      if (validation.isValid && validation.article) {
        validRecords.push(validation.article);
      } else {
        invalidRecords.push({
          row: index + 2,
          error: validation.error || 'Неизвестна грешка',
          data: rowObj,
        });
      }
    });

    if (validRecords.length === 0) {
      return {
        success: false,
        error: 'Няма валидни записи за импорт',
        validRecords: [],
        invalidRecords,
      };
    }

    return {
      success: true,
      validRecords,
      invalidRecords,
    };
  } catch (error) {
    console.error('Грешка при импорт:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестна грешка при четене на файла',
      validRecords: [],
      invalidRecords: [],
    };
  }
}

/**
 * Генерира примерен Excel файл за импорт
 */
export function generateArticleImportTemplate(): void {
  import('xlsx').then((XLSX) => {
    const data = [
      ['Артикул', 'Броя в кг'],
      ['Дънки мъжки дълги', 2],
      ['Тениски', 5],
      ['Блузи', 3],
      ['Якета тънки', 3],
      ['Рокли тънки', 4],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Артикули');

    XLSX.writeFile(workbook, 'шаблон_артикули.xlsx');
  });
}
