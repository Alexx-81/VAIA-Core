// API функции за доставки (Deliveries)
import { supabase } from '../supabase';
import type { Delivery, DeliveryInsert, DeliveryUpdate, DeliveryInventory } from '../supabase/types';

export interface DeliveryWithComputed extends Delivery {
  quality_name: string;
  is_invoiced: boolean;
  total_cost_eur: number;
  kg_sold_real: number;
  kg_remaining_real: number;
  kg_sold_acc: number;
  kg_remaining_acc: number;
}

export interface DeliveryFilters {
  from?: string;
  to?: string;
  qualityId?: number;
  search?: string;
  isInvoiced?: boolean | null;
  hasStock?: boolean | null;
}

// Взима всички доставки с пълна информация от view
export async function getDeliveries(filters?: DeliveryFilters): Promise<DeliveryInventory[]> {
  let query = supabase
    .from('delivery_inventory')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.from) {
    query = query.gte('date', filters.from);
  }
  if (filters?.to) {
    query = query.lte('date', filters.to);
  }
  if (filters?.qualityId) {
    query = query.eq('quality_id', filters.qualityId);
  }
  if (filters?.search) {
    query = query.or(`display_id.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
  }
  if (filters?.isInvoiced === true) {
    query = query.eq('is_invoiced', true);
  } else if (filters?.isInvoiced === false) {
    query = query.eq('is_invoiced', false);
  }
  if (filters?.hasStock === true) {
    query = query.gt('kg_remaining_real', 0);
  } else if (filters?.hasStock === false) {
    query = query.lte('kg_remaining_real', 0);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Взима доставки с налична стока (за POS dropdown)
export async function getDeliveriesWithStock(): Promise<DeliveryInventory[]> {
  const { data, error } = await supabase
    .from('delivery_inventory')
    .select('*')
    .gt('kg_remaining_real', 0)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Взима фактурирани доставки с налична стока (за Accounting dropdown)
export async function getInvoicedDeliveriesWithStock(): Promise<DeliveryInventory[]> {
  const { data, error } = await supabase
    .from('delivery_inventory')
    .select('*')
    .eq('is_invoiced', true)
    .gt('kg_remaining_acc', 0)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Взима доставка по ID
export async function getDeliveryById(id: string): Promise<DeliveryInventory | null> {
  const { data, error } = await supabase
    .from('delivery_inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Създава нова доставка
export async function createDelivery(delivery: DeliveryInsert): Promise<Delivery> {
  const { data, error } = await supabase
    .from('deliveries')
    .insert(delivery)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Обновява доставка
export async function updateDelivery(id: string, updates: DeliveryUpdate): Promise<Delivery> {
  const { data, error } = await supabase
    .from('deliveries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Проверява зависимости на доставка (за UI предупреждение)
export async function getDeliveryDependencies(id: string): Promise<{ saleCount: number }> {
  const { data: saleLines, error } = await supabase
    .from('sale_lines')
    .select('sale_id')
    .or(`real_delivery_id.eq.${id},accounting_delivery_id.eq.${id}`);

  if (error) throw error;

  const uniqueSaleIds = new Set((saleLines || []).map(l => l.sale_id));
  return { saleCount: uniqueSaleIds.size };
}

// Изтрива доставка каскадно (трие свързаните продажби)
export async function deleteDelivery(id: string): Promise<{ deletedSales: number }> {
  // 1. Намираме уникалните продажби, свързани с тази доставка
  const { data: saleLines, error: slError } = await supabase
    .from('sale_lines')
    .select('sale_id')
    .or(`real_delivery_id.eq.${id},accounting_delivery_id.eq.${id}`);

  if (slError) throw slError;

  const uniqueSaleIds = [...new Set((saleLines || []).map(l => l.sale_id))];

  // 2. Трием продажбите (CASCADE трие sale_lines автоматично)
  if (uniqueSaleIds.length > 0) {
    const { error: salesDelError } = await supabase
      .from('sales')
      .delete()
      .in('id', uniqueSaleIds);

    if (salesDelError) throw salesDelError;
  }

  // 3. Трием доставката
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return { deletedSales: uniqueSaleIds.length };
}

// Взима следващ display_id за доставка
export async function getNextDisplayId(): Promise<string> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('display_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) return '1';

  // Parse the display_id and increment
  const match = data.display_id.match(/^(\d+)(A)?$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return String(num + 1);
  }

  return '1';
}

// Генерира A variant на display_id (за нефактурирана доставка)
export function generateAVariant(displayId: string): string {
  return `${displayId}A`;
}

// Импортира доставки от масив
export async function importDeliveries(deliveries: DeliveryInsert[]): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .insert(deliveries)
    .select();

  if (error) throw error;
  return data || [];
}

// Взима уникални имена на доставчици
export async function getSupplierNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('supplier_name')
    .not('supplier_name', 'is', null)
    .order('supplier_name');

  if (error) throw error;

  // Get unique supplier names
  const uniqueNames = [...new Set((data || []).map(d => d.supplier_name).filter(Boolean))];
  return uniqueNames as string[];
}

// Статистики за доставки
export interface DeliveryStats {
  totalDeliveries: number;
  totalKgIn: number;
  totalValue: number;
  inStock: number;
  depleted: number;
}

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const { data, error } = await supabase
    .from('delivery_inventory')
    .select('*');

  if (error) throw error;

  const deliveries = data || [];
  
  return {
    totalDeliveries: deliveries.length,
    totalKgIn: deliveries.reduce((sum, d) => sum + (d.kg_in || 0), 0),
    totalValue: deliveries.reduce((sum, d) => sum + (d.total_cost_eur || 0), 0),
    inStock: deliveries.filter(d => (d.kg_remaining_real || 0) > 0).length,
    depleted: deliveries.filter(d => (d.kg_remaining_real || 0) <= 0).length,
  };
}
