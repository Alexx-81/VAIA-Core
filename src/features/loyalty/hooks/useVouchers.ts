import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllVouchersWithCustomer, expireVouchers } from '../../../lib/api/loyalty';
import type { CustomerVoucher } from '../../../lib/supabase/types';
import type { VoucherFilters } from '../types';

export interface VoucherWithCustomer extends CustomerVoucher {
  customer_name: string;
}

export function useVouchers() {
  const [vouchers, setVouchers] = useState<VoucherWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VoucherFilters>({ search: '', status: 'all' });

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Expire overdue vouchers first
      await expireVouchers();
      const data = await getAllVouchersWithCustomer();
      setVouchers(data as VoucherWithCustomer[]);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setError('Грешка при зареждане на ваучерите.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // Status filter
      if (filters.status !== 'all' && v.status !== filters.status) return false;
      // Search filter (customer name)
      if (filters.search) {
        const searchLow = filters.search.toLowerCase();
        if (!v.customer_name.toLowerCase().includes(searchLow)) return false;
      }
      return true;
    });
  }, [vouchers, filters]);

  const updateFilters = useCallback((updates: Partial<VoucherFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: vouchers.length,
    issued: vouchers.filter(v => v.status === 'issued').length,
    redeemed: vouchers.filter(v => v.status === 'redeemed').length,
    expired: vouchers.filter(v => v.status === 'expired').length,
    void: vouchers.filter(v => v.status === 'void').length,
  }), [vouchers]);

  return {
    vouchers: filteredVouchers,
    allVouchers: vouchers,
    loading,
    error,
    filters,
    updateFilters,
    stats,
    refreshVouchers: fetchVouchers,
  };
}
