import type { InventoryFilters, InventoryTab, Quality } from '../types';
import './InventoryFiltersBar.css';

interface InventoryFiltersBarProps {
  filters: InventoryFilters;
  onFilterChange: (updates: Partial<InventoryFilters>) => void;
  onExport: () => void;
  qualities: Quality[];
  totalCount: number;
  filteredCount: number;
  activeTab: InventoryTab;
}

export const InventoryFiltersBar = ({
  filters,
  onFilterChange,
  onExport,
  qualities,
  totalCount,
  filteredCount,
}: InventoryFiltersBarProps) => {
  return (
    <div className="inventory-filters">
      <input
        type="text"
        className="inventory-filters__input"
        placeholder="Търси по ID, фактура, качество..."
        value={filters.search}
        onChange={(e) => onFilterChange({ search: e.target.value })}
      />

      <div className="inventory-filters__group">
        <span className="inventory-filters__label">Качество:</span>
        <select
          className="inventory-filters__select"
          value={filters.qualityId}
          onChange={(e) => onFilterChange({ qualityId: e.target.value })}
        >
          <option value="all">Всички</option>
          {qualities.map(q => (
            <option key={q.id} value={q.id.toString()}>
              {q.name}
            </option>
          ))}
        </select>
      </div>

      <div className="inventory-filters__group">
        <span className="inventory-filters__label">Тип:</span>
        <select
          className="inventory-filters__select"
          value={filters.deliveryType}
          onChange={(e) => onFilterChange({ deliveryType: e.target.value as InventoryFilters['deliveryType'] })}
        >
          <option value="all">Всички</option>
          <option value="invoiced">Фактурни</option>
          <option value="non-invoiced">Без фактура (A)</option>
        </select>
      </div>

      <div className="inventory-filters__group">
        <span className="inventory-filters__label">Статус:</span>
        <select
          className="inventory-filters__select"
          value={filters.stockStatus}
          onChange={(e) => onFilterChange({ stockStatus: e.target.value as InventoryFilters['stockStatus'] })}
        >
          <option value="all">Всички</option>
          <option value="in-stock">Има наличност</option>
          <option value="below-minimum">Под минимум</option>
          <option value="depleted">Изчерпано</option>
          <option value="negative">Отрицателно</option>
        </select>
      </div>

      <div className="inventory-filters__group">
        <span className="inventory-filters__label">Мин. kg:</span>
        <input
          type="number"
          className="inventory-filters__input inventory-filters__input--number"
          value={filters.minKgThreshold}
          min="0"
          step="0.5"
          onChange={(e) => onFilterChange({ minKgThreshold: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="inventory-filters__spacer" />

      <span className="inventory-filters__count">
        Показани: <strong>{filteredCount}</strong> от {totalCount}
      </span>

      <button className="inventory-filters__btn inventory-filters__btn--export" onClick={onExport}>
        📥 Експорт CSV
      </button>
    </div>
  );
};
