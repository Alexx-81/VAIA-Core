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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [distrib, vouchers, roiStats, topCust] = await Promise.all([
          getLoyaltyStatsDistribution(),
          getLoyaltyStatsVouchers(dateFrom, dateTo),
          getLoyaltyStatsROI(dateFrom, dateTo),
          getLoyaltyStatsTopCustomers(20),
        ]);

        console.log('Loyalty Stats Loaded:', { distrib, vouchers, roiStats, topCust });

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
  }, [dateFrom, dateTo]);

  if (loading) {
    return <div className="loyalty-statistics__loading">Зареждане на статистики...</div>;
  }

  const formatEur = (value: number) => value.toFixed(2);
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="loyalty-statistics">
      {/* ROI Metrics */}
      <div className="loyalty-statistics__section">
        <h2 className="loyalty-statistics__section-title">📊 ROI Метрики</h2>
        {roi && (
          <div className="loyalty-statistics__kpi-grid">
            <div className="loyalty-statistics__kpi-card">
              <div className="loyalty-statistics__kpi-value">€{formatEur(roi.total_discounts_eur)}</div>
              <div className="loyalty-statistics__kpi-label">Общо отстъпки</div>
              <div className="loyalty-statistics__kpi-detail">
                Ниво: €{formatEur(roi.total_tier_discounts_eur)} | Ваучери: €{formatEur(roi.total_voucher_discounts_eur)}
              </div>
            </div>
            <div className="loyalty-statistics__kpi-card">
              <div className="loyalty-statistics__kpi-value">{formatPercent(roi.loyalty_participation_rate)}</div>
              <div className="loyalty-statistics__kpi-label">Участие в програмата</div>
              <div className="loyalty-statistics__kpi-detail">
                {roi.customers_with_loyalty} от {roi.total_customers} клиенти
              </div>
            </div>
            <div className="loyalty-statistics__kpi-card">
              <div className="loyalty-statistics__kpi-value">€{formatEur(roi.avg_discount_per_sale_eur)}</div>
              <div className="loyalty-statistics__kpi-label">Средна отстъпка / продажба</div>
              <div className="loyalty-statistics__kpi-detail">
                {roi.sales_with_loyalty_count} от {roi.total_sales_count} продажби
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tier Distribution */}
      <div className="loyalty-statistics__section">
        <h2 className="loyalty-statistics__section-title">🏆 Разпределение по нива</h2>
        <div className="loyalty-statistics__table-wrapper">
          <table className="loyalty-statistics__table">
            <thead>
              <tr>
                <th>Ниво</th>
                <th className="text-right">Клиенти</th>
                <th className="text-right">Среден оборот 12м</th>
                <th className="text-right">Общ оборот 12м</th>
              </tr>
            </thead>
            <tbody>
              {tierDistribution.map((tier, idx) => (
                <tr key={tier.tier_id || `no-tier-${idx}`}>
                  <td>
                    <span
                      className="loyalty-statistics__tier-badge"
                      style={{ backgroundColor: tier.tier_color }}
                    >
                      {tier.tier_name}
                    </span>
                  </td>
                  <td className="text-right">{tier.customer_count}</td>
                  <td className="text-right">€{formatEur(tier.avg_turnover_12m_eur)}</td>
                  <td className="text-right">€{formatEur(tier.total_turnover_12m_eur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vouchers by Month */}
      <div className="loyalty-statistics__section">
        <h2 className="loyalty-statistics__section-title">🎟️ Ваучери по месец</h2>
        <div className="loyalty-statistics__table-wrapper">
          <table className="loyalty-statistics__table">
            <thead>
              <tr>
                <th>Месец</th>
                <th className="text-right">Издадени бр.</th>
                <th className="text-right">Издадени €</th>
                <th className="text-right">Изплатени бр.</th>
                <th className="text-right">Изплатени €</th>
              </tr>
            </thead>
            <tbody>
              {vouchersMonthly.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">Няма данни за избрания период</td>
                </tr>
              ) : (
                vouchersMonthly.map((vm) => (
                  <tr key={vm.month}>
                    <td>{vm.month}</td>
                    <td className="text-right">{vm.issued_count}</td>
                    <td className="text-right">€{formatEur(vm.issued_amount_eur)}</td>
                    <td className="text-right">{vm.redeemed_count}</td>
                    <td className="text-right">€{formatEur(vm.redeemed_amount_eur)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers */}
      <div className="loyalty-statistics__section">
        <h2 className="loyalty-statistics__section-title">⭐ Топ клиенти</h2>
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
              {topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">Няма клиенти с loyalty активност</td>
                </tr>
              ) : (
                topCustomers.map((customer) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
