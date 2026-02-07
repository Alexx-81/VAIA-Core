import { useState, useEffect, useCallback } from 'react';
import { getEmployees, getEmployeePermissions } from '../../../lib/api/employees';
import type { Employee, EmployeePermission } from '../../../lib/supabase/types';
import type { EmployeeFilters } from '../types';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: '',
    status: 'active',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('useEmployees: fetchEmployees called');
      setLoading(true);
      setError(null);
      const data = await getEmployees();
      console.log('useEmployees: fetched employees:', data);
      setEmployees(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Грешка при зареждане';
      console.error('useEmployees: Failed to fetch employees:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const selectEmployee = useCallback(async (employee: Employee | null) => {
    setSelectedEmployee(employee);
    if (employee) {
      try {
        const perms = await getEmployeePermissions(employee.id);
        setSelectedPermissions(perms);
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
        setSelectedPermissions([]);
      }
    } else {
      setSelectedPermissions([]);
    }
  }, []);

  const filteredEmployees = employees.filter(emp => {
    // Status filter
    if (filters.status === 'active' && emp.is_former) return false;
    if (filters.status === 'former' && !emp.is_former) return false;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        emp.full_name.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search)
      );
    }

    return true;
  });

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    loading,
    error,
    filters,
    setFilters,
    selectedEmployee,
    selectedPermissions,
    selectEmployee,
    refresh: fetchEmployees,
  };
}
