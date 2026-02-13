// API функции за клиенти (Customers)
import { supabase } from '../supabase';
import type { Customer, CustomerInsert, CustomerUpdate } from '../supabase/types';

// Взима всички клиенти
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Взима клиент по ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Търси клиент по баркод
export async function searchCustomerByBarcode(barcode: string): Promise<Customer | null> {
  if (!barcode?.trim()) return null;

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('barcode', barcode.trim())
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Проверява дали баркод е зает от друг клиент
export async function isBarcodeAvailable(barcode: string, excludeCustomerId?: string): Promise<boolean> {
  if (!barcode?.trim()) return true;

  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('barcode', barcode.trim());

  if (error) throw error;
  
  if (!data || data.length === 0) return true;
  
  // Ако редактираме съществуващ клиент, игнорираме неговия баркод
  if (excludeCustomerId) {
    return data.every(customer => customer.id === excludeCustomerId);
  }
  
  return false;
}

// Създава нов клиент
export async function createCustomer(customer: CustomerInsert): Promise<Customer> {
  // Нормализиране на баркод и имейл
  const normalized: CustomerInsert = {
    ...customer,
    barcode: customer.barcode?.trim() || null,
    email: customer.email?.trim().toLowerCase() || null,
    phone: customer.phone?.trim() || null,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(normalized)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Обновява клиент
export async function updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer> {
  // Нормализиране на баркод и имейл
  const normalized: CustomerUpdate = {
    ...updates,
    barcode: updates.barcode !== undefined ? (updates.barcode?.trim() || null) : undefined,
    email: updates.email !== undefined ? (updates.email?.trim().toLowerCase() || null) : undefined,
    phone: updates.phone !== undefined ? (updates.phone?.trim() || null) : undefined,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('customers')
    .update(normalized)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Изтрива клиент
export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Търси клиенти по текст (име, фирма, телефон, имейл, баркод)
export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  if (!searchTerm?.trim()) {
    return getCustomers();
  }

  const term = searchTerm.trim().toLowerCase();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${term}%,company_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,barcode.ilike.%${term}%`)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Експортира клиенти за бекъп
export async function exportCustomersData(): Promise<Customer[]> {
  return getCustomers();
}
