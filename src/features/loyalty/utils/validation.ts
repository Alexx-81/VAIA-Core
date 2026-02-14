import type { TierFormData, TierFormErrors, VoucherRuleFormData, VoucherRuleFormErrors } from '../types';
import type { LoyaltyTier } from '../../../lib/supabase/types';

// ============================================
// Tier Validation
// ============================================
export function validateTier(data: TierFormData, existingTiers: LoyaltyTier[], editingId?: number): TierFormErrors {
  const errors: TierFormErrors = {};

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    errors.name = 'Името на нивото е задължително.';
  } else {
    const isDuplicate = existingTiers.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== editingId
    );
    if (isDuplicate) {
      errors.name = 'Вече съществува ниво с това име.';
    }
  }

  if (data.min_turnover_12m_eur < 0) {
    errors.min_turnover_12m_eur = 'Минималният оборот не може да бъде отрицателен.';
  }

  if (data.discount_percent < 0 || data.discount_percent > 100) {
    errors.discount_percent = 'Отстъпката трябва да е между 0% и 100%.';
  }

  if (data.sort_order < 0) {
    errors.sort_order = 'Подредбата трябва да е неотрицателно число.';
  }

  return errors;
}

// ============================================
// Voucher Rule Validation
// ============================================
export function validateVoucherRule(data: VoucherRuleFormData): VoucherRuleFormErrors {
  const errors: VoucherRuleFormErrors = {};

  if (data.trigger_turnover_12m_eur <= 0) {
    errors.trigger_turnover_12m_eur = 'Оборотът за активиране трябва да е положително число.';
  }

  if (data.voucher_amount_eur <= 0) {
    errors.voucher_amount_eur = 'Стойността на ваучера трябва да е положително число.';
  }

  if (data.valid_days < 1) {
    errors.valid_days = 'Валидността трябва да е поне 1 ден.';
  }

  if (data.min_purchase_eur < 0) {
    errors.min_purchase_eur = 'Минималната покупка не може да бъде отрицателна.';
  }

  if (data.min_purchase_eur > 0 && data.min_purchase_eur <= data.voucher_amount_eur) {
    errors.min_purchase_eur = 'Минималната покупка трябва да е по-голяма от стойността на ваучера.';
  }

  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(e => e !== undefined);
}
