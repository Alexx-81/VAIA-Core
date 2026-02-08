import { useState, useEffect } from 'react';
import type { EmployeeFormData } from '../types';
import type { Employee } from '../../../lib/supabase/types';

interface UseEmployeeFormOptions {
  employee?: Employee | null; // For edit mode
  onSubmit: (data: EmployeeFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function useEmployeeForm({ employee, onSubmit, onClose }: UseEmployeeFormOptions) {
  const isEditMode = !!employee;
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: employee?.full_name || '',
    email: employee?.email || '',
    password: '',
    role: employee?.role || 'employee',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.full_name,
        email: employee.email,
        password: '',
        role: employee.role,
      });
    }
  }, [employee]);

  const updateField = <K extends keyof EmployeeFormData>(
    field: K,
    value: EmployeeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setSubmitError('');
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EmployeeFormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Името е задължително';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Имейлът е задължителен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Невалиден имейл адрес';
    }

    // Password is required only when creating new employee
    if (!isEditMode) {
      if (!formData.password.trim()) {
        newErrors.password = 'Паролата е задължителна';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Паролата трябва да е поне 6 символа';
      }
    } else if (formData.password.trim() && formData.password.length < 6) {
      // When editing, validate password only if provided
      newErrors.password = 'Паролата трябва да е поне 6 символа';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    const result = await onSubmit(formData);

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setSubmitError(result.error || 'Неуспешно създаване');
    }
  };

  const reset = () => {
    setFormData({ fullName: '', email: '', password: '', role: 'employee' });
    setErrors({});
    setSubmitError('');
  };

  return {
    formData,
    errors,
    submitError,
    isSubmitting,
    isEditMode,
    updateField,
    handleSubmit,
    reset,
  };
}
