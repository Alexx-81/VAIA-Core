// Типове за клиенти (Customers)

export interface CustomerFormData {
  // Основни данни (таб 1)
  name: string;
  barcode: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  gdpr_consent: boolean;
  
  // Фирмени данни (таб 2)
  company_name: string;
  company_address: string;
  tax_number: string;
  bulstat: string;
  mol_name: string;
  recipient_name: string;
  recipient_egn: string;
  vat_number: string;
}

export type GdprConsentFilter = 'all' | 'yes' | 'no';
export type CompanyDataFilter = 'all' | 'yes' | 'no';

export interface CustomerFilters {
  search: string;
  gdprConsent: GdprConsentFilter;
  hasCompanyData: CompanyDataFilter;
}

export type DialogTab = 'personal' | 'company';

export interface CustomerFormErrors {
  name?: string;
  barcode?: string;
  email?: string;
  phone?: string;
}
