import type { CustomerFilters, GdprConsentFilter, CompanyDataFilter } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { exportCustomersToExcel, exportCustomersToPDF } from '../utils/customerUtils';
import type { Customer } from '../../../lib/supabase/types';
import { useState } from 'react';
import './CustomerFiltersBar.css';

interface CustomerFiltersBarProps {
  filters: CustomerFilters;
  onFilterChange: (partial: Partial<CustomerFilters>) => void;
  onNewCustomer: () => void;
  customers: Customer[];
  totalCount: number;
  filteredCount: number;
}

const gdprConsentOptions: { value: GdprConsentFilter; label: string }[] = [
  { value: 'all', label: 'Всички' },
  { value: 'yes', label: 'Със съгласие' },
  { value: 'no', label: 'Без съгласие' },
];

const companyDataOptions: { value: CompanyDataFilter; label: string }[] = [
  { value: 'all', label: 'Всички' },
  { value: 'yes', label: 'С фирмени данни' },
  { value: 'no', label: 'Без фирмени данни' },
];

export const CustomerFiltersBar = ({
  filters,
  onFilterChange,
  onNewCustomer,
  customers,
  totalCount,
  filteredCount,
}: CustomerFiltersBarProps) => {
  const { isReadOnly } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportCustomersToExcel(customers);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Грешка при експорт в Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportCustomersToPDF(customers);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Грешка при експорт в PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="customer-filters">
      <div className="customer-filters__left">
        <div className="customer-filters__search">
          <svg
            className="customer-filters__search-icon"
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
            placeholder="Търси по име, фирма, телефон, имейл, баркод…"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="customer-filters__input"
          />
          {filters.search && (
            <button
              className="customer-filters__clear"
              onClick={() => onFilterChange({ search: '' })}
              title="Изчисти търсенето"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={filters.gdprConsent}
          onChange={(e) =>
            onFilterChange({ gdprConsent: e.target.value as GdprConsentFilter })
          }
          className="customer-filters__select"
        >
          {gdprConsentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.hasCompanyData}
          onChange={(e) =>
            onFilterChange({ hasCompanyData: e.target.value as CompanyDataFilter })
          }
          className="customer-filters__select"
        >
          {companyDataOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="customer-filters__count">
          {filteredCount === totalCount
            ? `${totalCount} клиента`
            : `${filteredCount} от ${totalCount}`}
        </span>
      </div>

      <div className="customer-filters__right">
        {/* Export buttons */}
        <button
          className="customer-filters__btn customer-filters__btn--export"
          onClick={handleExportExcel}
          disabled={isExporting || customers.length === 0}
          title="Експорт в Excel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Excel
        </button>

        <button
          className="customer-filters__btn customer-filters__btn--export"
          onClick={handleExportPDF}
          disabled={isExporting || customers.length === 0}
          title="Експорт в PDF"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          PDF
        </button>

        {/* New customer button */}
        {!isReadOnly && (
          <button
            className="customer-filters__btn customer-filters__btn--new"
            onClick={onNewCustomer}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Нов клиент
          </button>
        )}
      </div>
    </div>
  );
};
