import type { ReactNode } from 'react';
import './DataCards.css';

export interface CardField<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataCardsProps<T> {
  data: T[];
  fields: CardField<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onItemClick?: (item: T) => void;
  renderCardTitle: (item: T) => ReactNode;
  renderCardSubtitle?: (item: T) => ReactNode;
  renderCardBadge?: (item: T) => ReactNode;
  renderCardActions?: (item: T) => ReactNode;
  emptyMessage?: string;
  className?: string;
  cardClassName?: (item: T) => string;
}

export function DataCards<T>({
  data,
  fields,
  keyExtractor,
  onItemClick,
  renderCardTitle,
  renderCardSubtitle,
  renderCardBadge,
  renderCardActions,
  emptyMessage = 'Няма данни',
  className = '',
  cardClassName,
}: DataCardsProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`data-cards-empty ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`data-cards ${className}`}>
      {data.map((item, index) => {
        const extraClass = cardClassName ? cardClassName(item) : '';
        
        return (
          <div
            key={keyExtractor(item, index)}
            className={`data-card ${extraClass}`}
            onClick={() => onItemClick?.(item)}
          >
            {/* Card Header */}
            <div className="data-card-header">
              <div className="data-card-title-section">
                <div className="data-card-title">{renderCardTitle(item)}</div>
                {renderCardSubtitle && (
                  <div className="data-card-subtitle">{renderCardSubtitle(item)}</div>
                )}
              </div>
              {renderCardBadge && (
                <div className="data-card-badge">{renderCardBadge(item)}</div>
              )}
            </div>

            {/* Card Content - Field Rows */}
            <div className="data-card-content">
              {fields
                .filter((field) => !field.hideOnMobile)
                .map((field) => (
                  <div key={String(field.key)} className="data-card-row">
                    <span className="data-card-label">{field.label}</span>
                    <span className="data-card-value">
                      {field.render
                        ? field.render(item)
                        : String((item as Record<string, unknown>)[field.key as string] ?? '—')}
                    </span>
                  </div>
                ))}
            </div>

            {/* Card Actions */}
            {renderCardActions && (
              <div className="data-card-actions" onClick={(e) => e.stopPropagation()}>
                {renderCardActions(item)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
