// Hook за архивиране и възстановяване на данни от Supabase
import { useState, useCallback } from 'react';
import { exportAllData, importAllData, getBackupCounts } from '../../../lib/api/backup';
import type { BackupData, BackupCounts } from '../../../lib/api/backup';
import { validateBackupFile, getBackupSummary, formatBackupDate } from '../utils/backupValidation';
import { saveToStorage, loadFromStorage } from '../../../shared/utils/storage';

const LAST_BACKUP_KEY = 'vaia-last-data-backup';

interface LastBackupInfo {
  date: string;
  counts: BackupCounts;
}

interface DataBackupMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

interface PendingImport {
  data: BackupData;
  counts: BackupCounts;
  summary: string;
  fileName: string;
}

interface UseDataBackupReturn {
  isExporting: boolean;
  isImporting: boolean;
  message: DataBackupMessage | null;
  lastBackupInfo: LastBackupInfo | null;
  lastBackupFormatted: string;
  pendingImport: PendingImport | null;
  exportBackup: () => Promise<void>;
  prepareImport: (file: File) => void;
  confirmImport: () => Promise<void>;
  cancelImport: () => void;
  clearMessage: () => void;
}

export function useDataBackup(): UseDataBackupReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<DataBackupMessage | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  // Зареждаме информация за последния backup от localStorage
  const lastBackupInfo = loadFromStorage<LastBackupInfo>(LAST_BACKUP_KEY);

  const lastBackupFormatted = lastBackupInfo
    ? `${formatBackupDate(lastBackupInfo.date)} — ${getBackupSummary(lastBackupInfo.counts)}`
    : 'Няма направен архив';

  const clearMessage = useCallback(() => setMessage(null), []);

  // ============ Експорт ============

  const exportBackup = useCallback(async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const data = await exportAllData();
      const counts = getBackupCounts(data);

      // Създаваме JSON файл
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Генерираме име на файла с текущата дата
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const fileName = `vaia-data-backup-${dateStr}.json`;

      // Тригерираме сваляне
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Записваме информация за последния backup
      const backupInfo: LastBackupInfo = {
        date: now.toISOString(),
        counts,
      };
      saveToStorage(LAST_BACKUP_KEY, backupInfo);

      const summary = getBackupSummary(counts);
      setMessage({
        type: 'success',
        text: `Архивът е създаден успешно: ${summary}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестна грешка';
      setMessage({
        type: 'error',
        text: `Грешка при създаване на архив: ${errorMessage}`,
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  // ============ Импорт — Стъпка 1: Подготовка ============

  const prepareImport = useCallback((file: File) => {
    setMessage(null);

    // Валидираме типа на файла
    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Моля, изберете JSON файл (.json).' });
      return;
    }

    // Валидираме размера (макс. 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Файлът е твърде голям (макс. 50 MB).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        const validation = validateBackupFile(parsed);
        if (!validation.isValid) {
          setMessage({ type: 'error', text: validation.error || 'Невалиден backup файл.' });
          return;
        }

        const counts = validation.counts!;
        const summary = getBackupSummary(counts);

        setPendingImport({
          data: parsed as BackupData,
          counts,
          summary,
          fileName: file.name,
        });
      } catch {
        setMessage({ type: 'error', text: 'Файлът не съдържа валиден JSON.' });
      }
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Грешка при четене на файла.' });
    };

    reader.readAsText(file);
  }, []);

  // ============ Импорт — Стъпка 2: Потвърждение ============

  const confirmImport = useCallback(async () => {
    if (!pendingImport) return;

    setIsImporting(true);
    setMessage(null);
    const { data, summary } = pendingImport;
    setPendingImport(null);

    try {
      await importAllData(data);

      // Записваме информация за последния backup (от файла)
      const counts = getBackupCounts(data);
      const backupInfo: LastBackupInfo = {
        date: data.createdAt || new Date().toISOString(),
        counts,
      };
      saveToStorage(LAST_BACKUP_KEY, backupInfo);

      setMessage({
        type: 'success',
        text: `Данните бяха възстановени успешно: ${summary}. Страницата ще се презареди...`,
      });

      // Презареждане след 2 секунди за да се обновят всички данни
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестна грешка';
      setMessage({
        type: 'error',
        text: `Грешка при възстановяване: ${errorMessage}`,
      });
    } finally {
      setIsImporting(false);
    }
  }, [pendingImport]);

  // ============ Импорт — Отмяна ============

  const cancelImport = useCallback(() => {
    setPendingImport(null);
  }, []);

  return {
    isExporting,
    isImporting,
    message,
    lastBackupInfo,
    lastBackupFormatted,
    pendingImport,
    exportBackup,
    prepareImport,
    confirmImport,
    cancelImport,
    clearMessage,
  };
}
