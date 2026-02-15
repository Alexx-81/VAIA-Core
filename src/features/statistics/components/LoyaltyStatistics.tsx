import { useEffect, useState } from 'react';
import {
  getLoyaltyStatsDistribution,
  getLoyaltyStatsVouchers,
  getLoyaltyStatsROI,
  getLoyaltyStatsTopCustomers,
  type LoyaltyTierDistribution,
  type LoyaltyVoucherMonthlyStats,
  type LoyaltyROIStats,
  type LoyaltyTopCustomer,
} from '../../../lib/api/loyalty';
import { LoyaltyFiltersBar } from './LoyaltyFiltersBar';
import type { LoyaltyFilters } from '../types';
import './LoyaltyStatistics.css';

interface LoyaltyStatisticsProps {
  dateFrom: string;
  dateTo: string;
}

export const LoyaltyStatistics = ({ dateFrom, dateTo }: LoyaltyStatisticsProps) => {
  const [loading, setLoading] = useState(true);
  const [tierDistribution, setTierDistribution] = useState<LoyaltyTierDistribution[]>([]);
  const [vouchersMonthly, setVouchersMonthly] = useState<LoyaltyVoucherMonthlyStats[]>([]);
  const [roi, setROI] = useState<LoyaltyROIStats | null>(null);
  const [topCustomers, setTopCustomers] = useState<LoyaltyTopCustomer[]>([]);

  // Format date to YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize filters with current month by default
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: formatLocalDate(firstDay),
      end: formatLocalDate(lastDay),
    };
  };

  const defaultRange = getCurrentMonthRange();
  const [filters, setFilters] = useState<LoyaltyFilters>({
    dateFrom: defaultRange.start,
    dateTo: defaultRange.end,
    customerId: null,
    tierId: null,
    voucherStatus: 'all',
  });

  const handleUpdateFilters = (updates: Partial<LoyaltyFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [distrib, vouchers, roiStats, topCust] = await Promise.all([
          getLoyaltyStatsDistribution(),
          getLoyaltyStatsVouchers(filters.dateFrom, filters.dateTo),
          getLoyaltyStatsROI(filters.dateFrom, filters.dateTo),
          getLoyaltyStatsTopCustomers(20),
        ]);

        setTierDistribution(distrib);
        setVouchersMonthly(vouchers);
        setROI(roiStats);
        setTopCustomers(topCust);
      } catch (error) {
        console.error('Грешка при зареждане на loyalty статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.dateFrom, filters.dateTo]);

  // Apply filters to tier distribution
  const filteredTierDistribution = tierDistribution.filter((tier) => {
    if (filters.tierId !== null && tier.tier_id !== filters.tierId) {
      return false;
    }
    return true;
  });

  // Apply filters to top customers
  const filteredTopCustomers = topCustomers.filter((customer) => {
    if (filters.customerId && customer.customer_id !== filters.customerId) {
      return false;
    }
    if (filters.tierId !== null && customer.current_tier_id !== filters.tierId) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="loyalty-statistics">
        <LoyaltyFiltersBar filters={filters} onUpdateFilters={handleUpdateFilters} />
        <div className="loyalty-statistics__loading">Зареждане на статистики...</div>
      </div>
    );
  }

  const formatEur = (value: number) => value.toFixed(2);
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="loyalty-statistics">
      <LoyaltyFiltersBar filters={filters} onUpdateFilters={handleUpdateFilters} />

      {/* Three Column Layout */}
      <div className="loyalty-statistics__main-grid">
        {/* ROI Metrics Card */}
        <div className="loyalty-statistics__card">
          <div className="loyalty-statistics__card-header">
            <div className="loyalty-statistics__card-icon">📊</div>
            <h2 className="loyalty-statistics__card-title">ROI Метрики</h2>
          </div>
          <div className="loyalty-statistics__card-body">
            {roi && (
              <>
                <div className="loyalty-statistics__metric-item">
                  <div className="loyalty-statistics__metric-emoji">💰</div>
                  <div className="loyalty-statistics__metric-content">
                    <div className="loyalty-statistics__metric-value">€{formatEur(roi.total_discounts_eur)}</div>
                    <div className="loyalty-statistics__metric-label">Общо отстъпки</div>
                    <div className="loyalty-statistics__metric-detail">
                      Ниво: €{formatEur(roi.total_tier_discounts_eur)}<br/>
                      Ваучери: €{formatEur(roi.total_voucher_discounts_eur)}
                    </div>
                  </div>
                </div>
                <div className="loyalty-statistics__metric-item">
                  <div className="loyalty-statistics__metric-emoji">👥</div>
                  <div className="loyalty-statistics__metric-content">
                    <div className="loyalty-statistics__metric-value">{formatPercent(roi.loyalty_participation_rate)}</div>
                    <div className="loyalty-statistics__metric-label">Участие</div>
                    <div className="loyalty-statistics__metric-detail">
                      {roi.customers_with_loyalty} от {roi.total_customers} клиенти
                    </div>
                  </div>
                </div>
                <div className="loyalty-statistics__metric-item">
                  <div className="loyalty-statistics__metric-emoji">🎯</div>
                  <div className="loyalty-statistics__metric-content">
                    <div className="loyalty-statistics__metric-value">€{formatEur(roi.avg_discount_per_sale_eur)}</div>
                    <div className="loyalty-statistics__metric-label">Средна отстъпка</div>
                    <div className="loyalty-statistics__metric-detail">
                      {roi.sales_with_loyalty_count} от {roi.total_sales_count} продажби
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tier Distribution Card */}
        <div className="loyalty-statistics__card">
          <div className="loyalty-statistics__card-header">
            <div className="loyalty-statistics__card-icon">🏆</div>
            <h2 className="loyalty-statistics__card-title">Разпределение по нива</h2>
          </div>
          <div className="loyalty-statistics__card-body">
            {filteredTierDistribution.length === 0 ? (
              <div className="loyalty-statistics__empty">Няма данни</div>
            ) : (
              filteredTierDistribution.map((tier, idx) => (
                <div key={tier.tier_id || `no-tier-${idx}`} className="loyalty-statistics__tier-item">
                  <div
                    className="loyalty-statistics__tier-badge"
                    style={{ 
                      backgroundColor: tier.tier_color,
                      boxShadow: `0 4px 12px ${tier.tier_color}40`
                    }}
                  >
                    {tier.tier_name}
                  </div>
                  <div className="loyalty-statistics__tier-stats">
                    <div className="loyalty-statistics__tier-stat-row">
                      <span className="loyalty-statistics__tier-stat-label">Клиенти:</span>
                      <span className="loyalty-statistics__tier-stat-value">{tier.customer_count}</span>
                    </div>
                    <div className="loyalty-statistics__tier-stat-row">
                      <span className="loyalty-statistics__tier-stat-label">Среден оборот:</span>
                      <span className="loyalty-statistics__tier-stat-value">€{formatEur(tier.avg_turnover_12m_eur)}</span>
                    </div>
                    <div className="loyalty-statistics__tier-stat-row">
                      <span className="loyalty-statistics__tier-stat-label">Общ оборот:</span>
                      <span className="loyalty-statistics__tier-stat-value">€{formatEur(tier.total_turnover_12m_eur)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vouchers Card */}
        <div className="loyalty-statistics__card">
          <div className="loyalty-statistics__card-header">
            <div className="loyalty-statistics__card-icon">🎟️</div>
            <h2 className="loyalty-statistics__card-title">Ваучери по месеци</h2>
          </div>
          <div className="loyalty-statistics__card-body">
            {vouchersMonthly.length === 0 ? (
              <div className="loyalty-statistics__empty">Няма данни</div>
            ) : (
              vouchersMonthly.map((vm) => (
                <div key={vm.month} className="loyalty-statistics__voucher-item">
                  <div className="loyalty-statistics__voucher-header">{vm.month}</div>
                  <div className="loyalty-statistics__voucher-row">
                    <div className="loyalty-statistics__voucher-col">
                      <div className="loyalty-statistics__voucher-label">Издадени</div>
                      <div className="loyalty-statistics__voucher-count">{vm.issued_count} бр.</div>
                      <div className="loyalty-statistics__voucher-amount">€{formatEur(vm.issued_amount_eur)}</div>
                    </div>
                    <div className="loyalty-statistics__voucher-divider"></div>
                    <div className="loyalty-statistics__voucher-col">
                      <div className="loyalty-statistics__voucher-label">Изплатени</div>
                      <div className="loyalty-statistics__voucher-count">{vm.redeemed_count} бр.</div>
                      <div className="loyalty-statistics__voucher-amount">€{formatEur(vm.redeemed_amount_eur)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="loyalty-statistics__card loyalty-statistics__card--full-width">
        <div className="loyalty-statistics__card-header">
          <div className="loyalty-statistics__card-icon">⭐</div>
          <h2 className="loyalty-statistics__card-title">Топ клиенти</h2>
        </div>
        <div className="loyalty-statistics__card-body loyalty-statistics__card-body--table">
          {filteredTopCustomers.length === 0 ? (
            <div className="loyalty-statistics__empty">Няма клиенти с loyalty активност</div>
          ) : (
            <div className="loyalty-statistics__table-wrapper">
              <table className="loyalty-statistics__table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Ниво</th>
                    <th className="text-right">Оборот 12м</th>
                    <th className="text-right">Отстъпки ниво</th>
                    <th className="text-right">Отстъпки ваучери</th>
                    <th className="text-right">Ваучери</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopCustomers.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td>{customer.customer_name}</td>
                      <td>
                        <span className="loyalty-statistics__tier-badge-small">
                          {customer.current_tier_name}
                        </span>
                      </td>
                      <td className="text-right">€{formatEur(customer.turnover_12m_eur)}</td>
                      <td className="text-right">€{formatEur(customer.tier_discount_total_eur)}</td>
                      <td className="text-right">€{formatEur(customer.voucher_discount_total_eur)}</td>
                      <td className="text-right">
                        {customer.total_vouchers_redeemed}/{customer.total_vouchers_issued}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
