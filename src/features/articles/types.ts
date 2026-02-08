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

// Import types
export interface ArticleImportRow {
  name: string;
  piecesPerKg: number;
}

export interface ImportResult {
  success: boolean;
  error?: string;
  validRecords: Partial<Article>[];
  invalidRecords: Array<{
    row: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}
