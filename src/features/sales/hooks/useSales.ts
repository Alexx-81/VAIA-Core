import { useState, useMemo, useCallback } from 'react';
import type { 
  Sale, 
  SaleWithComputed, 
  SalesFilters, 
  SalesDateRange,
  SaleLineFormData,
  PaymentMethod,
  DeliveryOption,
  ArticleOption,
  SaleLine,
} from '../types';
import { mockSales, getNextSaleNumber } from '../data/mockSales';
import { computeSale, getDateRangeFromPreset, generateId } from '../utils/salesUtils';
import { mockDeliveries, mockSalesData } from '../../deliveries/data/mockDeliveries';
import { mockArticles } from '../../articles/data/mockArticles';

const defaultFilters: SalesFilters = {
  dateRange: { preset: 'this-month' },
  search: '',
  paymentMethod: 'all',
};

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>(() => [...mockSales]);
  const [filters, setFilters] = useState<SalesFilters>(defaultFilters);
  const [deliverySalesKg, setDeliverySalesKg] = useState<Record<string, { real: number; acc: number }>>(
    // Инициализираме от mockSalesData
    Object.fromEntries(
      Object.entries(mockSalesData).map(([id, data]) => [id, { real: data.realKgSold, acc: data.accKgSold }])
    )
  );

  // Computed sales
  const computedSales = useMemo(() => {
    return sales
      .filter(s => s.status === 'finalized')
      .map(computeSale)
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [sales]);

  // Филтрирани продажби
  const filteredSales = useMemo(() => {
    let result = computedSales;

    // Филтър по период
    if (filters.dateRange.preset === 'all') {
      // Показваме всички - без филтър по период
    } else if (filters.dateRange.preset !== 'custom') {
      const { from, to } = getDateRangeFromPreset(filters.dateRange.preset);
      result = result.filter(s => s.dateTime >= from && s.dateTime <= to);
    } else if (filters.dateRange.from && filters.dateRange.to) {
      result = result.filter(s => 
        s.dateTime >= filters.dateRange.from! && s.dateTime <= filters.dateRange.to!
      );
    }

    // Филтър по търсене
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(s => 
        s.saleNumber.toLowerCase().includes(searchLower) ||
        (s.note && s.note.toLowerCase().includes(searchLower))
      );
    }

    // Филтър по метод на плащане
    if (filters.paymentMethod !== 'all') {
      result = result.filter(s => s.paymentMethod === filters.paymentMethod);
    }

    return result;
  }, [computedSales, filters]);

  // Статистики за филтрираните продажби
  const stats = useMemo(() => {
    return {
      totalSales: filteredSales.length,
      totalPieces: filteredSales.reduce((sum, s) => sum + s.totalPieces, 0),
      totalKg: filteredSales.reduce((sum, s) => sum + s.totalKg, 0),
      totalRevenueEur: filteredSales.reduce((sum, s) => sum + s.totalRevenueEur, 0),
      totalProfitRealEur: filteredSales.reduce((sum, s) => sum + s.totalProfitRealEur, 0),
    };
  }, [filteredSales]);

  // Активни артикули за dropdown
  const articleOptions: ArticleOption[] = useMemo(() => {
    return mockArticles
      .filter(a => a.isActive)
      .map(a => ({
        id: a.id,
        name: a.name,
        kgPerPiece: a.gramsPerPiece / 1000,
        gramsPerPiece: a.gramsPerPiece,
      }));
  }, []);

  // Доставки с Real наличност за dropdown
  const getDeliveryOptionsReal = useCallback((excludeKgForLines?: { deliveryId: string; kg: number }[]): DeliveryOption[] => {
    return mockDeliveries.map(d => {
      const salesKg = deliverySalesKg[d.id]?.real || 0;
      // Изключваме kg от текущите редове (за да не броим двойно)
      const excludeKg = excludeKgForLines
        ?.filter(l => l.deliveryId === d.id)
        .reduce((sum, l) => sum + l.kg, 0) || 0;
      const kgRemaining = d.kgIn - salesKg + excludeKg;
      
      return {
        id: d.id,
        displayId: d.displayId,
        qualityName: d.qualityName,
        kgRemaining,
        unitCostPerKg: d.unitCostPerKg,
        isInvoiced: !!d.invoiceNumber,
      };
    }).filter(d => d.kgRemaining > 0);
  }, [deliverySalesKg]);

  // Само фактурни доставки за Accounting dropdown
  const getDeliveryOptionsAccounting = useCallback((excludeKgForLines?: { deliveryId: string; kg: number }[]): DeliveryOption[] => {
    return mockDeliveries
      .filter(d => !!d.invoiceNumber)
      .map(d => {
        const salesKg = deliverySalesKg[d.id]?.acc || 0;
        const excludeKg = excludeKgForLines
          ?.filter(l => l.deliveryId === d.id)
          .reduce((sum, l) => sum + l.kg, 0) || 0;
        const kgRemaining = d.kgIn - salesKg + excludeKg;
        
        return {
          id: d.id,
          displayId: d.displayId,
          qualityName: d.qualityName,
          kgRemaining,
          unitCostPerKg: d.unitCostPerKg,
          isInvoiced: true,
        };
      })
      .filter(d => d.kgRemaining > 0);
  }, [deliverySalesKg]);

  // Update filters
  const updateFilters = useCallback((updates: Partial<SalesFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDateRange = useCallback((dateRange: SalesDateRange) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  // Създаване на нова продажба
  const createSale = useCallback((
    formData: { dateTime: Date; paymentMethod: PaymentMethod; note?: string },
    lines: SaleLineFormData[]
  ): { success: boolean; error?: string; sale?: SaleWithComputed } => {
    // Валидация
    if (lines.length === 0) {
      return { success: false, error: 'Добавете поне един ред към продажбата.' };
    }

    // Проверка на наличности и подготовка на линиите
    const saleLines: SaleLine[] = [];
    const kgChanges: { deliveryId: string; realKg: number; accKg: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const article = articleOptions.find(a => a.id === line.articleId);
      const realDelivery = mockDeliveries.find(d => d.id === line.realDeliveryId);
      
      if (!article) {
        return { success: false, error: `Ред ${i + 1}: Невалиден артикул.` };
      }
      if (!realDelivery) {
        return { success: false, error: `Ред ${i + 1}: Невалидна Real доставка.` };
      }

      const quantity = parseInt(line.quantity, 10);
      const unitPriceEur = parseFloat(line.unitPriceEur);
      const kgLine = quantity * article.kgPerPiece;

      // Проверка за Real наличност
      const currentRealKg = deliverySalesKg[realDelivery.id]?.real || 0;
      const pendingRealKg = kgChanges
        .filter(c => c.deliveryId === realDelivery.id)
        .reduce((sum, c) => sum + c.realKg, 0);
      const availableRealKg = realDelivery.kgIn - currentRealKg - pendingRealKg;
      
      if (kgLine > availableRealKg) {
        return { 
          success: false, 
          error: `Ред ${i + 1}: Недостатъчна Real наличност в доставка ${realDelivery.displayId}. Налични: ${availableRealKg.toFixed(2)} kg, нужни: ${kgLine.toFixed(2)} kg.` 
        };
      }

      // Проверка за A-доставки
      const isRealInvoiced = !!realDelivery.invoiceNumber;
      let accountingDeliveryId: string | undefined;
      let unitCostPerKgAccSnapshot: number | undefined;

      if (!isRealInvoiced) {
        if (!line.accountingDeliveryId) {
          return { success: false, error: `Ред ${i + 1}: За A-доставка е задължително да изберете Accounting доставка.` };
        }
        
        const accDelivery = mockDeliveries.find(d => d.id === line.accountingDeliveryId);
        if (!accDelivery || !accDelivery.invoiceNumber) {
          return { success: false, error: `Ред ${i + 1}: Невалидна Accounting доставка.` };
        }

        // Проверка за Accounting наличност
        const currentAccKg = deliverySalesKg[accDelivery.id]?.acc || 0;
        const pendingAccKg = kgChanges
          .filter(c => c.deliveryId === accDelivery.id)
          .reduce((sum, c) => sum + c.accKg, 0);
        const availableAccKg = accDelivery.kgIn - currentAccKg - pendingAccKg;
        
        if (kgLine > availableAccKg) {
          return { 
            success: false, 
            error: `Ред ${i + 1}: Недостатъчна Accounting наличност в доставка ${accDelivery.displayId}. Налични: ${availableAccKg.toFixed(2)} kg, нужни: ${kgLine.toFixed(2)} kg.` 
          };
        }

        accountingDeliveryId = accDelivery.id;
        unitCostPerKgAccSnapshot = accDelivery.unitCostPerKg;
        kgChanges.push({ deliveryId: accDelivery.id, realKg: 0, accKg: kgLine });
      }

      kgChanges.push({ deliveryId: realDelivery.id, realKg: kgLine, accKg: isRealInvoiced ? kgLine : 0 });

      saleLines.push({
        id: generateId(),
        articleId: article.id,
        articleName: article.name,
        quantity,
        unitPriceEur,
        realDeliveryId: realDelivery.id,
        accountingDeliveryId,
        kgPerPieceSnapshot: article.kgPerPiece,
        unitCostPerKgRealSnapshot: realDelivery.unitCostPerKg,
        unitCostPerKgAccSnapshot,
      });
    }

    // Създаване на продажбата
    const newSale: Sale = {
      id: generateId(),
      saleNumber: getNextSaleNumber(sales),
      dateTime: formData.dateTime,
      paymentMethod: formData.paymentMethod,
      note: formData.note || undefined,
      status: 'finalized',
      lines: saleLines,
      createdAt: new Date(),
      finalizedAt: new Date(),
    };

    // Update state
    setSales(prev => [...prev, newSale]);
    
    // Update delivery kg
    setDeliverySalesKg(prev => {
      const newState = { ...prev };
      for (const change of kgChanges) {
        if (!newState[change.deliveryId]) {
          newState[change.deliveryId] = { real: 0, acc: 0 };
        }
        newState[change.deliveryId] = {
          real: newState[change.deliveryId].real + change.realKg,
          acc: newState[change.deliveryId].acc + change.accKg,
        };
      }
      return newState;
    });

    return { success: true, sale: computeSale(newSale) };
  }, [sales, articleOptions, deliverySalesKg]);

  // Get sale by ID
  const getSaleById = useCallback((id: string): SaleWithComputed | undefined => {
    const sale = sales.find(s => s.id === id);
    return sale ? computeSale(sale) : undefined;
  }, [sales]);

  // Импортиране на продажби от Excel
  const importSales = useCallback((newSales: Sale[]) => {
    setSales(prev => [...prev, ...newSales]);
    // Също мутираме mockSales за споделяне с други модули
    mockSales.push(...newSales);
  }, []);

  return {
    sales: filteredSales,
    allSales: computedSales,
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
  };
};
