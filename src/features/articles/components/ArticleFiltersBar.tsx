import type { ArticleFilters, ArticleStatus, ArticleSortBy } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import './ArticleFiltersBar.css';

interface ArticleFiltersBarProps {
  filters: ArticleFilters;
  onFilterChange: (partial: Partial<ArticleFilters>) => void;
  onNewArticle: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions: { value: ArticleStatus; label: string }[] = [
  { value: 'all', label: 'Всички' },
  { value: 'active', label: 'Активни' },
  { value: 'inactive', label: 'Неактивни' },
];

const sortOptions: { value: ArticleSortBy; label: string }[] = [
  { value: 'name-asc', label: 'Име (А→Я)' },
  { value: 'name-desc', label: 'Име (Я→А)' },
  { value: 'most-used', label: 'Най-използвани' },
  { value: 'newest', label: 'Последно създадени' },
];

export const ArticleFiltersBar = ({
  filters,
  onFilterChange,
  onNewArticle,
  onImport,
  onDownloadTemplate,
  totalCount,
  filteredCount,
}: ArticleFiltersBarProps) => {
  const { isReadOnly } = useAuth();

  return (
    <div className="article-filters">
      <div className="article-filters__left">
        <div className="article-filters__search">
          <svg
            className="article-filters__search-icon"
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
            placeholder="Търси артикул…"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="article-filters__input"
          />
          {filters.search && (
            <button
              className="article-filters__clear"
              onClick={() => onFilterChange({ search: '' })}
              title="Изчисти търсенето"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({ status: e.target.value as ArticleStatus })
          }
          className="article-filters__select"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) =>
            onFilterChange({ sortBy: e.target.value as ArticleSortBy })
          }
          className="article-filters__select"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="article-filters__count">
          {filteredCount === totalCount
            ? `${totalCount} артикула`
            : `${filteredCount} от ${totalCount}`}
        </span>
      </div>

      <div className="article-filters__right">
        <button 
          className="article-filters__btn-secondary" 
          onClick={onDownloadTemplate}
          title="Изтегли Excel шаблон за импорт"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Шаблон
        </button>
        {!isReadOnly && (
          <>
            <button 
              className="article-filters__btn-secondary" 
              onClick={onImport}
              title="Импортирай артикули от Excel файл"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Импорт
            </button>
            <button className="article-filters__btn-new" onClick={onNewArticle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Нов артикул
            </button>
          </>
        )}
      </div>
    </div>
  );
};
