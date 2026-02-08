import { useState, useCallback, useEffect } from 'react';
import { useSales } from '../hooks/useSales';
import { SalesFiltersBar } from './SalesFiltersBar';
import { SalesTable } from './SalesTable';
import { SaleEditor } from './SaleEditor';
import { SaleDetail } from './SaleDetail';
import { ImportSalesDialog } from './ImportSalesDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Toast } from '../../../shared/components/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import type { SalesView, SaleWithComputed, Sale, SaleLine } from '../types';
import type { SaleImportRow } from '../utils/importSales';
import { groupRowsByDate } from '../utils/importSales';
import { generateId } from '../utils/salesUtils';
import './Sales.css';

export const Sales = () => {
  const {
    sales,
    allSales,
    filters,
    loading,
    updateFilters,
    updateDateRange,
    createSale,
    deleteSale,
    importSales,
    getSaleById,
    stats,
    articleOptions,
    getDeliveryOptionsReal,
    getDeliveryOptionsAccounting,
  } = useSales();

  const { isAdmin } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState<SalesView>('list');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Toast & delete confirm state
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Check if we should open editor directly from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setCurrentView('editor');
      setSelectedSaleId(null);
      // Clean up query param
      window.history.replaceState({ tab: 'sales' }, '', '/sales');
    }
  }, []);

  // Handlers
  const handleNewSale = useCallback(() => {
    setCurrentView('editor');
    setSelectedSaleId(null);
  }, []);

  // Ctrl+N shortcut to open new sale from list view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        // Only trigger from list view (not when already in editor)
        if (currentView === 'list' && !selectedSaleId) {
          e.preventDefault();
          handleNewSale();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, selectedSaleId, handleNewSale]);

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

  // Delete handler
  const handleDeleteSale = useCallback((sale: SaleWithComputed) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Изтриване на продажба',
      message: `Сигурни ли сте, че искате да изтриете продажба „${sale.saleNumber}“?\n\nПродажбата и всички нейни редове ще бъдат изтрити перманентно.\n\nТова действие е необратимо.`,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        const result = await deleteSale(sale.id);
        if (result.success) {
          setToast({ message: `Продажба „${sale.saleNumber}“ е изтрита успешно.`, variant: 'success' });
          if (selectedSaleId === sale.id) {
            setSelectedSaleId(null);
          }
        } else {
          setToast({ message: result.error || 'Грешка при изтриване.', variant: 'error' });
        }
      },
    });
  }, [deleteSale, selectedSaleId]);

  const handleDeleteFromDetail = useCallback(() => {
    if (selectedSaleId) {
      const sale = getSaleById(selectedSaleId);
      if (sale) {
        handleDeleteSale(sale);
      }
    }
  }, [selectedSaleId, getSaleById, handleDeleteSale]);

  // Import handlers
  const handleOpenImport = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleCloseImport = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const handleImportSales = useCallback(async (rows: SaleImportRow[]) => {
    // Групираме редовете по дата за създаване на отделни продажби
    const groupedByDate = groupRowsByDate(rows);
    const newSales: Sale[] = [];
    let saleCounter = allSales.length + 1;

    groupedByDate.forEach((dateRows, dateStr) => {
      const saleLines: SaleLine[] = dateRows.map((row, idx) => {
        const article = articleOptions.find(
          (a) => a.name.toLowerCase() === row.articleName.toLowerCase()
        );
        
        const kgPerPiece = article?.kgPerPiece || 0.3; // Default 300g if not found

        return {
          id: generateId(),
          articleId: article?.id || `imported-article-${idx}`,
          articleName: row.articleName,
          quantity: row.quantity,
          unitPriceEur: row.unitPrice,
          realDeliveryId: row.deliveryId.toString(),
          kgPerPieceSnapshot: kgPerPiece,
          unitCostPerKgRealSnapshot: 0, // Will be set by actual delivery data
        };
      });

      const saleDate = new Date(dateStr);
      const year = saleDate.getFullYear();
      const saleNumber = `S-${year}-${String(saleCounter).padStart(3, '0')}`;

      const newSale: Sale = {
        id: generateId(),
        saleNumber,
        dateTime: saleDate,
        paymentMethod: 'cash',
        status: 'finalized',
        lines: saleLines,
        createdAt: new Date(),
        finalizedAt: new Date(),
      };

      newSales.push(newSale);
      saleCounter++;
    });

    await importSales(newSales);
  }, [allSales.length, articleOptions, importSales]);

  // Get existing article names for validation
  const existingArticleNames = articleOptions.map((a) => a.name);

  // Get selected sale for detail view
  const selectedSale = selectedSaleId ? getSaleById(selectedSaleId) : undefined;

  // Loading state
  if (loading) {
    return (
      <div className="sales">
        <div className="sales__loading">Зареждане на продажби...</div>
      </div>
    );
  }

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
        <SaleDetail sale={selectedSale} onBack={handleBackToList} onDelete={isAdmin ? handleDeleteFromDetail : undefined} />
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
        onImport={handleOpenImport}
        totalCount={allSales.length}
        filteredCount={sales.length}
      />

      <SalesTable
        sales={sales}
        onViewDetail={handleViewDetail}
        onNewSale={handleNewSale}
        onDelete={isAdmin ? handleDeleteSale : undefined}
        stats={stats}
      />

      <ImportSalesDialog
        isOpen={isImportDialogOpen}
        onClose={handleCloseImport}
        onImport={handleImportSales}
        existingArticles={existingArticleNames}
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
