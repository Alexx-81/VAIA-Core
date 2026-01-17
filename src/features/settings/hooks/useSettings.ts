import { useState, useCallback, useEffect } from 'react';
import type {
  AppSettings,
  GeneralSettings,
  FormattingSettings,
  InventorySettings,
  ExportSettings,
  ReportHeaderSettings,
  SettingsSection,
} from '../types';
import { defaultSettings } from '../types';

const STORAGE_KEY = 'vaia-core-settings';

// Зареждане от localStorage
const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge с default за да добавим нови полета
      return {
        general: { ...defaultSettings.general, ...parsed.general },
        formatting: { ...defaultSettings.formatting, ...parsed.formatting },
        inventory: { ...defaultSettings.inventory, ...parsed.inventory },
        export: { ...defaultSettings.export, ...parsed.export },
        reportHeader: { ...defaultSettings.reportHeader, ...parsed.reportHeader },
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
};

// Запазване в localStorage
const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [expandedSection, setExpandedSection] = useState<SettingsSection | null>('general');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Изчистване на съобщението
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Toggle секция
  const toggleSection = useCallback((section: SettingsSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  // Обновяване на General settings
  const updateGeneral = useCallback((updates: Partial<GeneralSettings>) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Обновяване на Formatting settings
  const updateFormatting = useCallback((updates: Partial<FormattingSettings>) => {
    setSettings(prev => ({
      ...prev,
      formatting: { ...prev.formatting, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Обновяване на Inventory settings
  const updateInventory = useCallback((updates: Partial<InventorySettings>) => {
    setSettings(prev => ({
      ...prev,
      inventory: { ...prev.inventory, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Обновяване на Export settings
  const updateExport = useCallback((updates: Partial<ExportSettings>) => {
    setSettings(prev => ({
      ...prev,
      export: { ...prev.export, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Обновяване на Report Header settings
  const updateReportHeader = useCallback((updates: Partial<ReportHeaderSettings>) => {
    setSettings(prev => ({
      ...prev,
      reportHeader: { ...prev.reportHeader, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Запазване на настройките
  const save = useCallback(() => {
    try {
      saveSettings(settings);
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Настройките са запазени успешно!' });
    } catch {
      setSaveMessage({ type: 'error', text: 'Грешка при запазване на настройките.' });
    }
  }, [settings]);

  // Възстановяване на стойности по подразбиране
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
    setHasChanges(true);
    setSaveMessage({ type: 'success', text: 'Настройките са възстановени по подразбиране.' });
  }, []);

  // Експорт на настройки (backup)
  const exportSettings = useCallback(() => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaia-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveMessage({ type: 'success', text: 'Настройките са експортирани!' });
  }, [settings]);

  // Импорт на настройки (restore)
  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({
          general: { ...defaultSettings.general, ...imported.general },
          formatting: { ...defaultSettings.formatting, ...imported.formatting },
          inventory: { ...defaultSettings.inventory, ...imported.inventory },
          export: { ...defaultSettings.export, ...imported.export },
          reportHeader: { ...defaultSettings.reportHeader, ...imported.reportHeader },
        });
        setHasChanges(true);
        setSaveMessage({ type: 'success', text: 'Настройките са импортирани! Натиснете "Запази" за да ги приложите.' });
      } catch {
        setSaveMessage({ type: 'error', text: 'Грешка при импортиране. Невалиден файл.' });
      }
    };
    reader.readAsText(file);
  }, []);

  // Тест експорт (генерира примерен файл)
  const testExport = useCallback(() => {
    // Симулираме тестов експорт
    setSaveMessage({ type: 'success', text: 'Тестовият експорт е готов! (симулация)' });
  }, []);

  return {
    settings,
    expandedSection,
    saveMessage,
    hasChanges,
    toggleSection,
    updateGeneral,
    updateFormatting,
    updateInventory,
    updateExport,
    updateReportHeader,
    save,
    resetToDefaults,
    exportSettings,
    importSettings,
    testExport,
  };
};
