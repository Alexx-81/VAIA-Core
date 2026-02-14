import { useState, useEffect, useCallback } from 'react';
import { getCustomerLoyaltyInfo, ensureCustomerLoyaltyStatus, getCustomerVouchers, getLoyaltyTiers } from '../../../lib/api/loyalty';
import type { CustomerLoyaltyInfo } from '../../../lib/api/loyalty';
import type { CustomerVoucher, LoyaltyTier } from '../../../lib/supabase/types';

export interface EnrichedLoyaltyInfo extends CustomerLoyaltyInfo {
  next_tier_name: string | null;
  progress_to_next_tier: number | null;
}

export function useCustomerLoyalty(customerId: string | null) {
  const [loyaltyInfo, setLoyaltyInfo] = useState<EnrichedLoyaltyInfo | null>(null);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    if (!customerId) {
      setLoyaltyInfo(null);
      setVouchers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure loyalty status exists
      await ensureCustomerLoyaltyStatus(customerId);

      // Fetch loyalty info (tier, turnover, progress)
      const info = await getCustomerLoyaltyInfo(customerId);

      // Fetch all tiers to calculate next tier
      const allTiers = await getLoyaltyTiers();
      const sortedTiers = allTiers
        .filter((t) => t.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);

      // Find next tier
      const currentTierIndex = sortedTiers.findIndex((t) => t.id === info.tier_id);
      const nextTier: LoyaltyTier | undefined = sortedTiers[currentTierIndex + 1];

      const enrichedInfo: EnrichedLoyaltyInfo = {
        ...info,
        next_tier_name: nextTier?.name ?? null,
        progress_to_next_tier: nextTier
          ? Math.max(0, nextTier.min_turnover_12m_eur - info.turnover_12m_eur)
          : null,
      };

      setLoyaltyInfo(enrichedInfo);

      // Fetch active vouchers
      const customerVouchers = await getCustomerVouchers({ customerId, status: 'issued' });
      setVouchers(customerVouchers);
    } catch (err) {
      console.error('Error fetching customer loyalty:', err);
      setError('Грешка при зареждане на лоялната информация.');
      setLoyaltyInfo(null);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const refresh = useCallback(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  return {
    loyaltyInfo,
    vouchers,
    loading,
    error,
    refresh,
  };
}
