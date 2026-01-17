import type { Article } from '../types';

// Mock данни за артикули
export const mockArticles: Article[] = [
  {
    id: '1',
    name: 'Тениски',
    gramsPerPiece: 200, // 0.200 kg
    isActive: true,
    createdAt: new Date('2025-01-10'),
    lastSoldAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    name: 'Дънки мъжки дълги',
    gramsPerPiece: 650, // 0.650 kg
    isActive: true,
    createdAt: new Date('2025-01-12'),
    lastSoldAt: new Date('2026-01-16'),
  },
  {
    id: '3',
    name: 'Рокли дебели',
    gramsPerPiece: 450, // 0.450 kg
    isActive: true,
    createdAt: new Date('2025-02-05'),
    lastSoldAt: new Date('2026-01-14'),
  },
  {
    id: '4',
    name: 'Блузи дамски',
    gramsPerPiece: 180, // 0.180 kg
    isActive: true,
    createdAt: new Date('2025-03-01'),
    lastSoldAt: new Date('2026-01-10'),
  },
  {
    id: '5',
    name: 'Якета зимни',
    gramsPerPiece: 850, // 0.850 kg
    isActive: true,
    createdAt: new Date('2025-04-15'),
    lastSoldAt: new Date('2026-01-08'),
  },
  {
    id: '6',
    name: 'Поли къси',
    gramsPerPiece: 150, // 0.150 kg
    isActive: true,
    createdAt: new Date('2025-05-20'),
    lastSoldAt: new Date('2026-01-12'),
  },
  {
    id: '7',
    name: 'Панталони летни',
    gramsPerPiece: 280, // 0.280 kg
    isActive: true,
    createdAt: new Date('2025-06-10'),
    lastSoldAt: new Date('2026-01-11'),
  },
  {
    id: '8',
    name: 'Ризи мъжки',
    gramsPerPiece: 220, // 0.220 kg
    isActive: false, // Неактивен
    createdAt: new Date('2025-02-20'),
    lastSoldAt: new Date('2025-12-01'),
  },
  {
    id: '9',
    name: 'Пуловери',
    gramsPerPiece: 380, // 0.380 kg
    isActive: true,
    createdAt: new Date('2025-07-01'),
  },
  {
    id: '10',
    name: 'Шорти спортни',
    gramsPerPiece: 120, // 0.120 kg
    isActive: false, // Неактивен
    createdAt: new Date('2025-01-05'),
    lastSoldAt: new Date('2025-11-15'),
  },
];
