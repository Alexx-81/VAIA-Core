import { useState, useCallback } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryFiltersBar } from './InventoryFiltersBar';
import { InventoryTable } from './InventoryTable';
import { InventoryComparison } from './InventoryComparison';
import { Toast } from '../../../shared/components/Toast';
import { exportToCSV, exportComparisonToCSV, exportToExcel, exportComparisonToExcel, formatKg, formatEur } from '../utils/inventoryUtils';
import type { InventoryTab } from '../types';
import type { TabId } from '../../../shared/components/Tabs';
import './Inventory.css';

interface InventoryProps {
  onTabChange?: (tab: TabId) => void;
}

export const Inventory = ({ onTabChange }: InventoryProps) => {
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
    if (onTabChange) {
      // URL state — записваме deliveryId в sessionStorage за да може Deliveries да го прочете
      sessionStorage.setItem('highlight_delivery_id', deliveryId);
      onTabChange('deliveries');
    } else {
      console.log('View delivery:', deliveryId);
    }
  }, [onTabChange]);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExport = useCallback(() => {
    const now = formatLocalDate(new Date());
    
    if (activeTab === 'real') {
      exportToCSV(realInventory, 'real', `nalichnosti-real-${now}`);
    } else if (activeTab === 'accounting') {
      exportToCSV(accInventory, 'accounting', `nalichnosti-accounting-${now}`);
    } else {
      exportComparisonToCSV(comparisonInventory, `nalichnosti-sravnenie-${now}`);
    }
  }, [activeTab, realInventory, accInventory, comparisonInventory]);

  const handleExportExcel = useCallback(async () => {
    const now = formatLocalDate(new Date());
    
    try {
      if (activeTab === 'real') {
        await exportToExcel(realInventory, 'real', `nalichnosti-real-${now}`);
      } else if (activeTab === 'accounting') {
        await exportToExcel(accInventory, 'accounting', `nalichnosti-accounting-${now}`);
      } else {
        await exportComparisonToExcel(comparisonInventory, `nalichnosti-sravnenie-${now}`);
      }
    } catch (error) {
      console.error('Грешка при експортиране в Excel:', error);
      setToast({
        isOpen: true,
        message: 'Грешка при експортиране в Excel',
        variant: 'error',
      });
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
        onExportExcel={handleExportExcel}
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
          />
          <h3 className="inventory__section-title" style={{ marginTop: '32px' }}>📋 Счетоводни наличности</h3>
          <InventoryTable
            data={accInventory}
            type="accounting"
            stats={accStats}
            minKgThreshold={filters.minKgThreshold}
            onViewDelivery={handleViewDelivery}
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
        />
      )}

      {activeTab === 'accounting' && (
        <InventoryTable
          data={accInventory}
          type="accounting"
          stats={accStats}
          minKgThreshold={filters.minKgThreshold}
          onViewDelivery={handleViewDelivery}
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
