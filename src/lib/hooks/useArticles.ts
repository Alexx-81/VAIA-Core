// React hooks за Supabase API - Articles
import { useState, useEffect, useCallback } from 'react';
import * as articlesApi from '../api/articles';
import type { ArticleInsert, ArticleUpdate } from '../supabase/types';
import type { ArticleWithComputed } from '../api/articles';

export interface UseArticlesReturn {
  articles: ArticleWithComputed[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createArticle: (data: ArticleInsert) => Promise<ArticleWithComputed>;
  updateArticle: (id: string, data: ArticleUpdate) => Promise<ArticleWithComputed>;
  deactivateArticle: (id: string) => Promise<void>;
  activateArticle: (id: string) => Promise<void>;
}

export function useArticles(activeOnly: boolean = false): UseArticlesReturn {
  const [articles, setArticles] = useState<ArticleWithComputed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = activeOnly 
        ? await articlesApi.getActiveArticles()
        : await articlesApi.getArticles();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при зареждане на артикули');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(async (data: ArticleInsert): Promise<ArticleWithComputed> => {
    const article = await articlesApi.createArticle(data);
    setArticles(prev => [...prev, article].sort((a, b) => a.name.localeCompare(b.name)));
    return article;
  }, []);

  const updateArticle = useCallback(async (id: string, data: ArticleUpdate): Promise<ArticleWithComputed> => {
    const article = await articlesApi.updateArticle(id, data);
    setArticles(prev => prev.map(a => a.id === id ? article : a));
    return article;
  }, []);

  const deactivateArticle = useCallback(async (id: string): Promise<void> => {
    await articlesApi.deactivateArticle(id);
    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_active: false } : a));
  }, []);

  const activateArticle = useCallback(async (id: string): Promise<void> => {
    await articlesApi.activateArticle(id);
    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_active: true } : a));
  }, []);

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    createArticle,
    updateArticle,
    deactivateArticle,
    activateArticle,
  };
}
