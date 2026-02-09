import { useState, useRef } from 'react';
import type { Delivery, ImportResult, Quality } from '../types';
import { importDeliveriesFromExcel, validateExcelFile } from '../utils/importDeliveries';
import './ImportDeliveriesDialog.css';

interface ImportDeliveriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (deliveries: Delivery[]) => void;
  existingDisplayIds: string[];
  qualities: Quality[];
}

export function ImportDeliveriesDialog({
  isOpen,
  onClose,
  onImport,
  existingDisplayIds,
  qualities
}: ImportDeliveriesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateExcelFile(selectedFile);
    if (!validation.valid) {
      setResult({
        success: false,
        imported: 0,
        errors: [validation.error || 'Невалиден файл'],
        deliveries: []
      });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const importResult = await importDeliveriesFromExcel(file, existingDisplayIds, qualities);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Неизвестна грешка'],
        deliveries: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (result?.deliveries && result.deliveries.length > 0) {
      onImport(result.deliveries);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="import-dialog" onClick={e => e.stopPropagation()}>
        <div className="import-dialog__header">
          <h2>📥 Импортиране на доставки</h2>
          <button className="import-dialog__close" onClick={handleClose}>×</button>
        </div>

        <div className="import-dialog__content">
          {/* Зона за качване */}
          <div
            className={`drop-zone ${dragOver ? 'drop-zone--drag-over' : ''} ${file ? 'drop-zone--has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <div className="drop-zone__file-info">
                <span className="drop-zone__file-icon">📄</span>
                <span className="drop-zone__file-name">{file.name}</span>
                <span className="drop-zone__file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div className="drop-zone__content">
                <span className="drop-zone__upload-icon">📁</span>
                <p className="drop-zone__text">Плъзнете Excel файл тук</p>
                <p className="drop-zone__hint">или кликнете за избор</p>
                <p className="drop-zone__formats">Поддържани формати: .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {/* Очаквана структура */}
          <div className="import-info">
            <h4 className="import-info__title">📋 Очаквана структура на файла:</h4>
            <table className="import-info__table">
              <thead>
                <tr>
                  <th>Колона</th>
                  <th>Описание</th>
                  <th>Задължителна</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Дата</td>
                  <td>Дата на доставката (DD.MM.YYYY)</td>
                  <td>Не</td>
                </tr>
                <tr>
                  <td>Качество</td>
                  <td>Категория/качество на стоката</td>
                  <td>Да</td>
                </tr>
                <tr>
                  <td>Килограми</td>
                  <td>Тегло в килограми</td>
                  <td>Да</td>
                </tr>
                <tr>
                  <td>Единична цена</td>
                  <td>Цена за килограм (EUR)</td>
                  <td>Не</td>
                </tr>
                <tr>
                  <td>Обща сума</td>
                  <td>Обща стойност на доставката</td>
                  <td>Не</td>
                </tr>
                <tr>
                  <td>Фактура №</td>
                  <td>Номер на фактура</td>
                  <td>Не</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Резултат */}
          {result && (
            <div className={`import-result ${result.success ? 'import-result--success' : 'import-result--error'}`}>
              <h4 className="import-result__title">
                {result.success ? '✅ Успешен анализ' : '❌ Грешка при импортиране'}
              </h4>
              
              {result.success && (
                <p className="import-result__summary">
                  Намерени <strong>{result.imported}</strong> доставки за импортиране
                </p>
              )}
              
              {result.errors.length > 0 && (
                <div className="import-result__errors">
                  <p><strong>Грешки ({result.errors.length}):</strong></p>
                  <ul>
                    {result.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="import-result__more-errors">...и още {result.errors.length - 5} грешки</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Преглед на данните */}
              {result.deliveries.length > 0 && (
                <div className="import-preview">
                  <h4 className="import-preview__title">📊 Преглед (първите 5):</h4>
                  <table className="import-preview__table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Дата</th>
                        <th>Качество</th>
                        <th>Кг</th>
                        <th>Цена/кг</th>
                        <th>Общо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.deliveries.slice(0, 5).map((d, i) => {
                        const formatDate = (date: Date) => {
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = date.getFullYear();
                          return `${day}.${month}.${year}`;
                        };
                        return (
                          <tr key={i}>
                            <td>{d.displayId}</td>
                            <td>{formatDate(new Date(d.date))}</td>
                            <td>{d.qualityName}</td>
                            <td>{d.kgIn.toFixed(1)}</td>
                            <td>{d.unitCostPerKg.toFixed(2)} €</td>
                            <td>{(d.kgIn * d.unitCostPerKg).toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {result.deliveries.length > 5 && (
                    <p className="import-preview__more">...и още {result.deliveries.length - 5} записа</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="import-dialog__footer">
          <button className="btn btn--secondary" onClick={handleClose}>
            Отказ
          </button>
          
          {!result ? (
            <button 
              className="btn btn--primary" 
              onClick={handleImport}
              disabled={!file || isLoading}
            >
              {isLoading ? '⏳ Анализиране...' : '🔍 Анализирай файла'}
            </button>
          ) : result.success && result.deliveries.length > 0 ? (
            <button 
              className="btn btn--success" 
              onClick={handleConfirmImport}
            >
              ✅ Импортирай {result.deliveries.length} доставки
            </button>
          ) : (
            <button 
              className="btn btn--primary" 
              onClick={() => { setFile(null); setResult(null); }}
            >
              🔄 Опитай отново
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
