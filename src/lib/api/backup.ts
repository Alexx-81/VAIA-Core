// API функции за архивиране и възстановяване на данни (Backup)
// Версия 2.0 — пълен архив на всички таблици
import { supabase } from '../supabase';
import type {
  Quality, Article, Delivery, Sale, SaleLine,
  Customer, LoyaltyTier, VoucherRule, CustomerVoucher,
  CustomerLoyaltyStatus, LoyaltyLedger, AppSettings,
} from '../supabase/types';

// ============ Типове за backup ============

export interface BackupData {
  version: string;
  createdAt: string;
  // Основни таблици
  qualities: Quality[];
  articles: Article[];
  deliveries: Delivery[];
  sales: Sale[];
  saleLines: SaleLine[];
  // Клиенти
  customers: Customer[];
  // Програма за лоялност
  loyaltyTiers: LoyaltyTier[];
  voucherRules: VoucherRule[];
  customerVouchers: CustomerVoucher[];
  customerLoyaltyStatus: CustomerLoyaltyStatus[];
  loyaltyLedger: LoyaltyLedger[];
  // Настройки
  appSettings: AppSettings[];
}

export interface BackupCounts {
  qualities: number;
  articles: number;
  deliveries: number;
  sales: number;
  saleLines: number;
  customers: number;
  loyaltyTiers: number;
  voucherRules: number;
  customerVouchers: number;
  customerLoyaltyStatus: number;
  loyaltyLedger: number;
  appSettings: number;
}

// ============ Помощна функция за batch insert ============

async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  label: string,
  batchSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)(table).insert(batch);
    if (error) {
      const batchNum = Math.floor(i / batchSize) + 1;
      throw new Error(`Грешка при вмъкване на ${label} (партида ${batchNum}): ${error.message}`);
    }
  }
}

// ============ Експорт на данни ============

/** Зарежда всички данни от Supabase за архивиране */
export async function exportAllData(): Promise<BackupData> {
  // Зареждаме всички таблици паралелно
  const [
    qualitiesRes, articlesRes, deliveriesRes, salesRes, saleLinesRes,
    customersRes, loyaltyTiersRes, voucherRulesRes, customerVouchersRes,
    customerLoyaltyStatusRes, loyaltyLedgerRes, appSettingsRes,
  ] = await Promise.all([
    supabase.from('qualities').select('*').order('id'),
    supabase.from('articles').select('*').order('name'),
    supabase.from('deliveries').select('*').order('date'),
    supabase.from('sales').select('*').order('date_time'),
    supabase.from('sale_lines').select('*'),
    supabase.from('customers').select('*').order('name'),
    supabase.from('loyalty_tiers').select('*').order('id'),
    supabase.from('voucher_rules').select('*').order('id'),
    supabase.from('customer_vouchers').select('*').order('issued_at'),
    supabase.from('customer_loyalty_status').select('*'),
    supabase.from('loyalty_ledger').select('*').order('posted_at'),
    supabase.from('app_settings').select('*'),
  ]);

  if (qualitiesRes.error) throw new Error(`Грешка при зареждане на качества: ${qualitiesRes.error.message}`);
  if (articlesRes.error) throw new Error(`Грешка при зареждане на артикули: ${articlesRes.error.message}`);
  if (deliveriesRes.error) throw new Error(`Грешка при зареждане на доставки: ${deliveriesRes.error.message}`);
  if (salesRes.error) throw new Error(`Грешка при зареждане на продажби: ${salesRes.error.message}`);
  if (saleLinesRes.error) throw new Error(`Грешка при зареждане на редове от продажби: ${saleLinesRes.error.message}`);
  if (customersRes.error) throw new Error(`Грешка при зареждане на клиенти: ${customersRes.error.message}`);
  if (loyaltyTiersRes.error) throw new Error(`Грешка при зареждане на нива на лоялност: ${loyaltyTiersRes.error.message}`);
  if (voucherRulesRes.error) throw new Error(`Грешка при зареждане на правила за ваучери: ${voucherRulesRes.error.message}`);
  if (customerVouchersRes.error) throw new Error(`Грешка при зареждане на ваучери: ${customerVouchersRes.error.message}`);
  if (customerLoyaltyStatusRes.error) throw new Error(`Грешка при зареждане на лоялност статуси: ${customerLoyaltyStatusRes.error.message}`);
  if (loyaltyLedgerRes.error) throw new Error(`Грешка при зареждане на дневник лоялност: ${loyaltyLedgerRes.error.message}`);
  if (appSettingsRes.error) throw new Error(`Грешка при зареждане на настройки: ${appSettingsRes.error.message}`);

  return {
    version: '2.0',
    createdAt: new Date().toISOString(),
    qualities: qualitiesRes.data || [],
    articles: articlesRes.data || [],
    deliveries: deliveriesRes.data || [],
    sales: salesRes.data || [],
    saleLines: saleLinesRes.data || [],
    customers: customersRes.data || [],
    loyaltyTiers: loyaltyTiersRes.data || [],
    voucherRules: voucherRulesRes.data || [],
    customerVouchers: customerVouchersRes.data || [],
    customerLoyaltyStatus: customerLoyaltyStatusRes.data || [],
    loyaltyLedger: loyaltyLedgerRes.data || [],
    appSettings: appSettingsRes.data || [],
  };
}

// ============ Импорт на данни (пълно заместване) ============

/**
 * Помощна функция за изтриване на всички записи от таблица.
 * Използва .delete().not('id', 'is', null) за да изтрие всичко.
 */
async function deleteAll(table: string, label: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)(table).delete().not('id', 'is', null);
  if (error) throw new Error(`Грешка при изтриване на ${label}: ${error.message}`);
}

