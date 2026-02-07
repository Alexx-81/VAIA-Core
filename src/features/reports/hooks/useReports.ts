import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase/types';

type SaleLineComputed = Database['public']['Views']['sale_lines_computed']['Row'];
type DeliveryInventory = Database['public']['Views']['delivery_inventory']['Row'];
type Quality = Database['public']['Tables']['qualities']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'];

const defaultFilters: ReportFilters = {
  period: { preset: 'this-month' },
  mode: 'real',
  reportType: 'by-deliveries',
  qualityIds: [],
  deliveryId: '',
  supplierName: 'all',
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
  const [loading, setLoading] = useState(true);
  
  // Raw data from Supabase
  const [saleLines, setSaleLines] = useState<SaleLineComputed[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryInventory[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [saleLinesRes, deliveriesRes, qualitiesRes, salesRes] = await Promise.all([
          supabase.from('sale_lines_computed').select('*'),
          supabase.from('delivery_inventory').select('*'),
          supabase.from('qualities').select('*').eq('is_active', true),
          supabase.from('sales').select('*').eq('status', 'finalized'),
        ]);

        if (saleLinesRes.error) throw saleLinesRes.error;
        if (deliveriesRes.error) throw deliveriesRes.error;
        if (qualitiesRes.error) throw qualitiesRes.error;
        if (salesRes.error) throw salesRes.error;

        setSaleLines(saleLinesRes.data || []);
        setDeliveries(deliveriesRes.data || []);
        setQualities(qualitiesRes.data || []);
        setSales(salesRes.data || []);
      } catch (error) {
        console.error('Reports: Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Качества за филтъра
  const qualityOptions: QualityOption[] = useMemo(() => {
    return qualities.map(q => ({
      id: String(q.id),
      name: q.name,
      isActive: q.is_active,
    }));
  }, [qualities]);

  // Доставки за филтъра
  const deliveryOptions: DeliveryOption[] = useMemo(() => {
    return deliveries.map(d => ({
      id: d.id,
      displayId: d.display_id,
      qualityName: d.quality_name,
      isInvoiced: d.is_invoiced,
    }));
  }, [deliveries]);

  // Map sales by id for quick lookup
  const salesById = useMemo(() => {
    const map = new Map<number, Sale>();
    sales.forEach(s => map.set(s.id, s));
    return map;
  }, [sales]);

  // Map deliveries by id for quick lookup
  const deliveriesById = useMemo(() => {
    const map = new Map<string, DeliveryInventory>();
    deliveries.forEach(d => map.set(d.id, d));
    return map;
  }, [deliveries]);

  // Филтрирани транзакции
  const allTransactionRows = useMemo((): TransactionReportRow[] => {
    const { from, to } = getPeriodDates(filters.period);
    const rows: TransactionReportRow[] = [];
    
    for (const line of saleLines) {
      const sale = salesById.get(line.sale_id);
      if (!sale) continue;
      
      // Date filter
      const saleDate = new Date(sale.date_time);
      if (saleDate < from || saleDate > to) continue;
      
      // Payment method filter
      if (filters.paymentMethod !== 'all' && sale.payment_method !== filters.paymentMethod) {
        continue;
      }
      
      const realDelivery = deliveriesById.get(line.real_delivery_id);
      const accDeliveryId = line.accounting_delivery_id || line.real_delivery_id;
      const accDelivery = deliveriesById.get(accDeliveryId);
      
      if (!realDelivery) continue;
      
      // Quality filter
      if (filters.qualityIds.length > 0 && !filters.qualityIds.includes(String(realDelivery.quality_id))) {
        continue;
      }
      
      // Delivery filter
      if (filters.deliveryId) {
        const matchesReal = line.real_delivery_id === filters.deliveryId;
        const matchesAcc = accDeliveryId === filters.deliveryId;
        if (filters.mode === 'real' && !matchesReal) continue;
        if (filters.mode === 'accounting' && !matchesAcc) continue;
      }

      // Supplier filter
      if (filters.supplierName && filters.supplierName !== 'all') {
        const deliveryForSupplier = filters.mode === 'real' ? realDelivery : accDelivery;
        if (!deliveryForSupplier || deliveryForSupplier.supplier_name !== filters.supplierName) {
          continue;
        }
      }
      
      // В accounting режим показваме само фактурни
      if (filters.mode === 'accounting' && !accDelivery?.is_invoiced) {
        continue;
      }
      
      rows.push({
        saleDateTime: saleDate,
        saleNumber: sale.sale_number,
        paymentMethod: sale.payment_method,
        articleName: line.article_name,
        pieces: line.quantity,
        kg: line.kg_line,
        pricePerPieceEur: line.unit_price_eur,
        revenueEur: line.revenue_eur,
        realDeliveryId: line.real_delivery_id,
        realDeliveryDisplayId: realDelivery.display_id,
        accountingDeliveryId: accDeliveryId,
        accountingDeliveryDisplayId: accDelivery?.display_id || realDelivery.display_id,
        eurPerKgRealSnapshot: line.unit_cost_per_kg_real_snapshot,
        eurPerKgAccSnapshot: line.unit_cost_per_kg_acc_snapshot,
        cogsRealEur: line.cogs_real_eur,
        cogsAccEur: line.cogs_acc_eur,
        profitRealEur: line.profit_real_eur,
        profitAccEur: line.profit_acc_eur,
      });
    }
    
    return rows.sort((a, b) => a.saleDateTime.getTime() - b.saleDateTime.getTime());
  }, [saleLines, salesById, deliveriesById, filters]);

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
    const grouped = new Map<string, TransactionReportRow[]>();
    
    const groupKey = filters.mode === 'real' ? 'realDeliveryId' : 'accountingDeliveryId';
    const displayKey = filters.mode === 'real' ? 'realDeliveryDisplayId' : 'accountingDeliveryDisplayId';
    
    for (const row of allTransactionRows) {
      const key = row[groupKey];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(row);
    }
    
    const result: DeliveryReportRow[] = [];
    
    for (const [deliveryId, rows] of grouped) {
      const delivery = deliveriesById.get(deliveryId);
      if (!delivery) continue;
      
      const kgSold = rows.reduce((sum, r) => sum + r.kg, 0);
      const piecesSold = rows.reduce((sum, r) => sum + r.pieces, 0);
      const revenueEur = rows.reduce((sum, r) => sum + r.revenueEur, 0);
      const cogsEur = filters.mode === 'real'
        ? rows.reduce((sum, r) => sum + r.cogsRealEur, 0)
        : rows.reduce((sum, r) => sum + r.cogsAccEur, 0);
      const profitEur = revenueEur - cogsEur;
      const totalDeliveryCostEur = delivery.kg_in * delivery.unit_cost_per_kg;
      
      result.push({
        deliveryId,
        deliveryDisplayId: rows[0][displayKey],
        deliveryDate: new Date(delivery.date),
        qualityName: delivery.quality_name,
        invoiceNumber: delivery.invoice_number || '',
        isInvoiced: delivery.is_invoiced,
        kgIn: delivery.kg_in,
        eurPerKgDelivery: delivery.unit_cost_per_kg,
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
  }, [allTransactionRows, filters.mode, deliveriesById]);

  // Групиране по качества
  const qualityRows = useMemo((): QualityReportRow[] => {
    const grouped = new Map<number, TransactionReportRow[]>();
    
    for (const row of allTransactionRows) {
      const delivery = deliveriesById.get(
        filters.mode === 'real' ? row.realDeliveryId : row.accountingDeliveryId
      );
      if (!delivery) continue;
      
      const qualityId = delivery.quality_id;
      if (!grouped.has(qualityId)) {
        grouped.set(qualityId, []);
      }
      grouped.get(qualityId)!.push(row);
    }
    
    const result: QualityReportRow[] = [];
    
    for (const [qualityId, rows] of grouped) {
      const quality = qualities.find(q => q.id === qualityId);
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
  }, [allTransactionRows, filters.mode, deliveriesById, qualities]);

  // Групиране по артикули
  const articleRows = useMemo((): ArticleReportRow[] => {
    const grouped = new Map<string, TransactionReportRow[]>();
    
    for (const row of allTransactionRows) {
      if (!grouped.has(row.articleName)) {
        grouped.set(row.articleName, []);
      }
      grouped.get(row.articleName)!.push(row);
    }
    
    const result: ArticleReportRow[] = [];
    
    for (const [articleName, rows] of grouped) {
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

  // Уникални доставчици за dropdown
  const supplierOptions: string[] = useMemo(() => {
    const uniqueSuppliers = new Set<string>();
    deliveries.forEach(d => {
      if (d.supplier_name) {
        uniqueSuppliers.add(d.supplier_name);
      }
    });
    return Array.from(uniqueSuppliers).sort();
  }, [deliveries]);

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
    supplierOptions,
    isGenerating,
    loading,
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
