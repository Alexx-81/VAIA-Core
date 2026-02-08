import type { DeliveryWithComputed, SaleFromDelivery } from '../types';
import { formatDate, formatDateTime, formatKg, formatEur } from '../utils/deliveryUtils';
import { useAuth } from '../../../shared/context/AuthContext';
import './DeliveryDetail.css';

interface DeliveryDetailProps {
  delivery: DeliveryWithComputed;
  sales: SaleFromDelivery[];
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export const DeliveryDetail = ({
  delivery,
  sales,
  onBack,
  onEdit,
  onDelete,
}: DeliveryDetailProps) => {
  const { isReadOnly, isAdmin } = useAuth();

  // Изчисляваме сумарни стойности от продажбите
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenueEur, 0);
  const totalCost = sales.reduce((sum, s) => sum + s.costEur, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profitEur, 0);
  const totalKgSold = sales.reduce((sum, s) => sum + s.kgSold, 0);

  return (
    <div className="delivery-detail">
      {/* Back button */}
      <button className="delivery-detail__back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Обратно към списъка
      </button>

      {/* Header Card */}
      <div className="delivery-detail__header-card">
        <div className="delivery-detail__header-main">
          <div className="delivery-detail__id-section">
            <span className="delivery-detail__id-label">Доставка</span>
            <span className="delivery-detail__id-value">{delivery.displayId}</span>
            <span className={`delivery-detail__invoice-badge ${delivery.isInvoiced ? 'invoiced' : 'non-invoiced'}`}>
              {delivery.isInvoiced ? 'Фактурна' : 'Без фактура'}
            </span>
          </div>
          <button className="delivery-detail__edit-btn" onClick={onEdit} style={isReadOnly ? { display: 'none' } : undefined}>
            ✏️ Редакция
          </button>
          {isAdmin && onDelete && (
            <button className="delivery-detail__delete-btn" onClick={onDelete}>
              🗑️ Изтрий
            </button>
          )}
        </div>

        <div className="delivery-detail__header-grid">
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">Дата</span>
            <span className="delivery-detail__header-value">{formatDate(delivery.date)}</span>
          </div>
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">Качество</span>
            <span className="delivery-detail__header-value">{delivery.qualityName}</span>
          </div>
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">Фактура №</span>
            <span className="delivery-detail__header-value">{delivery.invoiceNumber || '—'}</span>
          </div>
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">EUR/kg</span>
            <span className="delivery-detail__header-value">{formatEur(delivery.unitCostPerKg)}</span>
          </div>
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">kg вход</span>
            <span className="delivery-detail__header-value">{formatKg(delivery.kgIn)}</span>
          </div>
          <div className="delivery-detail__header-item">
            <span className="delivery-detail__header-label">Обща сума</span>
            <span className="delivery-detail__header-value highlight">{formatEur(delivery.totalCostEur)} EUR</span>
          </div>
        </div>

        {delivery.note && (
          <div className="delivery-detail__note">
            <span className="delivery-detail__note-label">Бележка:</span>
            {delivery.note}
          </div>
        )}
      </div>

      {/* Секция Наличности */}
      <div className="delivery-detail__section">
        <h3 className="delivery-detail__section-title">Наличности (kg)</h3>
        <div className="delivery-detail__stock-grid">
          <div className="delivery-detail__stock-card">
            <span className="delivery-detail__stock-label">kg вход</span>
            <span className="delivery-detail__stock-value">{formatKg(delivery.kgIn)}</span>
          </div>
          <div className="delivery-detail__stock-card">
            <span className="delivery-detail__stock-label">kg продадени (Real)</span>
            <span className="delivery-detail__stock-value sold">{formatKg(delivery.kgSoldReal)}</span>
          </div>
          <div className="delivery-detail__stock-card">
            <span className="delivery-detail__stock-label">kg налични (Real)</span>
            <span className={`delivery-detail__stock-value ${delivery.kgRemainingReal > 0 ? 'available' : 'depleted'}`}>
              {formatKg(delivery.kgRemainingReal)}
            </span>
          </div>
          <div className="delivery-detail__stock-card muted">
            <span className="delivery-detail__stock-label">kg продадени (Счет.)</span>
            <span className="delivery-detail__stock-value">{formatKg(delivery.kgSoldAccounting)}</span>
          </div>
          <div className="delivery-detail__stock-card muted">
            <span className="delivery-detail__stock-label">kg налични (Счет.)</span>
            <span className="delivery-detail__stock-value">{formatKg(delivery.kgRemainingAccounting)}</span>
          </div>
        </div>
      </div>

      {/* Секция Продажби */}
      <div className="delivery-detail__section">
        <h3 className="delivery-detail__section-title">
          Продажби от тази доставка
          <span className="delivery-detail__section-count">{sales.length} продажби</span>
        </h3>

        {sales.length === 0 ? (
          <div className="delivery-detail__empty-sales">
            <span className="delivery-detail__empty-icon">📊</span>
            <p>Няма регистрирани продажби от тази доставка.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="delivery-detail__sales-summary">
              <div className="delivery-detail__summary-item">
                <span className="delivery-detail__summary-label">Общо kg</span>
                <span className="delivery-detail__summary-value">{formatKg(totalKgSold)}</span>
              </div>
              <div className="delivery-detail__summary-item">
                <span className="delivery-detail__summary-label">Оборот</span>
                <span className="delivery-detail__summary-value">{formatEur(totalRevenue)} EUR</span>
              </div>
              <div className="delivery-detail__summary-item">
                <span className="delivery-detail__summary-label">Себестойност</span>
                <span className="delivery-detail__summary-value">{formatEur(totalCost)} EUR</span>
              </div>
              <div className="delivery-detail__summary-item">
                <span className="delivery-detail__summary-label">Печалба</span>
                <span className="delivery-detail__summary-value profit">{formatEur(totalProfit)} EUR</span>
              </div>
            </div>

            {/* Sales Table */}
            <div className="delivery-detail__sales-table-wrapper">
              <table className="delivery-detail__sales-table">
                <thead>
                  <tr>
                    <th>Дата/час</th>
                    <th>№ продажба</th>
                    <th>Артикул</th>
                    <th className="text-right">Бройки</th>
                    <th className="text-right">kg</th>
                    <th className="text-right">Оборот</th>
                    <th className="text-right">Себест.</th>
                    <th className="text-right">Печалба</th>
                    <th className="text-center">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="text-muted">{formatDateTime(sale.dateTime)}</td>
                      <td>
                        <span className="delivery-detail__sale-number">{sale.saleNumber}</span>
                      </td>
                      <td>{sale.articleName}</td>
                      <td className="text-right">{sale.quantity}</td>
                      <td className="text-right">{formatKg(sale.kgSold)}</td>
                      <td className="text-right">{formatEur(sale.revenueEur)}</td>
                      <td className="text-right">{formatEur(sale.costEur)}</td>
                      <td className="text-right font-semibold text-green">{formatEur(sale.profitEur)}</td>
                      <td className="text-center">
                        <button
                          className="delivery-detail__view-sale-btn"
                          title="Виж продажбата"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
