import type { StatisticsFilters, CostMode } from '../types';
import './StatisticsFiltersBar.css';

interface Props {
  filters: StatisticsFilters;
  onUpdateFilters: (updates: Partial<StatisticsFilters>) => void;
  onToggleCostMode: (mode: CostMode) => void;
}

export const StatisticsFiltersBar = ({ filters, onUpdateFilters, onToggleCostMode }: Props) => {
  return (
    <div className="statistics-filters">
      <div className="statistics-filters__group">
        <label className="statistics-filters__label">Режим</label>
        <div className="statistics-filters__checkboxes">
          <label className="statistics-filters__checkbox">
            <input
              type="radio"
              name="cost-mode"
              checked={filters.costModes.includes('real')}
              onChange={() => onToggleCostMode('real')}
            />
            <span>Реален</span>
          </label>
          <label className="statistics-filters__checkbox">
            <input
              type="radio"
              name="cost-mode"
              checked={filters.costModes.includes('accounting')}
              onChange={() => onToggleCostMode('accounting')}
            />
            <span>Счетоводен</span>
          </label>
        </div>
      </div>

      <div className="statistics-filters__group">
        <label className="statistics-filters__label" htmlFor="payment-filter">
          По плащане
        </label>
        <select
          id="payment-filter"
          className="statistics-filters__select"
          value={filters.paymentMethod}
          onChange={(e) => onUpdateFilters({ paymentMethod: e.target.value as any })}
        >
          <option value="all">Всички</option>
          <option value="cash">По каса</option>
          <option value="card">Карта</option>
          <option value="no-cash">Без каса</option>
          <option value="other">Друго</option>
        </select>
      </div>

      <div className="statistics-filters__group">
        <label className="statistics-filters__label" htmlFor="date-from">
          От дата
        </label>
        <input
          id="date-from"
          type="date"
          className="statistics-filters__input"
          value={filters.dateFrom}
          onChange={(e) => onUpdateFilters({ dateFrom: e.target.value })}
        />
      </div>

      <div className="statistics-filters__group">
        <label className="statistics-filters__label" htmlFor="date-to">
          До дата
        </label>
        <input
          id="date-to"
          type="date"
          className="statistics-filters__input"
          value={filters.dateTo}
          onChange={(e) => onUpdateFilters({ dateTo: e.target.value })}
        />
      </div>
    </div>
  );
};
