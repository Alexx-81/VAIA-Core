import { useState, useMemo, useCallback } from 'react';
import type { 
  ReportFilters,
  ReportSummary,
  ReportData,
  DeliveryReportRow,
  QualityReportRow,
  ArticleReportRow,
  TransactionReportRow,
  ReportMode,
  ReportType,
  ReportPeriod,
  QualityOption,
  DeliveryOption,
} from '../types';
import { mockSales } from '../../sales/data/mockSales';
import { mockDeliveries, mockQualities } from '../../deliveries/data/mockDeliveries';

const defaultFilters: ReportFilters = {
  period: { preset: 'this-month' },
  mode: 'real',
  reportType: 'by-deliveries',
  qualityIds: [],
  deliveryId: '',
  paymentMethod: 'all',
};

// Помощна функция за получаване на период
const getPeriodDates = (period: ReportPeriod): { from: Date; to: Date } => {
  const now = new Date();
  
  if (period.preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  }
  
  if (period.preset === 'last-month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { from, to };
  }
  
  // custom
  return {
    from: period.from || new Date(now.getFullYear(), now.getMonth(), 1),
    to: period.to || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
};

// Форматиране на периода за етикет
const formatPeriodLabel = (period: ReportPeriod): string => {
  const { from, to } = getPeriodDates(period);
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
  
  if (period.preset === 'this-month' || period.preset === 'last-month') {
    return from.toLocaleDateString('bg-BG', opts);
  }
  
  // custom - показваме от-до
  const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return `${from.toLocaleDateString('bg-BG', dateOpts)} - ${to.toLocaleDateString('bg-BG', dateOpts)}`;
};

export const useReports = () => {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [isGenerating, setIsGenerating] = useState(false);

  // Качества за филтъра
  const qualityOptions: QualityOption[] = useMemo(() => {
    return mockQualities.map(q => ({
      id: q.id,
      name: q.name,
      isActive: q.isActive,
    }));
  }, []);

  // Доставки за филтъра
  const deliveryOptions: DeliveryOption[] = useMemo(() => {
    return mockDeliveries.map(d => ({
      id: d.id,
      displayId: d.displayId,
      qualityName: d.qualityName,
      isInvoiced: !!d.invoiceNumber,
    }));
  }, []);

  // Филтрирани финализирани продажби
  const filteredSales = useMemo(() => {
    const { from, to } = getPeriodDates(filters.period);
    
    return mockSales
      .filter(s => s.status === 'finalized')
      .filter(s => s.dateTime >= from && s.dateTime <= to)
      .filter(s => filters.paymentMethod === 'all' || s.paymentMethod === filters.paymentMethod);
  }, [filters.period, filters.paymentMethod]);

  // Всички редове от филтрираните продажби с изчислени стойности
  const allTransactionRows = useMemo((): TransactionReportRow[] => {
    const rows: TransactionReportRow[] = [];
    
    for (const sale of filteredSales) {
      for (const line of sale.lines) {
        const realDelivery = mockDeliveries.find(d => d.id === line.realDeliveryId);
        const accDeliveryId = line.accountingDeliveryId || line.realDeliveryId;
        const accDelivery = mockDeliveries.find(d => d.id === accDeliveryId);
        
        // Пропускаме ако няма доставка
        if (!realDelivery) continue;
        
        // Филтър по качество
        if (filters.qualityIds.length > 0 && !filters.qualityIds.includes(String(realDelivery.qualityId))) {
          continue;
        }
        
        // Филтър по доставка
        if (filters.deliveryId) {
          const matchesReal = line.realDeliveryId === filters.deliveryId;
          const matchesAcc = accDeliveryId === filters.deliveryId;
          if (filters.mode === 'real' && !matchesReal) continue;
          if (filters.mode === 'accounting' && !matchesAcc) continue;
        }
        
        // В accounting режим показваме само фактурни
        if (filters.mode === 'accounting' && !accDelivery?.invoiceNumber) {
          continue;
        }
        
        const kg = line.quantity * line.kgPerPieceSnapshot;
        const revenue = line.quantity * line.unitPriceEur;
        const cogsReal = kg * line.unitCostPerKgRealSnapshot;
        const cogsAcc = kg * (line.unitCostPerKgAccSnapshot || line.unitCostPerKgRealSnapshot);
        
        rows.push({
          saleDateTime: sale.dateTime,
          saleNumber: sale.saleNumber,
          paymentMethod: sale.paymentMethod,
          articleName: line.articleName,
          pieces: line.quantity,
          kg,
          pricePerPieceEur: line.unitPriceEur,
          revenueEur: revenue,
          realDeliveryId: line.realDeliveryId,
          realDeliveryDisplayId: realDelivery.displayId,
          accountingDeliveryId: accDeliveryId,
          accountingDeliveryDisplayId: accDelivery?.displayId || realDelivery.displayId,
          eurPerKgRealSnapshot: line.unitCostPerKgRealSnapshot,
          eurPerKgAccSnapshot: line.unitCostPerKgAccSnapshot || line.unitCostPerKgRealSnapshot,
          cogsRealEur: cogsReal,
          cogsAccEur: cogsAcc,
          profitRealEur: revenue - cogsReal,
          profitAccEur: revenue - cogsAcc,
        });
      }
    }
    
    return rows.sort((a, b) => a.saleDateTime.getTime() - b.saleDateTime.getTime());
  }, [filteredSales, filters.qualityIds, filters.deliveryId, filters.mode]);

  // Summary статистики
  const summary = useMemo((): ReportSummary => {
    const revenueEur = allTransactionRows.reduce((sum, r) => sum + r.revenueEur, 0);
    const cogsEur = filters.mode === 'real'
      ? allTransactionRows.reduce((sum, r) => sum + r.cogsRealEur, 0)
      : allTransactionRows.reduce((sum, r) => sum + r.cogsAccEur, 0);
    const profitEur = revenueEur - cogsEur;
    
    // Уникални продажби
    const uniqueSales = new Set(allTransactionRows.map(r => r.saleNumber));
    
    return {
      revenueEur,
      cogsEur,
      profitEur,
      marginPercent: revenueEur > 0 ? (profitEur / revenueEur) * 100 : 0,
      totalKg: allTransactionRows.reduce((sum, r) => sum + r.kg, 0),
      totalPieces: allTransactionRows.reduce((sum, r) => sum + r.pieces, 0),
      salesCount: uniqueSales.size,
    };
  }, [allTransactionRows, filters.mode]);

  // Групиране по доставки
  const deliveryRows = useMemo((): DeliveryReportRow[] => {
    const groupKey = filters.mode === 'real' ? 'realDeliveryId' : 'accountingDeliveryId';
    const displayKey = filters.mode === 'real' ? 'realDeliveryDisplayId' : 'accountingDeliveryDisplayId';
    
    const grouped = new Map<string, TransactionReportRow[]>();
    
    for (const row of allTransactionRows) {
      const key = row[groupKey];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(row);
    }
    
    const result: DeliveryReportRow[] = [];
    
    for (const [deliveryId, rows] of grouped) {
      const delivery = mockDeliveries.find(d => d.id === deliveryId);
      if (!delivery) continue;
      
      const kgSold = rows.reduce((sum, r) => sum + r.kg, 0);
      const piecesSold = rows.reduce((sum, r) => sum + r.pieces, 0);
      const revenueEur = rows.reduce((sum, r) => sum + r.revenueEur, 0);
      const cogsEur = filters.mode === 'real'
        ? rows.reduce((sum, r) => sum + r.cogsRealEur, 0)
        : rows.reduce((sum, r) => sum + r.cogsAccEur, 0);
      const profitEur = revenueEur - cogsEur;
      const totalDeliveryCostEur = delivery.kgIn * delivery.unitCostPerKg;
      
      result.push({
        deliveryId,
        deliveryDisplayId: rows[0][displayKey],
        deliveryDate: delivery.date,
        qualityName: delivery.qualityName,
        invoiceNumber: delivery.invoiceNumber || '',
        isInvoiced: !!delivery.invoiceNumber,
        kgIn: delivery.kgIn,
        eurPerKgDelivery: delivery.unitCostPerKg,
        totalDeliveryCostEur,
        kgSold,
        piecesSold,
        revenueEur,
        cogsEur,
        profitEur,
        marginPercent: revenueEur > 0 ? (profitEur / revenueEur) * 100 : 0,
        avgPricePerKgEur: kgSold > 0 ? revenueEur / kgSold : 0,
        earnedFromDeliveryEur: revenueEur - totalDeliveryCostEur,
      });
    }
    
    return result.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());
  }, [allTransactionRows, filters.mode]);

  // Групиране по качества
  const qualityRows = useMemo((): QualityReportRow[] => {
    const grouped = new Map<number, TransactionReportRow[]>();
    
    for (const row of allTransactionRows) {
      const delivery = mockDeliveries.find(d => 
        filters.mode === 'real' ? d.id === row.realDeliveryId : d.id === row.accountingDeliveryId
      );
      if (!delivery) continue;
      
      const qualityId = delivery.qualityId;
      if (!grouped.has(qualityId)) {
        grouped.set(qualityId, []);
      }
      grouped.get(qualityId)!.push(row);
    }
    
    const result: QualityReportRow[] = [];
    
    for (const [qualityId, rows] of grouped) {
      const quality = mockQualities.find(q => q.id === qualityId);
      if (!quality) continue;
      
      const kgSold = rows.reduce((sum, r) => sum + r.kg, 0);
      const piecesSold = rows.reduce((sum, r) => sum + r.pieces, 0);
      const revenueEur = rows.reduce((sum, r) => sum + r.revenueEur, 0);
      const cogsEur = filters.mode === 'real'
        ? rows.reduce((sum, r) => sum + r.cogsRealEur, 0)
        : rows.reduce((sum, r) => sum + r.cogsAccEur, 0);
      const profitEur = revenueEur - cogsEur;
      
      result.push({
        qualityId,
        qualityName: quality.name,
        kgSold,
        piecesSold,
        revenueEur,
        cogsEur,
        profitEur,
        marginPercent: revenueEur > 0 ? (profitEur / revenueEur) * 100 : 0,
        avgPricePerKgEur: kgSold > 0 ? revenueEur / kgSold : 0,
      });
    }
    
    return result.sort((a, b) => b.revenueEur - a.revenueEur);
  }, [allTransactionRows, filters.mode]);

  // Групиране по артикули
  const articleRows = useMemo((): ArticleReportRow[] => {
    const grouped = new Map<string, { name: string; rows: TransactionReportRow[] }>();
    
    for (const row of allTransactionRows) {
      if (!grouped.has(row.articleName)) {
        grouped.set(row.articleName, { name: row.articleName, rows: [] });
      }
      grouped.get(row.articleName)!.rows.push(row);
    }
    
    const result: ArticleReportRow[] = [];
    
    for (const [articleName, { rows }] of grouped) {
      const piecesSold = rows.reduce((sum, r) => sum + r.pieces, 0);
      const kgSold = rows.reduce((sum, r) => sum + r.kg, 0);
      const revenueEur = rows.reduce((sum, r) => sum + r.revenueEur, 0);
      const cogsEur = filters.mode === 'real'
        ? rows.reduce((sum, r) => sum + r.cogsRealEur, 0)
        : rows.reduce((sum, r) => sum + r.cogsAccEur, 0);
      const profitEur = revenueEur - cogsEur;
      
      result.push({
        articleId: articleName,
        articleName,
        piecesSold,
        kgSold,
        revenueEur,
        cogsEur,
        profitEur,
        marginPercent: revenueEur > 0 ? (profitEur / revenueEur) * 100 : 0,
        avgPricePerPieceEur: piecesSold > 0 ? revenueEur / piecesSold : 0,
      });
    }
    
    return result.sort((a, b) => b.revenueEur - a.revenueEur);
  }, [allTransactionRows, filters.mode]);

  // Пълни данни за отчета
  const reportData = useMemo((): ReportData => {
    return {
      filters,
      summary,
      deliveryRows,
      qualityRows,
      articleRows,
      transactionRows: allTransactionRows,
      generatedAt: new Date(),
      periodLabel: formatPeriodLabel(filters.period),
    };
  }, [filters, summary, deliveryRows, qualityRows, articleRows, allTransactionRows]);

  // Обновяване на филтри
  const updateFilters = useCallback((updates: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePeriod = useCallback((period: ReportPeriod) => {
    setFilters(prev => ({ ...prev, period }));
  }, []);

  const updateMode = useCallback((mode: ReportMode) => {
    setFilters(prev => ({ ...prev, mode }));
  }, []);

  const updateReportType = useCallback((reportType: ReportType) => {
    setFilters(prev => ({ ...prev, reportType }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Генериране на отчет (симулация)
  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    // Симулираме забавяне
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsGenerating(false);
    return reportData;
  }, [reportData]);

  // Филтриране по конкретна доставка (от таблицата)
  const filterByDelivery = useCallback((deliveryId: string) => {
    setFilters(prev => ({
      ...prev,
      deliveryId,
      reportType: 'detailed',
    }));
  }, []);

  return {
    filters,
    reportData,
    summary,
    deliveryRows,
    qualityRows,
    articleRows,
    transactionRows: allTransactionRows,
    qualityOptions,
    deliveryOptions,
    isGenerating,
    updateFilters,
    updatePeriod,
    updateMode,
    updateReportType,
    resetFilters,
    generateReport,
    filterByDelivery,
    getPeriodDates,
    formatPeriodLabel,
  };
};
