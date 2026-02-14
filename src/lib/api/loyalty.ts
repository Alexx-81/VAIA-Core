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

export async function getCustomerLoyaltyInfo(customerId: string): Promise<CustomerLoyaltyInfo> {
  const { data, error } = await supabase.rpc('get_customer_loyalty_info', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return data as unknown as CustomerLoyaltyInfo;
}

export async function ensureCustomerLoyaltyStatus(customerId: string): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_customer_loyalty_status', {
    p_customer_id: customerId,
  });

  if (error) throw error;
  return data as string;
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
