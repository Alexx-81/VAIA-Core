import type { SaleWithComputed } from '../types';
import { formatDateTime, formatEur, formatKg, formatPercent, getPaymentMethodLabel, getProfitClass, getMarginClass } from '../utils/salesUtils';
import { useAuth } from '../../../shared/context/AuthContext';
import { DataCards } from '../../../shared/components/DataCards';
import './SalesTable.css';

interface SalesTableProps {
  sales: SaleWithComputed[];
  onViewDetail: (sale: SaleWithComputed) => void;
  onNewSale: () => void;
  onDelete?: (sale: SaleWithComputed) => void;
  stats: {
    totalRevenueEur: number;
    totalProfitRealEur: number;
  };
}

export const SalesTable = ({
  sales,
  onViewDetail,
  onNewSale,
  onDelete,
  stats,
}: SalesTableProps) => {
  const { isReadOnly, isAdmin } = useAuth();

  if (sales.length === 0) {
    return (
      <div className="sales-table-container">
        <div className="sales-table__header">
          <h2 className="sales-table__title">Продажби</h2>
        </div>
        <div className="sales-table__empty">
          <div className="sales-table__empty-icon">🛒</div>
          <h3>Няма намерени продажби</h3>
          <p>Няма продажби, които да отговарят на филтрите, или все още няма въведени продажби.</p>
          {!isReadOnly && (
            <button className="sales-table__empty-btn" onClick={onNewSale}>
              <span>+</span>
              Нова продажба
            </button>
          )}
        </div>
      </div>
    );
  }

  const getPaymentIcon = (method: string): string => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'no-cash': return '🔓';
      default: return '📄';
    }
  };

  return (
    <div className="sales-table-container">
      <div className="sales-table__header">
        <h2 className="sales-table__title">Продажби</h2>
      </div>
      
      {/* Desktop Table View */}
      <div className="sales-table__wrapper desktop-only">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Дата/час</th>
              <th>№ продажба</th>
              <th>Клиент</th>
              <th>Плащане</th>
              <th className="text-right">Редове</th>
              <th className="text-right">Бройки</th>
              <th className="text-right">kg</th>
              <th className="text-right">Оборот (EUR)</th>
              <th className="text-right">Себест. (EUR)</th>
              <th className="text-right">Печалба (EUR)</th>
              <th className="text-center">Марж %</th>
              <th className="text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="text-muted">{formatDateTime(sale.dateTime)}</td>
                <td>
                  <button
                    className="sales-table__number-btn"
                    onClick={() => onViewDetail(sale)}
                    title="Виж детайл"
                  >
                    {sale.saleNumber}
                  </button>
                </td>
                <td className="text-muted">
                  {sale.customerName ? (
                    <span title={sale.customerCompanyName || undefined}>
                      {sale.customerName}
                      {sale.customerCompanyName && (
                        <span className="text-xs"> ({sale.customerCompanyName})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontStyle: 'italic' }}>-</span>
                  )}
                </td>
                <td>
                  <span className={`sales-table__payment-badge ${sale.paymentMethod}`}>
                    {getPaymentIcon(sale.paymentMethod)}
                    {getPaymentMethodLabel(sale.paymentMethod)}
                  </span>
                </td>
                <td className="text-right">{sale.linesCount}</td>
                <td className="text-right">{sale.totalPieces}</td>
                <td className="text-right">{formatKg(sale.totalKg)}</td>
                <td className="text-right font-semibold">
                  {sale.totalPaidEur !== undefined && sale.totalPaidEur !== sale.totalRevenueEur ? (
                    <div>
                      <div style={{ textDecoration: 'line-through', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                        {formatEur(sale.totalRevenueEur)}
                      </div>
                      <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                        {formatEur(sale.totalPaidEur)}
                        {sale.loyaltyMode === 'tier' && sale.tierDiscountPercent && (
                          <span style={{ fontSize: '0.75em', marginLeft: '4px' }}>(-{sale.tierDiscountPercent.toFixed(0)}%)</span>
                        )}
                        {sale.loyaltyMode === 'voucher' && sale.voucherAmountAppliedEur && (
                          <span style={{ fontSize: '0.75em', marginLeft: '4px' }}>(-€{sale.voucherAmountAppliedEur.toFixed(2)})</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    formatEur(sale.totalRevenueEur)
                  )}
                </td>
                <td className="text-right text-muted">{formatEur(sale.totalCogsRealEur)}</td>
                <td className="text-right">
                  <span className={`sales-table__profit ${getProfitClass(sale.totalProfitRealEur)}`}>
                    {formatEur(sale.totalProfitRealEur)}
                  </span>
                </td>
                <td className="text-center">
                  <span className={`sales-table__margin ${getMarginClass(sale.totalMarginRealPercent)}`}>
                    {formatPercent(sale.totalMarginRealPercent)}
                  </span>
                </td>
                <td className="text-center sales-table__actions">
                  <button
                    className="sales-table__action-btn view"
                    onClick={() => onViewDetail(sale)}
                    title="Отвори детайл"
                  >
                    👁️
                  </button>
                  {isAdmin && onDelete && (
                    <button
                      className="sales-table__action-btn delete"
                      onClick={() => onDelete(sale)}
                      title="Изтрий"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <DataCards
        data={sales}
        keyExtractor={(s) => s.id}
        onItemClick={(s) => onViewDetail(s)}
        fields={[
          {
            key: 'customer',
            label: 'Клиент',
            render: (s) => s.customerName 
              ? `${s.customerName}${s.customerCompanyName ? ` (${s.customerCompanyName})` : ''}`
              : '-',
          },
          {
            key: 'quantity',
            label: 'Количество',
            render: (s) => `${s.totalPieces} бр. / ${formatKg(s.totalKg)} kg`,
          },
          {
            key: 'totalRevenueEur',
            label: 'Оборот',
            render: (s) => (
              <strong>
                {s.totalPaidEur !== undefined && s.totalPaidEur !== s.totalRevenueEur ? (
                  <span>
                    <span style={{ textDecoration: 'line-through', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                      {formatEur(s.totalRevenueEur)}
                    </span>
                    <br />
                    <span style={{ color: 'var(--success)' }}>
                      {formatEur(s.totalPaidEur)} €
                    </span>
                  </span>
                ) : (
                  `${formatEur(s.totalRevenueEur)} €`
                )}
              </strong>
            ),
          },
          {
            key: 'totalProfitRealEur',
            label: 'Печалба',
            render: (s) => (
              <span className={`sales-table__profit ${getProfitClass(s.totalProfitRealEur)}`}>
                {formatEur(s.totalProfitRealEur)} € ({formatPercent(s.totalMarginRealPercent)})
              </span>
            ),
          },
        ]}
        renderCardTitle={(s) => s.saleNumber}
        renderCardSubtitle={(s) => formatDateTime(s.dateTime)}
        renderCardBadge={(s) => (
          <span className={`sales-table__payment-badge ${s.paymentMethod}`}>
            {getPaymentIcon(s.paymentMethod)}
            {getPaymentMethodLabel(s.paymentMethod)}
          </span>
        )}
        renderCardActions={(s) => (
          <>
            <button className="edit" onClick={() => onViewDetail(s)}>
              👁️ Виж детайл
            </button>
            {isAdmin && onDelete && (
              <button className="danger" onClick={() => onDelete(s)}>
                🗑️ Изтрий
              </button>
            )}
          </>
        )}
      />

      <div className="sales-table__footer">
        <div className="sales-table__total">
          <span className="sales-table__total-label">Общо оборот</span>
          <span className="sales-table__total-value">{formatEur(stats.totalRevenueEur)} EUR</span>
        </div>
        <div className="sales-table__total">
          <span className="sales-table__total-label">Общо печалба</span>
          <span className="sales-table__total-value profit">{formatEur(stats.totalProfitRealEur)} EUR</span>
        </div>
      </div>
    </div>
  );
};
