import { useState, useCallback, useEffect } from 'react';
import { useDeliveries } from '../hooks/useDeliveries';
import { DeliveryFiltersBar } from './DeliveryFiltersBar';
import { DeliveryTable } from './DeliveryTable';
import { DeliveryDialog } from './DeliveryDialog';
import { DeliveryDetail } from './DeliveryDetail';
import { ImportDeliveriesDialog } from './ImportDeliveriesDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Toast } from '../../../shared/components/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import type { DeliveryWithComputed, DeliveryView, DeliveryFormData, Delivery, SaleFromDelivery } from '../types';
import './Deliveries.css';

export const Deliveries = () => {
  const {
    deliveries,
    allDeliveries,
    availableQualities,
    hasInactiveQualities,
    filters,
    loading,
    updateFilters,
    updateDateRange,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    checkDeliveryDependencies,
    importDeliveries,
    getDeliveryById,
    getSalesForDelivery,
    existingDisplayIds,
    stats,
    qualities,
  } = useDeliveries();

  const { isAdmin } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState<DeliveryView>('list');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [salesForDelivery, setSalesForDelivery] = useState<SaleFromDelivery[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryWithComputed | undefined>();
  const [dialogKey, setDialogKey] = useState(0);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Toast & delete confirm state
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Check if we should open create dialog directly from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setEditingDelivery(undefined);
      setDialogKey((prev) => prev + 1);
      setDialogOpen(true);
      // Clean up query param
      window.history.replaceState({ tab: 'deliveries' }, '', '/deliveries');
    }
  }, []);

  // Load sales for selected delivery
  useEffect(() => {
    if (selectedDeliveryId) {
      getSalesForDelivery(selectedDeliveryId).then(setSalesForDelivery);
    } else {
      setSalesForDelivery([]);
    }
  }, [selectedDeliveryId, getSalesForDelivery]);

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
    async (formData: DeliveryFormData, allowFullEdit: boolean) => {
      if (editingDelivery) {
        return updateDelivery(editingDelivery.id, formData, allowFullEdit);
      }
      return createDelivery(formData);
    },
    [editingDelivery, createDelivery, updateDelivery]
  );

  // Import handlers
  const handleOpenImportDialog = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleCloseImportDialog = useCallback(() => {
    setImportDialogOpen(false);
  }, []);

  const handleImportDeliveries = useCallback(async (importedDeliveries: Delivery[]) => {
    await importDeliveries(importedDeliveries);
  }, [importDeliveries]);

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

  // Delete handler
  const handleDeleteDelivery = useCallback(async (delivery: DeliveryWithComputed) => {
    const deps = await checkDeliveryDependencies(delivery.id);

    let message = `Сигурни ли сте, че искате да изтриете доставка „${delivery.displayId}“?`;
    if (deps.saleCount > 0) {
      message += `\n\n❗ Ще бъдат изтрити и ${deps.saleCount} свързани продажби!`;
    }
    message += '\n\nТова действие е необратимо.';

    setDeleteConfirm({
      isOpen: true,
      title: 'Изтриване на доставка',
      message,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        const result = await deleteDelivery(delivery.id);
        if (result.success) {
          setToast({ message: `Доставка „${delivery.displayId}“ е изтрита успешно.`, variant: 'success' });
          if (currentView === 'detail') {
            handleBackToList();
          }
        } else {
          setToast({ message: result.error || 'Грешка при изтриване.', variant: 'error' });
        }
      },
    });
  }, [checkDeliveryDependencies, deleteDelivery, currentView, handleBackToList]);

  const handleDeleteFromDetail = useCallback(() => {
    if (selectedDeliveryId) {
      const delivery = getDeliveryById(selectedDeliveryId);
      if (delivery) {
        handleDeleteDelivery(delivery);
      }
    }
  }, [selectedDeliveryId, getDeliveryById, handleDeleteDelivery]);

  // Get selected delivery for detail view
  const selectedDelivery = selectedDeliveryId ? getDeliveryById(selectedDeliveryId) : undefined;

  // Show loading state
  if (loading) {
    return (
      <div className="deliveries">
        <div className="deliveries__loading">Зареждане на доставки...</div>
      </div>
    );
  }

  // Render detail view
  if (currentView === 'detail' && selectedDelivery) {
    return (
      <div className="deliveries">
        <DeliveryDetail
          delivery={selectedDelivery}
          sales={salesForDelivery}
          onBack={handleBackToList}
          onEdit={handleEditFromDetail}
          onDelete={isAdmin ? handleDeleteFromDetail : undefined}
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
        onImportDeliveries={handleOpenImportDialog}
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
        onDelete={isAdmin ? handleDeleteDelivery : undefined}
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

      <ImportDeliveriesDialog
        isOpen={importDialogOpen}
        onClose={handleCloseImportDialog}
        onImport={handleImportDeliveries}
        existingDisplayIds={existingDisplayIds}
        qualities={qualities}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Изтрий"
        variant="danger"
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
