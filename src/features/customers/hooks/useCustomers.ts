import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '../../../lib/supabase/types';
import type { CustomerFormData, CustomerFilters } from '../types';
import {
  getCustomers,
  createCustomer as createCustomerApi,
  updateCustomer as updateCustomerApi,
  deleteCustomer as deleteCustomerApi,
  isBarcodeAvailable,
} from '../../../lib/api/customers';
import { filterCustomers } from '../utils/customerUtils';

const initialFilters: CustomerFilters = {
  search: '',
  gdprConsent: 'all',
  hasCompanyData: 'all',
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);

  // Fetch customers from Supabase
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Филтрирани клиенти
  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, filters);
  }, [customers, filters]);

  // Обновява филтри
  const updateFilters = useCallback((partial: Partial<CustomerFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Създава нов клиент
  const createCustomer = useCallback(
    async (formData: CustomerFormData): Promise<{ success: boolean; error?: string }> => {
      // Валидация на задължително име
      if (!formData.name.trim()) {
        return { success: false, error: 'Името е задължително поле.' };
      }

      // Проверка за уникален баркод
      if (formData.barcode.trim()) {
        const available = await isBarcodeAvailable(formData.barcode.trim());
        if (!available) {
          return { success: false, error: 'Баркодът вече съществува.' };
        }
      }

      try {
        const newCustomer = await createCustomerApi({
          name: formData.name.trim(),
          barcode: formData.barcode.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
          gdpr_consent: formData.gdpr_consent,
          company_name: formData.company_name.trim() || null,
          company_address: formData.company_address.trim() || null,
          tax_number: formData.tax_number.trim() || null,
          bulstat: formData.bulstat.trim() || null,
          mol_name: formData.mol_name.trim() || null,
          recipient_name: formData.recipient_name.trim() || null,
          recipient_egn: formData.recipient_egn.trim() || null,
          vat_number: formData.vat_number.trim() || null,
        });

        setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        return { success: true };
      } catch (err) {
        console.error('Error creating customer:', err);
        return { success: false, error: 'Грешка при създаване на клиент.' };
      }
    },
    []
  );

  // Редактира клиент
  const updateCustomer = useCallback(
    async (
      id: string,
      formData: CustomerFormData
    ): Promise<{ success: boolean; error?: string }> => {
      // Валидация на задължително име
      if (!formData.name.trim()) {
        return { success: false, error: 'Името е задължително поле.' };
      }

      // Проверка за уникален баркод (изключваме текущия клиент)
      if (formData.barcode.trim()) {
        const available = await isBarcodeAvailable(formData.barcode.trim(), id);
        if (!available) {
          return { success: false, error: 'Баркодът вече съществува.' };
        }
      }

      try {
        const updatedCustomer = await updateCustomerApi(id, {
          name: formData.name.trim(),
          barcode: formData.barcode.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
          gdpr_consent: formData.gdpr_consent,
          company_name: formData.company_name.trim() || null,
          company_address: formData.company_address.trim() || null,
          tax_number: formData.tax_number.trim() || null,
          bulstat: formData.bulstat.trim() || null,
          mol_name: formData.mol_name.trim() || null,
          recipient_name: formData.recipient_name.trim() || null,
          recipient_egn: formData.recipient_egn.trim() || null,
          vat_number: formData.vat_number.trim() || null,
        });

        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? updatedCustomer : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        return { success: true };
      } catch (err) {
        console.error('Error updating customer:', err);
        return { success: false, error: 'Грешка при обновяване на клиент.' };
      }
    },
    []
  );

  // Изтрива клиент
  const deleteCustomer = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteCustomerApi(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting customer:', err);
      return { success: false, error: 'Грешка при изтриване на клиент.' };
    }
  }, []);

  // Всички баркоди за валидация
  const existingBarcodes = useMemo(() => {
    return customers
      .map((c) => c.barcode)
      .filter((b): b is string => b !== null && b !== undefined);
  }, [customers]);

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    loading,
    filters,
    updateFilters,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    existingBarcodes,
    refetch: fetchCustomers,
  };
};
