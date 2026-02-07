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
    <div className="employee-table__wrapper">
      <table className="employee-table">
        <thead>
          <tr>
            <th>Име</th>
            <th>Имейл</th>
            <th>Роля</th>
            <th>Статус</th>
            <th>Създаден</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.id}
              className={emp.is_former ? 'employee-table__row--former' : ''}
            >
              <td className="employee-table__name">
                <div className="employee-table__avatar">
                  {emp.full_name.charAt(0).toUpperCase()}
                </div>
                {emp.full_name}
              </td>
              <td className="employee-table__email">{emp.email}</td>
              <td>
                <span className={`employee-table__role employee-table__role--${emp.role}`}>
                  {emp.role === 'admin' ? 'Админ' : 'Служител'}
                </span>
              </td>
              <td>
                <span className={`employee-table__status ${emp.is_former ? 'employee-table__status--former' : 'employee-table__status--active'}`}>
                  {emp.is_former ? 'Бивш' : 'Активен'}
                </span>
              </td>
              <td className="employee-table__date">{formatDate(emp.created_at)}</td>
              <td className="employee-table__actions">
                {emp.role !== 'admin' && !emp.is_former && (
                  <button
                    className="employee-table__action-btn employee-table__action-btn--permissions"
                    onClick={() => onEditPermissions(emp)}
                    title="Редакция на права"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </button>
                )}
                <button
                  className={`employee-table__action-btn ${
                    emp.is_former 
                      ? 'employee-table__action-btn--reactivate' 
                      : 'employee-table__action-btn--deactivate'
                  }`}
                  onClick={() => onToggleStatus(emp)}
                  disabled={actionLoading === emp.id}
                  title={emp.is_former ? 'Възстанови' : 'Маркирай като бивш'}
                >
                  {actionLoading === emp.id ? (
                    <div className="employee-table__btn-spinner" />
                  ) : emp.is_former ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
