// API функции за програмата за лоялност
import { supabase } from '../supabase';
import type {
  LoyaltyTier, LoyaltyTierInsert, LoyaltyTierUpdate,
  VoucherRule, VoucherRuleInsert, VoucherRuleUpdate,
  CustomerVoucher, VoucherStatus, Json,
} from '../supabase/types';

// ============================================
// Loyalty Tiers
// ============================================

export async function getLoyaltyTiers(): Promise<LoyaltyTier[]> {
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function createLoyaltyTier(tier: LoyaltyTierInsert): Promise<LoyaltyTier> {
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .insert(tier)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLoyaltyTier(id: number, updates: LoyaltyTierUpdate): Promise<LoyaltyTier> {
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLoyaltyTier(id: number): Promise<void> {
  const { error } = await supabase
    .from('loyalty_tiers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Voucher Rules
// ============================================

export async function getVoucherRules(): Promise<VoucherRule[]> {
  const { data, error } = await supabase
    .from('voucher_rules')
    .select('*')
    .order('trigger_turnover_12m_eur');

  if (error) throw error;
  return data || [];
}

export async function createVoucherRule(rule: VoucherRuleInsert): Promise<VoucherRule> {
  const { data, error } = await supabase
    .from('voucher_rules')
    .insert(rule)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVoucherRule(id: number, updates: VoucherRuleUpdate): Promise<VoucherRule> {
  const { data, error } = await supabase
    .from('voucher_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVoucherRule(id: number): Promise<void> {
  const { error } = await supabase
    .from('voucher_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Customer Loyalty Info (RPC calls)
// ============================================

export interface CustomerLoyaltyInfo {
  customer_id: string;
  tier_id: number;
  tier_name: string;
  tier_sort_order: number;
  discount_percent: number;
  min_turnover_12m_eur: number;
  turnover_12m_eur: number;
  tier_reached_at: string;
  tier_locked_until: string;
  last_recalc_at: string | null;
  active_vouchers: {
    id: string;
    amount_eur: number;
    min_purchase_eur: number;
    status: string;
    issued_at: string;
    expires_at: string;
    rule_id: number | null;
  }[];
}

export async function getCustomerLoyaltyInfo(customerId: string): Promise<CustomerLoyaltyInfo | null> {
  const { data, error } = await supabase.rpc('get_customer_loyalty_info', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return data as unknown as (CustomerLoyaltyInfo | null);
}

export async function ensureCustomerLoyaltyStatus(customerId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_customer_loyalty_status', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return data as string | null;
}

// ============================================
// Process Loyalty After Sale (RPC)
// ============================================

export interface LoyaltyProcessResult {
  customer_id?: string;
  sale_id?: string;
  amount_recorded?: number;
  turnover_12m?: number;
  tier_changed?: boolean;
  new_tier?: string;
  issued_vouchers?: { voucher_id: string; amount_eur: number; rule_trigger: number }[];
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export async function processLoyaltyAfterSale(saleId: string): Promise<LoyaltyProcessResult> {
  const { data, error } = await supabase.rpc('process_loyalty_after_sale', {
    p_sale_id: saleId,
  });

  if (error) throw error;
  return data as unknown as LoyaltyProcessResult;
}

// ============================================
// Voucher Operations
// ============================================

export async function redeemVoucher(voucherId: string, saleId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('redeem_voucher', {
    p_voucher_id: voucherId,
    p_sale_id: saleId,
  });

  if (error) throw error;
  return data as boolean;
}

export async function expireVouchers(): Promise<number> {
  const { data, error } = await supabase.rpc('expire_vouchers');

  if (error) throw error;
  return data as number;
}

export async function getCustomerVouchers(filters?: {
  customerId?: string;
  status?: VoucherStatus;
}): Promise<CustomerVoucher[]> {
  let query = supabase
    .from('customer_vouchers')
    .select('*')
    .order('issued_at', { ascending: false });

  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAllVouchersWithCustomer(): Promise<(CustomerVoucher & { customer_name: string })[]> {
  const { data, error } = await supabase
    .from('customer_vouchers')
    .select('*, customers(name)')
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((v: Record<string, Json>) => ({
    ...v,
    customer_name: (v.customers as Record<string, string>)?.name || 'Неизвестен',
  })) as (CustomerVoucher & { customer_name: string })[];
}

// ============================================
// Loyalty Statistics
// ============================================

export interface LoyaltyTierDistribution {
  tier_id: number | null;
  tier_name: string;
  tier_color: string;
  customer_count: number;
  avg_turnover_12m_eur: number;
  total_turnover_12m_eur: number;
}

export interface LoyaltyVoucherMonthlyStats {
  month: string; // YYYY-MM format
  issued_count: number;
  issued_amount_eur: number;
  redeemed_count: number;
  redeemed_amount_eur: number;
}

export interface LoyaltyROIStats {
  total_tier_discounts_eur: number;
  total_voucher_discounts_eur: number;
  total_discounts_eur: number;
  customers_with_loyalty: number;
  total_customers: number;
  loyalty_participation_rate: number;
  avg_discount_per_sale_eur: number;
  sales_with_loyalty_count: number;
  total_sales_count: number;
}

export interface LoyaltyTopCustomer {
  customer_id: string;
  customer_name: string;
  current_tier_id: number | null;
  current_tier_name: string;
  turnover_12m_eur: number;
  tier_discount_total_eur: number;
  voucher_discount_total_eur: number;
  total_vouchers_issued: number;
  total_vouchers_redeemed: number;
}

/**
 * Разпределение на клиенти по лоялност нива
 */
export async function getLoyaltyStatsDistribution(): Promise<LoyaltyTierDistribution[]> {
  const { data, error } = await supabase.rpc('get_loyalty_tier_distribution');
  
  if (error) throw error;
  return data || [];
}

/**
 * Статистика за ваучери по месец
 */
export async function getLoyaltyStatsVouchers(
  dateFrom: string,
  dateTo: string
): Promise<LoyaltyVoucherMonthlyStats[]> {
  const { data, error } = await supabase.rpc('get_loyalty_vouchers_by_month', {
    date_from: dateFrom,
    date_to: dateTo,
  });
  
  if (error) throw error;
  return data || [];
}

/**
 * ROI метрики на лоялност програмата
 */
export async function getLoyaltyStatsROI(
  dateFrom: string,
  dateTo: string
): Promise<LoyaltyROIStats> {
  const { data, error } = await supabase.rpc('get_loyalty_roi_stats', {
    date_from: dateFrom,
    date_to: dateTo,
  });
  
  if (error) throw error;
  
  // RPC връща масив с един елемент, вземаме първия
  const result = (data as unknown as LoyaltyROIStats[]) || [];
  return result[0] || {
    total_tier_discounts_eur: 0,
    total_voucher_discounts_eur: 0,
    total_discounts_eur: 0,
    customers_with_loyalty: 0,
    total_customers: 0,
    loyalty_participation_rate: 0,
    avg_discount_per_sale_eur: 0,
    sales_with_loyalty_count: 0,
    total_sales_count: 0,
  };
}

/**
 * Топ клиенти по лоялност активност
 */
export async function getLoyaltyStatsTopCustomers(limit = 20): Promise<LoyaltyTopCustomer[]> {
  const { data, error } = await supabase.rpc('get_loyalty_top_customers', {
    result_limit: limit,
  });
  
  if (error) throw error;
  return data || [];
}
