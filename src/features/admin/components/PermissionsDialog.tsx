import { useState, useEffect } from 'react';
import type { Employee, EmployeePermission } from '../../../lib/supabase/types';
import './PermissionsDialog.css';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Начало',
  qualities: 'Качества',
  articles: 'Артикули',
  deliveries: 'Доставки',
  sales: 'Продажби (POS)',
  inventory: 'Наличности',
  reports: 'Отчети',
  statistics: 'Статистика',
  settings: 'Настройки',
};

const ALL_TABS = Object.keys(TAB_LABELS);

interface PermissionsDialogProps {
  isOpen: boolean;
  employee: Employee;
  permissions: EmployeePermission[];
  onSave: (permissions: { tab_id: string; can_access: boolean }[]) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const PermissionsDialog = ({
  isOpen,
  employee,
  permissions,
  onSave,
  onClose,
}: PermissionsDialogProps) => {
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize state from current permissions
    const state: Record<string, boolean> = {};
    ALL_TABS.forEach(tab => {
      const perm = permissions.find(p => p.tab_id === tab);
      state[tab] = perm ? perm.can_access : false;
    });
    setPermState(state);
  }, [permissions]);

  if (!isOpen) return null;

  const togglePermission = (tabId: string) => {
    setPermState(prev => ({ ...prev, [tabId]: !prev[tabId] }));
    setError('');
  };

  const toggleAll = (value: boolean) => {
    const state: Record<string, boolean> = {};
    ALL_TABS.forEach(tab => { state[tab] = value; });
    setPermState(state);
    setError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    const perms = ALL_TABS.map(tab => ({
      tab_id: tab,
      can_access: permState[tab] || false,
    }));

    const result = await onSave(perms);
    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Грешка при запис');
    }
  };

  const activeCount = ALL_TABS.filter(t => permState[t]).length;

  return (
    <div className="perms-dialog__overlay" onClick={onClose}>
      <div
        className="perms-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="perms-dialog__header">
          <div>
            <h2>Права за достъп</h2>
            <p className="perms-dialog__employee-name">{employee.full_name}</p>
          </div>
          <button className="perms-dialog__close" onClick={onClose} aria-label="Затвори">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="perms-dialog__content">
          <div className="perms-dialog__bulk-actions">
            <button
              className="perms-dialog__bulk-btn"
              onClick={() => toggleAll(true)}
              disabled={isSaving}
            >
              Избери всички
            </button>
            <button
              className="perms-dialog__bulk-btn"
              onClick={() => toggleAll(false)}
              disabled={isSaving}
            >
              Премахни всички
            </button>
            <span className="perms-dialog__count">
              {activeCount} / {ALL_TABS.length} активни
            </span>
          </div>

          <div className="perms-dialog__list">
            {ALL_TABS.map(tabId => (
              <button
                key={tabId}
                type="button"
                className={`perms-dialog__item ${permState[tabId] ? 'perms-dialog__item--active' : 'perms-dialog__item--inactive'}`}
                onClick={() => togglePermission(tabId)}
                disabled={isSaving}
              >
                <div className="perms-dialog__icon-wrapper">
                  {permState[tabId] ? (
                    <svg 
                      className="perms-dialog__eye-icon perms-dialog__eye-icon--open"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg 
                      className="perms-dialog__eye-icon perms-dialog__eye-icon--closed"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </div>
                <span className="perms-dialog__tab-name">{TAB_LABELS[tabId]}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="perms-dialog__error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="perms-dialog__footer">
          <button
            className="perms-dialog__btn perms-dialog__btn--cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Откажи
          </button>
          <button
            className="perms-dialog__btn perms-dialog__btn--save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Запазване...' : 'Запази промените'}
          </button>
        </div>
      </div>
    </div>
  );
};
