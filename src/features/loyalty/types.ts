// ============================================
// Loyalty Mode
// ============================================
export type LoyaltyMode = 'none' | 'tier' | 'voucher';

// ============================================
// Tier Form
// ============================================
export interface TierFormData {
  name: string;
  sort_order: number;
  min_turnover_12m_eur: number;
  discount_percent: number;
  is_active: boolean;
}

export interface TierFormErrors {
  name?: string;
  min_turnover_12m_eur?: string;
  discount_percent?: string;
  sort_order?: string;
  [key: string]: string | undefined;
}

// ============================================
// Voucher Rule Form
// ============================================
export interface VoucherRuleFormData {
  trigger_turnover_12m_eur: number;
  voucher_amount_eur: number;
  valid_days: number;
  min_purchase_eur: number;
  is_active: boolean;
}

export interface VoucherRuleFormErrors {
  trigger_turnover_12m_eur?: string;
  voucher_amount_eur?: string;
  valid_days?: string;
  min_purchase_eur?: string;
  [key: string]: string | undefined;
}

// ============================================
// Voucher Filters
// ============================================
export type VoucherStatusFilter = 'all' | 'issued' | 'redeemed' | 'expired' | 'void';

export interface VoucherFilters {
  search: string;
  status: VoucherStatusFilter;
}

// ============================================
// Loyalty Section Tabs
// ============================================
export type LoyaltySection = 'tiers' | 'voucher-rules' | 'vouchers';

// ============================================
// Customer Loyalty Display
// ============================================
export interface CustomerLoyaltyDisplay {
  customerId: string;
  customerName: string;
  tierName: string;
  discountPercent: number;
  turnover12m: number;
  tierLockedUntil: string;
  activeVouchersCount: number;
}
