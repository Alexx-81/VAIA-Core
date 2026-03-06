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
import { groupRowsByDateAndPayment } from '../utils/importSales';
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
    deliveries,
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
    // Групираме редовете по дата и метод на плащане за създаване на отделни продажби
    const grouped = groupRowsByDateAndPayment(rows);
    const newSales: Sale[] = [];
    const importErrors: string[] = [];
    let saleCounter = allSales.length + 1;

    grouped.forEach((groupRows, key) => {
      const [dateStr, paymentMethod] = key.split('|');
      const saleLines: SaleLine[] = [];

      groupRows.forEach((row, idx) => {
        // Намери артикул по име
        const article = articleOptions.find(
          (a) => a.name.trim().toLowerCase() === row.articleName.trim().toLowerCase()
        );
        if (!article) {
          importErrors.push(`Артикул "${row.articleName}" не е намерен в системата и е пропуснат.`);
          return;
        }

        // Намери реалната доставка по display_id ("1", "2", "1A" и т.н.)
        const realDelivery = deliveries.find(
          (d) => String(d.display_id).trim().toLowerCase() === String(row.deliveryId).trim().toLowerCase()
        );
        if (!realDelivery) {
          importErrors.push(`Доставка ID "${row.deliveryId}" (ред ${idx + 2}) не е намерена и е пропусната.`);
          return;
        }

        // Ако Real дост. съдържа "A" → вземи Acc. доставка от колоната в Excel-а
        // Ако НЕ съдържа "A" → и двете полета са същата доставка (realDelivery)
        const realIdStr = String(row.deliveryId).trim().toUpperCase();
        let accountingDeliveryId: string | undefined;
        let unitCostPerKgAccSnapshot: number | undefined;

        if (realIdStr.includes('A') && row.accountingDeliveryId !== undefined) {
          const accDelivery = deliveries.find(
            (d) => String(d.display_id).trim().toLowerCase() === String(row.accountingDeliveryId).trim().toLowerCase()
          );
          if (!accDelivery) {
            importErrors.push(`Acc. доставка ID "${row.accountingDeliveryId}" (ред ${idx + 2}) не е намерена — ще се използва само реалната доставка.`);
            // Fall back: leave accountingDeliveryId undefined
          } else {
            accountingDeliveryId = accDelivery.id;
            unitCostPerKgAccSnapshot = accDelivery.unit_cost_per_kg ?? 0;
          }
        } else if (!realIdStr.includes('A')) {
          // Real доставката е с фактура → accounting = real (same ID, но полето се оставя null по DB логиката)
          // Не задаваме accountingDeliveryId; DB-то третира NULL acc = same as real
        }

        saleLines.push({
          id: generateId(),
          articleId: article.id,
          articleName: article.name,
          quantity: row.quantity,
          unitPriceEur: row.unitPrice,
          realDeliveryId: realDelivery.id,
          accountingDeliveryId,
          kgPerPieceSnapshot: article.kgPerPiece,
          unitCostPerKgRealSnapshot: realDelivery.unit_cost_per_kg ?? 0,
          unitCostPerKgAccSnapshot,
        });
      });

      if (saleLines.length === 0) return; // Пропускаме продажби без редове

      const saleDate = new Date(dateStr);
      const year = saleDate.getFullYear();
      const saleNumber = `S-${year}-${String(saleCounter).padStart(3, '0')}`;

      const newSale: Sale = {
        id: generateId(),
        saleNumber,
        dateTime: saleDate,
        paymentMethod: paymentMethod as 'cash' | 'no-cash',
        status: 'finalized',
        lines: saleLines,
        createdAt: new Date(),
        finalizedAt: new Date(),
      };

      newSales.push(newSale);
      saleCounter++;
    });

    if (newSales.length === 0) {
      setToast({ message: `Импортът е неуспешен: ${importErrors.join(' ')}`, variant: 'error' });
      return;
    }

    const result = await importSales(newSales);
    if (result.success) {
      const warn = importErrors.length > 0 ? ` Предупреждения: ${importErrors.join(' ')}` : '';
      setToast({ message: `Успешно импортирани ${newSales.length} продажби.${warn}`, variant: importErrors.length > 0 ? 'warning' : 'success' });
    } else {
      setToast({ message: result.error || 'Грешка при импорт', variant: 'error' });
    }
  }, [allSales.length, articleOptions, deliveries, importSales]);

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
        <SaleDetail sale={selectedSale} onBack={handleBackToList} onDelete={isAdmin ? handleDeleteFromDetail : undefined} deliveries={deliveries} />
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
