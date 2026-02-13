import { useState, useCallback } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerFiltersBar } from './CustomerFiltersBar';
import { CustomerTable } from './CustomerTable';
import { CustomerDialog } from './CustomerDialog';
import { Toast } from '../../../shared/components/Toast';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useAuth } from '../../../shared/context/AuthContext';
import type { Customer } from '../../../lib/supabase/types';
import type { CustomerFormData } from '../types';
import './Customers.css';

export const Customers = () => {
  const {
    customers,
    allCustomers,
    filters,
    loading,
    updateFilters,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    existingBarcodes,
  } = useCustomers();

  const { isAdmin } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Отваря диалог за нов клиент
  const handleNewCustomer = useCallback(() => {
    setEditingCustomer(undefined);
    setDialogOpen(true);
  }, []);

  // Отваря диалог за редакция
  const handleEditCustomer = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }, []);

  // Затваря диалога
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingCustomer(undefined);
  }, []);

  // Submit handler
  const handleSubmit = useCallback(
    async (formData: CustomerFormData) => {
      if (editingCustomer) {
        const result = await updateCustomer(editingCustomer.id, formData);
        if (result.success) {
          setToast({ message: `Клиент „${formData.name}" е обновен успешно.`, variant: 'success' });
          handleCloseDialog();
        }
        return result;
      } else {
        const result = await createCustomer(formData);
        if (result.success) {
          setToast({ message: `Клиент „${formData.name}" е създаден успешно.`, variant: 'success' });
          handleCloseDialog();
        }
        return result;
      }
    },
    [editingCustomer, createCustomer, updateCustomer, handleCloseDialog]
  );

  // Delete handler
  const handleDeleteCustomer = useCallback(async (customer: Customer) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Изтриване на клиент`,
      message: `Сигурни ли сте, че искате да изтриете клиент „${customer.name}"?\n\nТова действие е необратимо.`,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        const result = await deleteCustomer(customer.id);
        if (result.success) {
          setToast({ message: `Клиент „${customer.name}" е изтрит успешно.`, variant: 'success' });
          handleCloseDialog();
        } else {
          setToast({ message: result.error || 'Грешка при изтриване.', variant: 'error' });
        }
      },
    });
  }, [deleteCustomer, handleCloseDialog]);

  if (loading) {
    return (
      <div className="customers__loading">
        <div className="customers__spinner" />
        <p>Зареждане на клиенти...</p>
      </div>
    );
  }

  return (
    <div className="customers">
      <div className="customers__header">
        <h1 className="customers__title">Клиенти</h1>
        <p className="customers__subtitle">
          Управление на клиентската база и фактурни данни
        </p>
      </div>

      <CustomerFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onNewCustomer={handleNewCustomer}
        customers={customers}
        totalCount={allCustomers.length}
        filteredCount={customers.length}
      />

      <CustomerTable
        customers={customers}
        onEdit={handleEditCustomer}
        onDelete={isAdmin ? handleDeleteCustomer : undefined}
      />

      <CustomerDialog
        isOpen={dialogOpen}
        customer={editingCustomer}
        existingBarcodes={existingBarcodes}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
        onDelete={isAdmin ? handleDeleteCustomer : undefined}
      />

      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        variant="danger"
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
