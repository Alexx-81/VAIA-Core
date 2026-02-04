// API функции за продажби (Sales)
import { supabase } from '../supabase';
import type {
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleLine,
  SaleLineInsert,
  SalesSummary,
  SaleLineComputed,
  PaymentMethod,
} from '../supabase/types';

export interface SaleWithLines extends Sale {
  lines: SaleLine[];
}

export interface SaleFilters {
  from?: string;
  to?: string;
  status?: 'draft' | 'finalized' | 'all';
  paymentMethod?: PaymentMethod | 'all';
  search?: string;
}

// Взима всички продажби с обобщение
export async function getSales(filters?: SaleFilters): Promise<SalesSummary[]> {
  let query = supabase
    .from('sales_summary')
    .select('*')
    .order('date_time', { ascending: false });

  if (filters?.from) {
    query = query.gte('date_time', filters.from);
  }
  if (filters?.to) {
    query = query.lte('date_time', filters.to);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod);
  }
  if (filters?.search) {
    query = query.or(`sale_number.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Взима продажба по ID с линии
export async function getSaleById(id: string): Promise<SaleWithLines | null> {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();

  if (saleError) throw saleError;
  if (!sale) return null;

  const { data: lines, error: linesError } = await supabase
    .from('sale_lines')
    .select('*')
    .eq('sale_id', id);

  if (linesError) throw linesError;

  return {
    ...sale,
    lines: lines || [],
  };
}

// Взима линии с изчислени стойности за продажба
export async function getSaleLinesComputed(saleId: string): Promise<SaleLineComputed[]> {
  const { data, error } = await supabase
    .from('sale_lines_computed')
    .select('*')
    .eq('sale_id', saleId);

  if (error) throw error;
  return data || [];
}

// Създава нова продажба
export async function createSale(sale: Omit<SaleInsert, 'sale_number'>): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Обновява продажба
export async function updateSale(id: string, updates: SaleUpdate): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Изтрива продажба (само draft)
export async function deleteSale(id: string): Promise<void> {
  // First delete lines
  const { error: linesError } = await supabase
    .from('sale_lines')
    .delete()
    .eq('sale_id', id);

  if (linesError) throw linesError;

  // Then delete sale
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Добавя линия към продажба
export async function addSaleLine(line: SaleLineInsert): Promise<SaleLine> {
  const { data, error } = await supabase
    .from('sale_lines')
    .insert(line)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Обновява линия
export async function updateSaleLine(id: string, updates: Partial<SaleLine>): Promise<SaleLine> {
  const { data, error } = await supabase
    .from('sale_lines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Изтрива линия
export async function deleteSaleLine(id: string): Promise<void> {
  const { error } = await supabase
    .from('sale_lines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Финализира продажба (използва функция в базата)
export async function finalizeSale(saleId: string): Promise<void> {
  const { error } = await supabase.rpc('finalize_sale', { p_sale_id: saleId });

  if (error) throw error;
}

// Генерира следващ номер на продажба
export async function generateSaleNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_sale_number');

  if (error) throw error;
  return data;
}

// Статистики за продажби
export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalProfitReal: number;
  totalProfitAcc: number;
  totalPieces: number;
  totalKg: number;
}

export async function getSalesStats(filters?: SaleFilters): Promise<SalesStats> {
  let query = supabase
    .from('sales_summary')
    .select('*')
    .eq('status', 'finalized');

  if (filters?.from) {
    query = query.gte('date_time', filters.from);
  }
  if (filters?.to) {
    query = query.lte('date_time', filters.to);
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod);
  }

  const { data, error } = await query;

  if (error) throw error;

  const sales = data || [];

  return {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + (s.total_revenue_eur || 0), 0),
    totalProfitReal: sales.reduce((sum, s) => sum + (s.total_profit_real_eur || 0), 0),
    totalProfitAcc: sales.reduce((sum, s) => sum + (s.total_profit_acc_eur || 0), 0),
    totalPieces: sales.reduce((sum, s) => sum + (s.total_pieces || 0), 0),
    totalKg: sales.reduce((sum, s) => sum + (s.total_kg || 0), 0),
  };
}

// Взима продажби за конкретна доставка
export async function getSalesForDelivery(deliveryId: string): Promise<SaleLineComputed[]> {
  const { data, error } = await supabase
    .from('sale_lines_computed')
    .select('*')
    .or(`real_delivery_id.eq.${deliveryId},accounting_delivery_id.eq.${deliveryId}`);

  if (error) throw error;
  return data || [];
}
