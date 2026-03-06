import type { SaleWithComputed } from '../types';
import { formatDateTime, formatEur, formatKg, formatPercent, getPaymentMethodLabel, getProfitClass, getMarginClass } from '../utils/salesUtils';
import { useAuth } from '../../../shared/context/AuthContext';
import './SaleDetail.css';

interface DeliveryInfo {
  id: string | null;
  display_id: string | null;
}

interface SaleDetailProps {
  sale: SaleWithComputed;
  onBack: () => void;
  onDelete?: () => void;
  deliveries?: DeliveryInfo[];
}

export const SaleDetail = ({ sale, onBack, onDelete, deliveries = [] }: SaleDetailProps) => {
  const { isAdmin } = useAuth();

  const getDisplayId = (uuid: string | undefined): string => {
    if (!uuid) return '—';
    const found = deliveries.find(d => d.id === uuid);
    return found?.display_id ? `#${found.display_id}` : `#${uuid.slice(0, 8)}…`;
  };
  const getPaymentIcon = (method: string): string => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'no-cash': return '🔓';
      default: return '📄';
    }
  };

  return (
    <div className="sale-detail">
      {/* Header */}
      <div className="sale-detail__header">
        <div className="sale-detail__header-left">
          <h2 className="sale-detail__title">
            Продажба {sale.saleNumber}
          </h2>
          <p className="sale-detail__subtitle">
            {sale.note || 'Без бележка'}
          </p>
          
          <div className="sale-detail__meta">
            <div className="sale-detail__meta-item">
              <span className="sale-detail__meta-label">Дата/час</span>
              <span className="sale-detail__meta-value">{formatDateTime(sale.dateTime)}</span>
            </div>
            <div className="sale-detail__meta-item">
              <span className="sale-detail__meta-label">Метод плащане</span>
              <span className={`sale-detail__payment-badge ${sale.paymentMethod}`}>
                {getPaymentIcon(sale.paymentMethod)}
                {getPaymentMethodLabel(sale.paymentMethod)}
              </span>
            </div>
            <div className="sale-detail__meta-item">
              <span className="sale-detail__meta-label">Редове</span>
              <span className="sale-detail__meta-value">{sale.linesCount}</span>
            </div>
            <div className="sale-detail__meta-item">
              <span className="sale-detail__meta-label">Общо бройки</span>
              <span className="sale-detail__meta-value">{sale.totalPieces}</span>
            </div>
            <div className="sale-detail__meta-item">
              <span className="sale-detail__meta-label">Общо kg</span>
              <span className="sale-detail__meta-value">{formatKg(sale.totalKg)}</span>
            </div>
          </div>
        </div>
        
        <div className="sale-detail__header-actions">
          {isAdmin && onDelete && (
            <button className="sale-detail__btn sale-detail__btn--danger" onClick={onDelete}>
              🗑️ Изтрий
            </button>
          )}
          <button className="sale-detail__btn sale-detail__btn--secondary" onClick={onBack}>
            ← Назад към списъка
          </button>
        </div>
      </div>

      {/* Lines section */}
      <div className="sale-detail__lines-header">
        <h3 className="sale-detail__lines-title">Редове на продажбата</h3>
        <span className="sale-detail__lines-count">{sale.linesCount} реда</span>
      </div>

      <div className="sale-detail__lines-wrapper">
        <table className="sale-detail__lines-table">
          <thead>
            <tr>
              <th>Артикул</th>
              <th className="text-right">Бройки</th>
              <th className="text-right">Цена/бр (EUR)</th>
              <th className="text-center">Отстъпка</th>
              <th className="text-right">Оборот (EUR)</th>
              <th>Real доставка</th>
              <th className="text-right">kg/бр</th>
              <th className="text-right">kg</th>
              <th className="text-right">EUR/kg</th>
              <th className="text-right">Себест. (EUR)</th>
              <th className="text-right">Печалба (EUR)</th>
              <th className="text-center">Марж %</th>
              <th>Acc. доставка</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line) => (
              <tr key={line.id}>
                <td className="font-semibold">{line.articleName}</td>
                <td className="text-right">{line.quantity}</td>
                <td className="text-right">{formatEur(line.unitPriceEur)}</td>
                <td className="text-center">
                  {line.articleDiscountPercentSnapshot ? (
                    <span className="sale-detail__discount-badge">
                      {line.articleDiscountPercentSnapshot}%
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="text-right font-semibold">{formatEur(line.revenueEur)}</td>
                <td>
                  <span className="sale-detail__delivery-badge">
                    {getDisplayId(line.realDeliveryId)}
                  </span>
                </td>
                <td className="text-right text-muted">{formatKg(line.kgPerPieceSnapshot)}</td>
                <td className="text-right">{formatKg(line.kgLine)}</td>
                <td className="text-right text-muted">{formatEur(line.unitCostPerKgRealSnapshot)}</td>
                <td className="text-right text-muted">{formatEur(line.cogsRealEur)}</td>
                <td className="text-right">
                  <span className={`sale-detail__profit ${getProfitClass(line.profitRealEur)}`}>
                    {formatEur(line.profitRealEur)}
                  </span>
                </td>
                <td className="text-center">
                  <span className={`sale-detail__margin-badge ${getMarginClass(line.marginRealPercent)}`}>
                    {formatPercent(line.marginRealPercent)}
                  </span>
                </td>
                <td>
                  {line.accountingDeliveryId ? (
                    <span className="sale-detail__delivery-badge accounting">
                      {getDisplayId(line.accountingDeliveryId)}
                    </span>
                  ) : (
                    <span className="sale-detail__delivery-badge">
                      {getDisplayId(line.realDeliveryId)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="sale-detail__totals">
        <div className="sale-detail__totals-block">
          <h4 className="sale-detail__totals-title real">📊 Реални суми</h4>
          <div className="sale-detail__totals-grid">
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Общо бройки</span>
              <span className="sale-detail__total-value">{sale.totalPieces}</span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Общо kg</span>
              <span className="sale-detail__total-value">{formatKg(sale.totalKg)}</span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Оборот (EUR)</span>
              <span className="sale-detail__total-value">{formatEur(sale.totalRevenueEur)}</span>
            </div>
            
            {/* Показваме отстъпка и крайна сума ако има loyalty/voucher */}
            {sale.totalPaidEur && sale.totalPaidEur < sale.totalRevenueEur && (
              <>
                <div className="sale-detail__total-item">
                  <span className="sale-detail__total-label">
                    {sale.loyaltyMode === 'tier' && '📉 Отстъпка ниво (EUR)'}
                    {sale.loyaltyMode === 'voucher' && '🎟️ Отстъпка ваучер (EUR)'}
                  </span>
                  <span className="sale-detail__total-value discount">
                    - {formatEur(sale.totalRevenueEur - sale.totalPaidEur)}
                  </span>
                </div>
                <div className="sale-detail__total-item">
                  <span className="sale-detail__total-label">💰 Крайна сума (EUR)</span>
                  <span className="sale-detail__total-value highlight">
                    {formatEur(sale.totalPaidEur)}
                  </span>
                </div>
              </>
            )}
            
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Себестойност (EUR)</span>
              <span className="sale-detail__total-value">{formatEur(sale.totalCogsRealEur)}</span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Печалба (EUR)</span>
              <span className={`sale-detail__total-value ${sale.totalProfitRealEur >= 0 ? 'profit' : 'negative'}`}>
                {formatEur(sale.totalProfitRealEur)}
              </span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Марж %</span>
              <span className={`sale-detail__total-value ${sale.totalProfitRealEur >= 0 ? 'profit' : 'negative'}`}>
                {formatPercent(sale.totalMarginRealPercent)}
              </span>
            </div>
          </div>
        </div>

        <div className="sale-detail__totals-block">
          <h4 className="sale-detail__totals-title accounting">📋 Счетоводни суми</h4>
          <div className="sale-detail__totals-grid">
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Себестойност (EUR)</span>
              <span className="sale-detail__total-value">{formatEur(sale.totalCogsAccEur)}</span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Печалба (EUR)</span>
              <span className={`sale-detail__total-value ${sale.totalProfitAccEur >= 0 ? 'profit' : 'negative'}`}>
                {formatEur(sale.totalProfitAccEur)}
              </span>
            </div>
            <div className="sale-detail__total-item">
              <span className="sale-detail__total-label">Марж %</span>
              <span className={`sale-detail__total-value ${sale.totalProfitAccEur >= 0 ? 'profit' : 'negative'}`}>
                {formatPercent(sale.totalMarginAccPercent)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
