import type { Article, ArticleWithComputed, ArticleFilters } from '../types';

/**
 * Конвертира грамове в килограми (за показване)
 */
export const gramsToKg = (grams: number): number => {
  return grams / 1000;
};

/**
 * Конвертира килограми в грамове (за съхранение)
 */
export const kgToGrams = (kg: number): number => {
  return Math.round(kg * 1000);
};

/**
 * Конвертира бр./kg в грамове на брой (за съхранение)
 * Пример: 5 бр./kg = 1000g / 5 = 200g на брой
 */
export const piecesPerKgToGrams = (piecesPerKg: number): number => {
  if (piecesPerKg <= 0) return 0;
  return Math.round(1000 / piecesPerKg);
};

/**
 * Форматира kg/бр с 3 десетични знака
 */
export const formatKgPerPiece = (grams: number): string => {
  return gramsToKg(grams).toFixed(3);
};

/**
 * Изчислява бр./kg
 */
export const calculatePiecesPerKg = (grams: number): number => {
  if (grams <= 0) return 0;
  return 1000 / grams;
};

/**
 * Форматира бр./kg с 2 десетични знака
 */
export const formatPiecesPerKg = (grams: number): string => {
  return calculatePiecesPerKg(grams).toFixed(2);
};

/**
 * Добавя computed properties към артикул
 */
export const withComputed = (article: Article): ArticleWithComputed => {
  return {
    ...article,
    kgPerPiece: gramsToKg(article.gramsPerPiece),
    piecesPerKg: calculatePiecesPerKg(article.gramsPerPiece),
  };
};

/**
 * Форматира дата за показване
 */
export const formatDate = (date: Date | undefined): string => {
  if (!date) return '—';
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Филтрира и сортира артикули
 */
export const filterAndSortArticles = (
  articles: Article[],
  filters: ArticleFilters
): Article[] => {
  let result = [...articles];

  // Филтър по търсене
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim();
    result = result.filter((article) =>
      article.name.toLowerCase().includes(searchLower)
    );
  }

  // Филтър по статус
  if (filters.status === 'active') {
    result = result.filter((article) => article.isActive);
  } else if (filters.status === 'inactive') {
    result = result.filter((article) => !article.isActive);
  }

  // Сортиране
  switch (filters.sortBy) {
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name, 'bg'));
      break;
    case 'name-desc':
      result.sort((a, b) => b.name.localeCompare(a.name, 'bg'));
      break;
    case 'newest':
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'most-used':
      // Сортира по последно продавани (най-скорошни първи)
      result.sort((a, b) => {
        if (!a.lastSoldAt && !b.lastSoldAt) return 0;
        if (!a.lastSoldAt) return 1;
        if (!b.lastSoldAt) return -1;
        return b.lastSoldAt.getTime() - a.lastSoldAt.getTime();
      });
      break;
  }

  return result;
};

/**
 * Валидира kg/бр стойност
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export const validateKgPerPiece = (value: string): ValidationResult => {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Въведете валидно число' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Теглото трябва да е по-голямо от 0' };
  }

  let warning: string | undefined;
  if (num < 0.02) {
    warning = 'Твърде малко тегло? Проверете стойността.';
  } else if (num > 5.0) {
    warning = 'Твърде голямо тегло? Проверете стойността.';
  }

  return { isValid: true, warning };
};

/**
 * Валидира бр./kg стойност (бройки в 1 килограм)
 */
export const validatePiecesPerKg = (value: string): ValidationResult => {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Въведете валидно число' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Бройките трябва да са по-голямо от 0' };
  }

  let warning: string | undefined;
  // Ако е под 0.2 бр/kg = над 5 kg на брой (много тежко)
  if (num < 0.2) {
    warning = 'Твърде малко бройки? Това означава над 5 kg на брой.';
  }
  // Ако е над 50 бр/kg = под 0.02 kg на брой (много леко)
  else if (num > 50) {
    warning = 'Твърде много бройки? Това означава под 20 грама на брой.';
  }

  return { isValid: true, warning };
};

/**
 * Валидира име на артикул
 */
export const validateArticleName = (
  name: string,
  existingNames: string[]
): ValidationResult => {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Името е задължително' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Името трябва да е поне 2 символа' };
  }

  // Проверка за уникалност (без текущия артикул при редакция)
  const nameLower = trimmed.toLowerCase();
  const isDuplicate = existingNames.some(
    (existing) => existing.toLowerCase() === nameLower
  );

  if (isDuplicate) {
    return { isValid: false, error: 'Вече има артикул с това име' };
  }

  return { isValid: true };
};

/**
 * Генерира уникално ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
