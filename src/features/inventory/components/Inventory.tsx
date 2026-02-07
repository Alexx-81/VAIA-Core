import { useState, useCallback } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryFiltersBar } from './InventoryFiltersBar';
import { InventoryTable } from './InventoryTable';
import { InventoryComparison } from './InventoryComparison';
import { Toast } from '../../../shared/components/Toast';
import { exportToCSV, exportComparisonToCSV, formatKg, formatEur } from '../utils/inventoryUtils';
import type { InventoryTab } from '../types';
import './Inventory.css';

export const Inventory = () => {
  const {
    realInventory,
    accInventory,
    comparisonInventory,
    allRealInventory,
    allAccInventory,
    filters,
    updateFilters,
    realStats,
    accStats,
    qualities,
    suppliers,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<InventoryTab>('real');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; variant: 'info' | 'success' | 'warning' | 'error' }>({
    isOpen: false,
    message: '',
    variant: 'info',
  });

  // Handlers
  const handleViewDelivery = useCallback((deliveryId: string) => {
    // TODO: Navigate to deliveries tab with selected delivery
    console.log('View delivery:', deliveryId);
    setToast({
      isOpen: true,
      message: `Навигация към доставка ${deliveryId} (TODO: интеграция с таб Доставки)`,
      variant: 'info',
    });
  }, []);

  const handleViewSales = useCallback((deliveryId: string, type: InventoryTab) => {
    // TODO: Navigate to sales tab with filter
    console.log('View sales for delivery:', deliveryId, 'type:', type);
    setToast({
      isOpen: true,
      message: `Навигация към продажби за доставка ${deliveryId} (${type}) (TODO: интеграция с таб Продажби)`,
      variant: 'info',
    });
  }, []);

  const handleExport = useCallback(() => {
    const now = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'real') {
      exportToCSV(realInventory, 'real', `nalichnosti-real-${now}`);
    } else if (activeTab === 'accounting') {
      exportToCSV(accInventory, 'accounting', `nalichnosti-accounting-${now}`);
    } else {
      exportComparisonToCSV(comparisonInventory, `nalichnosti-sravnenie-${now}`);
    }
  }, [activeTab, realInventory, accInventory, comparisonInventory]);

  // Current stats based on active tab
  const currentStats = activeTab === 'real' ? realStats : accStats;
  const totalCount = activeTab === 'real' ? allRealInventory.length : allAccInventory.length;
  const filteredCount = activeTab === 'real' ? realInventory.length : 
                        activeTab === 'accounting' ? accInventory.length : 
                        comparisonInventory.length;

  return (
    <div className="inventory">
      <div className="inventory__header">
        <div className="inventory__title-section">
          <h1 className="inventory__title">Наличности</h1>
          <p className="inventory__subtitle">
            Преглед на реални и счетоводни наличности по доставки
          </p>
        </div>
        <div className="inventory__stats">
          <div className="inventory__stat">
            <span className="inventory__stat-value">{currentStats.inStock}</span>
            <span className="inventory__stat-label">с наличност</span>
          </div>
          <div className="inventory__stat">
            <span className="inventory__stat-value warning">{currentStats.belowMinimum}</span>
            <span className="inventory__stat-label">под минимум</span>
          </div>
          <div className="inventory__stat">
            <span className="inventory__stat-value danger">{currentStats.depleted}</span>
            <span className="inventory__stat-label">изчерпани</span>
          </div>
          <div className="inventory__stat">
            <span className="inventory__stat-value">{formatKg(currentStats.totalKgRemaining)}</span>
            <span className="inventory__stat-label">kg налични</span>
          </div>
          <div className="inventory__stat">
            <span className="inventory__stat-value success">{formatEur(currentStats.totalValueRemaining)}</span>
            <span className="inventory__stat-label">EUR стойност</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inventory__tabs">
        <button
          className={`inventory__tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 Всички
        </button>
        <button
          className={`inventory__tab ${activeTab === 'real' ? 'active' : ''}`}
          onClick={() => setActiveTab('real')}
        >
          📦 Реални
        </button>
        <button
          className={`inventory__tab ${activeTab === 'accounting' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounting')}
        >
          📋 Счетоводни
        </button>
        <button
          className={`inventory__tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          📊 Сравнение
        </button>
      </div>

      <InventoryFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onExport={handleExport}
        qualities={qualities}
        suppliers={suppliers}
        totalCount={totalCount}
        filteredCount={filteredCount}
        activeTab={activeTab}
      />

      {activeTab === 'all' && (
        <>
          <h3 className="inventory__section-title">📦 Реални наличности</h3>
          <InventoryTable
            data={realInventory}
            type="real"
            stats={realStats}
            minKgThreshold={filters.minKgThreshold}
            onViewDelivery={handleViewDelivery}
            onViewSales={handleViewSales}
          />
          <h3 className="inventory__section-title" style={{ marginTop: '32px' }}>📋 Счетоводни наличности</h3>
          <InventoryTable
            data={accInventory}
            type="accounting"
            stats={accStats}
            minKgThreshold={filters.minKgThreshold}
            onViewDelivery={handleViewDelivery}
            onViewSales={handleViewSales}
          />
        </>
      )}

      {activeTab === 'real' && (
        <InventoryTable
          data={realInventory}
          type="real"
          stats={realStats}
          minKgThreshold={filters.minKgThreshold}
          onViewDelivery={handleViewDelivery}
          onViewSales={handleViewSales}
        />
      )}

      {activeTab === 'accounting' && (
        <InventoryTable
          data={accInventory}
          type="accounting"
          stats={accStats}
          minKgThreshold={filters.minKgThreshold}
          onViewDelivery={handleViewDelivery}
          onViewSales={handleViewSales}
        />
      )}

      {activeTab === 'comparison' && (
        <InventoryComparison
          data={comparisonInventory}
          onViewDelivery={handleViewDelivery}
        />
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};
