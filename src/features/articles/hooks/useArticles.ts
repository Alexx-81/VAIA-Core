import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Article, ArticleFormData, ArticleFilters } from '../types';
import { supabase } from '../../../lib/supabase';
import {
  filterAndSortArticles,
  piecesPerKgToGrams,
  validateArticleName,
  validatePiecesPerKg,
} from '../utils/articleUtils';
import { deleteArticle as deleteArticleApi, getArticleDependencies } from '../../../lib/api/articles';

const initialFilters: ArticleFilters = {
  search: '',
  status: 'active',
  sortBy: 'name-asc',
};

// Map DB format to local format
const mapDbArticle = (a: { id: string; name: string; grams_per_piece: number; is_active: boolean; created_at: string; last_sold_at: string | null }): Article => ({
  id: a.id,
  name: a.name,
  gramsPerPiece: a.grams_per_piece,
  isActive: a.is_active,
  createdAt: new Date(a.created_at),
  lastSoldAt: a.last_sold_at ? new Date(a.last_sold_at) : undefined,
});

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ArticleFilters>(initialFilters);

  // Fetch articles from Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('name');

        if (error) throw error;

        const mapped = (data || []).map(mapDbArticle);
        setArticles(mapped);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Филтрирани артикули
  const filteredArticles = useMemo(() => {
    return filterAndSortArticles(articles, filters);
  }, [articles, filters]);

  // Обновява филтри
  const updateFilters = useCallback((partial: Partial<ArticleFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Създава нов артикул
  const createArticle = useCallback(
    async (formData: ArticleFormData): Promise<{ success: boolean; error?: string }> => {
      const existingNames = articles.map((a) => a.name);

      // Валидация на име
      const nameValidation = validateArticleName(formData.name, existingNames);
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error };
      }

      // Валидация на бройки
      const piecesValidation = validatePiecesPerKg(formData.piecesPerKg);
      if (!piecesValidation.isValid) {
        return { success: false, error: piecesValidation.error };
      }

      // Конвертираме от бр./kg към грамове на брой
      const gramsPerPiece = piecesPerKgToGrams(parseFloat(formData.piecesPerKg));

      try {
        const { data, error } = await supabase
          .from('articles')
          .insert({
            name: formData.name.trim(),
            grams_per_piece: gramsPerPiece,
            is_active: formData.isActive,
          })
          .select()
          .single();

        if (error) throw error;

        const newArticle = mapDbArticle(data);
        setArticles((prev) => [...prev, newArticle].sort((a, b) => a.name.localeCompare(b.name)));
        return { success: true };
      } catch (err) {
        console.error('Error creating article:', err);
        return { success: false, error: 'Грешка при създаване на артикул.' };
      }
    },
    [articles]
  );

  // Редактира артикул
  const updateArticle = useCallback(
    async (
      id: string,
      formData: ArticleFormData
    ): Promise<{ success: boolean; error?: string }> => {
      const existingNames = articles
        .filter((a) => a.id !== id)
        .map((a) => a.name);

      // Валидация на име
      const nameValidation = validateArticleName(formData.name, existingNames);
      if (!nameValidation.isValid) {
        return { success: false, error: nameValidation.error };
      }

      // Валидация на бройки
      const piecesValidation = validatePiecesPerKg(formData.piecesPerKg);
      if (!piecesValidation.isValid) {
        return { success: false, error: piecesValidation.error };
      }

      // Конвертираме от бр./kg към грамове на брой
      const gramsPerPiece = piecesPerKgToGrams(parseFloat(formData.piecesPerKg));

      try {
        const { data, error } = await supabase
          .from('articles')
          .update({
            name: formData.name.trim(),
            grams_per_piece: gramsPerPiece,
            is_active: formData.isActive,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        const updatedArticle = mapDbArticle(data);
        setArticles((prev) =>
          prev.map((article) => (article.id === id ? updatedArticle : article))
        );

        return { success: true };
      } catch (err) {
        console.error('Error updating article:', err);
        return { success: false, error: 'Грешка при обновяване на артикул.' };
      }
    },
    [articles]
  );

  // Активира/деактивира артикул
  const toggleArticleStatus = useCallback(async (id: string) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const newStatus = !article.isActive;

    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;

      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: newStatus } : a))
      );
    } catch (err) {
      console.error('Error toggling article status:', err);
    }
  }, [articles]);

  // Изтрива артикул каскадно
  const deleteArticle = useCallback(async (id: string): Promise<{ success: boolean; error?: string; deletedSales?: number }> => {
    try {
      const result = await deleteArticleApi(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      return { success: true, deletedSales: result.deletedSales };
    } catch (err) {
      console.error('Error deleting article:', err);
      return { success: false, error: 'Грешка при изтриване на артикул.' };
    }
  }, []);

  // Проверка на зависимости
  const checkArticleDependencies = useCallback(async (id: string) => {
    try {
      return await getArticleDependencies(id);
    } catch {
      return { saleCount: 0 };
    }
  }, []);

  // Взима артикул по ID
  const getArticleById = useCallback(
    (id: string): Article | undefined => {
      return articles.find((a) => a.id === id);
    },
    [articles]
  );

  return {
    articles: filteredArticles,
    allArticles: articles,
    filters,
    loading,
    updateFilters,
    createArticle,
    updateArticle,
    toggleArticleStatus,
    deleteArticle,
    checkArticleDependencies,
    getArticleById,
  };
};
