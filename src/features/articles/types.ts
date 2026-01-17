// Типове за артикули (Products Catalog)

export interface Article {
  id: string;
  name: string;
  gramsPerPiece: number; // Съхраняваме в грамове за точност (integer)
  isActive: boolean;
  createdAt: Date;
  lastSoldAt?: Date; // Последна продажба
}

// Computed properties
export interface ArticleWithComputed extends Article {
  kgPerPiece: number;    // gramsPerPiece / 1000
  piecesPerKg: number;   // 1000 / gramsPerPiece
}

export interface ArticleFormData {
  name: string;
  piecesPerKg: string; // Бройки в 1 kg (потребителят въвежда това)
  isActive: boolean;
}

export type ArticleStatus = 'all' | 'active' | 'inactive';
export type ArticleSortBy = 'name-asc' | 'name-desc' | 'most-used' | 'newest';

export interface ArticleFilters {
  search: string;
  status: ArticleStatus;
  sortBy: ArticleSortBy;
}
