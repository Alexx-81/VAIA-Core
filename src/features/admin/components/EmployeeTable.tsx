import type { Employee } from '../../../lib/supabase/types';
import './EmployeeTable.css';

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  actionLoading: string | null;
  onToggleStatus: (employee: Employee) => void;
  onEditPermissions: (employee: Employee) => void;
}

export const EmployeeTable = ({
  employees,
  loading,
  actionLoading,
  onToggleStatus,
  onEditPermissions,
}: EmployeeTableProps) => {
  if (loading) {
    return (
      <div className="employee-table__loading">
        <div className="employee-table__spinner" />
        <span>Зареждане на служители...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="employee-table__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p>Няма намерени служители</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="employee-table">
      <div className="employee-table__grid">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className={`employee-card ${emp.is_former ? 'employee-card--former' : ''}`}
          >
            {/* Header with avatar and name */}
            <div className="employee-card__header">
              <div className="employee-card__avatar">
                {emp.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="employee-card__info">
                <h3 className="employee-card__name">{emp.full_name}</h3>
                <p className="employee-card__email">{emp.email}</p>
              </div>
              <div className="employee-card__badges">
                <span className={`employee-card__role employee-card__role--${emp.role}`}>
                  {emp.role === 'admin' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                  <span>{emp.role === 'admin' ? 'Администратор' : 'Служител'}</span>
                </span>
              </div>
            </div>

            {/* Body with status and date */}
            <div className="employee-card__body">
              <div className="employee-card__detail">
                <span className="employee-card__detail-label">Статус</span>
                <span className={`employee-card__status ${emp.is_former ? 'employee-card__status--former' : 'employee-card__status--active'}`}>
                  {emp.is_former ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                      <span>Бивш служител</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Активен</span>
                    </>
                  )}
                </span>
              </div>
              <div className="employee-card__detail">
                <span className="employee-card__detail-label">Създаден на</span>
                <span className="employee-card__detail-value">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDate(emp.created_at)}
                </span>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="employee-card__footer">
              {emp.role !== 'admin' && !emp.is_former && (
                <button
                  className="employee-card__btn employee-card__btn--permissions"
                  onClick={() => onEditPermissions(emp)}
                  title="Редакция на права"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Права за достъп</span>
                </button>
              )}
              <button
                className={`employee-card__btn ${
                  emp.is_former 
                    ? 'employee-card__btn--reactivate' 
                    : 'employee-card__btn--deactivate'
                }`}
                onClick={() => onToggleStatus(emp)}
                disabled={actionLoading === emp.id}
                title={emp.is_former ? 'Възстанови' : 'Маркирай като бивш'}
              >
                {actionLoading === emp.id ? (
                  <>
                    <div className="employee-card__btn-spinner" />
                    <span>Обработка...</span>
                  </>
                ) : emp.is_former ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span>Възстанови служител</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>Маркирай като бивш</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
