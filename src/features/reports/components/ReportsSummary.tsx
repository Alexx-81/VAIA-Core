import React from 'react';
import type { ReportSummary, ReportMode } from '../types';
import './ReportsSummary.css';

interface ReportsSummaryProps {
  summary: ReportSummary;
  mode: ReportMode;
  periodLabel: string;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('bg-BG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const ReportsSummary: React.FC<ReportsSummaryProps> = ({
  summary,
  mode,
  periodLabel,
}) => {
  return (
    <div className="reports-summary">
      <div className="reports-summary__header">
        <h3 className="reports-summary__title">
          📊 Обобщение за {periodLabel}
        </h3>
        <span className={`reports-summary__mode reports-summary__mode--${mode}`}>
          {mode === 'real' ? '📦 Реален режим' : '📋 Счетоводен режим'}
        </span>
      </div>

      <div className="reports-summary__cards">
        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">💰</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Оборот</span>
            <span className="reports-summary__card-value">{formatCurrency(summary.revenueEur)} €</span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">📦</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Себестойност</span>
            <span className="reports-summary__card-value reports-summary__card-value--neutral">
              {formatCurrency(summary.cogsEur)} €
            </span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">📈</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Печалба</span>
            <span className={`reports-summary__card-value ${summary.profitEur >= 0 ? 'reports-summary__card-value--positive' : 'reports-summary__card-value--negative'}`}>
              {formatCurrency(summary.profitEur)} €
            </span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">📊</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Марж</span>
            <span className={`reports-summary__card-value ${summary.marginPercent >= 30 ? 'reports-summary__card-value--positive' : summary.marginPercent >= 15 ? 'reports-summary__card-value--neutral' : 'reports-summary__card-value--warning'}`}>
              {formatNumber(summary.marginPercent, 1)}%
            </span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">⚖️</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Продадени kg</span>
            <span className="reports-summary__card-value">{formatNumber(summary.totalKg, 2)} kg</span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">🏷️</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Бройки</span>
            <span className="reports-summary__card-value">{summary.totalPieces.toLocaleString('bg-BG')}</span>
          </div>
        </div>

        <div className="reports-summary__card">
          <div className="reports-summary__card-icon">🧾</div>
          <div className="reports-summary__card-content">
            <span className="reports-summary__card-label">Продажби</span>
            <span className="reports-summary__card-value">{summary.salesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
