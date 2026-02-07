export interface QualityImportRow {
  name: string;
}

export interface QualityImportResult {
  valid: QualityImportRow[];
  errors: string[];
}

/**
 * Парсва Excel файл с качества
 */
export function parseQualitiesExcel(file: File): Promise<QualityImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Опитваме различни формати на колоната
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        
        const rows: QualityImportRow[] = jsonData
          .map((row) => {
            // Търсим колона с име "Качество", "Name", "Име" или първата колона
            const name = row['Качество'] || row['качество'] || row['Name'] || row['name'] || row['Име'] || row['име'] || Object.values(row)[0];
            return { name: String(name || '').trim() };
          })
          .filter((row) => row.name.length > 0);
        
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
 */
export function validateQualityImportRows(
  rows: QualityImportRow[],
  existingNames: string[]
): QualityImportResult {
  const valid: QualityImportRow[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();
  
  // Нормализирани съществуващи имена
  const normalizedExisting = new Set(existingNames.map(n => n.trim().toLowerCase()));
  
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header and 0-index
    const normalizedName = row.name.toLowerCase();
    
    if (!row.name) {
      errors.push(`Ред ${rowNum}: Липсва име`);
      return;
    }
    
    // Проверка за дубликат в съществуващите
    if (normalizedExisting.has(normalizedName)) {
      errors.push(`Ред ${rowNum}: "${row.name}" вече съществува`);
      return;
    }
    
    // Проверка за дубликат в текущия импорт
    if (seenNames.has(normalizedName)) {
      errors.push(`Ред ${rowNum}: "${row.name}" е дубликат в импорта`);
      return;
    }
    
    seenNames.add(normalizedName);
    valid.push(row);
  });
  
  return { valid, errors };
}
