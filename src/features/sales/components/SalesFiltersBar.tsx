import type { SalesFilters, SalesDateRange, PaymentMethod } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import './SalesFiltersBar.css';

interface SalesFiltersBarProps {
  filters: SalesFilters;
  onFilterChange: (updates: Partial<SalesFilters>) => void;
  onDateRangeChange: (dateRange: SalesDateRange) => void;
  onNewSale: () => void;
  onImport: () => void;
  totalCount: number;
  filteredCount: number;
}

export const SalesFiltersBar = ({
  filters,
  onFilterChange,
  onDateRangeChange,
  onNewSale,
  onImport,
  totalCount,
  filteredCount,
}: SalesFiltersBarProps) => {
  const { isReadOnly } = useAuth();

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePresetChange = (preset: SalesDateRange['preset']) => {
    onDateRangeChange({ preset });
  };

  const handlePaymentMethodChange = (method: PaymentMethod | 'all') => {
    onFilterChange({ paymentMethod: method });
  };

  const handleSearchChange = (search: string) => {
    onFilterChange({ search });
  };

  return (
    <div className="sales-filters">
      <div className="sales-filters__group">
        <span className="sales-filters__label">Период:</span>
        <select
          className="sales-filters__select"
          value={filters.dateRange.preset}
          onChange={(e) => handlePresetChange(e.target.value as SalesDateRange['preset'])}
        >
          <option value="all">Всички</option>
          <option value="today">Днес</option>
          <option value="this-week">Тази седмица</option>
          <option value="this-month">Този месец</option>
          <option value="last-month">Миналия месец</option>
          <option value="custom">По избор</option>
        </select>
      </div>

      {filters.dateRange.preset === 'custom' && (
        <div className="sales-filters__date-group">
          <input
            type="date"
            className="sales-filters__date-input"
            value={filters.dateRange.from ? formatDate(filters.dateRange.from) : ''}
            onChange={(e) => onDateRangeChange({
              ...filters.dateRange,
              from: e.target.value ? new Date(e.target.value) : undefined,
            })}
          />
          <span className="sales-filters__date-separator">—</span>
          <input
            type="date"
            className="sales-filters__date-input"
            value={filters.dateRange.to ? formatDate(filters.dateRange.to) : ''}
            onChange={(e) => onDateRangeChange({
              ...filters.dateRange,
              to: e.target.value ? new Date(e.target.value + 'T23:59:59') : undefined,
            })}
          />
        </div>
      )}

      <div className="sales-filters__group">
        <span className="sales-filters__label">Плащане:</span>
        <select
          className="sales-filters__select"
          value={filters.paymentMethod}
          onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod | 'all')}
        >
          <option value="all">Всички</option>
          <option value="cash">По каса</option>
          <option value="card">Карта</option>
          <option value="no-cash">Без каса</option>
          <option value="other">Друго</option>
        </select>
      </div>

      <input
        type="text"
        className="sales-filters__input"
        placeholder="Търси по № продажба или бележка..."
        value={filters.search}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      <div className="sales-filters__spacer" />

      <span className="sales-filters__count">
        Показани: <strong>{filteredCount}</strong> от {totalCount}
      </span>

      {!isReadOnly && (
        <button className="sales-filters__btn-secondary" onClick={onImport}>
          📥 Импорт
        </button>
      )}

      {!isReadOnly && (
        <button className="sales-filters__btn-primary" onClick={onNewSale}>
          <span>+</span>
          Нова продажба
        </button>
      )}
    </div>
  );
};
