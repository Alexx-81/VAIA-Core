import type { Sale, PaymentMethod } from '../types';

// Mock данни за продажби
export const mockSales: Sale[] = [
  {
    id: 'sale-001',
    saleNumber: 'S-2026-001',
    dateTime: new Date('2026-01-06T10:30:00'),
    paymentMethod: 'cash',
    note: 'Редовен клиент',
    status: 'finalized',
    createdAt: new Date('2026-01-06T10:30:00'),
    finalizedAt: new Date('2026-01-06T10:35:00'),
    lines: [
      {
        id: 'line-001-1',
        articleId: '1',
        articleName: 'Тениски',
        quantity: 50,
        unitPriceEur: 1.50,
        realDeliveryId: 'del-001',
        kgPerPieceSnapshot: 0.200,
        unitCostPerKgRealSnapshot: 3.50,
      },
      {
        id: 'line-001-2',
        articleId: '4',
        articleName: 'Блузи дамски',
        quantity: 30,
        unitPriceEur: 1.20,
        realDeliveryId: 'del-001',
        kgPerPieceSnapshot: 0.180,
        unitCostPerKgRealSnapshot: 3.50,
      },
    ],
  },
  {
    id: 'sale-002',
    saleNumber: 'S-2026-002',
    dateTime: new Date('2026-01-07T14:15:00'),
    paymentMethod: 'card',
    status: 'finalized',
    createdAt: new Date('2026-01-07T14:15:00'),
    finalizedAt: new Date('2026-01-07T14:20:00'),
    lines: [
      {
        id: 'line-002-1',
        articleId: '2',
        articleName: 'Дънки мъжки дълги',
        quantity: 20,
        unitPriceEur: 4.00,
        realDeliveryId: 'del-003',
        kgPerPieceSnapshot: 0.650,
        unitCostPerKgRealSnapshot: 2.80,
      },
    ],
  },
  {
    id: 'sale-003',
    saleNumber: 'S-2026-003',
    dateTime: new Date('2026-01-08T09:45:00'),
    paymentMethod: 'cash',
    note: 'Търговец на едро',
    status: 'finalized',
    createdAt: new Date('2026-01-08T09:45:00'),
    finalizedAt: new Date('2026-01-08T09:50:00'),
    lines: [
      {
        id: 'line-003-1',
        articleId: '1',
        articleName: 'Тениски',
        quantity: 100,
        unitPriceEur: 1.30,
        realDeliveryId: 'del-002', // A доставка (без фактура)
        accountingDeliveryId: 'del-001', // Счетоводно към фактурна
        kgPerPieceSnapshot: 0.200,
        unitCostPerKgRealSnapshot: 3.50,
        unitCostPerKgAccSnapshot: 3.50,
      },
      {
        id: 'line-003-2',
        articleId: '6',
        articleName: 'Поли къси',
        quantity: 80,
        unitPriceEur: 1.00,
        realDeliveryId: 'del-003',
        kgPerPieceSnapshot: 0.150,
        unitCostPerKgRealSnapshot: 2.80,
      },
    ],
  },
  {
    id: 'sale-004',
    saleNumber: 'S-2026-004',
    dateTime: new Date('2026-01-10T11:00:00'),
    paymentMethod: 'cash',
    status: 'finalized',
    createdAt: new Date('2026-01-10T11:00:00'),
    finalizedAt: new Date('2026-01-10T11:05:00'),
    lines: [
      {
        id: 'line-004-1',
        articleId: '5',
        articleName: 'Якета зимни',
        quantity: 15,
        unitPriceEur: 8.00,
        realDeliveryId: 'del-008',
        kgPerPieceSnapshot: 0.850,
        unitCostPerKgRealSnapshot: 5.50,
      },
    ],
  },
  {
    id: 'sale-005',
    saleNumber: 'S-2026-005',
    dateTime: new Date('2026-01-12T16:30:00'),
    paymentMethod: 'card',
    status: 'finalized',
    createdAt: new Date('2026-01-12T16:30:00'),
    finalizedAt: new Date('2026-01-12T16:35:00'),
    lines: [
      {
        id: 'line-005-1',
        articleId: '3',
        articleName: 'Рокли дебели',
        quantity: 25,
        unitPriceEur: 3.50,
        realDeliveryId: 'del-006',
        kgPerPieceSnapshot: 0.450,
        unitCostPerKgRealSnapshot: 3.00,
      },
      {
        id: 'line-005-2',
        articleId: '7',
        articleName: 'Панталони летни',
        quantity: 40,
        unitPriceEur: 2.00,
        realDeliveryId: 'del-006',
        kgPerPieceSnapshot: 0.280,
        unitCostPerKgRealSnapshot: 3.00,
      },
      {
        id: 'line-005-3',
        articleId: '9',
        articleName: 'Пуловери',
        quantity: 20,
        unitPriceEur: 2.50,
        realDeliveryId: 'del-007', // A доставка
        accountingDeliveryId: 'del-006',
        kgPerPieceSnapshot: 0.380,
        unitCostPerKgRealSnapshot: 3.00,
        unitCostPerKgAccSnapshot: 3.00,
      },
    ],
  },
  {
    id: 'sale-006',
    saleNumber: 'S-2026-006',
    dateTime: new Date('2026-01-14T10:15:00'),
    paymentMethod: 'other',
    note: 'Плащане с превод',
    status: 'finalized',
    createdAt: new Date('2026-01-14T10:15:00'),
    finalizedAt: new Date('2026-01-14T10:20:00'),
    lines: [
      {
        id: 'line-006-1',
        articleId: '4',
        articleName: 'Блузи дамски',
        quantity: 200,
        unitPriceEur: 1.10,
        realDeliveryId: 'del-010',
        kgPerPieceSnapshot: 0.180,
        unitCostPerKgRealSnapshot: 2.90,
      },
    ],
  },
  {
    id: 'sale-007',
    saleNumber: 'S-2026-007',
    dateTime: new Date('2026-01-15T14:00:00'),
    paymentMethod: 'cash',
    status: 'finalized',
    createdAt: new Date('2026-01-15T14:00:00'),
    finalizedAt: new Date('2026-01-15T14:05:00'),
    lines: [
      {
        id: 'line-007-1',
        articleId: '1',
        articleName: 'Тениски',
        quantity: 75,
        unitPriceEur: 1.40,
        realDeliveryId: 'del-003',
        kgPerPieceSnapshot: 0.200,
        unitCostPerKgRealSnapshot: 2.80,
      },
    ],
  },
  {
    id: 'sale-008',
    saleNumber: 'S-2026-008',
    dateTime: new Date('2026-01-16T09:30:00'),
    paymentMethod: 'card',
    status: 'finalized',
    createdAt: new Date('2026-01-16T09:30:00'),
    finalizedAt: new Date('2026-01-16T09:35:00'),
    lines: [
      {
        id: 'line-008-1',
        articleId: '2',
        articleName: 'Дънки мъжки дълги',
        quantity: 30,
        unitPriceEur: 3.80,
        realDeliveryId: 'del-004',
        kgPerPieceSnapshot: 0.650,
        unitCostPerKgRealSnapshot: 4.20,
      },
      {
        id: 'line-008-2',
        articleId: '7',
        articleName: 'Панталони летни',
        quantity: 50,
        unitPriceEur: 1.80,
        realDeliveryId: 'del-004',
        kgPerPieceSnapshot: 0.280,
        unitCostPerKgRealSnapshot: 4.20,
      },
    ],
  },
];

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
