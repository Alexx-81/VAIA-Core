import React, { useState, useCallback } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportsFiltersBar } from './ReportsFiltersBar';
import { ReportsSummary } from './ReportsSummary';
import { ReportsTable } from './ReportsTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import './Reports.css';

export const Reports: React.FC = () => {
  const {
    filters,
    reportData,
    summary,
    deliveryRows,
    qualityRows,
    articleRows,
    transactionRows,
    qualityOptions,
    deliveryOptions,
    supplierOptions,
    isGenerating,
    loading,
    reportGenerated,
    updateFilters,
    updatePeriod,
    updateMode,
    updateReportType,
    generateReport,
    filterByDelivery,
    formatPeriodLabel,
  } = useReports();

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const periodLabel = formatPeriodLabel(filters.period);

  const handleGenerate = useCallback(async () => {
    await generateReport();
  }, [generateReport]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      await exportToCSV({ ...reportData, periodLabel });
      setExportMessage({ type: 'success', text: 'CSV файлът е експортиран успешно!' });
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Грешка при експортиране. Моля, опитайте отново.' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 5000);
    }
  }, [reportData, periodLabel]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      await exportToExcel({ ...reportData, periodLabel });
      setExportMessage({ type: 'success', text: 'Excel файлът е експортиран успешно!' });
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Грешка при експортиране. Моля, опитайте отново.' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 5000);
    }
  }, [reportData, periodLabel]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      await exportToPDF({ ...reportData, periodLabel });
      setExportMessage({ type: 'success', text: 'PDF файлът е експортиран успешно!' });
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Грешка при експортиране. Моля, опитайте отново.' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 5000);
    }
  }, [reportData, periodLabel]);

  const handleViewDeliveryDetail = useCallback((deliveryId: string) => {
    filterByDelivery(deliveryId);
  }, [filterByDelivery]);

  return (
    <div className="reports">
      {/* Header */}
      <div className="reports__header">
        <div className="reports__title-section">
          <h1 className="reports__title">📊 Отчети</h1>
          <p className="reports__subtitle">
            Генерирайте месечни отчети в реален или счетоводен режим с възможност за експорт
          </p>
        </div>

        <div className="reports__header-actions">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || isExporting}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="btn-text">{isGenerating ? 'Генериране...' : 'Генерирай отчет'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={isGenerating || isExporting || !reportGenerated}
            title="Експорт като CSV"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="btn-text">CSV</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportExcel}
            disabled={isGenerating || isExporting || !reportGenerated}
            title="Експорт като Excel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span className="btn-text">Excel</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportPDF}
            disabled={isGenerating || isExporting || !reportGenerated}
            title="Експорт като PDF"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="btn-text">PDF</span>
          </button>
        </div>
      </div>

      {/* Export message */}
      {exportMessage && (
        <div className={`reports__message reports__message--${exportMessage.type}`}>
          {exportMessage.type === 'success' ? '✅' : '❌'} {exportMessage.text}
        </div>
      )}

      {/* Filters */}
      <ReportsFiltersBar
        filters={filters}
        qualityOptions={qualityOptions}
        deliveryOptions={deliveryOptions}
        supplierOptions={supplierOptions}
        onFilterChange={updateFilters}
        onPeriodChange={updatePeriod}
        onModeChange={updateMode}
        onReportTypeChange={updateReportType}
      />

      {/* Loading state */}
      {loading ? (
        <div className="reports__loading">
          <div className="reports__loading-spinner"></div>
          <p>Зареждане на данни...</p>
        </div>
      ) : !reportGenerated ? (
        <div className="reports__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>Готов за генериране на отчет</h3>
          <p>Изберете филтри и натиснете "Генерирай отчет" за да видите резултатите</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <ReportsSummary
            summary={summary}
            mode={filters.mode}
            periodLabel={periodLabel}
          />

          {/* Table */}
          <ReportsTable
            reportType={filters.reportType}
            mode={filters.mode}
            deliveryRows={deliveryRows}
            qualityRows={qualityRows}
            articleRows={articleRows}
            transactionRows={transactionRows}
            onViewDeliveryDetail={handleViewDeliveryDetail}
          />
        </>
      )}

      {/* Info panel */}
      <div className="reports__info">
        <h4 className="reports__info-title">ℹ️ Информация за режимите</h4>
        <div className="reports__info-grid">
          <div className="reports__info-item">
            <strong>📦 Реален режим:</strong>
            <p>Включва всички доставки (с фактура + A доставки). Групира по real_delivery_id. Показва "Пари изкарани от доставка".</p>
          </div>
          <div className="reports__info-item">
            <strong>📋 Счетоводен режим:</strong>
            <p>Само фактурни доставки. Групира по accounting_delivery_id. Подходящ за изпращане към счетоводство.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