/** 
 * Заменя всички данни в Supabase с данните от backup файл.
 * Изтрива всички съществуващи записи и вмъква новите,
 * спазвайки FK реда на зависимостите.
 * 
 * Циклична FK зависимост: sales.voucher_id → customer_vouchers
 * и customer_vouchers.created_from_sale_id/redeemed_sale_id → sales
 * Решение: NULL-ваме voucher_id преди изтриване, вмъкваме sales без voucher_id,
 * след customer_vouchers UPDATE-ваме voucher_id обратно.
 */
export async function importAllData(data: BackupData): Promise<void> {
  // ═══════════════════════════════════════════════════════════
  // Стъпка 1: Изтриване (от най-зависимите към независимите)
  // ═══════════════════════════════════════════════════════════

  // 1a) Изтриваме leaf таблици, които зависят от sales + customers
  await deleteAll('loyalty_ledger', 'дневник на лоялност');
  await deleteAll('sale_lines', 'редове от продажби');
  await deleteAll('customer_loyalty_status', 'статуси на лоялност');

  // 1b) Разчупваме циклична FK: sales ↔ customer_vouchers
  //     NULL-ваме voucher_id в sales, за да можем да изтрием customer_vouchers
  const nullifyVouchers = await supabase
    .from('sales')
    .update({ voucher_id: null } as never)
    .not('voucher_id', 'is', null);
  if (nullifyVouchers.error) throw new Error(`Грешка при нулиране на voucher_id: ${nullifyVouchers.error.message}`);

  await deleteAll('customer_vouchers', 'ваучери');
  await deleteAll('sales', 'продажби');
  await deleteAll('deliveries', 'доставки');
  await deleteAll('articles', 'артикули');
  await deleteAll('customers', 'клиенти');
  await deleteAll('voucher_rules', 'правила за ваучери');
  await deleteAll('loyalty_tiers', 'нива на лоялност');
  await deleteAll('qualities', 'качества');

  // Изтриваме настройки (singleton ред)
  const deleteSettings = await supabase.from('app_settings').delete().not('id', 'is', null);
  if (deleteSettings.error) throw new Error(`Грешка при изтриване на настройки: ${deleteSettings.error.message}`);

  // ═══════════════════════════════════════════════════════════
  // Стъпка 2: Вмъкване (от независимите към зависимите)
  // ═══════════════════════════════════════════════════════════

  // 2a) Независими таблици (без FK зависимости)
  if (data.qualities.length > 0) {
    await batchInsert('qualities', data.qualities, 'качества');
  }
  if (data.articles.length > 0) {
    await batchInsert('articles', data.articles, 'артикули');
  }
  if (data.customers.length > 0) {
    await batchInsert('customers', data.customers, 'клиенти');
  }
  if (data.loyaltyTiers.length > 0) {
    await batchInsert('loyalty_tiers', data.loyaltyTiers, 'нива на лоялност');
  }
  if (data.voucherRules.length > 0) {
    await batchInsert('voucher_rules', data.voucherRules, 'правила за ваучери');
  }

  // 2b) Deliveries (FK → qualities)
  if (data.deliveries.length > 0) {
    await batchInsert('deliveries', data.deliveries, 'доставки');
  }

  // 2c) Sales — вмъкваме с voucher_id = NULL (циклична FK)
  if (data.sales.length > 0) {
    const salesWithoutVoucher = data.sales.map(s => ({ ...s, voucher_id: null }));
    await batchInsert('sales', salesWithoutVoucher, 'продажби');
  }

  // 2d) Customer vouchers (FK → customers, sales, voucher_rules)
  if (data.customerVouchers.length > 0) {
    await batchInsert('customer_vouchers', data.customerVouchers, 'ваучери');
  }

  // 2e) Възстановяваме voucher_id в sales (разчупената циклична FK)
  const salesWithVoucher = data.sales.filter(s => s.voucher_id != null);
  for (const sale of salesWithVoucher) {
    const { error } = await supabase
      .from('sales')
      .update({ voucher_id: sale.voucher_id } as never)
      .eq('id', sale.id);
    if (error) throw new Error(`Грешка при възстановяване на voucher_id за продажба ${sale.sale_number}: ${error.message}`);
  }

  // 2f) Sale lines (FK → sales, articles, deliveries)
  if (data.saleLines.length > 0) {
    await batchInsert('sale_lines', data.saleLines, 'редове от продажби');
  }

  // 2g) Customer loyalty status (FK → customers, loyalty_tiers)
  if (data.customerLoyaltyStatus.length > 0) {
    await batchInsert('customer_loyalty_status', data.customerLoyaltyStatus, 'статуси на лоялност');
  }

  // 2h) Loyalty ledger (FK → customers, sales)
  if (data.loyaltyLedger.length > 0) {
    await batchInsert('loyalty_ledger', data.loyaltyLedger, 'дневник на лоялност');
  }

  // 2i) App settings (singleton — upsert)
  if (data.appSettings.length > 0) {
    const { error } = await supabase.from('app_settings').upsert(data.appSettings as never[]);
    if (error) throw new Error(`Грешка при вмъкване на настройки: ${error.message}`);
  }
}

/** Връща броя на записите по таблици от BackupData */
export function getBackupCounts(data: BackupData): BackupCounts {
  return {
    qualities: data.qualities.length,
    articles: data.articles.length,
    deliveries: data.deliveries.length,
    sales: data.sales.length,
    saleLines: data.saleLines.length,
    customers: data.customers.length,
    loyaltyTiers: data.loyaltyTiers.length,
    voucherRules: data.voucherRules.length,
    customerVouchers: data.customerVouchers.length,
    customerLoyaltyStatus: data.customerLoyaltyStatus.length,
    loyaltyLedger: data.loyaltyLedger.length,
    appSettings: data.appSettings.length,
  };
}
