import { supabase } from '../supabase/client';
import type { Employee, EmployeePermission } from '../supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ptigdekgzraimaepgczt.supabase.co';

// ==========================================
// Employee CRUD
// ==========================================

export async function getEmployees(): Promise<Employee[]> {
  console.log('API: getEmployees called');
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('API: getEmployees result', { data, error });
  if (error) {
    console.error('API: getEmployees error:', error);
    throw error;
  }
  return data || [];
}

export async function getEmployeeByAuthId(authUserId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function updateEmployee(
  id: string,
  updates: { full_name?: string; role?: string; email?: string }
): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create employee via Edge Function (requires service role for auth.admin.createUser)
 */
export async function createEmployee(params: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'employee';
}): Promise<Employee> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Не сте автентикирани');

    console.log('Creating employee with params:', { ...params, password: '***' });

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    console.log('Response status:', response.status, response.statusText);

    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      throw new Error(result.error || `Грешка при създаване: ${response.statusText}`);
    }

    return result.employee;
  } catch (error) {
    console.error('Create employee error:', error);
    throw error;
  }
}

/**
 * Deactivate/reactivate employee via Edge Function
 */
export async function manageEmployeeStatus(
  employeeId: string,
  action: 'deactivate' | 'reactivate'
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-employee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ employee_id: employeeId, action }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Failed to ${action} employee`);
  }
}

// ==========================================
// Permissions CRUD
// ==========================================

export async function getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]> {
  const { data, error } = await supabase
    .from('employee_permissions')
    .select('*')
    .eq('employee_id', employeeId);

  if (error) throw error;
  return data || [];
}

export async function getMyPermissions(): Promise<EmployeePermission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First get employee id
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!employee) return [];

  const { data, error } = await supabase
    .from('employee_permissions')
    .select('*')
    .eq('employee_id', employee.id);

  if (error) throw error;
  return data || [];
}

export async function updateEmployeePermissions(
  employeeId: string,
  permissions: { tab_id: string; can_access: boolean }[]
): Promise<void> {
  // Delete existing permissions and insert new ones
  const { error: deleteError } = await supabase
    .from('employee_permissions')
    .delete()
    .eq('employee_id', employeeId);

  if (deleteError) throw deleteError;

  if (permissions.length > 0) {
    const inserts = permissions.map(p => ({
      employee_id: employeeId,
      tab_id: p.tab_id,
      can_access: p.can_access,
    }));

    const { error: insertError } = await supabase
      .from('employee_permissions')
      .insert(inserts);

    if (insertError) throw insertError;
  }
}
