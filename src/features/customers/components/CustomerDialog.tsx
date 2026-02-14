import type { Customer } from '../../../lib/supabase/types';
import type { CustomerFormData } from '../types';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { useAuth } from '../../../shared/context/AuthContext';
import { CustomerLoyaltySection } from './CustomerLoyaltyBadge';
import './CustomerDialog.css';

interface CustomerDialogProps {
  isOpen: boolean;
  customer?: Customer;
  existingBarcodes: string[];
  onSubmit: (data: CustomerFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  onDelete?: (customer: Customer) => void;
}

export const CustomerDialog = ({
  isOpen,
  customer,
  existingBarcodes,
  onSubmit,
  onClose,
  onDelete,
}: CustomerDialogProps) => {
  const { isAdmin } = useAuth();
  const {
    formData,
    errors,
    touched,
    activeDialogTab,
    setActiveDialogTab,
    updateField,
    handleSubmit,
  } = useCustomerForm({
    customer,
    existingBarcodes,
    onSubmit,
    onClose,
  });

  if (!isOpen) return null;

  const isEdit = !!customer;

  return (
    <div className="customer-dialog__overlay">
      <div
        className="customer-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-dialog-title"
      >
        <div className="customer-dialog__header">
          <h2 id="customer-dialog-title">
            {isEdit ? 'Редакция на клиент' : 'Нов клиент'}
          </h2>
          <button
            className="customer-dialog__close"
            onClick={onClose}
            aria-label="Затвори"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Табове */}
        <div className="customer-dialog__tabs">
          <button
            className={`customer-dialog__tab ${
              activeDialogTab === 'personal' ? 'customer-dialog__tab--active' : ''
            }`}
            onClick={() => setActiveDialogTab('personal')}
          >
            Основни данни
          </button>
          <button
            className={`customer-dialog__tab ${
              activeDialogTab === 'company' ? 'customer-dialog__tab--active' : ''
            }`}
            onClick={() => setActiveDialogTab('company')}
          >
            Фактуриране
          </button>
          <button
            className={`customer-dialog__tab ${
              activeDialogTab === 'loyalty' ? 'customer-dialog__tab--active' : ''
            }`}
            onClick={() => setActiveDialogTab('loyalty')}
          >
            🏆 Програма за лоялност
          </button>
        </div>

        <div className="customer-dialog__content">
          {/* Таб 1: Основни данни */}
          {activeDialogTab === 'personal' && (
            <div className="customer-dialog__tab-content">
              {/* Име */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-name" className="customer-dialog__label">
                  Име на клиент <span className="customer-dialog__required">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="напр. Иван Петров"
                  className={`customer-dialog__input ${
                    touched.name && errors.name ? 'customer-dialog__input--error' : ''
                  }`}
                  autoFocus
                />
                {touched.name && errors.name && (
                  <span className="customer-dialog__error">{errors.name}</span>
                )}
              </div>

              {/* Баркод */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-barcode" className="customer-dialog__label">
                  Баркод
                </label>
                <input
                  id="customer-barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => updateField('barcode', e.target.value)}
                  placeholder="Уникален баркод"
                  className={`customer-dialog__input ${
                    touched.barcode && errors.barcode ? 'customer-dialog__input--error' : ''
                  }`}
                />
                <span className="customer-dialog__hint">
                  Може да се въведе ръчно или със скенер
                </span>
                {touched.barcode && errors.barcode && (
                  <span className="customer-dialog__error">{errors.barcode}</span>
                )}
              </div>

              {/* Телефон */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-phone" className="customer-dialog__label">
                  Телефон
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="напр. +359 88 123 4567"
                  className={`customer-dialog__input ${
                    touched.phone && errors.phone ? 'customer-dialog__input--error' : ''
                  }`}
                />
                {touched.phone && errors.phone && (
                  <span className="customer-dialog__error">{errors.phone}</span>
                )}
              </div>

              {/* Имейл */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-email" className="customer-dialog__label">
                  Имейл
                </label>
                <input
                  id="customer-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="напр. ivan@example.com"
                  className={`customer-dialog__input ${
                    touched.email && errors.email ? 'customer-dialog__input--error' : ''
                  }`}
                />
                {touched.email && errors.email && (
                  <span className="customer-dialog__error">{errors.email}</span>
                )}
              </div>

              {/* Адрес */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-address" className="customer-dialog__label">
                  Адрес
                </label>
                <textarea
                  id="customer-address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Адрес на клиента"
                  className="customer-dialog__textarea"
                  rows={2}
                />
              </div>

              {/* Забележка */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-notes" className="customer-dialog__label">
                  Забележка
                </label>
                <textarea
                  id="customer-notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Допълнителна информация"
                  className="customer-dialog__textarea"
                  rows={3}
                />
              </div>

              {/* GDPR Съгласие */}
              <div className="customer-dialog__field">
                <label className="customer-dialog__checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.gdpr_consent}
                    onChange={(e) => updateField('gdpr_consent', e.target.checked)}
                    className="customer-dialog__checkbox"
                  />
                  <span>Съгласие за предоставяне на лични данни</span>
                </label>
              </div>
            </div>
          )}

          {/* Таб 2: Фактуриране */}
          {activeDialogTab === 'company' && (
            <div className="customer-dialog__tab-content">
              {/* Име на фирма */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-company-name" className="customer-dialog__label">
                  Име на фирма
                </label>
                <input
                  id="customer-company-name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="напр. ВАЙА ЕООД"
                  className="customer-dialog__input"
                />
              </div>

              {/* Адрес на фирма */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-company-address" className="customer-dialog__label">
                  Адрес на фирмата
                </label>
                <textarea
                  id="customer-company-address"
                  value={formData.company_address}
                  onChange={(e) => updateField('company_address', e.target.value)}
                  placeholder="Адрес за фактуриране"
                  className="customer-dialog__textarea"
                  rows={2}
                />
              </div>

              {/* Данъчен номер */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-tax-number" className="customer-dialog__label">
                  Данъчен номер
                </label>
                <input
                  id="customer-tax-number"
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => updateField('tax_number', e.target.value)}
                  placeholder="Данъчен номер"
                  className="customer-dialog__input"
                />
              </div>

              {/* Булстат */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-bulstat" className="customer-dialog__label">
                  Булстат
                </label>
                <input
                  id="customer-bulstat"
                  type="text"
                  value={formData.bulstat}
                  onChange={(e) => updateField('bulstat', e.target.value)}
                  placeholder="Булстат"
                  className="customer-dialog__input"
                />
              </div>

              {/* МОЛ */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-mol" className="customer-dialog__label">
                  Име на МОЛ
                </label>
                <input
                  id="customer-mol"
                  type="text"
                  value={formData.mol_name}
                  onChange={(e) => updateField('mol_name', e.target.value)}
                  placeholder="Материално отговорно лице"
                  className="customer-dialog__input"
                />
              </div>

              {/* Получател */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-recipient" className="customer-dialog__label">
                  Име на получател
                </label>
                <input
                  id="customer-recipient"
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => updateField('recipient_name', e.target.value)}
                  placeholder="Име на получател"
                  className="customer-dialog__input"
                />
              </div>

              {/* ЕГН на получател */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-recipient-egn" className="customer-dialog__label">
                  ЕГН на получател
                </label>
                <input
                  id="customer-recipient-egn"
                  type="text"
                  value={formData.recipient_egn}
                  onChange={(e) => updateField('recipient_egn', e.target.value)}
                  placeholder="ЕГН"
                  className="customer-dialog__input"
                />
              </div>

              {/* ИН по ДДС */}
              <div className="customer-dialog__field">
                <label htmlFor="customer-vat" className="customer-dialog__label">
                  ИН по ДДС
                </label>
                <input
                  id="customer-vat"
                  type="text"
                  value={formData.vat_number}
                  onChange={(e) => updateField('vat_number', e.target.value)}
                  placeholder="Идентификационен номер по ДДС"
                  className="customer-dialog__input"
                />
              </div>
            </div>
          )}

          {/* Таб 3: Програма за лоялност */}
          {activeDialogTab === 'loyalty' && (
            <div className="customer-dialog__tab-content">
              {isEdit && customer ? (
                <CustomerLoyaltySection customerId={customer.id} />
              ) : (
                <div className="customer-dialog__loyalty-info">
                  <p className="customer-dialog__info-text">
                    💡 Програмата за лоялност ще бъде достъпна след създаване на клиента.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="customer-dialog__footer">
          {isEdit && isAdmin && onDelete && customer && (
            <button
              type="button"
              className="customer-dialog__btn customer-dialog__btn--delete"
              onClick={() => onDelete(customer)}
            >
              🗑️ Изтрий
            </button>
          )}
          <div className="customer-dialog__footer-right">
            <button
              type="button"
              className="customer-dialog__btn customer-dialog__btn--cancel"
              onClick={onClose}
            >
              Откажи
            </button>
            <button
              type="button"
              className="customer-dialog__btn customer-dialog__btn--save"
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
