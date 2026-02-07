import type { Sale, PaymentMethod } from '../types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../../shared/utils/storage';

// Зареждаме продажби от localStorage или празен масив
const loadedSales = loadFromStorage<Sale[]>(STORAGE_KEYS.SALES);
export const mockSales: Sale[] = loadedSales || [];

// Функция за запазване на продажби в localStorage
export const saveSales = (): void => {
  saveToStorage(STORAGE_KEYS.SALES, mockSales);
};

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
  cash: 'По каса',
  card: 'Карта',
  'no-cash': 'Без каса',
  other: 'Друго',
};
