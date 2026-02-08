// API функции за качества (Qualities)
import { supabase } from '../supabase';
import type { Quality, QualityInsert, QualityUpdate } from '../supabase/types';

export interface QualityWithStats extends Quality {
  deliveries_count: number;
  last_delivery_date: string | null;
}

// Взима всички качества
export async function getQualities(): Promise<Quality[]> {
  const { data, error } = await supabase
    .from('qualities')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Взима активните качества
export async function getActiveQualities(): Promise<Quality[]> {
  const { data, error } = await supabase
    .from('qualities')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Взима качество по ID
export async function getQualityById(id: number): Promise<Quality | null> {
  const { data, error } = await supabase
    .from('qualities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Създава ново качество
export async function createQuality(quality: QualityInsert): Promise<Quality> {
  const { data, error } = await supabase
    .from('qualities')
    .insert(quality)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Обновява качество
export async function updateQuality(id: number, updates: QualityUpdate): Promise<Quality> {
  const { data, error } = await supabase
    .from('qualities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Изтрива качество (soft delete - деактивира)
export async function deactivateQuality(id: number): Promise<void> {
  const { error } = await supabase
    .from('qualities')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Активира качество
export async function activateQuality(id: number): Promise<void> {
  const { error } = await supabase
    .from('qualities')
    .update({ is_active: true })
    .eq('id', id);

  if (error) throw error;
}

// Взима качества със статистики
export async function getQualitiesWithStats(): Promise<QualityWithStats[]> {
  const { data: qualities, error: qualitiesError } = await supabase
    .from('qualities')
    .select('*')
    .order('name');

  if (qualitiesError) throw qualitiesError;

  // За всяко качество взимаме броя доставки и последната дата
  const qualitiesWithStats = await Promise.all(
    (qualities || []).map(async (quality) => {
      const { count, error: countError } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('quality_id', quality.id);

      if (countError) throw countError;

      const { data: lastDelivery, error: lastError } = await supabase
        .from('deliveries')
        .select('date')
        .eq('quality_id', quality.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastError) throw lastError;

      return {
        ...quality,
        deliveries_count: count || 0,
        last_delivery_date: lastDelivery?.date || null,
      };
    })
  );

  return qualitiesWithStats;
}

// Проверява зависимости на качество (за UI предупреждение)
export async function getQualityDependencies(id: number): Promise<{ deliveryCount: number; saleCount: number }> {
  // Намираме доставки за това качество
  const { data: deliveries, error: delError } = await supabase
    .from('deliveries')
    .select('id')
    .eq('quality_id', id);

  if (delError) throw delError;

  const deliveryIds = (deliveries || []).map(d => d.id);
  let saleCount = 0;

  if (deliveryIds.length > 0) {
    // Намираме уникалните продажби, свързани с тези доставки
    const { data: saleLines, error: slError } = await supabase
      .from('sale_lines')
      .select('sale_id, real_delivery_id, accounting_delivery_id')
      .or(deliveryIds.map(id => `real_delivery_id.eq.${id}`).join(','));

    if (slError) throw slError;

    const uniqueSaleIds = new Set((saleLines || []).map(l => l.sale_id));
    saleCount = uniqueSaleIds.size;
  }

  return { deliveryCount: deliveryIds.length, saleCount };
}

// Изтрива качество каскадно (триe свързаните продажби и доставки)
export async function deleteQuality(id: number): Promise<{ deletedSales: number; deletedDeliveries: number }> {
  // 1. Намираме доставките за това качество
  const { data: deliveries, error: delError } = await supabase
    .from('deliveries')
    .select('id')
    .eq('quality_id', id);

  if (delError) throw delError;

  const deliveryIds = (deliveries || []).map(d => d.id);
  let deletedSales = 0;

  if (deliveryIds.length > 0) {
    // 2. Намираме уникалните продажби, свързани с тези доставки
    const { data: saleLines, error: slError } = await supabase
      .from('sale_lines')
      .select('sale_id, real_delivery_id')
      .or(deliveryIds.map(id => `real_delivery_id.eq.${id}`).join(','));

    if (slError) throw slError;

    const uniqueSaleIds = [...new Set((saleLines || []).map(l => l.sale_id))];

    // 3. Трием продажбите (CASCADE трие sale_lines автоматично)
    if (uniqueSaleIds.length > 0) {
      const { error: salesDelError } = await supabase
        .from('sales')
        .delete()
        .in('id', uniqueSaleIds);

      if (salesDelError) throw salesDelError;
      deletedSales = uniqueSaleIds.length;
    }

    // 4. Трием доставките
    const { error: deliveriesDelError } = await supabase
      .from('deliveries')
      .delete()
      .in('id', deliveryIds);

    if (deliveriesDelError) throw deliveriesDelError;
  }

  // 5. Трием качеството
  const { error } = await supabase
    .from('qualities')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return { deletedSales, deletedDeliveries: deliveryIds.length };
}

// Импортира качества от масив
export async function importQualities(qualities: QualityInsert[]): Promise<Quality[]> {
  const { data, error } = await supabase
    .from('qualities')
    .upsert(qualities, { onConflict: 'name' })
    .select();

  if (error) throw error;
  return data || [];
}
