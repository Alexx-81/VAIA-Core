// React hooks за Supabase API
import { useState, useEffect, useCallback } from 'react';
import * as qualitiesApi from '../api/qualities';
import type { Quality, QualityInsert, QualityUpdate } from '../supabase/types';

export interface UseQualitiesReturn {
  qualities: Quality[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createQuality: (data: QualityInsert) => Promise<Quality>;
  updateQuality: (id: number, data: QualityUpdate) => Promise<Quality>;
  deactivateQuality: (id: number) => Promise<void>;
  activateQuality: (id: number) => Promise<void>;
}

export function useQualities(activeOnly: boolean = false): UseQualitiesReturn {
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQualities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = activeOnly 
        ? await qualitiesApi.getActiveQualities()
        : await qualitiesApi.getQualities();
      setQualities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при зареждане на качества');
      console.error('Error fetching qualities:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchQualities();
  }, [fetchQualities]);

  const createQuality = useCallback(async (data: QualityInsert): Promise<Quality> => {
    const quality = await qualitiesApi.createQuality(data);
    setQualities(prev => [...prev, quality].sort((a, b) => a.name.localeCompare(b.name)));
    return quality;
  }, []);

  const updateQuality = useCallback(async (id: number, data: QualityUpdate): Promise<Quality> => {
    const quality = await qualitiesApi.updateQuality(id, data);
    setQualities(prev => prev.map(q => q.id === id ? quality : q));
    return quality;
  }, []);

  const deactivateQuality = useCallback(async (id: number): Promise<void> => {
    await qualitiesApi.deactivateQuality(id);
    setQualities(prev => prev.map(q => q.id === id ? { ...q, is_active: false } : q));
  }, []);

  const activateQuality = useCallback(async (id: number): Promise<void> => {
    await qualitiesApi.activateQuality(id);
    setQualities(prev => prev.map(q => q.id === id ? { ...q, is_active: true } : q));
  }, []);

  return {
    qualities,
    loading,
    error,
    refetch: fetchQualities,
    createQuality,
    updateQuality,
    deactivateQuality,
    activateQuality,
  };
}
