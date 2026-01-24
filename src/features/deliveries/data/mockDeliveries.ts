import type { Delivery, Quality, SaleFromDelivery } from '../types';

// Качества от системата
export const mockQualities: Quality[] = [
  { id: 2, name: 'ЛЕТНИ РОКЛИ - В', isActive: true },
  { id: 3, name: 'ДАМСКИ ТЕНИСКИ - В', isActive: true },
  { id: 4, name: 'АУТЛЕТ JACK & JONES', isActive: true },
  { id: 5, name: 'ДАМСКИ БЛУЗИ - В', isActive: true },
  { id: 6, name: 'ДАМСКИ ПАНТАЛОНИ UTT', isActive: true },
  { id: 7, name: 'СПОРТ UTT', isActive: true },
  { id: 8, name: 'SHOP MIX SUMMER', isActive: true },
  { id: 9, name: 'ЗИМНИ РОКЛИ - В', isActive: true },
  { id: 10, name: 'ИЗКУСТВЕНИ ПАЛТА - В', isActive: true },
  { id: 11, name: 'ДЖОГИНК ПАНТАЛОНИ - ЕН', isActive: true },
  { id: 12, name: 'МЪЖКИ СПОРТ - В', isActive: true },
  { id: 13, name: 'ДАМСКИ ПАЛТА - В', isActive: true },
  { id: 14, name: 'НЕУПРЕН - В', isActive: true },
  { id: 15, name: 'ЗИМНИ ПОЛИ - В', isActive: true },
  { id: 16, name: 'МЪЖКИ ДЪНКИ - ЕН', isActive: true },
  { id: 17, name: 'МЪЖКО ЯКЕ - В', isActive: true },
  { id: 18, name: 'ДАМСКО КЪСО ЯКЕ - В', isActive: true },
  { id: 19, name: 'ДАМСКИ ЗИМНИ ПАНТАЛОНИ - В', isActive: true },
  { id: 20, name: 'МЪЖКИ ВЪЛНЕНИ ПУЛОВЕРИ - В', isActive: true },
  { id: 21, name: 'ДАМСКИ ПУЛОВЕРИ КЪС РЪКАВ - В', isActive: true },
  { id: 22, name: 'ЕЛЕЦИ - А - ЕН', isActive: true },
  { id: 23, name: 'ДАМСКО ЗИМНО ЯКЕ - В', isActive: true },
  { id: 24, name: 'АУТЛЕТ', isActive: true },
  { id: 25, name: 'ЗИМЕН МИКС ЕКСТРА UT', isActive: true },
  { id: 26, name: 'ДАМСКИ ПАЛТА - ДУЛОВО', isActive: true },
  { id: 27, name: 'ЗИМНИ РОКЛИ - ДУЛОВО', isActive: true },
  { id: 28, name: 'ДАМСКИ ПАНТАЛОНИ - ДУЛОВО', isActive: true },
  { id: 29, name: 'ДАМСКИ САКА - ДУЛОВО', isActive: true },
  { id: 30, name: 'ДАМСКИ БЛУЗИ - ДУЛОВО', isActive: true },
  { id: 31, name: 'СУИТЧЕРИ - ДУЛОВО', isActive: true },
];

// Празен масив за доставки - ще се попълни чрез импорт
export const mockDeliveries: Delivery[] = [];

// Mock данни за продажби (симулация)
export const mockSalesData: Record<string, { realKgSold: number; accKgSold: number }> = {};

// Mock продажби от конкретна доставка (за детайлен изглед)
export const getMockSalesForDelivery = (_deliveryId: string): SaleFromDelivery[] => {
  return [];
};
