import type { DeliveryFilters, DateRange, Quality, DateRangePreset } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { toDateInputValue } from '../utils/deliveryUtils';
import './DeliveryFiltersBar.css';

interface DeliveryFiltersBarProps {
  filters: DeliveryFilters;
  onFilterChange: (partial: Partial<DeliveryFilters>) => void;
  onDateRangeChange: (range: DateRange) => void;
  onNewDelivery: () => void;
  onImportDeliveries?: () => void;
  qualities: Quality[];
  hasInactiveQualities: boolean;
  totalCount: number;
  filteredCount: number;
}

const dateRangePresets: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'Всички' },
  { value: 'this-month', label: 'Този месец' },
  { value: 'last-month', label: 'Миналия месец' },
  { value: 'this-year', label: 'Тази година' },
  { value: 'custom', label: 'Персонализиран' },
];

const deliveryTypeOptions = [
  { value: 'all', label: 'Всички' },
  { value: 'invoiced', label: 'Фактурни' },
  { value: 'non-invoiced', label: 'Без фактура (A)' },
];

const stockStatusOptions = [
  { value: 'all', label: 'Всички' },
  { value: 'in-stock', label: 'Има наличност' },
  { value: 'depleted', label: 'Изчерпана' },
  { value: 'below-minimum', label: 'Под минимум' },
];

export const DeliveryFiltersBar = ({
  filters,
  onFilterChange,
  onDateRangeChange,
  onNewDelivery,
  onImportDeliveries,
  qualities,
  hasInactiveQualities,
  totalCount,
  filteredCount,
}: DeliveryFiltersBarProps) => {
  const { isReadOnly } = useAuth();

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      onDateRangeChange({
        preset: 'custom',
        from: startOfMonth,
        to: now,
      });
    } else {
      onDateRangeChange({ preset });
    }
  };

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : undefined;
    onDateRangeChange({
      ...filters.dateRange,
      preset: 'custom',
      [type]: date,
    });
  };

  return (
    <div className="delivery-filters">
      <div className="delivery-filters__row">
        {/* Период */}
        <div className="delivery-filters__group">
          <label className="delivery-filters__label">Период</label>
          <select
            value={filters.dateRange.preset}
            onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
            className="delivery-filters__select"
          >
            {dateRangePresets.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom date range */}
        {filters.dateRange.preset === 'custom' && (
          <>
            <div className="delivery-filters__group">
              <label className="delivery-filters__label">От</label>
              <input
                type="date"
                value={filters.dateRange.from ? toDateInputValue(filters.dateRange.from) : ''}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                className="delivery-filters__date-input"
              />
            </div>
            <div className="delivery-filters__group">
              <label className="delivery-filters__label">До</label>
              <input
                type="date"
                value={filters.dateRange.to ? toDateInputValue(filters.dateRange.to) : ''}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                className="delivery-filters__date-input"
              />
            </div>
          </>
        )}

        {/* Търсене */}
        <div className="delivery-filters__group delivery-filters__group--search">
          <label className="delivery-filters__label">Търсене</label>
          <div className="delivery-filters__search-wrapper">
            <svg
              className="delivery-filters__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="ID / фактура…"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="delivery-filters__input"
            />
            {filters.search && (
              <button
                className="delivery-filters__clear"
                onClick={() => onFilterChange({ search: '' })}
                title="Изчисти търсенето"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Качество */}
        <div className="delivery-filters__group">
          <label className="delivery-filters__label">Качество</label>
          <select
            value={filters.qualityId}
            onChange={(e) => onFilterChange({ qualityId: e.target.value })}
            className="delivery-filters__select"
          >
            <option value="all">Всички</option>
            {qualities.map((q) => (
              <option key={q.id} value={q.id.toString()}>
                {q.name}
                {!q.isActive ? ' (неактивно)' : ''}
              </option>
            ))}
          </select>
          {hasInactiveQualities && (
            <label className="delivery-filters__checkbox-label">
              <input
                type="checkbox"
                checked={filters.showInactiveQualities}
                onChange={(e) => onFilterChange({ showInactiveQualities: e.target.checked })}
              />
              <span>Покажи неактивни</span>
            </label>
          )}
        </div>
      </div>

      <div className="delivery-filters__row">
        {/* Тип доставка */}
        <div className="delivery-filters__group">
          <label className="delivery-filters__label">Тип доставка</label>
          <select
            value={filters.deliveryType}
            onChange={(e) => onFilterChange({ deliveryType: e.target.value as any })}
            className="delivery-filters__select"
          >
            {deliveryTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Статус наличност */}
        <div className="delivery-filters__group">
          <label className="delivery-filters__label">Статус наличност</label>
          <select
            value={filters.stockStatus}
            onChange={(e) => onFilterChange({ stockStatus: e.target.value as any })}
            className="delivery-filters__select"
          >
            {stockStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Spacer */}
        <div className="delivery-filters__spacer"></div>

        {/* Статистика и бутони */}
        <div className="delivery-filters__actions">
          <span className="delivery-filters__count">
            {filteredCount === totalCount
              ? `${totalCount} доставки`
              : `${filteredCount} от ${totalCount}`}
          </span>
          {!isReadOnly && onImportDeliveries && (
            <button className="delivery-filters__btn-import" onClick={onImportDeliveries}>
              <span className="delivery-filters__btn-icon">📥</span>
              Импорт
            </button>
          )}
          {!isReadOnly && (
            <button className="delivery-filters__btn-new" onClick={onNewDelivery}>
              <span className="delivery-filters__btn-icon">+</span>
              Нова доставка
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
