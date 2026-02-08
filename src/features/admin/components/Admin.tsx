import { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../../../shared/context/AuthContext';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeDialog } from './EmployeeDialog';
import { PermissionsDialog } from './PermissionsDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { createEmployee, manageEmployeeStatus, updateEmployee, updateEmployeePermissions } from '../../../lib/api/employees';
import type { Employee } from '../../../lib/supabase/types';
import type { EmployeeFormData } from '../types';
import './Admin.css';

export const Admin = () => {
  const { isReadOnly } = useAuth();

  const {
    employees,
    loading,
    error,
    filters,
    setFilters,
    selectedEmployee,
    selectedPermissions,
    selectEmployee,
    refresh,
  } = useEmployees();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  const handleCreateEmployee = async (data: EmployeeFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Admin: Creating employee with data:', { ...data, password: '***' });
      const employee = await createEmployee({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        role: data.role,
      });
      console.log('Admin: Employee created successfully:', employee);
      await refresh();
      return { success: true };
    } catch (err) {
      console.error('Admin: Failed to create employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Неуспешно създаване на служител';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const handleEditEmployee = async (data: EmployeeFormData): Promise<{ success: boolean; error?: string }> => {
    if (!editingEmployee) return { success: false, error: 'Няма избран служител' };
    try {
      console.log('Admin: Updating employee with data:', { ...data, password: data.password ? '***' : 'unchanged' });
      await updateEmployee(editingEmployee.id, {
        full_name: data.fullName,
        email: data.email,
        role: data.role,
      });
      console.log('Admin: Employee updated successfully');
      await refresh();
      return { success: true };
    } catch (err) {
      console.error('Admin: Failed to update employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Неуспешно актуализиране на служител';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    const action = employee.is_former ? 'reactivate' : 'deactivate';
    const title = employee.is_former ? 'Възстановяване на служител' : 'Деактивиране на служител';
    const message = employee.is_former
      ? `Сигурни ли сте, че искате да възстановите ${employee.full_name}?`
      : `Сигурни ли сте, че искате да маркирате ${employee.full_name} като бивш служител?`;

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      variant: employee.is_former ? 'success' : 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(employee.id);
        try {
          await manageEmployeeStatus(employee.id, action);
          await refresh();
        } catch (err) {
          setConfirmDialog({
            isOpen: true,
            title: 'Грешка',
            message: err instanceof Error ? err.message : 'Грешка при промяна на статуса',
            variant: 'danger',
            onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
          });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleEditPermissions = (employee: Employee) => {
    selectEmployee(employee);
    setShowPermissionsDialog(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditDialog(true);
  };

  const handleSavePermissions = async (
    permissions: { tab_id: string; can_access: boolean }[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!selectedEmployee) return { success: false, error: 'Няма избран служител' };
    try {
      await updateEmployeePermissions(selectedEmployee.id, permissions);
      await refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Грешка при записване',
      };
    }
  };

  return (
    <div className="admin">
      <div className="admin__header">
        <div className="admin__title-section">
          <h1 className="admin__title">Администрация</h1>
          <p className="admin__subtitle">Управление на служители и права за достъп</p>
        </div>
        {!isReadOnly && (
          <button
            className="admin__create-btn"
            onClick={() => setShowCreateDialog(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Нов служител
          </button>
        )}
      </div>

      <div className="admin__filters">
        <input
          type="text"
          className="admin__search"
          placeholder="Търсене по име или имейл..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <div className="admin__status-filters">
          <button
            className={`admin__filter-btn ${filters.status === 'active' ? 'admin__filter-btn--active' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'active' })}
          >
            Активни
          </button>
          <button
            className={`admin__filter-btn ${filters.status === 'former' ? 'admin__filter-btn--active' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'former' })}
          >
            Бивши
          </button>
          <button
            className={`admin__filter-btn ${filters.status === 'all' ? 'admin__filter-btn--active' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'all' })}
          >
            Всички
          </button>
        </div>
      </div>

      {error && (
        <div className="admin__error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <EmployeeTable
        employees={employees}
        loading={loading}
        actionLoading={actionLoading}
        onToggleStatus={handleToggleStatus}
        onEditPermissions={handleEditPermissions}
        onEdit={handleEdit}
        isReadOnly={isReadOnly}
      />

      {showCreateDialog && (
        <EmployeeDialog
          isOpen={showCreateDialog}
          onSubmit={handleCreateEmployee}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {showEditDialog && (
        <EmployeeDialog
          isOpen={showEditDialog}
          employee={editingEmployee}
          onSubmit={handleEditEmployee}
          onClose={() => {
            setShowEditDialog(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {showPermissionsDialog && selectedEmployee && (
        <PermissionsDialog
          isOpen={showPermissionsDialog}
          employee={selectedEmployee}
          permissions={selectedPermissions}
          onSave={handleSavePermissions}
          onClose={() => {
            setShowPermissionsDialog(false);
            selectEmployee(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};
