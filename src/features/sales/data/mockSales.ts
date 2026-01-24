import type { Sale, PaymentMethod } from '../types';

// Празен масив за продажби
export const mockSales: Sale[] = [];

// Helper за следващ номер на продажба
export const getNextSaleNumber = (existingSales: Sale[]): string => {
  const year = new Date().getFullYear();
  const salesThisYear = existingSales.filter(s => 
    s.saleNumber.includes(`S-${year}`)
  );
  const nextNum = salesThisYear.length + 1;
  return `S-${year}-${String(nextNum).padStart(3, '0')}`;
};

// Helper за payment method label
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Кеш',
  card: 'Карта',
  other: 'Друго',
};
