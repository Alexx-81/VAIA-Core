import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  Delivery,
  DeliveryWithComputed,
  DeliveryFilters,
  DeliveryFormData,
  Quality,
  SaleFromDelivery,
  DateRange,
} from '../types';
import { supabase } from '../../../lib/supabase';
import {
  filterDeliveries,
  validateDisplayId,
  validateKg,
  validateUnitCost,
  validateQuality,
  validateDate,
} from '../utils/deliveryUtils';

// Начални филтри
const initialFilters: DeliveryFilters = {
  dateRange: { preset: 'this-month' },
  search: '',
  qualityId: 'all',
  showInactiveQualities: false,
  deliveryType: 'all',
  stockStatus: 'all',
};

// Минимален праг за наличност (от Settings)
const MIN_KG_THRESHOLD = 10;

// Map от DB към локален тип Delivery
interface DbDelivery {
  id: string;
  display_id: string;
  date: string;
  quality_id: number;
  kg_in: number;
  unit_cost_per_kg: number;
  invoice_number: string | null;
  supplier_name: string | null;
  note: string | null;
  created_at: string;
  qualities?: { name: string } | null;
}

const mapDbDelivery = (d: DbDelivery): Delivery => ({
  id: d.id,
  displayId: d.display_id,
  date: new Date(d.date),
  qualityId: d.quality_id,
  qualityName: d.qualities?.name || '',
  kgIn: d.kg_in,
  unitCostPerKg: d.unit_cost_per_kg,
  invoiceNumber: d.invoice_number || undefined,
  supplierName: d.supplier_name || undefined,
  note: d.note || undefined,
  createdAt: new Date(d.created_at),
});

// Map от DB view към DeliveryWithComputed
interface DbDeliveryView {
  id: string;
  display_id: string;
  date: string;
  quality_id: number;
  quality_name: string;
  kg_in: number;
  unit_cost_per_kg: number;
  invoice_number: string | null;
  supplier_name: string | null;
  note: string | null;
  created_at: string;
  is_invoiced: boolean;
  total_cost_eur: number;
  kg_sold_real: number;
  kg_remaining_real: number;
  kg_sold_acc: number;
  kg_remaining_acc: number;
}

const mapDbDeliveryView = (d: DbDeliveryView): DeliveryWithComputed => ({
  id: d.id,
  displayId: d.display_id,
  date: new Date(d.date),
  qualityId: d.quality_id,
  qualityName: d.quality_name,
  kgIn: d.kg_in,
  unitCostPerKg: d.unit_cost_per_kg,
  invoiceNumber: d.invoice_number || undefined,
  supplierName: d.supplier_name || undefined,
  note: d.note || undefined,
  createdAt: new Date(d.created_at),
  isInvoiced: d.is_invoiced,
  totalCostEur: d.total_cost_eur,
  kgSoldReal: d.kg_sold_real,
  kgRemainingReal: d.kg_remaining_real,
  kgSoldAccounting: d.kg_sold_acc,
  kgRemainingAccounting: d.kg_remaining_acc,
});

