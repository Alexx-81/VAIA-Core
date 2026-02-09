import type { StatisticsSummaryData, CostMode } from '../types';
import './StatisticsSummary.css';

interface Props {
  summary: StatisticsSummaryData;
  costModes: CostMode[];
}

export const StatisticsSummary = ({ summary, costModes }: Props) => {
  const showReal = costModes.includes('real');
  const showAcc = costModes.includes('accounting');

  return (
    <div className="statistics-summary">
      <div className="statistics-summary__card">
        <div className="statistics-summary__label">Общ оборот</div>
        <div className="statistics-summary__value statistics-summary__value--primary">
          {summary.totalRevenue.toFixed(2)} €
        </div>
      </div>

      {showReal && (
        <>
          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Себестойност (реална)</div>
            <div className="statistics-summary__value">
              {summary.totalCostReal.toFixed(2)} €
            </div>
          </div>

          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Печалба (реална)</div>
            <div className={`statistics-summary__value ${
              summary.totalProfitReal >= 0 
                ? 'statistics-summary__value--positive' 
                : 'statistics-summary__value--negative'
            }`}>
              {summary.totalProfitReal.toFixed(2)} €
            </div>
          </div>

          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Марж (реален)</div>
            <div className={`statistics-summary__value ${
              summary.avgMarginReal >= 0 
                ? 'statistics-summary__value--positive' 
                : 'statistics-summary__value--negative'
            }`}>
              {summary.avgMarginReal.toFixed(1)}%
            </div>
          </div>
        </>
      )}

      {showAcc && (
        <>
          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Себестойност (счет.)</div>
            <div className="statistics-summary__value">
              {summary.totalCostAcc.toFixed(2)} €
            </div>
          </div>

          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Печалба (счет.)</div>
            <div className={`statistics-summary__value ${
              summary.totalProfitAcc >= 0 
                ? 'statistics-summary__value--positive' 
                : 'statistics-summary__value--negative'
            }`}>
              {summary.totalProfitAcc.toFixed(2)} €
            </div>
          </div>

          <div className="statistics-summary__card">
            <div className="statistics-summary__label">Марж (счет.)</div>
            <div className={`statistics-summary__value ${
              summary.avgMarginAcc >= 0 
                ? 'statistics-summary__value--positive' 
                : 'statistics-summary__value--negative'
            }`}>
              {summary.avgMarginAcc.toFixed(1)}%
            </div>
          </div>
        </>
      )}

      <div className="statistics-summary__card">
        <div className="statistics-summary__label">Общо килограми</div>
        <div className="statistics-summary__value statistics-summary__value--secondary">
          {summary.totalKgSold.toFixed(1)} kg
        </div>
      </div>
    </div>
  );
};
