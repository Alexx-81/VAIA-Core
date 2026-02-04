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

// Импортира качества от масив
export async function importQualities(qualities: QualityInsert[]): Promise<Quality[]> {
  const { data, error } = await supabase
    .from('qualities')
    .upsert(qualities, { onConflict: 'name' })
    .select();

  if (error) throw error;
  return data || [];
}
