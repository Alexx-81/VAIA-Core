import { useState, useMemo, useEffect, useCallback } from 'react';
import type { TabId } from '../../../shared/components/Tabs';
import { useAuth } from '../../../shared/context/AuthContext';
import { DataCards } from '../../../shared/components/DataCards';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { getSales, deleteSale } from '../../../lib/api/sales';
import { getDeliveries } from '../../../lib/api/deliveries';
import { getQualities } from '../../../lib/api/qualities';
import type { SalesSummary, DeliveryInventory, Quality } from '../../../lib/supabase/types';
import './Dashboard.css';

// Types
type DateRangeOption = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type LedgerView = 'real' | 'accounting';
type PaymentMethod = 'cash' | 'card' | 'other' | 'no-cash';

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardProps {
  onTabChange?: (tabId: TabId) => void;
}

interface DashboardSale {
  id: string;
  saleNumber: string;
  datetime: Date;
  paymentMethod: PaymentMethod;
  linesCount: number;
  pieces: number;
  kg: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
}

interface LowStockDelivery {
  id: string;
  deliveryId: string;
  date: Date;
  quality: string;
  isInvoiced: boolean;
  kgIn: number;
  kgOut: number;
  kgRemaining: number;
  percentRemaining: number;
  costPerKg: number;
}

// Settings
const LOW_STOCK_THRESHOLD_KG = 5.0;

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('bg-BG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${formatNumber(value, 2)}%`;
};

const formatDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'В брой',
    card: 'Карта',
    other: 'Друго',
    'no-cash': 'Без каса',
  };
  return labels[method];
};

const getDateRangeLabel = (option: DateRangeOption): string => {
  const labels: Record<DateRangeOption, string> = {
    today: 'Днес',
    this_week: 'Тази седмица',
    this_month: 'Този месец',
    last_month: 'Миналия месец',
    this_year: 'Тази година',
    custom: 'Персонализиран',
  };
  return labels[option];
};

