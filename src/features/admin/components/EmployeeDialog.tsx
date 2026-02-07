import { useEmployeeForm } from '../hooks/useEmployeeForm';
import type { EmployeeFormData } from '../types';
import './EmployeeDialog.css';

interface EmployeeDialogProps {
  isOpen: boolean;
  onSubmit: (data: EmployeeFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const EmployeeDialog = ({ isOpen, onSubmit, onClose }: EmployeeDialogProps) => {
  const {
    formData,
    errors,
    submitError,
    isSubmitting,
    updateField,
    handleSubmit,
  } = useEmployeeForm({ onSubmit, onClose });

  if (!isOpen) return null;

  return (
    <div className="employee-dialog__overlay" onClick={onClose}>
      <div
        className="employee-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-dialog-title"
      >
        <div className="employee-dialog__header">
          <h2 id="employee-dialog-title">Нов служител</h2>
          <button
            className="employee-dialog__close"
            onClick={onClose}
            aria-label="Затвори"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="employee-dialog__content">
          {/* Име */}
          <div className="employee-dialog__field">
            <label htmlFor="emp-name" className="employee-dialog__label">
              Пълно име <span className="employee-dialog__required">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Иван Иванов"
              className={`employee-dialog__input ${errors.fullName ? 'employee-dialog__input--error' : ''}`}
              autoFocus
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <span className="employee-dialog__error">{errors.fullName}</span>
            )}
          </div>

          {/* Имейл */}
          <div className="employee-dialog__field">
            <label htmlFor="emp-email" className="employee-dialog__label">
              Имейл <span className="employee-dialog__required">*</span>
            </label>
            <input
              id="emp-email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="ivan@example.com"
              className={`employee-dialog__input ${errors.email ? 'employee-dialog__input--error' : ''}`}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {errors.email && (
              <span className="employee-dialog__error">{errors.email}</span>
            )}
          </div>

          {/* Парола */}
          <div className="employee-dialog__field">
            <label htmlFor="emp-password" className="employee-dialog__label">
              Парола <span className="employee-dialog__required">*</span>
            </label>
            <input
              id="emp-password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Минимум 6 символа"
              className={`employee-dialog__input ${errors.password ? 'employee-dialog__input--error' : ''}`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="employee-dialog__error">{errors.password}</span>
            )}
          </div>

          {/* Роля */}
          <div className="employee-dialog__field">
            <label className="employee-dialog__label">Роля</label>
            <div className="employee-dialog__role-selector">
              <button
                type="button"
                className={`employee-dialog__role-btn ${formData.role === 'employee' ? 'employee-dialog__role-btn--active' : ''}`}
                onClick={() => updateField('role', 'employee')}
                disabled={isSubmitting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Служител
              </button>
              <button
                type="button"
                className={`employee-dialog__role-btn ${formData.role === 'admin' ? 'employee-dialog__role-btn--active employee-dialog__role-btn--admin' : ''}`}
                onClick={() => updateField('role', 'admin')}
                disabled={isSubmitting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Администратор
              </button>
            </div>
            {formData.role === 'admin' && (
              <span className="employee-dialog__hint">
                Администраторите имат пълен достъп до всички функции.
              </span>
            )}
            {formData.role === 'employee' && (
              <span className="employee-dialog__hint">
                След създаване, задайте правата за достъп от таблицата.
              </span>
            )}
          </div>

          {submitError && (
            <div className="employee-dialog__submit-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {submitError}
            </div>
          )}
        </div>

        <div className="employee-dialog__footer">
          <button
            type="button"
            className="employee-dialog__btn employee-dialog__btn--cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Откажи
          </button>
          <button
            type="button"
            className="employee-dialog__btn employee-dialog__btn--save"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Създаване...' : 'Създай служител'}
          </button>
        </div>
      </div>
    </div>
  );
};
