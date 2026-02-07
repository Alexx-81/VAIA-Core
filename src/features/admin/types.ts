export interface EmployeeFormData {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

export interface EmployeeFilters {
  search: string;
  status: 'all' | 'active' | 'former';
}
