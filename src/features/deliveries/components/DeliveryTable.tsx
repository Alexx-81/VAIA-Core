import type { DeliveryWithComputed } from '../types';
import { formatDate, formatKg, formatEur } from '../utils/deliveryUtils';
import './DeliveryTable.css';

interface DeliveryTableProps {
  deliveries: DeliveryWithComputed[];
  onViewDetail: (delivery: DeliveryWithComputed) => void;
  onEdit: (delivery: DeliveryWithComputed) => void;
  onNewDelivery: () => void;
}

export const DeliveryTable = ({
  deliveries,
  onViewDetail,
  onEdit,
  onNewDelivery,
}: DeliveryTableProps) => {
  if (deliveries.length === 0) {
    return (
      <div className="delivery-table-container">
        <div className="delivery-table__header">
          <h2 className="delivery-table__title">Доставки</h2>
        </div>
        <div className="delivery-table__empty">
          <div className="delivery-table__empty-icon">📦</div>
          <h3>Няма намерени доставки</h3>
          <p>Няма доставки, които да отговарят на филтрите, или все още няма въведени доставки.</p>
          <button className="delivery-table__empty-btn" onClick={onNewDelivery}>
            <span>+</span>
            Нова доставка
          </button>
        </div>
      </div>
    );
  }

  const getStockStatusClass = (delivery: DeliveryWithComputed): string => {
    if (delivery.kgRemainingReal <= 0) return 'depleted';
    if (delivery.kgRemainingReal <= 10) return 'low';
    return 'available';
  };



  return (
    <div className="delivery-table-container">
      <div className="delivery-table__header">
        <h2 className="delivery-table__title">Доставки</h2>
      </div>
      
      <div className="delivery-table__wrapper">
        <table className="delivery-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Качество</th>
              <th>Фактура №</th>
              <th className="text-center">Фактурна?</th>
              <th className="text-right">kg вход</th>
              <th className="text-right">kg продадени</th>
              <th className="text-right">kg налични</th>
              <th className="text-right">EUR/kg</th>
              <th className="text-right">Обща сума (EUR)</th>
              <th className="text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className={delivery.kgRemainingReal <= 0 ? 'depleted-row' : ''}
              >
                <td>
                  <button
                    className="delivery-table__id-btn"
                    onClick={() => onViewDetail(delivery)}
                    title="Виж детайл"
                  >
                    {delivery.displayId}
                  </button>
                </td>
                <td className="text-muted">{formatDate(delivery.date)}</td>
                <td>
                  <span className="delivery-table__quality">{delivery.qualityName}</span>
                </td>
                <td className="text-muted">
                  {delivery.invoiceNumber || '—'}
                </td>
                <td className="text-center">
                  <span className={`delivery-table__invoice-badge ${delivery.isInvoiced ? 'yes' : 'no'}`}>
                    {delivery.isInvoiced ? 'Да' : 'Не'}
                  </span>
                </td>
                <td className="text-right">{formatKg(delivery.kgIn)}</td>
                <td className="text-right">{formatKg(delivery.kgSoldReal)}</td>
                <td className="text-right">
                  <span className={`delivery-table__stock ${getStockStatusClass(delivery)}`}>
                    {formatKg(delivery.kgRemainingReal)}
                  </span>
                </td>
                <td className="text-right">{formatEur(delivery.unitCostPerKg)}</td>
                <td className="text-right font-semibold">{formatEur(delivery.totalCostEur)}</td>
                <td className="text-center delivery-table__actions">
                  <button
                    className="delivery-table__action-btn view"
                    onClick={() => onViewDetail(delivery)}
                    title="Отвори детайл"
                  >
                    👁️
                  </button>
                  <button
                    className="delivery-table__action-btn edit"
                    onClick={() => onEdit(delivery)}
                    title="Редакция"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