export const useDeliveries = () => {
  // Основни данни
  const [deliveries, setDeliveries] = useState<DeliveryWithComputed[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters);
  const [loading, setLoading] = useState(true);

  // Fetch deliveries and qualities from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch qualities
        const { data: qualitiesData, error: qualitiesError } = await supabase
          .from('qualities')
          .select('id, name, is_active')
          .order('name');

        if (qualitiesError) throw qualitiesError;

        setQualities(
          (qualitiesData || []).map((q: { id: number; name: string; is_active: boolean }) => ({
            id: q.id,
            name: q.name,
            isActive: q.is_active,
          }))
        );

        // Fetch deliveries from the view (includes computed values)
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('delivery_inventory')
          .select('*')
          .order('date', { ascending: false });

        if (deliveriesError) throw deliveriesError;

        setDeliveries((deliveriesData || []).map(mapDbDeliveryView));
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Филтрирани доставки
  const filteredDeliveries = useMemo(() => {
    return filterDeliveries(deliveries, filters, MIN_KG_THRESHOLD);
  }, [deliveries, filters]);

  // Качества за dropdown (с филтър за неактивни)
  const availableQualities = useMemo(() => {
    if (filters.showInactiveQualities) {
      return qualities;
    }
    return qualities.filter((q) => q.isActive);
  }, [qualities, filters.showInactiveQualities]);

  // Проверка дали има неактивни качества
  const hasInactiveQualities = useMemo(() => {
    return qualities.some((q) => !q.isActive);
  }, [qualities]);

  // Обновяване на филтри
  const updateFilters = useCallback((partial: Partial<DeliveryFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Обновяване на dateRange
  const updateDateRange = useCallback((range: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
  }, []);

  // Списък с всички displayId (за валидация)
  const existingDisplayIds = useMemo(() => {
    return deliveries.map((d) => d.displayId);
  }, [deliveries]);

  // Създаване на нова доставка
  const createDelivery = useCallback(
    async (formData: DeliveryFormData): Promise<{ success: boolean; error?: string }> => {
      // Валидации
      const idValidation = validateDisplayId(formData.displayId, existingDisplayIds);
      if (!idValidation.isValid) {
        return { success: false, error: idValidation.error };
      }

      const dateValidation = validateDate(formData.date);
      if (!dateValidation.isValid) {
        return { success: false, error: dateValidation.error };
      }

      const qualityValidation = validateQuality(formData.qualityId);
      if (!qualityValidation.isValid) {
        return { success: false, error: qualityValidation.error };
      }

      const kgValidation = validateKg(formData.kgIn);
      if (!kgValidation.isValid) {
        return { success: false, error: kgValidation.error };
      }

      const costValidation = validateUnitCost(formData.unitCostPerKg);
      if (!costValidation.isValid) {
        return { success: false, error: costValidation.error };
      }

      // Намираме качеството
      const quality = qualities.find((q) => q.id === parseInt(formData.qualityId, 10));
      if (!quality) {
        return { success: false, error: 'Невалидно качество.' };
      }

      try {
        // Insert into Supabase
        const { data, error } = await supabase
          .from('deliveries')
          .insert({
            display_id: formData.displayId.trim(),
            date: formData.date,
            quality_id: quality.id,
            kg_in: parseFloat(formData.kgIn),
            unit_cost_per_kg: parseFloat(formData.unitCostPerKg),
            invoice_number: formData.invoiceNumber.trim() || null,
            supplier_name: formData.supplierName.trim() || null,
            note: formData.note.trim() || null,
          })
          .select(`
            *,
            qualities!inner(name)
          `)
          .single();

        if (error) throw error;

        // Fetch the delivery with computed values from the view
        const { data: viewData, error: viewError } = await supabase
          .from('delivery_inventory')
          .select('*')
          .eq('id', data.id)
          .single();

        if (viewError) throw viewError;

        const newDelivery = mapDbDeliveryView(viewData);
        setDeliveries((prev) => [newDelivery, ...prev]);
        return { success: true };
      } catch (err) {
        console.error('Error creating delivery:', err);
        return { success: false, error: 'Грешка при създаване на доставка.' };
      }
    },
    [existingDisplayIds, qualities]
  );

  // Редактиране на доставка
  const updateDelivery = useCallback(
    async (id: string, formData: DeliveryFormData, allowFullEdit: boolean): Promise<{ success: boolean; error?: string }> => {
      const delivery = deliveries.find((d) => d.id === id);
      if (!delivery) {
        return { success: false, error: 'Доставката не е намерена.' };
      }

      try {
        // Ако има продажби, позволяваме само промяна на бележка
        if (!allowFullEdit) {
          const { error } = await supabase
            .from('deliveries')
            .update({ note: formData.note.trim() || null })
            .eq('id', id);

          if (error) throw error;

          setDeliveries((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, note: formData.note.trim() || undefined } : d
            )
          );
          return { success: true };
        }

        // Пълна редакция
        const otherIds = existingDisplayIds.filter((did) => did !== delivery.displayId);

        const idValidation = validateDisplayId(formData.displayId, otherIds);
        if (!idValidation.isValid) {
          return { success: false, error: idValidation.error };
        }

        const dateValidation = validateDate(formData.date);
        if (!dateValidation.isValid) {
          return { success: false, error: dateValidation.error };
        }

        const qualityValidation = validateQuality(formData.qualityId);
        if (!qualityValidation.isValid) {
          return { success: false, error: qualityValidation.error };
        }

        const kgValidation = validateKg(formData.kgIn);
        if (!kgValidation.isValid) {
          return { success: false, error: kgValidation.error };
        }

        const costValidation = validateUnitCost(formData.unitCostPerKg);
        if (!costValidation.isValid) {
          return { success: false, error: costValidation.error };
        }

        const quality = qualities.find((q) => q.id === parseInt(formData.qualityId, 10));
        if (!quality) {
          return { success: false, error: 'Невалидно качество.' };
        }

        const { error } = await supabase
          .from('deliveries')
          .update({
            display_id: formData.displayId.trim(),
            date: formData.date,
            quality_id: quality.id,
            kg_in: parseFloat(formData.kgIn),
            unit_cost_per_kg: parseFloat(formData.unitCostPerKg),
            invoice_number: formData.invoiceNumber.trim() || null,
            supplier_name: formData.supplierName.trim() || null,
            note: formData.note.trim() || null,
          })
          .eq('id', id);

        if (error) throw error;

        // Refetch the delivery from view
        const { data: viewData, error: viewError } = await supabase
          .from('delivery_inventory')
          .select('*')
          .eq('id', id)
          .single();

        if (viewError) throw viewError;

        const updatedDelivery = mapDbDeliveryView(viewData);
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? updatedDelivery : d))
        );

        return { success: true };
      } catch (err) {
        console.error('Error updating delivery:', err);
        return { success: false, error: 'Грешка при обновяване на доставка.' };
      }
    },
    [deliveries, existingDisplayIds, qualities]
  );

  // Вземане на една доставка по ID
  const getDeliveryById = useCallback(
    (id: string): DeliveryWithComputed | undefined => {
      return deliveries.find((d) => d.id === id);
    },
    [deliveries]
  );

  // Вземане на продажби за доставка
  const getSalesForDelivery = useCallback(async (deliveryId: string): Promise<SaleFromDelivery[]> => {
    try {
      const { data, error } = await supabase
        .from('sale_lines_computed')
        .select(`
          id,
          article_name,
          quantity,
          kg_sold,
          revenue_eur,
          cogs_eur,
          profit_eur,
          delivery_id_accounting,
          sales!inner(id, sale_number, date_time)
        `)
        .eq('delivery_id_real', deliveryId);

      if (error) throw error;

      return (data || []).map((line: { id: string; article_name: string; quantity: number; kg_sold: number; revenue_eur: number; cogs_eur: number; profit_eur: number; delivery_id_accounting: string | null; sales: { id: string; sale_number: string; date_time: string } }) => ({
        id: line.id,
        dateTime: new Date(line.sales.date_time),
        saleNumber: line.sales.sale_number,
        articleName: line.article_name,
        quantity: line.quantity,
        kgSold: line.kg_sold,
        revenueEur: line.revenue_eur,
        costEur: line.cogs_eur,
        profitEur: line.profit_eur,
        accountingDeliveryId: line.delivery_id_accounting || undefined,
      }));
    } catch (err) {
      console.error('Error fetching sales for delivery:', err);
      return [];
    }
  }, []);

  // Статистики
  const stats = useMemo(() => {
    const total = filteredDeliveries.length;
    const totalKgIn = filteredDeliveries.reduce((sum, d) => sum + d.kgIn, 0);
    const totalKgRemaining = filteredDeliveries.reduce((sum, d) => sum + d.kgRemainingReal, 0);
    const totalCost = filteredDeliveries.reduce((sum, d) => sum + d.totalCostEur, 0);
    const inStock = filteredDeliveries.filter((d) => d.kgRemainingReal > 0).length;
    const depleted = filteredDeliveries.filter((d) => d.kgRemainingReal <= 0).length;

    return {
      total,
      totalKgIn,
      totalKgRemaining,
      totalCost,
      inStock,
      depleted,
    };
  }, [filteredDeliveries]);

  // Импортиране на доставки от Excel
  const importDeliveries = useCallback(async (newDeliveries: Delivery[]): Promise<{ success: boolean; error?: string }> => {
    try {
      // Map to DB format
      const dbDeliveries = newDeliveries.map((d) => ({
        display_id: d.displayId,
        date: d.date.toISOString().split('T')[0],
        quality_id: d.qualityId,
        kg_in: d.kgIn,
        unit_cost_per_kg: d.unitCostPerKg,
        invoice_number: d.invoiceNumber || null,
        supplier_name: d.supplierName || null,
        note: d.note || null,
      }));

      const { data, error } = await supabase
        .from('deliveries')
        .insert(dbDeliveries)
        .select();

      if (error) throw error;

      // Refetch all deliveries to get computed values
      const { data: viewData, error: viewError } = await supabase
        .from('delivery_inventory')
        .select('*')
        .order('date', { ascending: false });

      if (viewError) throw viewError;

      setDeliveries((viewData || []).map(mapDbDeliveryView));
      return { success: true };
    } catch (err) {
      console.error('Error importing deliveries:', err);
      return { success: false, error: 'Грешка при импортиране на доставки.' };
    }
  }, []);

  // Refresh deliveries
  const refreshDeliveries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_inventory')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setDeliveries((data || []).map(mapDbDeliveryView));
    } catch (err) {
      console.error('Error refreshing deliveries:', err);
    }
  }, []);

  return {
    // Данни
    deliveries: filteredDeliveries,
    allDeliveries: deliveries,
    qualities,
    availableQualities,
    hasInactiveQualities,
    loading,
    
    // Филтри
    filters,
    updateFilters,
    updateDateRange,
    
    // Операции
    createDelivery,
    updateDelivery,
    importDeliveries,
    getDeliveryById,
    getSalesForDelivery,
    refreshDeliveries,
    
    // Помощни
    existingDisplayIds,
    stats,
    minKgThreshold: MIN_KG_THRESHOLD,
  };
};
