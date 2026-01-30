import React, { useState, useCallback } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportsFiltersBar } from './ReportsFiltersBar';
import { ReportsSummary } from './ReportsSummary';
import { ReportsTable } from './ReportsTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import type { ExportFormat } from '../types';
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

  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);
    setExportMessage(null);
    
    try {
      const data = {
        ...reportData,
        periodLabel,
      };
      
      switch (format) {
        case 'csv':
          exportToCSV(data);
          setExportMessage({ type: 'success', text: 'CSV файловете са експортирани успешно!' });
          break;
        case 'excel':
          await exportToExcel(data);
          setExportMessage({ type: 'success', text: 'Excel файлът е експортиран успешно!' });
          break;
        case 'pdf':
          await exportToPDF(data);
          setExportMessage({ type: 'success', text: 'PDF файлът е експортиран успешно!' });
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Грешка при експортиране. Моля, опитайте отново.' });
    } finally {
      setIsExporting(false);
      // Изчистваме съобщението след 5 секунди
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
        onGenerate={handleGenerate}
        onExport={handleExport}
        isGenerating={isGenerating || isExporting}
      />

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
