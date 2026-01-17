import { useState, useCallback, useEffect } from 'react';
import type { DeliveryWithComputed, DeliveryFormData, Quality, DeliveryFormWarning } from '../types';
import {
  toDateInputValue,
  formatEur,
  validateDisplayId,
  validateDate,
  validateQuality,
  validateKg,
  validateUnitCost,
  getFormWarnings,
  canEditDelivery,
  roundToTwo,
} from '../utils/deliveryUtils';
import './DeliveryDialog.css';

interface DeliveryDialogProps {
  isOpen: boolean;
  delivery?: DeliveryWithComputed;
  qualities: Quality[];
  existingDisplayIds: string[];
  onSubmit: (data: DeliveryFormData, allowFullEdit: boolean) => { success: boolean; error?: string };
  onClose: () => void;
}

const initialFormData: DeliveryFormData = {
  displayId: '',
  date: toDateInputValue(new Date()),
  qualityId: '',
  kgIn: '',
  unitCostPerKg: '',
  invoiceNumber: '',
  note: '',
};

export const DeliveryDialog = ({
  isOpen,
  delivery,
  qualities,
  existingDisplayIds,
  onSubmit,
  onClose,
}: DeliveryDialogProps) => {
  const [formData, setFormData] = useState<DeliveryFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DeliveryFormWarning[]>([]);

  const isEdit = !!delivery;
  const editRestrictions = delivery ? canEditDelivery(delivery) : { canEdit: true };
  const allowFullEdit = !isEdit || editRestrictions.canEdit;

  // Попълваме формата при редакция
  useEffect(() => {
    if (isOpen) {
      if (delivery) {
        setFormData({
          displayId: delivery.displayId,
          date: toDateInputValue(delivery.date),
          qualityId: delivery.qualityId.toString(),
          kgIn: delivery.kgIn.toString(),
          unitCostPerKg: delivery.unitCostPerKg.toString(),
          invoiceNumber: delivery.invoiceNumber || '',
          note: delivery.note || '',
        });
      } else {
        setFormData(initialFormData);
      }
      setFormError(null);
      setWarnings([]);
    }
  }, [isOpen, delivery]);

  // Обновяване на предупреждения при промяна на формата
  useEffect(() => {
    if (isOpen) {
      setWarnings(getFormWarnings(formData));
    }
  }, [formData, isOpen]);

  // Изчислена обща сума
  const computedTotalCost = useCallback(() => {
    const kg = parseFloat(formData.kgIn);
    const cost = parseFloat(formData.unitCostPerKg);
    if (!isNaN(kg) && !isNaN(cost) && kg > 0 && cost >= 0) {
      return roundToTwo(kg * cost);
    }
    return 0;
  }, [formData.kgIn, formData.unitCostPerKg]);

  const handleChange = useCallback(
    (field: keyof DeliveryFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormError(null);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    // Валидация (само ако allowFullEdit)
    if (allowFullEdit) {
      const idValidation = validateDisplayId(
        formData.displayId,
        existingDisplayIds,
        isEdit ? delivery?.displayId : undefined
      );
      if (!idValidation.isValid) {
        setFormError(idValidation.error!);
        return;
      }

      const dateValidation = validateDate(formData.date);
      if (!dateValidation.isValid) {
        setFormError(dateValidation.error!);
        return;
      }

      const qualityValidation = validateQuality(formData.qualityId);
      if (!qualityValidation.isValid) {
        setFormError(qualityValidation.error!);
        return;
      }

      const kgValidation = validateKg(formData.kgIn);
      if (!kgValidation.isValid) {
        setFormError(kgValidation.error!);
        return;
      }

      const costValidation = validateUnitCost(formData.unitCostPerKg);
      if (!costValidation.isValid) {
        setFormError(costValidation.error!);
        return;
      }
    }

    const result = onSubmit(formData, allowFullEdit);
    if (!result.success) {
      setFormError(result.error || 'Възникна грешка при запазването.');
    } else {
      onClose();
    }
  }, [formData, allowFullEdit, existingDisplayIds, isEdit, delivery, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="delivery-dialog__overlay" onClick={onClose}>
      <div
        className="delivery-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="delivery-dialog__header">
          <h2>{isEdit ? 'Редакция на доставка' : 'Нова доставка'}</h2>
          <button className="delivery-dialog__close" onClick={onClose} aria-label="Затвори">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="delivery-dialog__content">
          {/* Грешка */}
          {formError && (
            <div className="delivery-dialog__error">
              <span className="delivery-dialog__error-icon">⚠️</span>
              {formError}
            </div>
          )}

          {/* Предупреждение за редакция */}
          {isEdit && !editRestrictions.canEdit && (
            <div className="delivery-dialog__warning">
              <span className="delivery-dialog__warning-icon">ℹ️</span>
              {editRestrictions.reason}
            </div>
          )}

          {/* Предупреждения за формата */}
          {warnings.map((warning, idx) => (
            <div key={idx} className="delivery-dialog__warning">
              <span className="delivery-dialog__warning-icon">⚠️</span>
              {warning.message}
            </div>
          ))}

          {/* ID на доставка */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">
              ID на доставка <span className="delivery-dialog__required">*</span>
            </label>
            <input
              type="text"
              value={formData.displayId}
              onChange={(e) => handleChange('displayId', e.target.value)}
              placeholder="напр. 1, 1A, 2"
              className="delivery-dialog__input"
              disabled={!allowFullEdit}
              autoFocus={allowFullEdit}
            />
            <span className="delivery-dialog__hint">
              Уникален идентификатор. "A" се използва за доставки без фактура.
            </span>
          </div>

          {/* Дата */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">
              Дата <span className="delivery-dialog__required">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="delivery-dialog__input"
              disabled={!allowFullEdit}
            />
          </div>

          {/* Качество */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">
              Качество <span className="delivery-dialog__required">*</span>
            </label>
            <select
              value={formData.qualityId}
              onChange={(e) => handleChange('qualityId', e.target.value)}
              className="delivery-dialog__select"
              disabled={!allowFullEdit}
            >
              <option value="">— Избери качество —</option>
              {qualities.map((q) => (
                <option key={q.id} value={q.id.toString()}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Килограми и EUR/kg на един ред */}
          <div className="delivery-dialog__row">
            <div className="delivery-dialog__field">
              <label className="delivery-dialog__label">
                Килограми (kg) <span className="delivery-dialog__required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.kgIn}
                onChange={(e) => handleChange('kgIn', e.target.value)}
                placeholder="напр. 150.00"
                className="delivery-dialog__input"
                disabled={!allowFullEdit}
              />
            </div>

            <div className="delivery-dialog__field">
              <label className="delivery-dialog__label">
                EUR/kg <span className="delivery-dialog__required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCostPerKg}
                onChange={(e) => handleChange('unitCostPerKg', e.target.value)}
                placeholder="напр. 3.50"
                className="delivery-dialog__input"
                disabled={!allowFullEdit}
              />
            </div>
          </div>

          {/* Обща сума (read-only) */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">Обща сума (EUR)</label>
            <div className="delivery-dialog__computed">
              <span className="delivery-dialog__computed-value">
                {formatEur(computedTotalCost())} EUR
              </span>
            </div>
            <span className="delivery-dialog__hint">
              Изчислено автоматично: kg × EUR/kg
            </span>
          </div>

          {/* Фактура № */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">Фактура №</label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              placeholder="напр. INV-2026-001"
              className="delivery-dialog__input"
              disabled={!allowFullEdit}
            />
            <span className="delivery-dialog__hint">
              Оставете празно за доставки без фактура (тип "A").
            </span>
          </div>

          {/* Бележка */}
          <div className="delivery-dialog__field">
            <label className="delivery-dialog__label">Бележка</label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Допълнителна информация..."
              className="delivery-dialog__textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="delivery-dialog__footer">
          <button className="delivery-dialog__btn secondary" onClick={onClose}>
            Откажи
          </button>
          <button className="delivery-dialog__btn primary" onClick={handleSubmit}>
            Запази
          </button>
        </div>
      </div>
    </div>
  );
};
