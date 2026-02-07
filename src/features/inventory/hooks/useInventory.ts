import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { DeliveryInventory } from '../../../lib/supabase/types';
import type { 
  InventoryFilters, 
  InventoryRealRow, 
  InventoryAccRow, 
  InventoryComparisonRow,
  InventoryStats,
  Quality 
} from '../types';

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
  const [deliveries, setDeliveries] = useState<DeliveryInventory[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);

  // Load deliveries from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('delivery_inventory')
          .select('*')
          .order('date', { ascending: false });

        if (deliveriesError) throw deliveriesError;
        setDeliveries(deliveriesData || []);

        const { data: qualitiesData, error: qualitiesError } = await supabase
          .from('qualities')
          .select('*')
          .order('name');

        if (qualitiesError) throw qualitiesError;
        setQualities((qualitiesData || []).map(q => ({
          id: q.id,
          name: q.name,
          isActive: q.is_active,
        })));
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Real наличности
  const realInventory: InventoryRealRow[] = useMemo(() => {
    return deliveries.map(d => {
      const kgRemainingReal = d.kg_remaining_real || 0;
      const totalCostEur = d.total_cost_eur || 0;
      const revenueRealEur = d.revenue_real_eur || 0;
      const earnedRealEur = d.earned_real_eur || 0;
      
      return {
        deliveryId: d.id || '',
        displayId: d.display_id || '',
        date: d.date ? new Date(d.date) : new Date(),
        qualityId: d.quality_id || 0,
        qualityName: d.quality_name || '',
        invoiceNumber: d.invoice_number || undefined,
        supplierName: d.supplier_name || undefined,
        isInvoiced: d.is_invoiced || false,
        kgIn: d.kg_in || 0,
        unitCostPerKg: d.unit_cost_per_kg || 0,
        kgSoldReal: d.kg_sold_real || 0,
        kgRemainingReal,
        percentRemaining: (d.kg_in || 0) > 0 ? (kgRemainingReal / (d.kg_in || 0)) * 100 : 0,
        totalCostEur,
        valueRemainingRealEur: kgRemainingReal * (d.unit_cost_per_kg || 0),
        revenueRealEur,
        earnedRealEur,
      };
    });
  }, [deliveries]);

  // Accounting наличности
  const accInventory: InventoryAccRow[] = useMemo(() => {
    return deliveries.map(d => {
      const kgRemainingAcc = d.kg_remaining_acc || 0;
      const totalCostEur = d.total_cost_eur || 0;
      const revenueAccEur = d.revenue_acc_eur || 0;
      const earnedAccEur = d.earned_acc_eur || 0;
      
      return {
        deliveryId: d.id || '',
        displayId: d.display_id || '',
        date: d.date ? new Date(d.date) : new Date(),
        qualityId: d.quality_id || 0,
        qualityName: d.quality_name || '',
        invoiceNumber: d.invoice_number || undefined,
        supplierName: d.supplier_name || undefined,
        isInvoiced: d.is_invoiced || false,
        kgIn: d.kg_in || 0,
        unitCostPerKg: d.unit_cost_per_kg || 0,
        kgSoldAcc: d.kg_sold_acc || 0,
        kgRemainingAcc,
        percentRemaining: (d.kg_in || 0) > 0 ? (kgRemainingAcc / (d.kg_in || 0)) * 100 : 0,
        totalCostEur,
        valueRemainingAccEur: kgRemainingAcc * (d.unit_cost_per_kg || 0),
        revenueAccEur,
        earnedAccEur,
      };
    });
  }, [deliveries]);

  // Сравнение Real vs Accounting
  const comparisonInventory: InventoryComparisonRow[] = useMemo(() => {
    return deliveries.map(d => {
      const kgRemainingReal = d.kg_remaining_real || 0;
      const kgRemainingAcc = d.kg_remaining_acc || 0;
      const kgDifference = kgRemainingReal - kgRemainingAcc;
      const revenueRealEur = d.revenue_real_eur || 0;
      const revenueAccEur = d.revenue_acc_eur || 0;
      const earnedRealEur = d.earned_real_eur || 0;
      const earnedAccEur = d.earned_acc_eur || 0;
      
      // Определяне на статус
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (Math.abs(kgDifference) > 0.01) {
        status = Math.abs(kgDifference) > 5 ? 'critical' : 'warning';
      }
      
      return {
        deliveryId: d.id || '',
        displayId: d.display_id || '',
        qualityName: d.quality_name || '',
        kgRemainingReal,
        kgRemainingAcc,
        kgDifference,
        revenueRealEur,
        revenueAccEur,
        earnedRealEur,
        earnedAccEur,
        status,
      };
    });
  }, [deliveries]);

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

  // Уникални доставчици за dropdown
  const suppliers: string[] = useMemo(() => {
    const uniqueSuppliers = new Set<string>();
    deliveries.forEach(d => {
      if (d.supplier_name) {
        uniqueSuppliers.add(d.supplier_name);
      }
    });
    return Array.from(uniqueSuppliers).sort();
  }, [deliveries]);

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
    loading,
  };
};
