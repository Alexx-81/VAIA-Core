import { useState, useMemo } from 'react';
import type { TabId } from '../../../shared/components/Tabs';
import { DataCards } from '../../../shared/components/DataCards';
import './Dashboard.css';

// Types
type DateRangeOption = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type LedgerView = 'real' | 'accounting';
type PaymentMethod = 'cash' | 'card' | 'other';

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardProps {
  onTabChange?: (tabId: TabId) => void;
}

interface Sale {
  id: number;
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
  id: number;
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

// Mock data for qualities
const mockQualities = [
  { id: 1, name: 'Robusta Uganda' },
  { id: 2, name: 'Arabica Ethiopia' },
  { id: 3, name: 'Robusta Vietnam' },
  { id: 4, name: 'Arabica Colombia' },
  { id: 5, name: 'Blend Premium' },
];

// Mock KPI data
const mockKPIData = {
  revenue: 45320.50,
  cogs: 32150.25,
  profit: 13170.25,
  profitMargin: 29.06,
  soldKg: 1245.5,
  totalItems: 3420,
  salesCount: 156,
  avgSaleValue: 290.52,
};

// Mock sales data
const mockSales: Sale[] = [
  { id: 1, saleNumber: 'S-2026-0156', datetime: new Date('2026-01-11T14:32:00'), paymentMethod: 'card', linesCount: 4, pieces: 12, kg: 3.6, revenue: 86.40, cogs: 54.00, profit: 32.40, margin: 37.5 },
  { id: 2, saleNumber: 'S-2026-0155', datetime: new Date('2026-01-11T13:15:00'), paymentMethod: 'cash', linesCount: 2, pieces: 5, kg: 1.5, revenue: 37.50, cogs: 22.50, profit: 15.00, margin: 40.0 },
  { id: 3, saleNumber: 'S-2026-0154', datetime: new Date('2026-01-11T11:45:00'), paymentMethod: 'cash', linesCount: 6, pieces: 24, kg: 7.2, revenue: 172.80, cogs: 108.00, profit: 64.80, margin: 37.5 },
  { id: 4, saleNumber: 'S-2026-0153', datetime: new Date('2026-01-11T10:20:00'), paymentMethod: 'card', linesCount: 3, pieces: 8, kg: 2.4, revenue: 60.00, cogs: 36.00, profit: 24.00, margin: 40.0 },
  { id: 5, saleNumber: 'S-2026-0152', datetime: new Date('2026-01-10T17:50:00'), paymentMethod: 'other', linesCount: 1, pieces: 50, kg: 15.0, revenue: 337.50, cogs: 225.00, profit: 112.50, margin: 33.3 },
  { id: 6, saleNumber: 'S-2026-0151', datetime: new Date('2026-01-10T16:30:00'), paymentMethod: 'cash', linesCount: 5, pieces: 18, kg: 5.4, revenue: 135.00, cogs: 81.00, profit: 54.00, margin: 40.0 },
  { id: 7, saleNumber: 'S-2026-0150', datetime: new Date('2026-01-10T14:10:00'), paymentMethod: 'card', linesCount: 2, pieces: 6, kg: 1.8, revenue: 45.00, cogs: 27.00, profit: 18.00, margin: 40.0 },
  { id: 8, saleNumber: 'S-2026-0149', datetime: new Date('2026-01-10T12:05:00'), paymentMethod: 'cash', linesCount: 4, pieces: 15, kg: 4.5, revenue: 112.50, cogs: 67.50, profit: 45.00, margin: 40.0 },
];

// Mock low stock deliveries data
const mockLowStockDeliveries: LowStockDelivery[] = [
  { id: 1, deliveryId: 'D-2025-0089', date: new Date('2025-12-15'), quality: 'Robusta Uganda', isInvoiced: true, kgIn: 50.0, kgOut: 47.5, kgRemaining: 2.5, percentRemaining: 5.0, costPerKg: 12.50 },
  { id: 2, deliveryId: 'D-2025-0092', date: new Date('2025-12-22'), quality: 'Arabica Ethiopia', isInvoiced: false, kgIn: 30.0, kgOut: 26.8, kgRemaining: 3.2, percentRemaining: 10.7, costPerKg: 18.00 },
  { id: 3, deliveryId: 'D-2026-0003', date: new Date('2026-01-05'), quality: 'Blend Premium', isInvoiced: true, kgIn: 25.0, kgOut: 21.2, kgRemaining: 3.8, percentRemaining: 15.2, costPerKg: 14.00 },
  { id: 4, deliveryId: 'D-2025-0085', date: new Date('2025-12-10'), quality: 'Robusta Vietnam', isInvoiced: true, kgIn: 40.0, kgOut: 35.5, kgRemaining: 4.5, percentRemaining: 11.25, costPerKg: 11.00 },
];

// Settings mock
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
  return date.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'В брой',
    card: 'Карта',
    other: 'Друго',
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
  return date.toISOString().split('T')[0];
};

