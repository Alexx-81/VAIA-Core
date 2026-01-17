import type { InventoryRealRow, InventoryAccRow, InventoryStats, InventoryTab } from '../types';
import { formatKg, formatEur, formatPercent, formatDate, getStockStatusClass, getEarnedClass } from '../utils/inventoryUtils';
import './InventoryTable.css';

interface InventoryTableProps {
  data: InventoryRealRow[] | InventoryAccRow[];
  type: 'real' | 'accounting';
  stats: InventoryStats;
  minKgThreshold: number;
  onViewDelivery: (deliveryId: string) => void;
  onViewSales: (deliveryId: string, type: InventoryTab) => void;
}

export const InventoryTable = ({
  data,
  type,
  stats,
  minKgThreshold,
  onViewDelivery,
  onViewSales,
}: InventoryTableProps) => {
  const isReal = type === 'real';
  const typeLabel = isReal ? 'Real' : 'Acc';

  if (data.length === 0) {
    return (
      <div className="inventory-table-container">
        <div className="inventory-table__header">
          <h2 className="inventory-table__title">
            Наличности
            <span className={`inventory-table__title-badge ${type}`}>{typeLabel}</span>
          </h2>
        </div>
        <div className="inventory-table__empty">
          <div className="inventory-table__empty-icon">📦</div>
          <h3>Няма намерени наличности</h3>
          <p>Няма доставки, които да отговарят на избраните филтри.</p>
        </div>
      </div>
    );
  }

  const getPercentClass = (percent: number): string => {
    if (percent === 0) return 'zero';
    if (percent <= 20) return 'low';
    if (percent <= 50) return 'medium';
    return 'high';
  };

  const getRowClass = (kgRemaining: number): string => {
    if (kgRemaining < 0) return 'negative';
    if (kgRemaining === 0) return 'depleted';
    if (kgRemaining <= minKgThreshold) return 'below-minimum';
    return '';
  };

  return (
    <div className="inventory-table-container">
      <div className="inventory-table__header">
        <h2 className="inventory-table__title">
          Наличности
          <span className={`inventory-table__title-badge ${type}`}>{typeLabel}</span>
        </h2>
      </div>
      
      <div className="inventory-table__wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Качество</th>
              <th>Фактура №</th>
              <th className="text-center">Факт.?</th>
              <th className="text-right">kg вход</th>
              <th className="text-right">kg прод. ({typeLabel})</th>
              <th className="text-right">kg нал. ({typeLabel})</th>
              <th className="text-center">% ост.</th>
              <th className="text-right">EUR/kg</th>
              <th className="text-right">Обща сума</th>
              <th className="text-right">Стойност ост.</th>
              <th className="text-right">Оборот ({typeLabel})</th>
              <th className="text-right">Пари изк. ({typeLabel})</th>
              <th className="text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {(data as (InventoryRealRow | InventoryAccRow)[]).map((row) => {
              const kgSold = isReal ? (row as InventoryRealRow).kgSoldReal : (row as InventoryAccRow).kgSoldAcc;
              const kgRemaining = isReal ? (row as InventoryRealRow).kgRemainingReal : (row as InventoryAccRow).kgRemainingAcc;
              const valueRemaining = isReal ? (row as InventoryRealRow).valueRemainingRealEur : (row as InventoryAccRow).valueRemainingAccEur;
              const revenue = isReal ? (row as InventoryRealRow).revenueRealEur : (row as InventoryAccRow).revenueAccEur;
              const earned = isReal ? (row as InventoryRealRow).earnedRealEur : (row as InventoryAccRow).earnedAccEur;

              return (
                <tr key={row.deliveryId} className={getRowClass(kgRemaining)}>
                  <td>
                    <button
                      className="inventory-table__id-btn"
                      onClick={() => onViewDelivery(row.deliveryId)}
                      title="Отвори доставка"
                    >
                      {row.displayId}
                    </button>
                  </td>
                  <td className="text-muted">{formatDate(row.date)}</td>
                  <td>{row.qualityName}</td>
                  <td className="text-muted">{row.invoiceNumber || '—'}</td>
                  <td className="text-center">
                    <span className={`inventory-table__invoice-badge ${row.isInvoiced ? 'yes' : 'no'}`}>
                      {row.isInvoiced ? 'Да' : 'Не'}
                    </span>
                  </td>
                  <td className="text-right">{formatKg(row.kgIn)}</td>
                  <td className="text-right text-muted">{formatKg(kgSold)}</td>
                  <td className="text-right">
                    <span className={`inventory-table__stock ${getStockStatusClass(kgRemaining, minKgThreshold)}`}>
                      {formatKg(kgRemaining)}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inventory-table__percent ${getPercentClass(row.percentRemaining)}`}>
                      {formatPercent(row.percentRemaining)}
                    </span>
                  </td>
                  <td className="text-right">{formatEur(row.unitCostPerKg)}</td>
                  <td className="text-right font-semibold">{formatEur(row.totalCostEur)}</td>
                  <td className="text-right text-muted">{formatEur(valueRemaining)}</td>
                  <td className="text-right">{formatEur(revenue)}</td>
                  <td className="text-right">
                    <span className={`inventory-table__earned ${getEarnedClass(earned)}`}>
                      {formatEur(earned)}
                    </span>
                  </td>
                  <td className="text-center inventory-table__actions">
                    <button
                      className="inventory-table__action-btn view"
                      onClick={() => onViewDelivery(row.deliveryId)}
                      title="Отвори доставка"
                    >
                      📦
                    </button>
                    <button
                      className="inventory-table__action-btn sales"
                      onClick={() => onViewSales(row.deliveryId, type)}
                      title="Виж продажбите"
                    >
                      🛒
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="inventory-table__footer">
        <div className="inventory-table__total">
          <span className="inventory-table__total-label">Общо kg налични</span>
          <span className="inventory-table__total-value">{formatKg(stats.totalKgRemaining)}</span>
        </div>
        <div className="inventory-table__total">
          <span className="inventory-table__total-label">Стойност на остатъка</span>
          <span className="inventory-table__total-value success">{formatEur(stats.totalValueRemaining)} EUR</span>
        </div>
      </div>
    </div>
  );
};
