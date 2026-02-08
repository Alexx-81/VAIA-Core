// LocalStorage utility за персистиране на данни

const STORAGE_KEYS = {
  DELIVERIES: 'vaia_deliveries',
  SALES: 'vaia_sales',
  SALES_DATA: 'vaia_sales_data',
  ARTICLES: 'vaia_articles',
  QUALITIES: 'vaia_qualities',
  LAST_DATA_BACKUP: 'vaia-last-data-backup',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Записва данни в localStorage
 */
export const saveToStorage = <T>(key: StorageKey, data: T): void => {
  try {
    const serialized = JSON.stringify(data, (_, value) => {
      // Конвертираме Date обекти в ISO strings
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

/**
 * Зарежда данни от localStorage
 */
export const loadFromStorage = <T>(key: StorageKey): T | null => {
  try {
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;
    
    return JSON.parse(serialized, (_, value) => {
      // Възстановяваме Date обекти от ISO strings
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Изтрива данни от localStorage
 */
export const removeFromStorage = (key: StorageKey): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

/**
 * Изчиства всички VAIA данни от localStorage
 */
export const clearAllStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key);
  });
};

export { STORAGE_KEYS };
