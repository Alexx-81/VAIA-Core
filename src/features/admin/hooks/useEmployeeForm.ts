import { useState } from 'react';
import type { EmployeeFormData } from '../types';

interface UseEmployeeFormOptions {
  onSubmit: (data: EmployeeFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function useEmployeeForm({ onSubmit, onClose }: UseEmployeeFormOptions) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.password.trim()) {
      newErrors.password = 'Паролата е задължителна';
    } else if (formData.password.length < 6) {
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
    updateField,
    handleSubmit,
    reset,
  };
}