const calculateDateRange = (option: DateRangeOption): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (option) {
    case 'today':
      return { from: today, to: today };
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { from: monday, to: today };
    }
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: firstDay, to: today };
    }
    case 'last_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: firstDay, to: lastDay };
    }
    case 'this_year': {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      return { from: firstDay, to: today };
    }
    default:
      return { from: today, to: today };
  }
};

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper за проверка дали дата е в период
const isDateInRange = (date: Date, range: DateRange): boolean => {
  const d = date instanceof Date ? date : new Date(date);
  const from = new Date(range.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(range.to);
  to.setHours(23, 59, 59, 999);
  return d >= from && d <= to;
};

export const Dashboard = ({ onTabChange }: DashboardProps) => {
  const { isReadOnly } = useAuth();

  // State
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>(() => calculateDateRange('this_month'));
  const [ledgerView, setLedgerView] = useState<LedgerView>('real');
  const [selectedQualities, setSelectedQualities] = useState<number[]>([]);
  const [isQualityDropdownOpen, setIsQualityDropdownOpen] = useState(false);
  
  // Data state - зареждаме от Supabase
  const [rawSales, setRawSales] = useState<SalesSummary[]>([]);
  const [rawDeliveries, setRawDeliveries] = useState<DeliveryInventory[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [salesData, deliveriesData, qualitiesData] = await Promise.all([
        getSales({ status: 'finalized' }),
        getDeliveries(),
        getQualities(),
      ]);
      setRawSales(salesData);
      setRawDeliveries(deliveriesData);
      setQualities(qualitiesData.filter(q => q.is_active));
    } catch (error) {
      console.error('Dashboard: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed values
  const activeDateRange = useMemo(() => {
    if (dateRangeOption === 'custom') {
      return customDateRange;
    }
    return calculateDateRange(dateRangeOption);
  }, [dateRangeOption, customDateRange]);

  // Sales are already finalized and computed from sales_summary view
  const computedSales = useMemo(() => {
    return rawSales;
  }, [rawSales]);

  // Filter sales by date range and qualities
  const filteredSales = useMemo(() => {
    return computedSales.filter(sale => {
      if (!sale.date_time) {
        return false;
      }
      const saleDate = new Date(sale.date_time);
      if (Number.isNaN(saleDate.getTime())) {
        return false;
      }
      if (!isDateInRange(saleDate, activeDateRange)) {
        return false;
      }
      // Quality filter - skip if no quality filter or all selected
      if (selectedQualities.length > 0 && selectedQualities.length !== qualities.length) {
        // Check if any line has a quality that matches selected qualities
        // For now, we include all sales (quality filter would need sale->delivery->quality mapping)
      }
      return true;
    });
  }, [computedSales, activeDateRange, selectedQualities, qualities.length]);

  // Deliveries already have computed values from delivery_inventory view
  const computedDeliveries = useMemo(() => {
    return rawDeliveries;
  }, [rawDeliveries]);

  // Low stock deliveries
  const lowStockDeliveries = useMemo((): LowStockDelivery[] => {
    return computedDeliveries
      .flatMap(d => {
        if (!d.id || !d.display_id || !d.date || !d.quality_name) {
          return [];
        }
        const kgIn = d.kg_in ?? 0;
        const kgRemaining = ledgerView === 'real'
          ? d.kg_remaining_real ?? 0
          : d.kg_remaining_acc ?? 0;
        if (kgRemaining <= 0 || kgRemaining > LOW_STOCK_THRESHOLD_KG) {
          return [];
        }
        return [{
          id: d.id,
          deliveryId: d.display_id,
          date: new Date(d.date),
          quality: d.quality_name,
          isInvoiced: d.is_invoiced ?? false,
          kgIn,
          kgOut: ledgerView === 'real' ? d.kg_sold_real ?? 0 : d.kg_sold_acc ?? 0,
          kgRemaining,
          percentRemaining: kgIn > 0 ? (kgRemaining / kgIn) * 100 : 0,
          costPerKg: d.unit_cost_per_kg ?? 0,
        }];
      })
      .sort((a, b) => a.kgRemaining - b.kgRemaining);
  }, [computedDeliveries, ledgerView]);

  // Transform sales for display
  const displaySales = useMemo((): DashboardSale[] => {
    return filteredSales
      .filter((sale): sale is SalesSummary & { id: string; sale_number: string; date_time: string } => {
        return !!sale.id && !!sale.sale_number && !!sale.date_time;
      })
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      .slice(0, 10) // Last 10 sales
      .map(sale => ({
        id: sale.id,
        saleNumber: sale.sale_number,
        datetime: new Date(sale.date_time),
        paymentMethod: (sale.payment_method ?? 'other') as PaymentMethod,
        linesCount: sale.lines_count ?? 0,
        pieces: sale.total_pieces ?? 0,
        kg: sale.total_kg ?? 0,
        revenue: sale.total_revenue_eur ?? 0,
        cogs: ledgerView === 'real' ? sale.total_cogs_real_eur ?? 0 : sale.total_cogs_acc_eur ?? 0,
        profit: ledgerView === 'real' ? sale.total_profit_real_eur ?? 0 : sale.total_profit_acc_eur ?? 0,
        margin: ledgerView === 'real' ? sale.total_margin_real_percent ?? 0 : sale.total_margin_acc_percent ?? 0,
      }));
  }, [filteredSales, ledgerView]);

  // KPI data calculated from filtered sales
  const kpiData = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + (s.total_revenue_eur ?? 0), 0);
    const cogsReal = filteredSales.reduce((sum, s) => sum + (s.total_cogs_real_eur ?? 0), 0);
    const cogsAcc = filteredSales.reduce((sum, s) => sum + (s.total_cogs_acc_eur ?? 0), 0);
    const cogs = ledgerView === 'real' ? cogsReal : cogsAcc;
    const profit = revenue - cogs;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const soldKg = filteredSales.reduce((sum, s) => sum + (s.total_kg ?? 0), 0);
    const totalItems = filteredSales.reduce((sum, s) => sum + (s.total_pieces ?? 0), 0);
    const salesCount = filteredSales.length;
    const avgSaleValue = salesCount > 0 ? revenue / salesCount : 0;

    return {
      revenue,
      cogs,
      profit,
      profitMargin,
      soldKg,
      totalItems,
      salesCount,
      avgSaleValue,
    };
  }, [filteredSales, ledgerView]);

  // Handlers
  const handleDateRangeChange = (option: DateRangeOption) => {
    setDateRangeOption(option);
    if (option !== 'custom') {
      setCustomDateRange(calculateDateRange(option));
    }
  };

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: new Date(value),
    }));
  };

  const handleQualityToggle = (qualityId: number) => {
    setSelectedQualities(prev => 
      prev.includes(qualityId)
        ? prev.filter(id => id !== qualityId)
        : [...prev, qualityId]
    );
  };

  const handleSelectAllQualities = () => {
    if (selectedQualities.length === qualities.length) {
      setSelectedQualities([]);
    } else {
      setSelectedQualities(qualities.map(q => q.id));
    }
  };

  const getSelectedQualitiesLabel = (): string => {
    if (selectedQualities.length === 0 || selectedQualities.length === qualities.length) {
      return 'Всички качества';
    }
    if (selectedQualities.length === 1) {
      const quality = qualities.find(q => q.id === selectedQualities[0]);
      return quality?.name || 'Избрано: 1';
    }
    return `Избрани: ${selectedQualities.length}`;
  };

  const handleNewSale = () => {
    // Creates new sale (draft) and opens POS tab in editor mode
    onTabChange?.('sales');
    // Add query param to signal Sales component to open editor directly
    window.history.replaceState(
      { tab: 'sales' },
      '',
      '/sales?new=true'
    );
  };

  const handleNewDelivery = () => {
    // Opens Deliveries tab in "Create" mode
    onTabChange?.('deliveries');
    // Add query param to signal Deliveries component to open create form
    window.history.replaceState(
      { tab: 'deliveries' },
      '',
      '/deliveries?new=true'
    );
  };

  const handleExport = () => {
    // Opens Reports tab with current filters pre-filled
    // Period = current selection, Ledger view = current, Quality filter = current
    onTabChange?.('reports');
  };

  const handleViewAllSales = () => {
    onTabChange?.('sales');
  };

  const handleOpenSale = (saleId: string) => {
    console.log('Opening sale:', saleId);
    onTabChange?.('sales');
  };

  const handleVoidSale = useCallback((saleId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Сторниране на продажба',
      message: 'Сигурни ли сте, че искате да сторнирате тази продажба? Това действие е необратимо.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await deleteSale(saleId);
          await loadData();
          console.log('Sale voided successfully:', saleId);
        } catch (error) {
          console.error('Error voiding sale:', error);
          setConfirmDialog({
            isOpen: true,
            title: 'Грешка',
            message: error instanceof Error ? error.message : 'Грешка при сторниране на продажбата. Моля, опитайте отново.',
            variant: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
          });
        }
      },
    });
  }, [loadData, confirmDialog]);

  const handleOpenDelivery = (deliveryId: string) => {
    console.log('Opening delivery:', deliveryId);
    onTabChange?.('deliveries');
  };

  // KPI Cards configuration
  const kpiCards = [
    // Row 1: Revenue and margin
    {
      title: 'Оборот',
      value: formatCurrency(kpiData.revenue),
      icon: '💰',
      color: 'revenue',
    },
    {
      title: 'Себестойност',
      value: formatCurrency(kpiData.cogs),
      icon: '📦',
      color: 'cogs',
    },
    {
      title: 'Печалба',
      value: formatCurrency(kpiData.profit),
      icon: '📈',
      color: 'profit',
    },
    {
      title: 'Марж',
      value: formatPercent(kpiData.profitMargin),
      icon: '📊',
      color: 'margin',
    },
    // Row 2: Quantities and operations
    {
      title: 'Продадени',
      value: `${formatNumber(kpiData.soldKg, 1)} kg`,
      icon: '⚖️',
      color: 'quantity',
    },
    {
      title: 'Бройки',
      value: formatNumber(kpiData.totalItems),
      icon: '🔢',
      color: 'items',
    },
    {
      title: 'Брой продажби',
      value: formatNumber(kpiData.salesCount),
      icon: '🧾',
      color: 'sales',
    },
    {
      title: 'Средна продажба',
      value: formatCurrency(kpiData.avgSaleValue),
      icon: '💵',
      color: 'average',
    },
  ];

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-filters">
          {/* Date Range Selector */}
          <div className="filter-group">
            <label className="filter-label">Период</label>
            <div className="date-range-selector">
              <select
                className="filter-select"
                value={dateRangeOption}
                onChange={(e) => handleDateRangeChange(e.target.value as DateRangeOption)}
              >
                <option value="today">Днес</option>
                <option value="this_week">Тази седмица</option>
                <option value="this_month">Този месец</option>
                <option value="last_month">Миналия месец</option>
                <option value="this_year">Тази година</option>
                <option value="custom">Персонализиран</option>
              </select>
              
              {dateRangeOption === 'custom' && (
                <div className="custom-date-inputs">
                  <input
                    type="date"
                    className="date-input"
                    value={formatDateForInput(customDateRange.from)}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  />
                  <span className="date-separator">—</span>
                  <input
                    type="date"
                    className="date-input"
                    value={formatDateForInput(customDateRange.to)}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ledger View Selector */}
          <div className="filter-group">
            <label className="filter-label">Гледна точка</label>
            <div className="segmented-control">
              <button
                className={`segment ${ledgerView === 'real' ? 'active' : ''}`}
                onClick={() => setLedgerView('real')}
              >
                Реален
              </button>
              <button
                className={`segment ${ledgerView === 'accounting' ? 'active' : ''}`}
                onClick={() => setLedgerView('accounting')}
              >
                Счетоводен
              </button>
            </div>
          </div>

          {/* Quality Filter */}
          <div className="filter-group">
            <label className="filter-label">Качество</label>
            <div className="multi-select-dropdown">
              <button
                className="multi-select-trigger"
                onClick={() => setIsQualityDropdownOpen(!isQualityDropdownOpen)}
              >
                <span>{getSelectedQualitiesLabel()}</span>
                <span className={`dropdown-arrow ${isQualityDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {isQualityDropdownOpen && (
                <div className="multi-select-options">
                  <label className="option-item select-all">
                    <input
                      type="checkbox"
                      checked={selectedQualities.length === 0 || selectedQualities.length === qualities.length}
                      onChange={handleSelectAllQualities}
                    />
                    <span>Всички</span>
                  </label>
                  <div className="options-divider" />
                  {qualities.map(quality => (
                    <label key={quality.id} className="option-item">
                      <input
                        type="checkbox"
                        checked={selectedQualities.includes(quality.id)}
                        onChange={() => handleQualityToggle(quality.id)}
                      />
                      <span>{quality.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dashboard-actions">
          {!isReadOnly && (
            <>
              <button className="action-btn primary" onClick={handleNewSale}>
                <span className="btn-icon">+</span>
                Нова продажба
              </button>
              <button className="action-btn primary" onClick={handleNewDelivery}>
                <span className="btn-icon">+</span>
                Нова доставка
              </button>
            </>
          )}
          <button className="action-btn secondary" onClick={handleExport}>
            <span className="btn-icon">📋</span>
            Експорт (месец)
          </button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="date-range-display">
        <span className="range-label">Показване за:</span>
        <span className="range-value">
          {getDateRangeLabel(dateRangeOption)}
          {dateRangeOption === 'custom' && (
            <> ({formatDate(activeDateRange.from)} - {formatDate(activeDateRange.to)})</>
          )}
        </span>
        <span className="ledger-badge">{ledgerView === 'real' ? 'Реален' : 'Счетоводен'}</span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="dashboard__loading">
          <div className="dashboard__loading-spinner"></div>
          <p>Зареждане на данни...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-section">
        <div className="kpi-row">
          <h3 className="kpi-row-title">Оборот и марж</h3>
          <div className="kpi-cards">
            {kpiCards.slice(0, 4).map((card, index) => (
              <div key={index} className={`kpi-card ${card.color}`}>
                <div className="kpi-icon">{card.icon}</div>
                <div className="kpi-content">
                  <span className="kpi-title">{card.title}</span>
                  <span className="kpi-value">{card.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-row">
          <h3 className="kpi-row-title">Количества и операции</h3>
          <div className="kpi-cards">
            {kpiCards.slice(4, 8).map((card, index) => (
              <div key={index} className={`kpi-card ${card.color}`}>
                <div className="kpi-icon">{card.icon}</div>
                <div className="kpi-content">
                  <span className="kpi-title">{card.title}</span>
                  <span className="kpi-value">{card.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="tables-section">
        {/* Last Sales Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">📋 Последни продажби</h3>
            <div className="table-actions">
              <button className="table-action-btn" onClick={handleViewAllSales}>
                Виж всички продажби
              </button>
              <button className="table-action-btn secondary" onClick={handleExport}>
                Експорт на периода
              </button>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="table-wrapper desktop-only">
            <table className="data-table sales-table">
              <thead>
                <tr>
                  <th>Дата/час</th>
                  <th>№ продажба</th>
                  <th>Плащане</th>
                  <th className="text-center">Редове</th>
                  <th className="text-right">Бройки</th>
                  <th className="text-right">kg</th>
                  <th className="text-right">Оборот</th>
                  <th className="text-right">Себест.</th>
                  <th className="text-right">Печалба</th>
                  <th className="text-right">Марж</th>
                  <th className="text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {displaySales.map(sale => (
                  <tr key={sale.id}>
                    <td className="datetime-cell">{formatDateTime(sale.datetime)}</td>
                    <td className="sale-number">{sale.saleNumber}</td>
                    <td>
                      <span className={`payment-badge ${sale.paymentMethod}`}>
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="text-center">{sale.linesCount}</td>
                    <td className="text-right">{formatNumber(sale.pieces)}</td>
                    <td className="text-right">{formatNumber(sale.kg, 1)}</td>
                    <td className="text-right">{formatCurrency(sale.revenue)}</td>
                    <td className="text-right text-muted">{formatCurrency(sale.cogs)}</td>
                    <td className="text-right text-profit">{formatCurrency(sale.profit)}</td>
                    <td className="text-right">{formatPercent(sale.margin)}</td>
                    <td className="actions-cell">
                      <button 
                        className="row-action-btn" 
                        onClick={() => handleOpenSale(sale.id)}
                        title="Отвори"
                      >
                        👁️
                      </button>
                      {!isReadOnly && (
                        <button 
                          className="row-action-btn danger" 
                          onClick={() => handleVoidSale(sale.id)}
                          title="Сторно"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <DataCards
            data={displaySales}
            keyExtractor={(s) => s.id}
            onItemClick={(s) => handleOpenSale(s.id)}
            fields={[
              {
                key: 'kg',
                label: 'Количество',
                render: (s) => `${formatNumber(s.pieces)} бр. / ${formatNumber(s.kg, 1)} kg`,
              },
              {
                key: 'revenue',
                label: 'Оборот',
                render: (s) => <strong>{formatCurrency(s.revenue)}</strong>,
              },
              {
                key: 'profit',
                label: 'Печалба',
                render: (s) => (
                  <span className="text-profit">{formatCurrency(s.profit)} ({formatPercent(s.margin)})</span>
                ),
              },
            ]}
            renderCardTitle={(s) => (
              <>
                <span className="sale-number">{s.saleNumber}</span>
              </>
            )}
            renderCardSubtitle={(s) => formatDateTime(s.datetime)}
            renderCardBadge={(s) => (
              <span className={`payment-badge ${s.paymentMethod}`}>
                {getPaymentMethodLabel(s.paymentMethod)}
              </span>
            )}
            renderCardActions={(s) => (
              <>
                <button className="edit" onClick={() => handleOpenSale(s.id)}>
                  👁️ Отвори
                </button>
                {!isReadOnly && (
                  <button className="danger" onClick={() => handleVoidSale(s.id)}>
                    ✕ Сторно
                  </button>
                )}
              </>
            )}
          />

          {displaySales.length === 0 && (
            <div className="empty-state">
              📋 Няма продажби за избрания период
            </div>
          )}
        </div>

        {/* Low Stock Deliveries Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">⚠️ Наличност под минимум</h3>
            <div className="table-info">
              <span className="threshold-badge">
                Праг: {formatNumber(LOW_STOCK_THRESHOLD_KG, 2)} kg
              </span>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="table-wrapper desktop-only">
            <table className="data-table low-stock-table">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Дата</th>
                  <th>Качество</th>
                  <th className="text-center">Фактурна?</th>
                  <th className="text-right">kg вход</th>
                  <th className="text-right">kg продадени</th>
                  <th className="text-right">kg налични</th>
                  <th className="text-right">% оставащи</th>
                  <th className="text-right">Цена (EUR/kg)</th>
                  <th className="text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {lowStockDeliveries.map(delivery => (
                  <tr key={delivery.id} className={delivery.kgRemaining <= 3 ? 'critical' : ''}>
                    <td className="delivery-id">{delivery.deliveryId}</td>
                    <td>{formatDate(delivery.date)}</td>
                    <td>{delivery.quality}</td>
                    <td className="text-center">
                      <span className={`invoice-badge ${delivery.isInvoiced ? 'yes' : 'no'}`}>
                        {delivery.isInvoiced ? 'Да' : 'Не'}
                      </span>
                    </td>
                    <td className="text-right">{formatNumber(delivery.kgIn, 1)}</td>
                    <td className="text-right text-muted">{formatNumber(delivery.kgOut, 1)}</td>
                    <td className="text-right text-warning">{formatNumber(delivery.kgRemaining, 1)}</td>
                    <td className="text-right">
                      <span className={`percent-badge ${delivery.percentRemaining <= 10 ? 'critical' : 'warning'}`}>
                        {formatPercent(delivery.percentRemaining)}
                      </span>
                    </td>
                    <td className="text-right">{formatCurrency(delivery.costPerKg)}</td>
                    <td className="actions-cell">
                      <button 
                        className="row-action-btn" 
                        onClick={() => handleOpenDelivery(delivery.id)}
                        title="Отвори доставка"
                      >
                        📦
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <DataCards
            data={lowStockDeliveries}
            keyExtractor={(d) => d.id}
            onItemClick={(d) => handleOpenDelivery(d.id)}
            cardClassName={(d) => (d.kgRemaining <= 3 ? 'critical' : '')}
            fields={[
              {
                key: 'kgRemaining',
                label: 'kg налични',
                render: (d) => (
                  <span className="text-warning">{formatNumber(d.kgRemaining, 1)} kg</span>
                ),
              },
              {
                key: 'percentRemaining',
                label: '% оставащи',
                render: (d) => (
                  <span className={`percent-badge ${d.percentRemaining <= 10 ? 'critical' : 'warning'}`}>
                    {formatPercent(d.percentRemaining)}
                  </span>
                ),
              },
              {
                key: 'costPerKg',
                label: 'Цена',
                render: (d) => `${formatCurrency(d.costPerKg)}/kg`,
              },
            ]}
            renderCardTitle={(d) => (
              <>
                <span className="delivery-id">{d.deliveryId}</span>
              </>
            )}
            renderCardSubtitle={(d) => `${d.quality} • ${formatDate(d.date)}`}
            renderCardBadge={(d) => (
              <span className={`invoice-badge ${d.isInvoiced ? 'yes' : 'no'}`}>
                {d.isInvoiced ? 'Фактурна' : 'Без факт.'}
              </span>
            )}
            renderCardActions={(d) => (
              <button className="edit" onClick={() => handleOpenDelivery(d.id)}>
                📦 Отвори доставка
              </button>
            )}
          />

          {lowStockDeliveries.length === 0 && (
            <div className="empty-state">
              ✅ Няма доставки с ниска наличност
            </div>
          )}
        </div>
      </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};
