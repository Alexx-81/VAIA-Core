import { useState, useCallback } from 'react';
import { useSales } from '../hooks/useSales';
import { SalesFiltersBar } from './SalesFiltersBar';
import { SalesTable } from './SalesTable';
import { SaleEditor } from './SaleEditor';
import { SaleDetail } from './SaleDetail';
import { ImportSalesDialog } from './ImportSalesDialog';
import type { SalesView, SaleWithComputed, Sale, SaleLine } from '../types';
import type { SaleImportRow } from '../utils/importSales';
import { groupRowsByDate } from '../utils/importSales';
import { generateId } from '../utils/salesUtils';
import { mockDeliveries, mockSalesData } from '../../deliveries/data/mockDeliveries';
import './Sales.css';

export const Sales = () => {
  const {
    sales,
    allSales,
    filters,
    updateFilters,
    updateDateRange,
    createSale,
    importSales,
    getSaleById,
    stats,
    articleOptions,
    getDeliveryOptionsReal,
    getDeliveryOptionsAccounting,
  } = useSales();

  // View state
  const [currentView, setCurrentView] = useState<SalesView>('list');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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

  // Import handlers
  const handleOpenImport = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleCloseImport = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const handleImportSales = useCallback((rows: SaleImportRow[]) => {
    // Групираме редовете по дата за създаване на отделни продажби
    const groupedByDate = groupRowsByDate(rows);
    const newSales: Sale[] = [];
    let saleCounter = allSales.length + 1;

    // Track kg sold per delivery for updating mockSalesData
    const kgSoldByDelivery: Record<string, number> = {};

    groupedByDate.forEach((dateRows, dateStr) => {
      const saleLines: SaleLine[] = dateRows.map((row, idx) => {
        const article = articleOptions.find(
          (a) => a.name.toLowerCase() === row.articleName.toLowerCase()
        );
        
        // Намираме доставката за да вземем unitCostPerKg
        const delivery = mockDeliveries.find(d => d.displayId === row.deliveryId.toString() || d.id === row.deliveryId.toString());
        const unitCostPerKg = delivery?.unitCostPerKg || 0;
        const kgPerPiece = article?.kgPerPiece || 0.3; // Default 300g if not found
        const kgLine = row.quantity * kgPerPiece;
        
        // Track kg sold for this delivery
        const deliveryId = delivery?.id || row.deliveryId.toString();
        kgSoldByDelivery[deliveryId] = (kgSoldByDelivery[deliveryId] || 0) + kgLine;

        return {
          id: generateId(),
          articleId: article?.id || `imported-article-${idx}`,
          articleName: row.articleName,
          quantity: row.quantity,
          unitPriceEur: row.unitPrice,
          realDeliveryId: deliveryId,
          kgPerPieceSnapshot: kgPerPiece,
          unitCostPerKgRealSnapshot: unitCostPerKg,
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

    // Update mockSalesData with kg sold per delivery
    Object.entries(kgSoldByDelivery).forEach(([deliveryId, kgSold]) => {
      if (!mockSalesData[deliveryId]) {
        mockSalesData[deliveryId] = { realKgSold: 0, accKgSold: 0 };
      }
      mockSalesData[deliveryId].realKgSold += kgSold;
      mockSalesData[deliveryId].accKgSold += kgSold;
    });

    importSales(newSales);
  }, [allSales.length, articleOptions, importSales]);

  // Get existing article names for validation
  const existingArticleNames = articleOptions.map((a) => a.name);

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
        onImport={handleOpenImport}
        totalCount={allSales.length}
        filteredCount={sales.length}
      />

      <SalesTable
        sales={sales}
        onViewDetail={handleViewDetail}
        onNewSale={handleNewSale}
        stats={stats}
      />

      <ImportSalesDialog
        isOpen={isImportDialogOpen}
        onClose={handleCloseImport}
        onImport={handleImportSales}
        existingArticles={existingArticleNames}
      />
    </div>
  );
};
