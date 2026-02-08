// Валидация на backup файл
import type { BackupData, BackupCounts } from '../../../lib/api/backup';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  counts?: BackupCounts;
}

/** Проверява дали подаденият обект е валиден backup файл */
export function validateBackupFile(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Файлът не съдържа валиден JSON обект.' };
  }

  const obj = data as Record<string, unknown>;

  // Проверяваме версията
  if (!obj.version || typeof obj.version !== 'string') {
    return { isValid: false, error: 'Файлът не съдържа информация за версия. Вероятно не е VAIA backup файл.' };
  }

  if (!obj.version.startsWith('1.')) {
    return { isValid: false, error: `Неподдържана версия на архива: ${obj.version}. Поддържа се версия 1.x.` };
  }

  // Проверяваме наличието на всички масиви
  const requiredArrays = ['qualities', 'articles', 'deliveries', 'sales', 'saleLines'] as const;
  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      return { isValid: false, error: `Файлът не съдържа поле "${key}" или не е масив.` };
    }
  }

  const backup = obj as unknown as BackupData;

  // Валидираме quality записи
  for (const q of backup.qualities) {
    if (!q.name || typeof q.name !== 'string') {
      return { isValid: false, error: `Невалиден запис в качества: липсва поле "name".` };
    }
    if (q.id === undefined || q.id === null) {
      return { isValid: false, error: `Невалиден запис в качества: липсва поле "id".` };
    }
  }

  // Валидираме article записи
  for (const a of backup.articles) {
    if (!a.name || typeof a.name !== 'string') {
      return { isValid: false, error: `Невалиден запис в артикули: липсва поле "name".` };
    }
    if (!a.id) {
      return { isValid: false, error: `Невалиден запис в артикули: липсва поле "id".` };
    }
    if (typeof a.grams_per_piece !== 'number') {
      return { isValid: false, error: `Невалиден запис в артикули "${a.name}": липсва поле "grams_per_piece".` };
    }
  }

  // Валидираме delivery записи
  for (const d of backup.deliveries) {
    if (!d.id) {
      return { isValid: false, error: `Невалиден запис в доставки: липсва поле "id".` };
    }
    if (!d.date || typeof d.date !== 'string') {
      return { isValid: false, error: `Невалиден запис в доставки: липсва поле "date".` };
    }
    if (typeof d.kg_in !== 'number') {
      return { isValid: false, error: `Невалиден запис в доставки: липсва поле "kg_in".` };
    }
    if (d.quality_id === undefined || d.quality_id === null) {
      return { isValid: false, error: `Невалиден запис в доставки: липсва поле "quality_id".` };
    }
  }

  // Валидираме sale записи
  for (const s of backup.sales) {
    if (!s.id) {
      return { isValid: false, error: `Невалиден запис в продажби: липсва поле "id".` };
    }
    if (!s.sale_number) {
      return { isValid: false, error: `Невалиден запис в продажби: липсва поле "sale_number".` };
    }
  }

  // Валидираме sale_line записи
  for (const sl of backup.saleLines) {
    if (!sl.id) {
      return { isValid: false, error: `Невалиден запис в редове от продажби: липсва поле "id".` };
    }
    if (!sl.sale_id) {
      return { isValid: false, error: `Невалиден запис в редове от продажби: липсва поле "sale_id".` };
    }
    if (!sl.article_id) {
      return { isValid: false, error: `Невалиден запис в редове от продажби: липсва поле "article_id".` };
    }
  }

  return {
    isValid: true,
    counts: {
      qualities: backup.qualities.length,
      articles: backup.articles.length,
      deliveries: backup.deliveries.length,
      sales: backup.sales.length,
      saleLines: backup.saleLines.length,
    },
  };
}

/** Генерира текстово описание на съдържанието на backup файл */
export function getBackupSummary(counts: BackupCounts): string {
  const parts: string[] = [];
  parts.push(`${counts.qualities} качеств${counts.qualities === 1 ? 'о' : 'а'}`);
  parts.push(`${counts.articles} артикул${counts.articles === 1 ? '' : 'а'}`);
  parts.push(`${counts.deliveries} доставк${counts.deliveries === 1 ? 'а' : 'и'}`);
  parts.push(`${counts.sales} продажб${counts.sales === 1 ? 'а' : 'и'}`);
  parts.push(`${counts.saleLines} ред${counts.saleLines === 1 ? '' : 'а'} от продажби`);
  return parts.join(', ');
}

/** Форматира дата от ISO string за показване */
export function formatBackupDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('bg-BG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
