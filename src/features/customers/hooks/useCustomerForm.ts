import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '../../../lib/supabase/types';
import type { CustomerFormData, CustomerFormErrors, DialogTab } from '../types';

interface UseCustomerFormProps {
  customer?: Customer;
  existingBarcodes: string[];
  onSubmit: (data: CustomerFormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const initialFormData: CustomerFormData = {
  name: '',
  barcode: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  gdpr_consent: false,
  company_name: '',
  company_address: '',
  tax_number: '',
  bulstat: '',
  mol_name: '',
  recipient_name: '',
  recipient_egn: '',
  vat_number: '',
};

export const useCustomerForm = ({
  customer,
  existingBarcodes,
  onSubmit,
  onClose,
}: UseCustomerFormProps) => {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [touched, setTouched] = useState<Record<keyof CustomerFormData, boolean>>({
    name: false,
    barcode: false,
    phone: false,
    email: false,
    address: false,
    notes: false,
    gdpr_consent: false,
    company_name: false,
    company_address: false,
    tax_number: false,
    bulstat: false,
    mol_name: false,
    recipient_name: false,
    recipient_egn: false,
    vat_number: false,
  });
  const [activeDialogTab, setActiveDialogTab] = useState<DialogTab>('personal');

  // Зарежда данни при редакция
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        barcode: customer.barcode || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
        gdpr_consent: customer.gdpr_consent || false,
        company_name: customer.company_name || '',
        company_address: customer.company_address || '',
        tax_number: customer.tax_number || '',
        bulstat: customer.bulstat || '',
        mol_name: customer.mol_name || '',
        recipient_name: customer.recipient_name || '',
        recipient_egn: customer.recipient_egn || '',
        vat_number: customer.vat_number || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setTouched({
      name: false,
      barcode: false,
      phone: false,
      email: false,
      address: false,
      notes: false,
      gdpr_consent: false,
      company_name: false,
      company_address: false,
      tax_number: false,
      bulstat: false,
      mol_name: false,
      recipient_name: false,
      recipient_egn: false,
      vat_number: false,
    });
    setActiveDialogTab('personal');
  }, [customer]);

  // Валидира форма
  const validate = useCallback(() => {
    const newErrors: CustomerFormErrors = {};

    // Задължително име
    if (!formData.name.trim()) {
      newErrors.name = 'Името е задължително поле';
    }

    // Валидация на баркод
    if (formData.barcode.trim()) {
      // Проверка за дубликати (изключва текущия клиент при редакция)
      const isDuplicate = existingBarcodes.some(
        (b) => 
          b.toLowerCase() === formData.barcode.trim().toLowerCase() && 
          b !== customer?.barcode
      );
      if (isDuplicate) {
        newErrors.barcode = 'Баркодът вече съществува';
      }
    }

    // Валидация на имейл
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Невалиден имейл адрес';
      }
    }

    // Валидация на телефон (опционална)
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Невалиден телефонен номер';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingBarcodes, customer]);

  // Валидира при промяна след първото докосване
  useEffect(() => {
    if (Object.values(touched).some((t) => t)) {
      validate();
    }
  }, [formData, touched, validate]);

  // Обновява поле
  const updateField = useCallback(
    <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Маркираме всички полета като докоснати
    setTouched({
      name: true,
      barcode: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      gdpr_consent: true,
      company_name: true,
      company_address: true,
      tax_number: true,
      bulstat: true,
      mol_name: true,
      recipient_name: true,
      recipient_egn: true,
      vat_number: true,
    });

    if (!validate()) {
      // Ако има грешка в първия таб, превключи го
      if (errors.name || errors.barcode || errors.phone || errors.email) {
        setActiveDialogTab('personal');
      }
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    } else if (result.error) {
      setErrors((prev) => ({ ...prev, name: result.error }));
      setActiveDialogTab('personal');
    }
  }, [formData, validate, onSubmit, onClose, errors]);

  return {
    formData,
    errors,
    touched,
    activeDialogTab,
    setActiveDialogTab,
    updateField,
    handleSubmit,
    isValid: Object.keys(errors).length === 0 && formData.name.trim().length > 0,
  };
};
