import type { InventoryComparisonRow } from '../types';
import { formatKg, formatEur } from '../utils/inventoryUtils';
import './InventoryComparison.css';

interface InventoryComparisonProps {
  data: InventoryComparisonRow[];
  onViewDelivery: (deliveryId: string) => void;
}

export const InventoryComparison = ({
  data,
  onViewDelivery,
}: InventoryComparisonProps) => {
  if (data.length === 0) {
    return (
      <div className="comparison-table-container">
        <div className="comparison-table__header">
          <h2 className="comparison-table__title">
            Сравнение
            <span className="comparison-table__title-badge">Real vs Acc</span>
          </h2>
        </div>
        <div className="comparison-table__empty">
          <div className="comparison-table__empty-icon">📊</div>
          <h3>Няма данни за сравнение</h3>
          <p>Няма доставки, които да отговарят на избраните филтри.</p>
        </div>
      </div>
    );
  }

  const getDiffClass = (diff: number): string => {
    if (Math.abs(diff) < 0.01) return 'zero';
    return diff > 0 ? 'positive' : 'negative';
  };

  const formatDiff = (diff: number): string => {
    if (Math.abs(diff) < 0.01) return '0.00';
    const sign = diff > 0 ? '+' : '';
    return sign + formatKg(diff);
  };

  // Summary counts
  const okCount = data.filter(r => r.status === 'ok').length;
  const warningCount = data.filter(r => r.status === 'warning').length;
  const criticalCount = data.filter(r => r.status === 'critical').length;

  return (
    <div className="comparison-table-container">
      <div className="comparison-table__header">
        <h2 className="comparison-table__title">
          Сравнение
          <span className="comparison-table__title-badge">Real vs Acc</span>
        </h2>
      </div>
      
      <div className="comparison-table__wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Качество</th>
              <th className="text-right real">kg нал. (Real)</th>
              <th className="text-right acc">kg нал. (Acc)</th>
              <th className="text-right">Разлика kg</th>
              <th className="text-right real">Оборот Real</th>
              <th className="text-right acc">Оборот Acc</th>
              <th className="text-right real">Пари изк. Real</th>
              <th className="text-right acc">Пари изк. Acc</th>
              <th className="text-center">Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.deliveryId} className={row.status !== 'ok' ? row.status : ''}>
                <td>
                  <button
                    className="inventory-table__id-btn"
                    onClick={() => onViewDelivery(row.deliveryId)}
                    title="Отвори доставка"
                  >
                    {row.displayId}
                  </button>
                </td>
                <td>{row.qualityName}</td>
                <td className="text-right comparison-table__real font-semibold">
                  {formatKg(row.kgRemainingReal)}
                </td>
                <td className="text-right comparison-table__acc font-semibold">
                  {formatKg(row.kgRemainingAcc)}
                </td>
                <td className="text-right">
                  <span className={`comparison-table__diff ${getDiffClass(row.kgDifference)}`}>
                    {formatDiff(row.kgDifference)}
                  </span>
                </td>
                <td className="text-right comparison-table__real">
                  {formatEur(row.revenueRealEur)}
                </td>
                <td className="text-right comparison-table__acc">
                  {formatEur(row.revenueAccEur)}
                </td>
                <td className="text-right comparison-table__real font-semibold">
                  {formatEur(row.earnedRealEur)}
                </td>
                <td className="text-right comparison-table__acc font-semibold">
                  {formatEur(row.earnedAccEur)}
                </td>
                <td className="text-center">
                  <span className={`comparison-table__status ${row.status}`}>
                    {row.status === 'ok' && '✓ OK'}
                    {row.status === 'warning' && '⚠️ Внимание'}
                    {row.status === 'critical' && '❌ Критично'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-table__summary">
        <div className="comparison-table__summary-item">
          <span className="comparison-table__summary-icon">✅</span>
          <span>OK:</span>
          <span className="comparison-table__summary-count ok">{okCount}</span>
        </div>
        <div className="comparison-table__summary-item">
          <span className="comparison-table__summary-icon">⚠️</span>
          <span>Внимание:</span>
          <span className="comparison-table__summary-count warning">{warningCount}</span>
        </div>
        <div className="comparison-table__summary-item">
          <span className="comparison-table__summary-icon">❌</span>
          <span>Критично:</span>
          <span className="comparison-table__summary-count critical">{criticalCount}</span>
        </div>
      </div>
    </div>
  );
};
