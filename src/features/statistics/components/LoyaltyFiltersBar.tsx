import { useEffect, useState } from 'react';
import type { LoyaltyFilters } from '../types';
import type { LoyaltyTier } from '../../../lib/supabase/types';
import { getLoyaltyTiers } from '../../../lib/api/loyalty';
import { useCustomers } from '../../customers/hooks/useCustomers';
import './LoyaltyFiltersBar.css';

interface LoyaltyFiltersBarProps {
  filters: LoyaltyFilters;
  onUpdateFilters: (filters: Partial<LoyaltyFilters>) => void;
}

export const LoyaltyFiltersBar = ({ filters, onUpdateFilters }: LoyaltyFiltersBarProps) => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const { customers } = useCustomers();

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await getLoyaltyTiers();
        setTiers(data);
      } catch (error) {
        console.error('Грешка при зареждане на нива:', error);
      }
    };
    fetchTiers();
  }, []);

  // Get current month range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  // Get current year range
  const getCurrentYearRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  // Quick filter buttons
  const setCurrentMonth = () => {
    const range = getCurrentMonthRange();
    onUpdateFilters({ dateFrom: range.start, dateTo: range.end });
  };

  const setCurrentYear = () => {
    const range = getCurrentYearRange();
    onUpdateFilters({ dateFrom: range.start, dateTo: range.end });
  };

  const setLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    onUpdateFilters({
      dateFrom: firstDay.toISOString().split('T')[0],
      dateTo: lastDay.toISOString().split('T')[0],
    });
  };

  const setLast3Months = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    onUpdateFilters({
      dateFrom: firstDay.toISOString().split('T')[0],
      dateTo: lastDay.toISOString().split('T')[0],
    });
  };

  // Only show customers with barcodes (loyalty customers)
  const loyaltyCustomers = customers.filter(c => c.barcode);

  return (
    <div className="loyalty-filters-bar">
      <div className="loyalty-filters-bar__row">
        {/* Quick Date Filters */}
        <div className="loyalty-filters-bar__quick-dates">
          <button
            className="loyalty-filters-bar__quick-btn"
            onClick={setCurrentMonth}
            title="Текущ месец"
          >
            Текущ месец
          </button>
          <button
            className="loyalty-filters-bar__quick-btn"
            onClick={setLastMonth}
            title="Миналия месец"
          >
            Миналия месец
          </button>
          <button
            className="loyalty-filters-bar__quick-btn"
            onClick={setLast3Months}
            title="Последни 3 месеца"
          >
            Последни 3м
          </button>
          <button
            className="loyalty-filters-bar__quick-btn"
            onClick={setCurrentYear}
            title="Текуща година"
          >
            Текуща година
          </button>
        </div>

        {/* Date Range */}
        <div className="loyalty-filters-bar__date-range">
          <label>
            От:
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onUpdateFilters({ dateFrom: e.target.value })}
              className="loyalty-filters-bar__date-input"
            />
          </label>
          <label>
            До:
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onUpdateFilters({ dateTo: e.target.value })}
              className="loyalty-filters-bar__date-input"
            />
          </label>
        </div>
      </div>

      <div className="loyalty-filters-bar__row">
        {/* Customer Filter */}
        <div className="loyalty-filters-bar__filter">
          <label>
            Клиент:
            <select
              value={filters.customerId || ''}
              onChange={(e) => onUpdateFilters({ customerId: e.target.value || null })}
              className="loyalty-filters-bar__select"
            >
              <option value="">Всички клиенти</option>
              {loyaltyCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.barcode})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Tier Filter */}
        <div className="loyalty-filters-bar__filter">
          <label>
            Ниво:
            <select
              value={filters.tierId ?? ''}
              onChange={(e) => onUpdateFilters({ tierId: e.target.value ? Number(e.target.value) : null })}
              className="loyalty-filters-bar__select"
            >
              <option value="">Всички нива</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Voucher Status Filter */}
        <div className="loyalty-filters-bar__filter">
          <label>
            Ваучери:
            <select
              value={filters.voucherStatus}
              onChange={(e) => onUpdateFilters({ voucherStatus: e.target.value as LoyaltyFilters['voucherStatus'] })}
              className="loyalty-filters-bar__select"
            >
              <option value="all">Всички</option>
              <option value="issued">Издадени</option>
              <option value="redeemed">Изплатени</option>
              <option value="active">Активни</option>
              <option value="expired">Изтекли</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};
