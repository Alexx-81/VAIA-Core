import { useState, useEffect, useCallback } from 'react';
import type { Article, ArticleFormData, ArticleFilters } from '../types';
import { mockArticles, saveArticles } from '../data/mockArticles';
import {
  filterAndSortArticles,
  piecesPerKgToGrams,
  validateArticleName,
  validatePiecesPerKg,
  generateId,
} from '../utils/articleUtils';

const initialFilters: ArticleFilters = {
  search: '',
  status: 'active',
  sortBy: 'name-asc',
};

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [filters, setFilters] = useState<ArticleFilters>(initialFilters);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  // Прилага филтри при промяна
  useEffect(() => {
    const result = filterAndSortArticles(articles, filters);
    setFilteredArticles(result);
  }, [articles, filters]);

  // Обновява филтри
  const updateFilters = useCallback((partial: Partial<ArticleFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Създава нов артикул
  const createArticle = useCallback(
    (formData: ArticleFormData): { success: boolean; error?: string } => {
      const existingNames = articles
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

      const newArticle: Article = {
        id: generateId(),
        name: formData.name.trim(),
        gramsPerPiece,
        isActive: formData.isActive,
        createdAt: new Date(),
      };

      setArticles((prev) => [...prev, newArticle]);
      // Синхронизираме с mockArticles и записваме в localStorage
      mockArticles.push(newArticle);
      saveArticles();
      return { success: true };
    },
    [articles]
  );

  // Редактира артикул
  const updateArticle = useCallback(
    (
      id: string,
      formData: ArticleFormData
    ): { success: boolean; error?: string } => {
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

      setArticles((prev) =>
        prev.map((article) =>
          article.id === id
            ? {
                ...article,
                name: formData.name.trim(),
                gramsPerPiece,
                isActive: formData.isActive,
              }
            : article
        )
      );

      // Синхронизираме с mockArticles и записваме в localStorage
      const mockIndex = mockArticles.findIndex((a) => a.id === id);
      if (mockIndex !== -1) {
        mockArticles[mockIndex] = {
          ...mockArticles[mockIndex],
          name: formData.name.trim(),
          gramsPerPiece,
          isActive: formData.isActive,
        };
      }
      saveArticles();

      return { success: true };
    },
    [articles]
  );

  // Активира/деактивира артикул
  const toggleArticleStatus = useCallback((id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id
          ? { ...article, isActive: !article.isActive }
          : article
      )
    );
    
    // Синхронизираме с mockArticles и записваме в localStorage
    const mockIndex = mockArticles.findIndex((a) => a.id === id);
    if (mockIndex !== -1) {
      mockArticles[mockIndex] = {
        ...mockArticles[mockIndex],
        isActive: !mockArticles[mockIndex].isActive,
      };
    }
    saveArticles();
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
    updateFilters,
    createArticle,
    updateArticle,
    toggleArticleStatus,
    getArticleById,
  };
};
