// React hooks за Supabase API - Deliveries
import { useState, useEffect, useCallback } from 'react';
import * as deliveriesApi from '../api/deliveries';
import type { DeliveryInsert, DeliveryUpdate, DeliveryInventory } from '../supabase/types';

export interface UseDeliveriesReturn {
  deliveries: DeliveryInventory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDelivery: (data: DeliveryInsert) => Promise<void>;
  updateDelivery: (id: string, data: DeliveryUpdate) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;
}

export function useDeliveries(filters?: deliveriesApi.DeliveryFilters): UseDeliveriesReturn {
  const [deliveries, setDeliveries] = useState<DeliveryInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveriesApi.getDeliveries(filters);
      setDeliveries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при зареждане на доставки');
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const createDelivery = useCallback(async (data: DeliveryInsert): Promise<void> => {
    await deliveriesApi.createDelivery(data);
    await fetchDeliveries();
  }, [fetchDeliveries]);

  const updateDelivery = useCallback(async (id: string, data: DeliveryUpdate): Promise<void> => {
    await deliveriesApi.updateDelivery(id, data);
    await fetchDeliveries();
  }, [fetchDeliveries]);

  const deleteDelivery = useCallback(async (id: string): Promise<void> => {
    await deliveriesApi.deleteDelivery(id);
    await fetchDeliveries();
  }, [fetchDeliveries]);

  return {
    deliveries,
    loading,
    error,
    refetch: fetchDeliveries,
    createDelivery,
    updateDelivery,
    deleteDelivery,
  };
}
