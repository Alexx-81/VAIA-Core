// API функции за архивиране и възстановяване на данни (Backup)
import { supabase } from '../supabase';
import type { Quality, Article, Delivery, Sale, SaleLine } from '../supabase/types';

// ============ Типове за backup ============

export interface BackupData {
  version: string;
  createdAt: string;
  qualities: Quality[];
  articles: Article[];
  deliveries: Delivery[];
  sales: Sale[];
  saleLines: SaleLine[];
}

export interface BackupCounts {
  qualities: number;
  articles: number;
  deliveries: number;
  sales: number;
  saleLines: number;
}

// ============ Експорт на данни ============

/** Зарежда всички данни от Supabase за архивиране */
export async function exportAllData(): Promise<BackupData> {
  // Зареждаме всички таблици паралелно
  const [qualitiesRes, articlesRes, deliveriesRes, salesRes, saleLinesRes] = await Promise.all([
    supabase.from('qualities').select('*').order('id'),
    supabase.from('articles').select('*').order('name'),
    supabase.from('deliveries').select('*').order('date'),
    supabase.from('sales').select('*').order('date_time'),
    supabase.from('sale_lines').select('*'),
  ]);

  if (qualitiesRes.error) throw new Error(`Грешка при зареждане на качества: ${qualitiesRes.error.message}`);
  if (articlesRes.error) throw new Error(`Грешка при зареждане на артикули: ${articlesRes.error.message}`);
  if (deliveriesRes.error) throw new Error(`Грешка при зареждане на доставки: ${deliveriesRes.error.message}`);
  if (salesRes.error) throw new Error(`Грешка при зареждане на продажби: ${salesRes.error.message}`);
  if (saleLinesRes.error) throw new Error(`Грешка при зареждане на редове от продажби: ${saleLinesRes.error.message}`);

  return {
    version: '1.0',
    createdAt: new Date().toISOString(),
    qualities: qualitiesRes.data || [],
    articles: articlesRes.data || [],
    deliveries: deliveriesRes.data || [],
    sales: salesRes.data || [],
    saleLines: saleLinesRes.data || [],
  };
}

// ============ Импорт на данни (пълно заместване) ============

/** 
 * Заменя всички данни в Supabase с данните от backup файл.
 * Изтрива всички съществуващи записи и вмъква новите,
 * спазвайки FK реда на зависимостите.
 */
export async function importAllData(data: BackupData): Promise<void> {
  // Стъпка 1: Изтриване (по FK ред — от зависимите към независимите)
  // sale_lines → sales → deliveries → articles → qualities

  const deleteSaleLines = await supabase.from('sale_lines').delete().not('id', 'is', null);
  if (deleteSaleLines.error) throw new Error(`Грешка при изтриване на редове от продажби: ${deleteSaleLines.error.message}`);

  const deleteSales = await supabase.from('sales').delete().not('id', 'is', null);
  if (deleteSales.error) throw new Error(`Грешка при изтриване на продажби: ${deleteSales.error.message}`);

  const deleteDeliveries = await supabase.from('deliveries').delete().not('id', 'is', null);
  if (deleteDeliveries.error) throw new Error(`Грешка при изтриване на доставки: ${deleteDeliveries.error.message}`);

  const deleteArticles = await supabase.from('articles').delete().not('id', 'is', null);
  if (deleteArticles.error) throw new Error(`Грешка при изтриване на артикули: ${deleteArticles.error.message}`);

  const deleteQualities = await supabase.from('qualities').delete().not('id', 'is', null);
  if (deleteQualities.error) throw new Error(`Грешка при изтриване на качества: ${deleteQualities.error.message}`);

  // Стъпка 2: Вмъкване (по FK ред — от независимите към зависимите)
  // qualities → articles → deliveries → sales → sale_lines

  if (data.qualities.length > 0) {
    const insertQualities = await supabase.from('qualities').insert(data.qualities);
    if (insertQualities.error) throw new Error(`Грешка при вмъкване на качества: ${insertQualities.error.message}`);
  }

  if (data.articles.length > 0) {
    const insertArticles = await supabase.from('articles').insert(data.articles);
    if (insertArticles.error) throw new Error(`Грешка при вмъкване на артикули: ${insertArticles.error.message}`);
  }

  if (data.deliveries.length > 0) {
    // Вмъкваме на партиди от 500, за да не превишим лимита
    const batchSize = 500;
    for (let i = 0; i < data.deliveries.length; i += batchSize) {
      const batch = data.deliveries.slice(i, i + batchSize);
      const insertDeliveries = await supabase.from('deliveries').insert(batch);
      if (insertDeliveries.error) throw new Error(`Грешка при вмъкване на доставки (партида ${Math.floor(i / batchSize) + 1}): ${insertDeliveries.error.message}`);
    }
  }

  if (data.sales.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < data.sales.length; i += batchSize) {
      const batch = data.sales.slice(i, i + batchSize);
      const insertSales = await supabase.from('sales').insert(batch);
      if (insertSales.error) throw new Error(`Грешка при вмъкване на продажби (партида ${Math.floor(i / batchSize) + 1}): ${insertSales.error.message}`);
    }
  }

  if (data.saleLines.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < data.saleLines.length; i += batchSize) {
      const batch = data.saleLines.slice(i, i + batchSize);
      const insertSaleLines = await supabase.from('sale_lines').insert(batch);
      if (insertSaleLines.error) throw new Error(`Грешка при вмъкване на редове от продажби (партида ${Math.floor(i / batchSize) + 1}): ${insertSaleLines.error.message}`);
    }
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
  };
}
