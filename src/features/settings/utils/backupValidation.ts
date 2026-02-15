// Валидация на backup файл (версия 2.0)
import type { BackupData, BackupCounts } from '../../../lib/api/backup';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  counts?: BackupCounts;
}

/** Проверява дали подаденият обект е валиден backup файл (версия 2.x) */
export function validateBackupFile(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Файлът не съдържа валиден JSON обект.' };
  }

  const obj = data as Record<string, unknown>;

  // Проверяваме версията
  if (!obj.version || typeof obj.version !== 'string') {
    return { isValid: false, error: 'Файлът не съдържа информация за версия. Вероятно не е VAIA backup файл.' };
  }

  if (!obj.version.startsWith('2.')) {
    return { isValid: false, error: `Неподдържана версия на архива: ${obj.version}. Поддържа се версия 2.x.` };
  }

  // Проверяваме наличието на всички масиви
  const requiredArrays = [
    'qualities', 'articles', 'deliveries', 'sales', 'saleLines',
    'customers', 'loyaltyTiers', 'voucherRules', 'customerVouchers',
    'customerLoyaltyStatus', 'loyaltyLedger', 'appSettings',
  ] as const;
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

  // Валидираме customer записи
  for (const c of backup.customers) {
    if (!c.id) {
      return { isValid: false, error: `Невалиден запис в клиенти: липсва поле "id".` };
    }
    if (!c.name || typeof c.name !== 'string') {
      return { isValid: false, error: `Невалиден запис в клиенти: липсва поле "name".` };
    }
  }

  // Валидираме loyalty_tier записи
  for (const lt of backup.loyaltyTiers) {
    if (lt.id === undefined || lt.id === null) {
      return { isValid: false, error: `Невалиден запис в нива на лоялност: липсва поле "id".` };
    }
    if (!lt.name || typeof lt.name !== 'string') {
      return { isValid: false, error: `Невалиден запис в нива на лоялност: липсва поле "name".` };
    }
  }

  // Валидираме voucher_rule записи
  for (const vr of backup.voucherRules) {
    if (vr.id === undefined || vr.id === null) {
      return { isValid: false, error: `Невалиден запис в правила за ваучери: липсва поле "id".` };
    }
    if (typeof vr.trigger_turnover_12m_eur !== 'number') {
      return { isValid: false, error: `Невалиден запис в правила за ваучери: липсва поле "trigger_turnover_12m_eur".` };
    }
  }

  // Валидираме customer_voucher записи
  for (const cv of backup.customerVouchers) {
    if (!cv.id) {
      return { isValid: false, error: `Невалиден запис в ваучери: липсва поле "id".` };
    }
    if (!cv.customer_id) {
      return { isValid: false, error: `Невалиден запис в ваучери: липсва поле "customer_id".` };
    }
  }

  // Валидираме customer_loyalty_status записи
  for (const cls of backup.customerLoyaltyStatus) {
    if (!cls.id) {
      return { isValid: false, error: `Невалиден запис в статуси лоялност: липсва поле "id".` };
    }
    if (!cls.customer_id) {
      return { isValid: false, error: `Невалиден запис в статуси лоялност: липсва поле "customer_id".` };
    }
  }

  // Валидираме loyalty_ledger записи
  for (const ll of backup.loyaltyLedger) {
    if (!ll.id) {
      return { isValid: false, error: `Невалиден запис в дневник лоялност: липсва поле "id".` };
    }
    if (!ll.customer_id) {
      return { isValid: false, error: `Невалиден запис в дневник лоялност: липсва поле "customer_id".` };
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
      customers: backup.customers.length,
      loyaltyTiers: backup.loyaltyTiers.length,
      voucherRules: backup.voucherRules.length,
      customerVouchers: backup.customerVouchers.length,
      customerLoyaltyStatus: backup.customerLoyaltyStatus.length,
      loyaltyLedger: backup.loyaltyLedger.length,
      appSettings: backup.appSettings.length,
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
  parts.push(`${counts.customers} клиент${counts.customers === 1 ? '' : 'а'}`);
  if (counts.loyaltyTiers > 0) parts.push(`${counts.loyaltyTiers} нив${counts.loyaltyTiers === 1 ? 'о' : 'а'} лоялност`);
  if (counts.voucherRules > 0) parts.push(`${counts.voucherRules} правил${counts.voucherRules === 1 ? 'о' : 'а'} за ваучери`);
  if (counts.customerVouchers > 0) parts.push(`${counts.customerVouchers} ваучер${counts.customerVouchers === 1 ? '' : 'а'}`);
  if (counts.customerLoyaltyStatus > 0) parts.push(`${counts.customerLoyaltyStatus} статус${counts.customerLoyaltyStatus === 1 ? '' : 'а'} лоялност`);
  if (counts.loyaltyLedger > 0) parts.push(`${counts.loyaltyLedger} запис${counts.loyaltyLedger === 1 ? '' : 'а'} в дневника`);
  if (counts.appSettings > 0) parts.push('настройки');
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
