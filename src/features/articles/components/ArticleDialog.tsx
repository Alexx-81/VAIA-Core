import type { Article, ArticleFormData } from '../types';
import { useArticleForm } from '../hooks/useArticleForm';
import { useAuth } from '../../../shared/context/AuthContext';
import './ArticleDialog.css';

interface ArticleDialogProps {
  isOpen: boolean;
  article?: Article;
  existingNames: string[];
  onSubmit: (data: ArticleFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  onDelete?: (article: Article) => void;
}

export const ArticleDialog = ({
  isOpen,
  article,
  existingNames,
  onSubmit,
  onClose,
  onDelete,
}: ArticleDialogProps) => {
  const { isAdmin } = useAuth();
  const {
    formData,
    errors,
    warnings,
    touched,
    computedKgPerPiece,
    updateField,
    handleSubmit,
  } = useArticleForm({
    article,
    existingNames,
    onSubmit,
    onClose,
  });

  if (!isOpen) return null;

  const isEdit = !!article;

  return (
    <div className="article-dialog__overlay" onClick={onClose}>
      <div
        className="article-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-dialog-title"
      >
        <div className="article-dialog__header">
          <h2 id="article-dialog-title">
            {isEdit ? 'Редакция на артикул' : 'Нов артикул'}
          </h2>
          <button
            className="article-dialog__close"
            onClick={onClose}
            aria-label="Затвори"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="article-dialog__content">
          {/* Име на артикул */}
          <div className="article-dialog__field">
            <label htmlFor="article-name" className="article-dialog__label">
              Име на артикул <span className="article-dialog__required">*</span>
            </label>
            <input
              id="article-name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="напр. Тениски, Дънки мъжки дълги"
              className={`article-dialog__input ${
                touched.name && errors.name ? 'article-dialog__input--error' : ''
              }`}
              autoFocus
            />
            {touched.name && errors.name && (
              <span className="article-dialog__error">{errors.name}</span>
            )}
          </div>

          {/* Бройки в 1 kg */}
          <div className="article-dialog__field">
            <label htmlFor="article-pieces" className="article-dialog__label">
              Бройки в 1 kg (бр./kg) <span className="article-dialog__required">*</span>
            </label>
            <input
              id="article-pieces"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.piecesPerKg}
              onChange={(e) => updateField('piecesPerKg', e.target.value)}
              placeholder="напр. 5 (за тениски 5 бр. = 1 kg)"
              className={`article-dialog__input ${
                touched.piecesPerKg && errors.piecesPerKg
                  ? 'article-dialog__input--error'
                  : warnings.piecesPerKg
                  ? 'article-dialog__input--warning'
                  : ''
              }`}
            />
            <span className="article-dialog__hint">
              Колко броя от този артикул правят 1 kg? (напр. 5 тениски = 1 kg)
            </span>
            {touched.piecesPerKg && errors.piecesPerKg && (
              <span className="article-dialog__error">{errors.piecesPerKg}</span>
            )}
            {!errors.piecesPerKg && warnings.piecesPerKg && (
              <span className="article-dialog__warning">{warnings.piecesPerKg}</span>
            )}
          </div>

          {/* Изчислени kg/бр (read-only) */}
          <div className="article-dialog__field">
            <label className="article-dialog__label">
              Изчислено тегло на 1 брой
            </label>
            <div className="article-dialog__computed">
              <span className="article-dialog__computed-value">
                {computedKgPerPiece}
              </span>
              <span className="article-dialog__computed-label">kg на брой</span>
            </div>
            <span className="article-dialog__hint">
              Това тегло се използва при продажба за изчисляване на доставната цена.
            </span>
          </div>

          {/* Процент отстъпка */}
          <div className="article-dialog__field">
            <label htmlFor="article-discount-percent" className="article-dialog__label">
              Процент отстъпка (%)
            </label>
            <input
              id="article-discount-percent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.discountPercent}
              onChange={(e) => updateField('discountPercent', e.target.value)}
              placeholder="напр. 10 (за 10% отстъпка)"
              className={`article-dialog__input ${
                touched.discountPercent && errors.discountPercent
                  ? 'article-dialog__input--error'
                  : ''
              }`}
            />
            <span className="article-dialog__hint">
              Отстъпка в проценти (0-100%). Опционално.
            </span>
            {touched.discountPercent && errors.discountPercent && (
              <span className="article-dialog__error">{errors.discountPercent}</span>
            )}
          </div>

          {/* Фиксирана отстъпка */}
          <div className="article-dialog__field">
            <label htmlFor="article-discount-fixed" className="article-dialog__label">
              Фиксирана отстъпка (€)
            </label>
            <input
              id="article-discount-fixed"
              type="number"
              step="0.01"
              min="0"
              value={formData.discountFixedEur}
              onChange={(e) => updateField('discountFixedEur', e.target.value)}
              placeholder="напр. 5.00 (за 5€ отстъпка)"
              className={`article-dialog__input ${
                touched.discountFixedEur && errors.discountFixedEur
                  ? 'article-dialog__input--error'
                  : ''
              }`}
            />
            <span className="article-dialog__hint">
              Фиксирана отстъпка в евро. Опционално.
            </span>
            {touched.discountFixedEur && errors.discountFixedEur && (
              <span className="article-dialog__error">{errors.discountFixedEur}</span>
            )}
          </div>

          {/* Статус */}
          <div className="article-dialog__field">
            <label className="article-dialog__label">Статус</label>
            <div className="article-dialog__toggle-wrapper">
              <button
                type="button"
                className={`article-dialog__toggle ${
                  formData.isActive ? 'article-dialog__toggle--active' : ''
                }`}
                onClick={() => updateField('isActive', !formData.isActive)}
                role="switch"
                aria-checked={formData.isActive}
              >
                <span className="article-dialog__toggle-slider" />
              </button>
              <span className="article-dialog__toggle-label">
                {formData.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>
        </div>

        <div className="article-dialog__footer">
          {isEdit && isAdmin && onDelete && article && (
            <button
              type="button"
              className="article-dialog__btn article-dialog__btn--delete"
              onClick={() => onDelete(article)}
            >
              🗑️ Изтрий
            </button>
          )}
          <div className="article-dialog__footer-right">
            <button
              type="button"
              className="article-dialog__btn article-dialog__btn--cancel"
              onClick={onClose}
            >
              Откажи
            </button>
            <button
              type="button"
              className="article-dialog__btn article-dialog__btn--save"
              onClick={handleSubmit}
            >
              Запази
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
