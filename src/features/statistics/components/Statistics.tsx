import { useStatistics } from '../hooks/useStatistics';
import { StatisticsFiltersBar } from './StatisticsFiltersBar';
import { StatisticsSummary } from './StatisticsSummary';
import { StatisticsTable } from './StatisticsTable';
import { exportStatisticsToCSV, exportStatisticsToExcel, exportStatisticsToPDF } from '../utils/exportStatistics';
import type { StatisticsTab } from '../types';
import './Statistics.css';

export const Statistics = () => {
  const {
    activeTab,
    setActiveTab,
    rows,
    summary,
    loading,
    filters,
    updateFilters,
    toggleCostMode,
  } = useStatistics();

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const tabLabels: Record<StatisticsTab, string> = {
      daily: 'Дневен отчет',
      monthly: 'Месечен отчет',
      yearly: 'Годишен отчет',
    };

    const title = `${tabLabels[activeTab]} - ${filters.dateFrom} до ${filters.dateTo}`;

    if (format === 'csv') {
      exportStatisticsToCSV(rows, filters.costModes, title);
    } else if (format === 'excel') {
      exportStatisticsToExcel(rows, filters.costModes, title);
    } else if (format === 'pdf') {
      exportStatisticsToPDF(rows, summary, filters.costModes, title);
    }
  };

  return (
    <div className="statistics">
      <div className="statistics__header">
        <div className="statistics__header-content">
          <h1 className="statistics__title">Статистика</h1>
          <div className="statistics__export-buttons">
            <button
              className="statistics__export-button"
              onClick={() => handleExport('csv')}
              title="Експорт като CSV"
            >
              <span className="statistics__export-icon">📄</span>
              CSV
            </button>
            <button
              className="statistics__export-button"
              onClick={() => handleExport('excel')}
              title="Експорт като Excel"
            >
              <span className="statistics__export-icon">📊</span>
              Excel
            </button>
            <button
              className="statistics__export-button"
              onClick={() => handleExport('pdf')}
              title="Експорт като PDF"
            >
              <span className="statistics__export-icon">📑</span>
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="statistics__tabs">
        <button
          className={`statistics__tab ${activeTab === 'daily' ? 'statistics__tab--active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Дневен отчет
        </button>
        <button
          className={`statistics__tab ${activeTab === 'monthly' ? 'statistics__tab--active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Месечен отчет
        </button>
        <button
          className={`statistics__tab ${activeTab === 'yearly' ? 'statistics__tab--active' : ''}`}
          onClick={() => setActiveTab('yearly')}
        >
          Годишен отчет
        </button>
      </div>

      <div className="statistics__content">
        <StatisticsFiltersBar
          filters={filters}
          onUpdateFilters={updateFilters}
          onToggleCostMode={toggleCostMode}
        />

        {loading ? (
          <div className="statistics__loading">
            <div className="statistics__spinner"></div>
            <p>Зареждане на данни...</p>
          </div>
        ) : (
          <>
            <StatisticsSummary summary={summary} costModes={filters.costModes} />
            <StatisticsTable rows={rows} costModes={filters.costModes} />
          </>
        )}
      </div>
    </div>
  );
};
