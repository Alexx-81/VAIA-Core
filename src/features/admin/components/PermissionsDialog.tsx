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
              <label
                key={tabId}
                className={`perms-dialog__item ${permState[tabId] ? 'perms-dialog__item--active' : ''}`}
              >
                <div className="perms-dialog__checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={permState[tabId] || false}
                    onChange={() => togglePermission(tabId)}
                    className="perms-dialog__checkbox"
                    disabled={isSaving}
                  />
                  <div className={`perms-dialog__custom-checkbox ${permState[tabId] ? 'perms-dialog__custom-checkbox--checked' : ''}`}>
                    {permState[tabId] && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="perms-dialog__tab-name">{TAB_LABELS[tabId]}</span>
              </label>
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
