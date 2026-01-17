import { useState, useCallback } from 'react';
import { useSales } from '../hooks/useSales';
import { SalesFiltersBar } from './SalesFiltersBar';
import { SalesTable } from './SalesTable';
import { SaleEditor } from './SaleEditor';
import { SaleDetail } from './SaleDetail';
import type { SalesView, SaleWithComputed } from '../types';
import './Sales.css';

export const Sales = () => {
  const {
    sales,
    allSales,
    filters,
    updateFilters,
    updateDateRange,
    createSale,
    getSaleById,
    stats,
    articleOptions,
    getDeliveryOptionsReal,
    getDeliveryOptionsAccounting,
  } = useSales();

  // View state
  const [currentView, setCurrentView] = useState<SalesView>('list');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Handlers
  const handleNewSale = useCallback(() => {
    setCurrentView('editor');
    setSelectedSaleId(null);
  }, []);

  const handleViewDetail = useCallback((sale: SaleWithComputed) => {
    setSelectedSaleId(sale.id);
    setCurrentView('list'); // Will show detail inline or navigate
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedSaleId(null);
  }, []);

  const handleSaleCreated = useCallback((sale: SaleWithComputed) => {
    // Show success and go back to list or show detail
    setSelectedSaleId(sale.id);
    setCurrentView('list');
  }, []);

  // Get selected sale for detail view
  const selectedSale = selectedSaleId ? getSaleById(selectedSaleId) : undefined;

  // Render editor view
  if (currentView === 'editor') {
    return (
      <div className="sales">
        <SaleEditor
          articleOptions={articleOptions}
          getDeliveryOptionsReal={getDeliveryOptionsReal}
          getDeliveryOptionsAccounting={getDeliveryOptionsAccounting}
          onSave={createSale}
          onCancel={handleBackToList}
          onSaleCreated={handleSaleCreated}
        />
      </div>
    );
  }

  // Render detail view
  if (selectedSale) {
    return (
      <div className="sales">
        <SaleDetail sale={selectedSale} onBack={handleBackToList} />
      </div>
    );
  }

  // Render list view
  return (
    <div className="sales">
      <div className="sales__header">
        <div className="sales__title-section">
          <h1 className="sales__title">Продажби (POS / Каса)</h1>
          <p className="sales__subtitle">
            Управление на продажби, калкулация на печалба и марж
          </p>
        </div>
        <div className="sales__stats">
          <div className="sales__stat">
            <span className="sales__stat-value">{stats.totalSales}</span>
            <span className="sales__stat-label">продажби</span>
          </div>
          <div className="sales__stat">
            <span className="sales__stat-value">{stats.totalRevenueEur.toFixed(0)}</span>
            <span className="sales__stat-label">EUR оборот</span>
          </div>
        </div>
      </div>

      <SalesFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onDateRangeChange={updateDateRange}
        onNewSale={handleNewSale}
        totalCount={allSales.length}
        filteredCount={sales.length}
      />

      <SalesTable
        sales={sales}
        onViewDetail={handleViewDetail}
        onNewSale={handleNewSale}
        stats={stats}
      />
    </div>
  );
};