export const Dashboard = ({ onTabChange }: DashboardProps) => {
  // State
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>(() => calculateDateRange('this_month'));
  const [ledgerView, setLedgerView] = useState<LedgerView>('real');
  const [selectedQualities, setSelectedQualities] = useState<number[]>([]);
  const [isQualityDropdownOpen, setIsQualityDropdownOpen] = useState(false);

  // Computed values
  const activeDateRange = useMemo(() => {
    if (dateRangeOption === 'custom') {
      return customDateRange;
    }
    return calculateDateRange(dateRangeOption);
  }, [dateRangeOption, customDateRange]);

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
    if (selectedQualities.length === mockQualities.length) {
      setSelectedQualities([]);
    } else {
      setSelectedQualities(mockQualities.map(q => q.id));
    }
  };

  const getSelectedQualitiesLabel = (): string => {
    if (selectedQualities.length === 0 || selectedQualities.length === mockQualities.length) {
      return 'Всички качества';
    }
    if (selectedQualities.length === 1) {
      const quality = mockQualities.find(q => q.id === selectedQualities[0]);
      return quality?.name || 'Избрано: 1';
    }
    return `Избрани: ${selectedQualities.length}`;
  };

  const handleNewSale = () => {
    // Creates new sale (draft) and opens POS tab
    onTabChange?.('sales');
  };

  const handleNewDelivery = () => {
    // Opens Deliveries tab in "Create" mode
    onTabChange?.('deliveries');
  };

  const handleExport = () => {
    // Opens Reports tab with current filters pre-filled
    // Period = current selection, Ledger view = current, Quality filter = current
    onTabChange?.('reports');
  };

  const handleViewAllSales = () => {
    onTabChange?.('sales');
  };

  const handleOpenSale = (saleId: number) => {
    console.log('Opening sale:', saleId);
    onTabChange?.('sales');
  };

  const handleVoidSale = (saleId: number) => {
    console.log('Voiding sale:', saleId);
    // TODO: Implement void/cancel functionality
  };

  const handleOpenDelivery = (deliveryId: number) => {
    console.log('Opening delivery:', deliveryId);
    onTabChange?.('deliveries');
  };

  // KPI Cards configuration
  const kpiCards = [
    // Row 1: Revenue and margin
    {
      title: 'Оборот',
      value: formatCurrency(mockKPIData.revenue),
      icon: '💰',
      color: 'revenue',
    },
    {
      title: 'Себестойност',
      value: formatCurrency(mockKPIData.cogs),
      icon: '📦',
      color: 'cogs',
    },
    {
      title: 'Печалба',
      value: formatCurrency(mockKPIData.profit),
      icon: '📈',
      color: 'profit',
    },
    {
      title: 'Марж',
      value: formatPercent(mockKPIData.profitMargin),
      icon: '📊',
      color: 'margin',
    },
    // Row 2: Quantities and operations
    {
      title: 'Продадени',
      value: `${formatNumber(mockKPIData.soldKg, 1)} kg`,
      icon: '⚖️',
      color: 'quantity',
    },
    {
      title: 'Бройки',
      value: formatNumber(mockKPIData.totalItems),
      icon: '🔢',
      color: 'items',
    },
    {
      title: 'Брой продажби',
      value: formatNumber(mockKPIData.salesCount),
      icon: '🧾',
      color: 'sales',
    },
    {
      title: 'Средна продажба',
      value: formatCurrency(mockKPIData.avgSaleValue),
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
                      checked={selectedQualities.length === 0 || selectedQualities.length === mockQualities.length}
                      onChange={handleSelectAllQualities}
                    />
                    <span>Всички</span>
                  </label>
                  <div className="options-divider" />
                  {mockQualities.map(quality => (
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
          <button className="action-btn primary" onClick={handleNewSale}>
            <span className="btn-icon">+</span>
            Нова продажба
          </button>
          <button className="action-btn primary" onClick={handleNewDelivery}>
            <span className="btn-icon">+</span>
            Нова доставка
          </button>
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
            <> ({activeDateRange.from.toLocaleDateString('bg-BG')} - {activeDateRange.to.toLocaleDateString('bg-BG')})</>
          )}
        </span>
        <span className="ledger-badge">{ledgerView === 'real' ? 'Реален' : 'Счетоводен'}</span>
      </div>

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
                {mockSales.map(sale => (
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
                      <button 
                        className="row-action-btn danger" 
                        onClick={() => handleVoidSale(sale.id)}
                        title="Сторно"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <DataCards
            data={mockSales}
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
                <button className="danger" onClick={() => handleVoidSale(s.id)}>
                  ✕ Сторно
                </button>
              </>
            )}
          />
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
                {mockLowStockDeliveries.map(delivery => (
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
            data={mockLowStockDeliveries}
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

          {mockLowStockDeliveries.length === 0 && (
            <div className="empty-state">
              ✅ Няма доставки с ниска наличност
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
