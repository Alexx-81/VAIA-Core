import { useState, useEffect, useCallback } from 'react';
import {
  getLoyaltyTiers,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  getVoucherRules,
  createVoucherRule,
  updateVoucherRule,
  deleteVoucherRule,
} from '../../../lib/api/loyalty';
import type { LoyaltyTier, VoucherRule } from '../../../lib/supabase/types';
import type { TierFormData, VoucherRuleFormData } from '../types';

export function useLoyaltyConfig() {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [voucherRules, setVoucherRules] = useState<VoucherRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all config
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tiersData, rulesData] = await Promise.all([
        getLoyaltyTiers(),
        getVoucherRules(),
      ]);
      setTiers(tiersData);
      setVoucherRules(rulesData);
    } catch (err) {
      console.error('Error fetching loyalty config:', err);
      setError('Грешка при зареждане на конфигурацията за лоялност.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ============================================
  // Tiers CRUD
  // ============================================
  const handleCreateTier = useCallback(async (data: TierFormData): Promise<boolean> => {
    try {
      const newTier = await createLoyaltyTier({
        name: data.name.trim(),
        sort_order: data.sort_order,
        min_turnover_12m_eur: data.min_turnover_12m_eur,
        discount_percent: data.discount_percent,
        is_active: data.is_active,
      });
      setTiers(prev => [...prev, newTier].sort((a, b) => a.sort_order - b.sort_order));
      return true;
    } catch (err) {
      console.error('Error creating tier:', err);
      setError('Грешка при създаване на ниво.');
      return false;
    }
  }, []);

  const handleUpdateTier = useCallback(async (id: number, data: Partial<TierFormData>): Promise<boolean> => {
    try {
      const updated = await updateLoyaltyTier(id, data);
      setTiers(prev => prev.map(t => t.id === id ? updated : t).sort((a, b) => a.sort_order - b.sort_order));
      return true;
    } catch (err) {
      console.error('Error updating tier:', err);
      setError('Грешка при обновяване на ниво.');
      return false;
    }
  }, []);

  const handleDeleteTier = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteLoyaltyTier(id);
      setTiers(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting tier:', err);
      setError('Грешка при изтриване на ниво. Може да е в употреба.');
      return false;
    }
  }, []);

  // ============================================
  // Voucher Rules CRUD
  // ============================================
  const handleCreateRule = useCallback(async (data: VoucherRuleFormData): Promise<boolean> => {
    try {
      const newRule = await createVoucherRule({
        trigger_turnover_12m_eur: data.trigger_turnover_12m_eur,
        voucher_amount_eur: data.voucher_amount_eur,
        valid_days: data.valid_days,
        min_purchase_eur: data.min_purchase_eur,
        is_active: data.is_active,
      });
      setVoucherRules(prev => [...prev, newRule].sort((a, b) => a.trigger_turnover_12m_eur - b.trigger_turnover_12m_eur));
      return true;
    } catch (err) {
      console.error('Error creating voucher rule:', err);
      setError('Грешка при създаване на правило за ваучер.');
      return false;
    }
  }, []);

  const handleUpdateRule = useCallback(async (id: number, data: Partial<VoucherRuleFormData>): Promise<boolean> => {
    try {
      const updated = await updateVoucherRule(id, data);
      setVoucherRules(prev => prev.map(r => r.id === id ? updated : r).sort((a, b) => a.trigger_turnover_12m_eur - b.trigger_turnover_12m_eur));
      return true;
    } catch (err) {
      console.error('Error updating voucher rule:', err);
      setError('Грешка при обновяване на правило за ваучер.');
      return false;
    }
  }, []);

  const handleDeleteRule = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteVoucherRule(id);
      setVoucherRules(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting voucher rule:', err);
      setError('Грешка при изтриване на правило за ваучер.');
      return false;
    }
  }, []);

  return {
    tiers,
    voucherRules,
    loading,
    error,
    clearError: () => setError(null),
    refreshConfig: fetchConfig,
    // Tiers
    createTier: handleCreateTier,
    updateTier: handleUpdateTier,
    deleteTier: handleDeleteTier,
    // Rules
    createRule: handleCreateRule,
    updateRule: handleUpdateRule,
    deleteRule: handleDeleteRule,
  };
}
