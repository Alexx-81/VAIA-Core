import { useState, useCallback } from 'react';
import { useDeliveries } from '../hooks/useDeliveries';
import { DeliveryFiltersBar } from './DeliveryFiltersBar';
import { DeliveryTable } from './DeliveryTable';
import { DeliveryDialog } from './DeliveryDialog';
import { DeliveryDetail } from './DeliveryDetail';
import type { DeliveryWithComputed, DeliveryView, DeliveryFormData } from '../types';
import './Deliveries.css';

export const Deliveries = () => {
  const {
    deliveries,
    allDeliveries,
    availableQualities,
    hasInactiveQualities,
    filters,
    updateFilters,
    updateDateRange,
    createDelivery,
    updateDelivery,
    getDeliveryById,
    getSalesForDelivery,
    existingDisplayIds,
    stats,
  } = useDeliveries();

  // View state
  const [currentView, setCurrentView] = useState<DeliveryView>('list');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryWithComputed | undefined>();
  const [dialogKey, setDialogKey] = useState(0);

  // Handlers for list view
  const handleNewDelivery = useCallback(() => {
    setEditingDelivery(undefined);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  }, []);

  const handleEditDelivery = useCallback((delivery: DeliveryWithComputed) => {
    setEditingDelivery(delivery);
    setDialogKey((prev) => prev + 1);
    setDialogOpen(true);
  }, []);

  const handleViewDetail = useCallback((delivery: DeliveryWithComputed) => {
    setSelectedDeliveryId(delivery.id);
    setCurrentView('detail');
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingDelivery(undefined);
  }, []);

  const handleSubmit = useCallback(
    (formData: DeliveryFormData, allowFullEdit: boolean) => {
      if (editingDelivery) {
        return updateDelivery(editingDelivery.id, formData, allowFullEdit);
      }
      return createDelivery(formData);
    },
    [editingDelivery, createDelivery, updateDelivery]
  );

  // Handlers for detail view
  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedDeliveryId(null);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (selectedDeliveryId) {
      const delivery = getDeliveryById(selectedDeliveryId);
      if (delivery) {
        handleEditDelivery(delivery);
      }
    }
  }, [selectedDeliveryId, getDeliveryById, handleEditDelivery]);

  // Get selected delivery for detail view
  const selectedDelivery = selectedDeliveryId ? getDeliveryById(selectedDeliveryId) : undefined;
  const salesForDelivery = selectedDeliveryId ? getSalesForDelivery(selectedDeliveryId) : [];

  // Render detail view
  if (currentView === 'detail' && selectedDelivery) {
    return (
      <div className="deliveries">
        <DeliveryDetail
          delivery={selectedDelivery}
          sales={salesForDelivery}
          onBack={handleBackToList}
          onEdit={handleEditFromDetail}
        />

        <DeliveryDialog
          key={dialogKey}
          isOpen={dialogOpen}
          delivery={editingDelivery}
          qualities={availableQualities}
          existingDisplayIds={existingDisplayIds}
          onSubmit={handleSubmit}
          onClose={handleCloseDialog}
        />
      </div>
    );
  }

  // Render list view
  return (
    <div className="deliveries">
      <div className="deliveries__header">
        <div className="deliveries__title-section">
          <h1 className="deliveries__title">Доставки</h1>
          <p className="deliveries__subtitle">
            Управление на доставки, наличности и доставни цени
          </p>
        </div>
        <div className="deliveries__stats">
          <div className="deliveries__stat">
            <span className="deliveries__stat-value">{stats.inStock}</span>
            <span className="deliveries__stat-label">с наличност</span>
          </div>
          <div className="deliveries__stat">
            <span className="deliveries__stat-value">{stats.depleted}</span>
            <span className="deliveries__stat-label">изчерпани</span>
          </div>
        </div>
      </div>

      <DeliveryFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onDateRangeChange={updateDateRange}
        onNewDelivery={handleNewDelivery}
        qualities={availableQualities}
        hasInactiveQualities={hasInactiveQualities}
        totalCount={allDeliveries.length}
        filteredCount={deliveries.length}
      />

      <DeliveryTable
        deliveries={deliveries}
        onViewDetail={handleViewDetail}
        onEdit={handleEditDelivery}
        onNewDelivery={handleNewDelivery}
      />

      <DeliveryDialog
        key={dialogKey}
        isOpen={dialogOpen}
        delivery={editingDelivery}
        qualities={availableQualities}
        existingDisplayIds={existingDisplayIds}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />
    </div>
  );
};
