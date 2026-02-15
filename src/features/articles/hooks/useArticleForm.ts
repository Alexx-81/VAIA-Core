import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Article, ArticleFormData } from '../types';
import { calculatePiecesPerKg, validateArticleName, validatePiecesPerKg } from '../utils/articleUtils';

interface UseArticleFormProps {
  article?: Article;
  existingNames: string[];
  onSubmit: (data: ArticleFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const useArticleForm = ({
  article,
  existingNames,
  onSubmit,
  onClose,
}: UseArticleFormProps) => {
  const [formData, setFormData] = useState<ArticleFormData>({
    name: '',
    piecesPerKg: '',
    isActive: true,
    discountPercent: '0',
    discountFixedEur: '0',
  });

  const [errors, setErrors] = useState<{ 
    name?: string; 
    piecesPerKg?: string;
    discountPercent?: string;
    discountFixedEur?: string;
  }>({});
  const [warnings, setWarnings] = useState<{ piecesPerKg?: string }>({});
  const [touched, setTouched] = useState<{ 
    name: boolean; 
    piecesPerKg: boolean;
    discountPercent: boolean;
    discountFixedEur: boolean;
  }>({
    name: false,
    piecesPerKg: false,
    discountPercent: false,
    discountFixedEur: false,
  });

  // Зарежда данни при редакция
  useEffect(() => {
    if (article) {
      // Конвертираме от gramsPerPiece към piecesPerKg
      const piecesPerKg = calculatePiecesPerKg(article.gramsPerPiece);
      setFormData({
        name: article.name,
        piecesPerKg: piecesPerKg.toFixed(2),
        isActive: article.isActive,
        discountPercent: article.discountPercent.toString(),
        discountFixedEur: article.discountFixedEur.toString(),
      });
    } else {
      setFormData({
        name: '',
        piecesPerKg: '',
        isActive: true,
        discountPercent: '0',
        discountFixedEur: '0',
      });
    }
    setErrors({});
    setWarnings({});
    setTouched({ 
      name: false, 
      piecesPerKg: false,
      discountPercent: false,
      discountFixedEur: false,
    });
  }, [article]);

  // Филтрира имената без текущия артикул
  const filteredNames = useMemo(() => {
    if (article) {
      return existingNames.filter((n) => n.toLowerCase() !== article.name.toLowerCase());
    }
    return existingNames;
  }, [existingNames, article]);

  // Валидира форма
  const validate = useCallback(() => {
    const newErrors: { 
      name?: string; 
      piecesPerKg?: string;
      discountPercent?: string;
      discountFixedEur?: string;
    } = {};
    const newWarnings: { piecesPerKg?: string } = {};

    // Валидация на име
    const nameResult = validateArticleName(formData.name, filteredNames);
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error;
    }

    // Валидация на бройки
    const piecesResult = validatePiecesPerKg(formData.piecesPerKg);
    if (!piecesResult.isValid) {
      newErrors.piecesPerKg = piecesResult.error;
    } else if (piecesResult.warning) {
      newWarnings.piecesPerKg = piecesResult.warning;
    }

    // Валидация на процент отстъпка
    const discountPercent = parseFloat(formData.discountPercent);
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      newErrors.discountPercent = 'Процентът трябва да е между 0 и 100';
    }

    // Валидация на фиксирана отстъпка
    const discountFixed = parseFloat(formData.discountFixedEur);
    if (isNaN(discountFixed) || discountFixed < 0) {
      newErrors.discountFixedEur = 'Фиксираната отстъпка не може да е отрицателна';
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  }, [formData, filteredNames]);

  // Валидира при промяна на данни
  useEffect(() => {
    if (touched.name || touched.piecesPerKg) {
      validate();
    }
  }, [formData, touched, validate]);

  // Обновява поле
  const updateField = useCallback(
    <K extends keyof ArticleFormData>(field: K, value: ArticleFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  // Изчислени kg/бр (от въведените бройки)
  const computedKgPerPiece = useMemo(() => {
    const pieces = parseFloat(formData.piecesPerKg);
    if (isNaN(pieces) || pieces <= 0) return '—';
    return (1 / pieces).toFixed(3);
  }, [formData.piecesPerKg]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    setTouched({ 
      name: true, 
      piecesPerKg: true,
      discountPercent: true,
      discountFixedEur: true,
    });
    
    if (!validate()) {
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    } else if (result.error) {
      setErrors((prev) => ({ ...prev, name: result.error }));
    }
  }, [formData, validate, onSubmit, onClose]);

  return {
    formData,
    errors,
    warnings,
    touched,
    computedKgPerPiece,
    updateField,
    handleSubmit,
    isValid: Object.keys(errors).length === 0 && formData.name.trim() && formData.piecesPerKg,
  };
};
