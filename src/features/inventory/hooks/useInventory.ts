import { useState, useMemo, useCallback } from 'react';
import type { 
  InventoryFilters, 
  InventoryRealRow, 
  InventoryAccRow, 
  InventoryComparisonRow,
  InventoryStats,
  Quality 
} from '../types';
import { mockDeliveries, mockQualities, mockSalesData } from '../../deliveries/data/mockDeliveries';
import { mockSales } from '../../sales/data/mockSales';

const defaultFilters: InventoryFilters = {
  search: '',
  qualityId: 'all',
  supplierName: 'all',
  deliveryType: 'all',
  stockStatus: 'all',
  minKgThreshold: 5,
};

export const useInventory = () => {
  const [filters, setFilters] = useState<InventoryFilters>(defaultFilters);

  // Изчисляване на revenue от продажби за всяка доставка
  const deliveryRevenues = useMemo(() => {
    const realRevenue: Record<string, number> = {};
    const accRevenue: Record<string, number> = {};

    for (const sale of mockSales) {
      if (sale.status !== 'finalized') continue;
      
      for (const line of sale.lines) {
        const lineRevenue = line.quantity * line.unitPriceEur;
        
        // Real revenue
        if (line.realDeliveryId) {
          realRevenue[line.realDeliveryId] = (realRevenue[line.realDeliveryId] || 0) + lineRevenue;
        }
        
        // Accounting revenue
        const accDeliveryId = line.accountingDeliveryId || line.realDeliveryId;
        if (accDeliveryId) {
          accRevenue[accDeliveryId] = (accRevenue[accDeliveryId] || 0) + lineRevenue;
        }
      }
    }

    return { realRevenue, accRevenue };
  }, []);

  // Real наличности
  const realInventory: InventoryRealRow[] = useMemo(() => {
    return mockDeliveries.map(delivery => {
      const salesData = mockSalesData[delivery.id] || { realKgSold: 0, accKgSold: 0 };
      const kgSoldReal = salesData.realKgSold;
      const kgRemainingReal = delivery.kgIn - kgSoldReal;
      const totalCostEur = delivery.kgIn * delivery.unitCostPerKg;
      const revenueRealEur = deliveryRevenues.realRevenue[delivery.id] || 0;
      
      // Ensure date is a Date object (might be string from localStorage)
      const date = delivery.date instanceof Date ? delivery.date : new Date(delivery.date);
      
      return {
        deliveryId: delivery.id,
        displayId: delivery.displayId,
        date,
        qualityId: delivery.qualityId,
        qualityName: delivery.qualityName,
        invoiceNumber: delivery.invoiceNumber,
        supplierName: delivery.supplierName,
        isInvoiced: !!delivery.invoiceNumber,
        kgIn: delivery.kgIn,
        unitCostPerKg: delivery.unitCostPerKg,
        kgSoldReal,
        kgRemainingReal,
        percentRemaining: delivery.kgIn > 0 ? (kgRemainingReal / delivery.kgIn) * 100 : 0,
        totalCostEur,
        valueRemainingRealEur: kgRemainingReal * delivery.unitCostPerKg,
        revenueRealEur,
        earnedRealEur: revenueRealEur - totalCostEur,
      };
    });
  }, [deliveryRevenues]);

  // Accounting наличности
  const accInventory: InventoryAccRow[] = useMemo(() => {
    return mockDeliveries.map(delivery => {
      const salesData = mockSalesData[delivery.id] || { realKgSold: 0, accKgSold: 0 };
      const kgSoldAcc = salesData.accKgSold;
      const kgRemainingAcc = delivery.kgIn - kgSoldAcc;
      const totalCostEur = delivery.kgIn * delivery.unitCostPerKg;
      const revenueAccEur = deliveryRevenues.accRevenue[delivery.id] || 0;
      
      // Ensure date is a Date object (might be string from localStorage)
      const date = delivery.date instanceof Date ? delivery.date : new Date(delivery.date);
      
      return {
        deliveryId: delivery.id,
        displayId: delivery.displayId,
        date,
        qualityId: delivery.qualityId,
        qualityName: delivery.qualityName,
        invoiceNumber: delivery.invoiceNumber,
        supplierName: delivery.supplierName,
        isInvoiced: !!delivery.invoiceNumber,
        kgIn: delivery.kgIn,
        unitCostPerKg: delivery.unitCostPerKg,
        kgSoldAcc,
        kgRemainingAcc,
        percentRemaining: delivery.kgIn > 0 ? (kgRemainingAcc / delivery.kgIn) * 100 : 0,
        totalCostEur,
        valueRemainingAccEur: kgRemainingAcc * delivery.unitCostPerKg,
        revenueAccEur,
        earnedAccEur: revenueAccEur - totalCostEur,
      };
    });
  }, [deliveryRevenues]);

  // Сравнение Real vs Accounting
  const comparisonInventory: InventoryComparisonRow[] = useMemo(() => {
    return mockDeliveries.map(delivery => {
      const salesData = mockSalesData[delivery.id] || { realKgSold: 0, accKgSold: 0 };
      const kgRemainingReal = delivery.kgIn - salesData.realKgSold;
      const kgRemainingAcc = delivery.kgIn - salesData.accKgSold;
      const kgDifference = kgRemainingReal - kgRemainingAcc;
      const totalCostEur = delivery.kgIn * delivery.unitCostPerKg;
      const revenueRealEur = deliveryRevenues.realRevenue[delivery.id] || 0;
      const revenueAccEur = deliveryRevenues.accRevenue[delivery.id] || 0;
      
      // Определяне на статус
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (Math.abs(kgDifference) > 0.01) {
        status = Math.abs(kgDifference) > 5 ? 'critical' : 'warning';
      }
      
      return {
        deliveryId: delivery.id,
        displayId: delivery.displayId,
        qualityName: delivery.qualityName,
        kgRemainingReal,
        kgRemainingAcc,
        kgDifference,
        revenueRealEur,
        revenueAccEur,
        earnedRealEur: revenueRealEur - totalCostEur,
        earnedAccEur: revenueAccEur - totalCostEur,
        status,
      };
    });
  }, [deliveryRevenues]);

  // Филтриране
  const applyFilters = useCallback(<T extends { 
    displayId: string; 
    qualityName: string; 
    qualityId?: number;
    invoiceNumber?: string; 
    supplierName?: string;
    isInvoiced?: boolean;
  }>(
    data: T[], 
    kgRemainingKey: keyof T
  ): T[] => {
    let result = [...data];

    // Търсене
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(row => 
        row.displayId.toLowerCase().includes(searchLower) ||
        row.qualityName.toLowerCase().includes(searchLower) ||
        (row.invoiceNumber && row.invoiceNumber.toLowerCase().includes(searchLower)) ||
        (row.supplierName && row.supplierName.toLowerCase().includes(searchLower))
      );
    }

    // Качество
    if (filters.qualityId !== 'all') {
      const qId = parseInt(filters.qualityId, 10);
      result = result.filter(row => row.qualityId === qId);
    }

    // Доставчик
    if (filters.supplierName && filters.supplierName !== 'all') {
      result = result.filter(row => row.supplierName === filters.supplierName);
    }

    // Тип доставка
    if (filters.deliveryType === 'invoiced') {
      result = result.filter(row => row.isInvoiced === true);
    } else if (filters.deliveryType === 'non-invoiced') {
      result = result.filter(row => row.isInvoiced === false);
    }

    // Статус на наличност
    if (filters.stockStatus !== 'all') {
      result = result.filter(row => {
        const kgRemaining = row[kgRemainingKey] as number;
        switch (filters.stockStatus) {
          case 'in-stock':
            return kgRemaining > filters.minKgThreshold;
          case 'below-minimum':
            return kgRemaining > 0 && kgRemaining <= filters.minKgThreshold;
          case 'depleted':
            return kgRemaining === 0;
          case 'negative':
            return kgRemaining < 0;
          default:
            return true;
        }
      });
    }

    return result;
  }, [filters]);

  // Филтрирани данни
  const filteredRealInventory = useMemo(() => 
    applyFilters(realInventory, 'kgRemainingReal'),
  [realInventory, applyFilters]);

  const filteredAccInventory = useMemo(() => 
    applyFilters(accInventory, 'kgRemainingAcc'),
  [accInventory, applyFilters]);

  const filteredComparisonInventory = useMemo(() => {
    let result = [...comparisonInventory];

    // Търсене
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(row => 
        row.displayId.toLowerCase().includes(searchLower) ||
        row.qualityName.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [comparisonInventory, filters.search]);

  // Статистики за Real
  const realStats: InventoryStats = useMemo(() => {
    const inStock = filteredRealInventory.filter(r => r.kgRemainingReal > filters.minKgThreshold).length;
    const belowMinimum = filteredRealInventory.filter(r => r.kgRemainingReal > 0 && r.kgRemainingReal <= filters.minKgThreshold).length;
    const depleted = filteredRealInventory.filter(r => r.kgRemainingReal <= 0).length;
    const totalKgRemaining = filteredRealInventory.reduce((sum, r) => sum + Math.max(0, r.kgRemainingReal), 0);
    const totalValueRemaining = filteredRealInventory.reduce((sum, r) => sum + Math.max(0, r.valueRemainingRealEur), 0);

    return {
      totalDeliveries: filteredRealInventory.length,
      inStock,
      belowMinimum,
      depleted,
      totalKgRemaining,
      totalValueRemaining,
    };
  }, [filteredRealInventory, filters.minKgThreshold]);

  // Статистики за Accounting
  const accStats: InventoryStats = useMemo(() => {
    const inStock = filteredAccInventory.filter(r => r.kgRemainingAcc > filters.minKgThreshold).length;
    const belowMinimum = filteredAccInventory.filter(r => r.kgRemainingAcc > 0 && r.kgRemainingAcc <= filters.minKgThreshold).length;
    const depleted = filteredAccInventory.filter(r => r.kgRemainingAcc <= 0).length;
    const totalKgRemaining = filteredAccInventory.reduce((sum, r) => sum + Math.max(0, r.kgRemainingAcc), 0);
    const totalValueRemaining = filteredAccInventory.reduce((sum, r) => sum + Math.max(0, r.valueRemainingAccEur), 0);

    return {
      totalDeliveries: filteredAccInventory.length,
      inStock,
      belowMinimum,
      depleted,
      totalKgRemaining,
      totalValueRemaining,
    };
  }, [filteredAccInventory, filters.minKgThreshold]);

  // Качества за dropdown
  const qualities: Quality[] = useMemo(() => mockQualities, []);

  // Уникални доставчици за dropdown
  const suppliers: string[] = useMemo(() => {
    const uniqueSuppliers = new Set<string>();
    mockDeliveries.forEach(d => {
      if (d.supplierName) {
        uniqueSuppliers.add(d.supplierName);
      }
    });
    return Array.from(uniqueSuppliers).sort();
  }, []);

  // Update filters
  const updateFilters = useCallback((updates: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    realInventory: filteredRealInventory,
    accInventory: filteredAccInventory,
    comparisonInventory: filteredComparisonInventory,
    allRealInventory: realInventory,
    allAccInventory: accInventory,
    filters,
    updateFilters,
    realStats,
    accStats,
    qualities,
    suppliers,
  };
};
