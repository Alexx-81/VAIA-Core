import { useState, useCallback, useMemo } from 'react';
import type {
  Delivery,
  DeliveryWithComputed,
  DeliveryFilters,
  DeliveryFormData,
  Quality,
  SaleFromDelivery,
  DateRange,
} from '../types';
import { mockDeliveries, mockQualities, getMockSalesForDelivery, saveDeliveries } from '../data/mockDeliveries';
import {
  computeDeliveryValues,
  filterDeliveries,
  validateDisplayId,
  validateKg,
  validateUnitCost,
  validateQuality,
  validateDate,
  generateId,
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

export const useDeliveries = () => {
  // Основни данни - инициализираме от текущото състояние на mockDeliveries
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => [...mockDeliveries]);
  const [qualities] = useState<Quality[]>(mockQualities);
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters);

  // Изчислени доставки
  const deliveriesWithComputed = useMemo(() => {
    return deliveries.map(computeDeliveryValues);
  }, [deliveries]);

  // Филтрирани доставки
  const filteredDeliveries = useMemo(() => {
    return filterDeliveries(deliveriesWithComputed, filters, MIN_KG_THRESHOLD);
  }, [deliveriesWithComputed, filters]);

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
    (formData: DeliveryFormData): { success: boolean; error?: string } => {
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

      // Създаваме нова доставка
      const newDelivery: Delivery = {
        id: generateId(),
        displayId: formData.displayId.trim(),
        date: new Date(formData.date),
        qualityId: quality.id,
        qualityName: quality.name,
        kgIn: parseFloat(formData.kgIn),
        unitCostPerKg: parseFloat(formData.unitCostPerKg),
        invoiceNumber: formData.invoiceNumber.trim() || undefined,
        supplierName: formData.supplierName.trim() || undefined,
        note: formData.note.trim() || undefined,
        createdAt: new Date(),
      };

      // Добавяме към state
      setDeliveries((prev) => [...prev, newDelivery]);
      // Също мутираме mockDeliveries за споделяне с други модули и персистентност при смяна на таб
      mockDeliveries.push(newDelivery);
      // Записваме в localStorage
      saveDeliveries();
      return { success: true };
    },
    [existingDisplayIds, qualities]
  );

  // Редактиране на доставка
  const updateDelivery = useCallback(
    (id: string, formData: DeliveryFormData, allowFullEdit: boolean): { success: boolean; error?: string } => {
      const delivery = deliveriesWithComputed.find((d) => d.id === id);
      if (!delivery) {
        return { success: false, error: 'Доставката не е намерена.' };
      }

      // Ако има продажби, позволяваме само промяна на бележка
      if (!allowFullEdit) {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, note: formData.note.trim() || undefined }
              : d
          )
        );
        // Синхронизираме с mockDeliveries
        const mockIndex = mockDeliveries.findIndex((d) => d.id === id);
        if (mockIndex !== -1) {
          mockDeliveries[mockIndex] = { ...mockDeliveries[mockIndex], note: formData.note.trim() || undefined };
        }
        // Записваме в localStorage
        saveDeliveries();
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

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                displayId: formData.displayId.trim(),
                date: new Date(formData.date),
                qualityId: quality.id,
                qualityName: quality.name,
                kgIn: parseFloat(formData.kgIn),
                unitCostPerKg: parseFloat(formData.unitCostPerKg),
                invoiceNumber: formData.invoiceNumber.trim() || undefined,
                supplierName: formData.supplierName.trim() || undefined,
                note: formData.note.trim() || undefined,
              }
            : d
        )
      );
      // Синхронизираме с mockDeliveries
      const mockIndex = mockDeliveries.findIndex((d) => d.id === id);
      if (mockIndex !== -1) {
        mockDeliveries[mockIndex] = {
          ...mockDeliveries[mockIndex],
          displayId: formData.displayId.trim(),
          date: new Date(formData.date),
          qualityId: quality.id,
          qualityName: quality.name,
          kgIn: parseFloat(formData.kgIn),
          unitCostPerKg: parseFloat(formData.unitCostPerKg),
          invoiceNumber: formData.invoiceNumber.trim() || undefined,
          supplierName: formData.supplierName.trim() || undefined,
          note: formData.note.trim() || undefined,
        };
      }
      // Записваме в localStorage
      saveDeliveries();
      return { success: true };
    },
    [deliveriesWithComputed, existingDisplayIds, qualities]
  );

  // Вземане на една доставка по ID
  const getDeliveryById = useCallback(
    (id: string): DeliveryWithComputed | undefined => {
      return deliveriesWithComputed.find((d) => d.id === id);
    },
    [deliveriesWithComputed]
  );

  // Вземане на продажби за доставка
  const getSalesForDelivery = useCallback((deliveryId: string): SaleFromDelivery[] => {
    return getMockSalesForDelivery(deliveryId);
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
  const importDeliveries = useCallback((newDeliveries: Delivery[]) => {
    // Добавяме към state
    setDeliveries((prev) => [...prev, ...newDeliveries]);
    // Също мутираме mockDeliveries за споделяне с други модули (useSales)
    mockDeliveries.push(...newDeliveries);
    // Записваме в localStorage
    saveDeliveries();
  }, []);

  return {
    // Данни
    deliveries: filteredDeliveries,
    allDeliveries: deliveriesWithComputed,
    qualities,
    availableQualities,
    hasInactiveQualities,
    
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
    
    // Помощни
    existingDisplayIds,
    stats,
    minKgThreshold: MIN_KG_THRESHOLD,
  };
};
