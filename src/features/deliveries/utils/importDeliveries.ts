import type { Delivery, DeliveryImportRow, ImportResult, Quality } from '../types';
import { generateId } from './deliveryUtils';

/**
 * Парсва дата от различни формати
 */
async function parseDate(value: unknown): Promise<string> {
  if (!value) return new Date().toISOString().split('T')[0];
  
  // Ако е число (Excel serial date)
  if (typeof value === 'number') {
    const XLSX = await import('xlsx');
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  // Ако е Date обект
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // Ако е стринг във формат DD.MM.YYYY
  if (typeof value === 'string') {
    const parts = value.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // Опитай директно парсване
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

/**
 * Парсва число от стойност (обработва € символ и запетаи)
 */
function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Премахва € символ, интервали и заменя запетая с точка
    const cleaned = value.replace(/[€\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Мапва ред от Excel към DeliveryImportRow
 */
async function mapRowToDelivery(row: Record<string, unknown>, rowIndex: number): Promise<DeliveryImportRow | null> {
  // Възможни имена на колони (български и английски)
  const columnMappings = {
    deliveryId: ['Доставка ID', 'ID', 'Delivery ID', 'DeliveryId', 'id'],
    date: ['Дата', 'Date', 'date'],
    quality: ['Качество', 'Quality', 'Категория', 'Category', 'quality'],
    kilograms: ['Килограми', 'Kilograms', 'Кг', 'Kg', 'Weight', 'kg', 'kgIn'],
    pricePerKg: ['Единична доставна цена на килограм', 'Цена/кг', 'Price per Kg', 'PricePerKg', 'Unit Price', 'unitCostPerKg'],
    totalAmount: ['Обща сума', 'Total', 'Total Amount', 'TotalAmount', 'Сума'],
    invoiceNumber: ['Фактура №', 'Фактура', 'Invoice', 'Invoice Number', 'InvoiceNumber', 'invoiceNumber']
  };

  const getValue = (mappings: string[]): unknown => {
    for (const key of mappings) {
      if (row[key] !== undefined) return row[key];
    }
    return undefined;
  };

  const deliveryId = getValue(columnMappings.deliveryId);
  const date = getValue(columnMappings.date);
  const quality = getValue(columnMappings.quality);
  const kilograms = getValue(columnMappings.kilograms);
  const pricePerKg = getValue(columnMappings.pricePerKg);
  const totalAmount = getValue(columnMappings.totalAmount);
  const invoiceNumber = getValue(columnMappings.invoiceNumber);

  // Валидация - трябва да има поне качество и килограми
  if (!quality || !kilograms) {
    return null;
  }

  return {
    deliveryId: parseNumber(deliveryId) || rowIndex,
    date: await parseDate(date),
    quality: String(quality).trim(),
    kilograms: parseNumber(kilograms),
    pricePerKg: parseNumber(pricePerKg),
    totalAmount: parseNumber(totalAmount),
    invoiceNumber: invoiceNumber ? String(invoiceNumber).trim() : ''
  };
}

/**
 * Нормализира текст - заменя кирилски букви с латински еквиваленти и обратно
 */
function normalizeText(text: string): string {
  // Карта за заместване на подобни букви
  const charMap: Record<string, string> = {
    // Кирилица към латиница
    'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'к': 'k', 
    'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'х': 'x', 'у': 'y',
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K',
    'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y',
  };
  
  return text
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    // Нормализираме различни видове тирета и интервали
    .replace(/[\s\-–—_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Намира качество по име (fuzzy match)
 */
function findQualityByName(qualityName: string, qualities: Quality[]): Quality | undefined {
  const normalizedInput = normalizeText(qualityName);
  
  // Опитваме точно съвпадение (нормализирано)
  let found = qualities.find(q => normalizeText(q.name) === normalizedInput);
  if (found) return found;
  
  // Опитваме partial match
  found = qualities.find(q => {
    const normalizedQuality = normalizeText(q.name);
    return normalizedQuality.includes(normalizedInput) || 
           normalizedInput.includes(normalizedQuality);
  });
  if (found) return found;
  
  // Опитваме match без последната буква (B/В)
  const inputWithoutSuffix = normalizedInput.replace(/\s*[bв]\s*$/i, '').trim();
  found = qualities.find(q => {
    const qualityWithoutSuffix = normalizeText(q.name).replace(/\s*[bв]\s*$/i, '').trim();
    return qualityWithoutSuffix === inputWithoutSuffix;
  });
  
  return found;
}

/**
 * Конвертира импортиран ред към Delivery обект
 */
function importRowToDelivery(
  row: DeliveryImportRow, 
  existingIds: Set<string>,
  qualities: Quality[]
): { delivery: Delivery | null; error?: string } {
  // Намираме качеството
  const quality = findQualityByName(row.quality, qualities);
  if (!quality) {
    return { 
      delivery: null, 
      error: `Качеството "${row.quality}" не е намерено` 
    };
  }

  // Генерираме уникално displayId
  let displayId = String(row.deliveryId);
  let counter = 1;
  while (existingIds.has(displayId)) {
    displayId = `${row.deliveryId}${String.fromCharCode(64 + counter)}`; // 1A, 1B, etc.
    counter++;
  }
  existingIds.add(displayId);

  const delivery: Delivery = {
    id: generateId(),
    displayId,
    date: new Date(row.date),
    qualityId: quality.id,
    qualityName: quality.name,
    kgIn: row.kilograms,
    unitCostPerKg: row.pricePerKg,
    invoiceNumber: row.invoiceNumber || undefined,
    note: `Импортирано от Excel на ${new Date().toLocaleDateString('bg-BG')}`,
    createdAt: new Date(),
  };

  return { delivery };
}

/**
 * Импортира доставки от Excel файл
 */
export async function importDeliveriesFromExcel(
  file: File,
  existingDisplayIds: string[] = [],
  qualities: Quality[] = []
): Promise<ImportResult> {
  const errors: string[] = [];
  const deliveries: Delivery[] = [];
  const existingIds = new Set(existingDisplayIds);

  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    // Взема първия лист
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертира към JSON
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    
    if (rows.length === 0) {
      return {
        success: false,
        imported: 0,
        errors: ['Файлът е празен или няма валидни данни'],
        deliveries: []
      };
    }

    // Обработва всеки ред
    const rowPromises = rows.map(async (row: Record<string, unknown>, index: number) => {
      try {
        const mappedRow = await mapRowToDelivery(row, index + 1);
        
        if (mappedRow) {
          const { delivery, error } = importRowToDelivery(mappedRow, existingIds, qualities);
          if (delivery) {
            deliveries.push(delivery);
          } else if (error) {
            errors.push(`Ред ${index + 2}: ${error}`);
          }
        } else {
          errors.push(`Ред ${index + 2}: Невалидни данни (липсва качество или килограми)`);
        }
      } catch (err) {
        errors.push(`Ред ${index + 2}: ${err instanceof Error ? err.message : 'Неизвестна грешка'}`);
      }
    });
    
    await Promise.all(rowPromises);

    return {
      success: deliveries.length > 0,
      imported: deliveries.length,
      errors,
      deliveries
    };
  } catch (err) {
    return {
      success: false,
      imported: 0,
      errors: [`Грешка при четене на файла: ${err instanceof Error ? err.message : 'Неизвестна грешка'}`],
      deliveries: []
    };
  }
}

/**
 * Валидира файл преди импортиране
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  
  if (!validExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Невалиден формат. Поддържани формати: ${validExtensions.join(', ')}` 
    };
  }
  
  // Максимален размер 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Файлът е твърде голям. Максимален размер: 10MB' 
    };
  }
  
  return { valid: true };
}
