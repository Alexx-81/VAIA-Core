// API функции за наличности (Inventory)
import { supabase } from '../supabase';
import type { DeliveryInventory } from '../supabase/types';

export type InventoryTab = 'all' | 'real' | 'accounting' | 'comparison';
export type InventoryDeliveryType = 'all' | 'invoiced' | 'non-invoiced';
export type InventoryStockStatus = 'all' | 'in-stock' | 'below-minimum' | 'depleted' | 'negative';

export interface InventoryFilters {
  search?: string;
  qualityId?: number;
  supplierName?: string;
  deliveryType?: InventoryDeliveryType;
  stockStatus?: InventoryStockStatus;
  minKgThreshold?: number;
}

export interface InventoryStats {
  totalDeliveries: number;
  inStock: number;
  belowMinimum: number;
  depleted: number;
  totalKgRemaining: number;
  totalValueRemaining: number;
}

export interface InventoryComparisonRow {
  id: string;
  display_id: string;
  quality_name: string;
  kg_remaining_real: number;
  kg_remaining_acc: number;
  kg_difference: number;
  status: 'ok' | 'warning' | 'critical';
}

// Взима наличности с филтри
export async function getInventory(filters?: InventoryFilters, tab: InventoryTab = 'all'): Promise<DeliveryInventory[]> {
  let query = supabase
    .from('delivery_inventory')
    .select('*')
    .order('date', { ascending: false });

  // Apply filters
  if (filters?.search) {
    query = query.or(`display_id.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%,quality_name.ilike.%${filters.search}%`);
  }
  if (filters?.qualityId) {
    query = query.eq('quality_id', filters.qualityId);
  }
  if (filters?.supplierName && filters.supplierName !== 'all') {
    query = query.eq('supplier_name', filters.supplierName);
  }
  if (filters?.deliveryType === 'invoiced') {
    query = query.eq('is_invoiced', true);
  } else if (filters?.deliveryType === 'non-invoiced') {
    query = query.eq('is_invoiced', false);
  }

  const { data, error } = await query;

  if (error) throw error;

  let result = data || [];

  // Filter by stock status (needs to be done after fetch due to computed fields)
  if (filters?.stockStatus && filters.stockStatus !== 'all') {
    const threshold = filters.minKgThreshold || 5;
    
    result = result.filter(d => {
      const remaining = tab === 'accounting' ? (d.kg_remaining_acc || 0) : (d.kg_remaining_real || 0);
      
      switch (filters.stockStatus) {
        case 'in-stock':
          return remaining > threshold;
        case 'below-minimum':
          return remaining > 0 && remaining <= threshold;
        case 'depleted':
          return remaining === 0;
        case 'negative':
          return remaining < 0;
        default:
          return true;
      }
    });
  }

  return result;
}

// Взима статистики за наличностите
export async function getInventoryStats(filters?: InventoryFilters, minKgThreshold: number = 5): Promise<InventoryStats> {
  const inventory = await getInventory(filters);

  return {
    totalDeliveries: inventory.length,
    inStock: inventory.filter(d => (d.kg_remaining_real || 0) > minKgThreshold).length,
    belowMinimum: inventory.filter(d => (d.kg_remaining_real || 0) > 0 && (d.kg_remaining_real || 0) <= minKgThreshold).length,
    depleted: inventory.filter(d => (d.kg_remaining_real || 0) <= 0).length,
    totalKgRemaining: inventory.reduce((sum, d) => sum + (d.kg_remaining_real || 0), 0),
    totalValueRemaining: inventory.reduce((sum, d) => sum + ((d.kg_remaining_real || 0) * (d.unit_cost_per_kg || 0)), 0),
  };
}

// Взима сравнение Real vs Accounting
export async function getInventoryComparison(filters?: InventoryFilters): Promise<InventoryComparisonRow[]> {
  const inventory = await getInventory(filters);

  return inventory.map(d => {
    const kgReal = d.kg_remaining_real || 0;
    const kgAcc = d.kg_remaining_acc || 0;
    const difference = kgReal - kgAcc;
    
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    const absDiff = Math.abs(difference);
    
    if (absDiff > 10) {
      status = 'critical';
    } else if (absDiff > 2) {
      status = 'warning';
    }

    return {
      id: d.id || '',
      display_id: d.display_id || '',
      quality_name: d.quality_name || '',
      kg_remaining_real: kgReal,
      kg_remaining_acc: kgAcc,
      kg_difference: difference,
      status,
    };
  }).filter(row => row.kg_difference !== 0);
}

// Взима общ изглед за dashboard
export interface InventoryOverview {
  totalKgReal: number;
  totalKgAcc: number;
  totalValueReal: number;
  totalValueAcc: number;
  deliveriesWithStock: number;
  depleted: number;
}

export async function getInventoryOverview(): Promise<InventoryOverview> {
  const { data, error } = await supabase
    .from('delivery_inventory')
    .select('*');

  if (error) throw error;

  const inventory = data || [];

  return {
    totalKgReal: inventory.reduce((sum, d) => sum + Math.max(0, d.kg_remaining_real || 0), 0),
    totalKgAcc: inventory.reduce((sum, d) => sum + Math.max(0, d.kg_remaining_acc || 0), 0),
    totalValueReal: inventory.reduce((sum, d) => sum + (Math.max(0, d.kg_remaining_real || 0) * (d.unit_cost_per_kg || 0)), 0),
    totalValueAcc: inventory.reduce((sum, d) => sum + (Math.max(0, d.kg_remaining_acc || 0) * (d.unit_cost_per_kg || 0)), 0),
    deliveriesWithStock: inventory.filter(d => (d.kg_remaining_real || 0) > 0).length,
    depleted: inventory.filter(d => (d.kg_remaining_real || 0) <= 0).length,
  };
}
