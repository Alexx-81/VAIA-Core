export interface EmployeeFormData {
  fullName: string;
  email: string;
  password: string; // Optional when editing
  role: 'admin' | 'employee';
}

export interface EmployeeEditData {
  fullName: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface EmployeeFilters {
  search: string;
  status: 'all' | 'active' | 'former';
}
