import React from 'react';
import type { 
  ReportFilters, 
  ReportMode, 
  ReportType, 
  ReportPeriod,
  QualityOption,
  DeliveryOption,
} from '../types';
import './ReportsFiltersBar.css';

interface ReportsFiltersBarProps {
  filters: ReportFilters;
  qualityOptions: QualityOption[];
  deliveryOptions: DeliveryOption[];
  supplierOptions: string[];
  onFilterChange: (updates: Partial<ReportFilters>) => void;
  onPeriodChange: (period: ReportPeriod) => void;
  onModeChange: (mode: ReportMode) => void;
  onReportTypeChange: (type: ReportType) => void;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportsFiltersBar: React.FC<ReportsFiltersBarProps> = ({
  filters,
  qualityOptions,
  deliveryOptions,
  supplierOptions,
  onFilterChange,
  onPeriodChange,
  onModeChange,
  onReportTypeChange,
}) => {

  const handlePeriodPresetChange = (preset: ReportPeriod['preset']) => {
    if (preset === 'custom') {
      const now = new Date();
      onPeriodChange({
        preset: 'custom',
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      });
    } else {
      onPeriodChange({ preset });
    }
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPeriodChange({
      ...filters.period,
      preset: 'custom',
      from: new Date(e.target.value),
    });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPeriodChange({
      ...filters.period,
      preset: 'custom',
      to: new Date(e.target.value),
    });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      onFilterChange({ qualityIds: [] });
    } else {
      onFilterChange({ qualityIds: [value] });
    }
  };

  return (
    <div className="reports-filters">
        {/* Период */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Период</label>
          <select
            className="reports-filters__select"
            value={filters.period.preset}
            onChange={(e) => handlePeriodPresetChange(e.target.value as ReportPeriod['preset'])}
          >
            <option value="this-month">Този месец</option>
            <option value="last-month">Миналия месец</option>
            <option value="custom">Персонализиран</option>
          </select>
        </div>

        {/* Custom дати */}
        {filters.period.preset === 'custom' && (
          <>
            <div className="reports-filters__group">
              <label className="reports-filters__label">От</label>
              <input
                type="date"
                className="reports-filters__input"
                value={filters.period.from ? formatDate(filters.period.from) : ''}
                onChange={handleDateFromChange}
              />
            </div>
            <div className="reports-filters__group">
              <label className="reports-filters__label">До</label>
              <input
                type="date"
                className="reports-filters__input"
                value={filters.period.to ? formatDate(filters.period.to) : ''}
                onChange={handleDateToChange}
              />
            </div>
          </>
        )}

        {/* Режим (Real / Accounting) */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Режим</label>
          <div className="reports-filters__segmented">
            <button
              className={`reports-filters__segment ${filters.mode === 'real' ? 'active' : ''}`}
              onClick={() => onModeChange('real')}
            >
              📦 Реален
            </button>
            <button
              className={`reports-filters__segment ${filters.mode === 'accounting' ? 'active' : ''}`}
              onClick={() => onModeChange('accounting')}
            >
              📋 Счетоводен
            </button>
          </div>
        </div>

        {/* Групиране */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Групиране</label>
          <select
            className="reports-filters__select"
            value={filters.reportType}
            onChange={(e) => onReportTypeChange(e.target.value as ReportType)}
          >
            <option value="by-deliveries">По доставки</option>
            <option value="by-qualities">По качества</option>
            <option value="by-articles">По артикули</option>
            <option value="detailed">Детайлен отчет</option>
          </select>
        </div>
      {/* Качество */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Качество</label>
          <select
            className="reports-filters__select"
            value={filters.qualityIds.length > 0 ? filters.qualityIds[0] : 'all'}
            onChange={handleQualityChange}
          >
            <option value="all">Всички</option>
            {qualityOptions.filter(q => q.isActive).map(q => (
              <option key={q.id} value={String(q.id)}>{q.name}</option>
            ))}
          </select>
        </div>

        {/* Доставка */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Доставка</label>
          <select
            className="reports-filters__select"
            value={filters.deliveryId || 'all'}
            onChange={(e) => onFilterChange({ deliveryId: e.target.value === 'all' ? '' : e.target.value })}
          >
            <option value="all">Всички</option>
            {deliveryOptions
              .filter(d => filters.mode === 'real' || d.isInvoiced)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.displayId} - {d.qualityName}
                </option>
              ))
            }
          </select>
        </div>

        {/* Доставчик */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Доставчик</label>
          <select
            className="reports-filters__select"
            value={filters.supplierName || 'all'}
            onChange={(e) => onFilterChange({ supplierName: e.target.value })}
          >
            <option value="all">Всички</option>
            {(supplierOptions || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Метод плащане */}
        <div className="reports-filters__group">
          <label className="reports-filters__label">Плащане</label>
          <select
            className="reports-filters__select"
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value as ReportFilters['paymentMethod'] })}
          >
            <option value="all">Всички</option>
            <option value="cash">По каса</option>
            <option value="card">Карта</option>
            <option value="no-cash">Без каса</option>
            <option value="other">Друго</option>
          </select>
        </div>
    </div>
  );
};
