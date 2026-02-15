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
    <div className="vouchers-list">
      {/* Header */}
      <div className="vouchers-list__header">
        <div className="vouchers-list__title-section">
          <h3 className="vouchers-list__title">Издадени ваучери</h3>
          <p className="vouchers-list__subtitle">
            Преглед на всички ваучери, издадени на клиенти по програмата за лоялност
          </p>
        </div>
        <button type="button" className="vouchers-list__refresh-btn" onClick={onRefresh} disabled={loading}>
          <span className="vouchers-list__refresh-icon">↻</span>
          Обнови
        </button>
      </div>

      {/* Filters */}
      <div className="vouchers-list__filters">
        <div className="vouchers-list__filter-group">
          <label className="vouchers-list__filter-label">Статус</label>
          <select
            className="vouchers-list__filter-select"
            value={filters.status}
            onChange={e => onUpdateFilters({ status: e.target.value as VoucherStatusFilter })}
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="vouchers-list__filter-group vouchers-list__filter-group--search">
          <label className="vouchers-list__filter-label">Търсене по клиент</label>
          <input
            type="text"
            className="vouchers-list__filter-input"
            placeholder="Въведете име на клиент..."
            value={filters.search}
            onChange={e => onUpdateFilters({ search: e.target.value })}
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="vouchers-list__stats">
        <div className="vouchers-list__stat-card vouchers-list__stat-card--total">
          <div className="vouchers-list__stat-icon">📊</div>
          <div className="vouchers-list__stat-content">
            <div className="vouchers-list__stat-value">{stats.total}</div>
            <div className="vouchers-list__stat-label">Общо</div>
          </div>
        </div>
        <div className="vouchers-list__stat-card vouchers-list__stat-card--active">
          <div className="vouchers-list__stat-icon">✅</div>
          <div className="vouchers-list__stat-content">
            <div className="vouchers-list__stat-value">{stats.issued}</div>
            <div className="vouchers-list__stat-label">Активни</div>
          </div>
        </div>
        <div className="vouchers-list__stat-card vouchers-list__stat-card--redeemed">
          <div className="vouchers-list__stat-icon">🎁</div>
          <div className="vouchers-list__stat-content">
            <div className="vouchers-list__stat-value">{stats.redeemed}</div>
            <div className="vouchers-list__stat-label">Използвани</div>
          </div>
        </div>
        <div className="vouchers-list__stat-card vouchers-list__stat-card--expired">
          <div className="vouchers-list__stat-icon">⏰</div>
          <div className="vouchers-list__stat-content">
            <div className="vouchers-list__stat-value">{stats.expired}</div>
            <div className="vouchers-list__stat-label">Изтекли</div>
          </div>
        </div>
        <div className="vouchers-list__stat-card vouchers-list__stat-card--void">
          <div className="vouchers-list__stat-icon">🚫</div>
          <div className="vouchers-list__stat-content">
            <div className="vouchers-list__stat-value">{stats.void}</div>
            <div className="vouchers-list__stat-label">Анулирани</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="vouchers-list__table-wrapper">
        {loading ? (
          <div className="vouchers-list__loading">
            <div className="vouchers-list__spinner"></div>
            <p>Зареждане на ваучери...</p>
          </div>
        ) : (
          <table className="vouchers-list__table">
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
                  <td><span className="vouchers-list__amount">€{v.amount_eur.toFixed(2)}</span></td>
                  <td>
                    <span className={`loyalty-badge ${STATUS_BADGE[v.status] || ''}`}>
                      {STATUS_LABELS[v.status] || v.status}
                    </span>
                  </td>
                  <td>{formatDateTime(v.issued_at)}</td>
                  <td>{formatDate(v.expires_at)}</td>
                  <td>{v.redeemed_at ? formatDateTime(v.redeemed_at) : '—'}</td>
                  <td><span className="vouchers-list__cycle">{v.cycle_key}</span></td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={7} className="vouchers-list__empty">
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
    </div>
  );
};
