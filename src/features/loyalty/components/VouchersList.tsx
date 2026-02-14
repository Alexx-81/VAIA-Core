import type { VoucherFilters, VoucherStatusFilter } from '../types';
import type { VoucherWithCustomer } from '../hooks/useVouchers';

interface VoucherStats {
  total: number;
  issued: number;
  redeemed: number;
  expired: number;
  void: number;
}

interface VouchersListProps {
  vouchers: VoucherWithCustomer[];
  loading: boolean;
  filters: VoucherFilters;
  stats: VoucherStats;
  onUpdateFilters: (filters: Partial<VoucherFilters>) => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  issued: 'Издаден',
  redeemed: 'Използван',
  expired: 'Изтекъл',
  void: 'Анулиран',
};

const STATUS_BADGE: Record<string, string> = {
  issued: 'loyalty-badge--voucher-issued',
  redeemed: 'loyalty-badge--voucher-redeemed',
  expired: 'loyalty-badge--voucher-expired',
  void: 'loyalty-badge--voucher-void',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bg-BG', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const statusOptions: { value: VoucherStatusFilter; label: string }[] = [
  { value: 'all', label: 'Всички' },
  { value: 'issued', label: 'Издадени' },
  { value: 'redeemed', label: 'Използвани' },
  { value: 'expired', label: 'Изтекли' },
  { value: 'void', label: 'Анулирани' },
];

export const VouchersList = ({
  vouchers, loading, filters, stats, onUpdateFilters, onRefresh,
}: VouchersListProps) => {
  return (
    <div className="loyalty-config">
      <div className="loyalty-config__header">
        <div>
          <h3 className="loyalty-config__title">Издадени ваучери</h3>
          <p className="loyalty-config__subtitle">
            Преглед на всички ваучери, издадени на клиенти по програмата за лоялност.
          </p>
        </div>
        <button type="button" className="loyalty__add-btn" onClick={onRefresh} disabled={loading}>
          ↻ Обнови
        </button>
      </div>

      {/* Stats cards */}
      <div className="voucher-stats">
        <div className="voucher-stats__card">
          <span className="voucher-stats__value">{stats.total}</span>
          <span className="voucher-stats__label">Общо</span>
        </div>
        <div className="voucher-stats__card voucher-stats__card--issued">
          <span className="voucher-stats__value">{stats.issued}</span>
          <span className="voucher-stats__label">Активни</span>
        </div>
        <div className="voucher-stats__card voucher-stats__card--redeemed">
          <span className="voucher-stats__value">{stats.redeemed}</span>
          <span className="voucher-stats__label">Използвани</span>
        </div>
        <div className="voucher-stats__card voucher-stats__card--expired">
          <span className="voucher-stats__value">{stats.expired}</span>
          <span className="voucher-stats__label">Изтекли</span>
        </div>
        <div className="voucher-stats__card voucher-stats__card--void">
          <span className="voucher-stats__value">{stats.void}</span>
          <span className="voucher-stats__label">Анулирани</span>
        </div>
      </div>

      {/* Filters */}
      <div className="voucher-filters">
        <div className="voucher-filters__group">
          <label className="voucher-filters__label">Статус</label>
          <select
            className="voucher-filters__select"
            value={filters.status}
            onChange={e => onUpdateFilters({ status: e.target.value as VoucherStatusFilter })}
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="voucher-filters__group">
          <label className="voucher-filters__label">Търсене по клиент</label>
          <input
            type="text"
            className="voucher-filters__input"
            placeholder="Име на клиент..."
            value={filters.search}
            onChange={e => onUpdateFilters({ search: e.target.value })}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loyalty__loading">Зареждане на ваучери...</div>
      ) : (
        <table className="loyalty-table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Сума (€)</th>
              <th>Статус</th>
              <th>Издаден на</th>
              <th>Изтича на</th>
              <th>Използван на</th>
              <th>Цикъл</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id}>
                <td><strong>{v.customer_name}</strong></td>
                <td><span className="loyalty-eur">€{v.amount_eur.toFixed(2)}</span></td>
                <td>
                  <span className={`loyalty-badge ${STATUS_BADGE[v.status] || ''}`}>
                    {STATUS_LABELS[v.status] || v.status}
                  </span>
                </td>
                <td>{formatDateTime(v.issued_at)}</td>
                <td>{formatDate(v.expires_at)}</td>
                <td>{v.redeemed_at ? formatDateTime(v.redeemed_at) : '—'}</td>
                <td><span className="voucher-cycle">{v.cycle_key}</span></td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={7} className="loyalty__empty">
                  {filters.status !== 'all' || filters.search
                    ? 'Няма ваучери, отговарящи на филтрите.'
                    : 'Все още няма издадени ваучери.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
