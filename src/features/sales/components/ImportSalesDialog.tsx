import { useState, useRef } from 'react';
import { parseExcelFile, validateImportRows } from '../utils/importSales';
import type { SaleImportRow } from '../utils/importSales';
import './ImportSalesDialog.css';

interface ImportSalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: SaleImportRow[]) => void;
  existingArticles: string[];
}

export function ImportSalesDialog({
  isOpen,
  onClose,
  onImport,
  existingArticles,
}: ImportSalesDialogProps) {
  const [preview, setPreview] = useState<SaleImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsLoading(true);
    setErrors([]);

    try {
      const rows = await parseExcelFile(selectedFile);
      const { valid, errors: validationErrors } = validateImportRows(rows, existingArticles);

      setPreview(valid);
      setErrors(validationErrors);
      setStep('preview');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Грешка при обработка на файла']);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    onImport(preview);
    handleClose();
  };

  const handleClose = () => {
    setPreview([]);
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBack = () => {
    setStep('upload');
    setPreview([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalValue = preview.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);

  return (
    <div className="import-sales-overlay" onClick={handleClose}>
      <div className="import-sales-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="import-sales-header">
          <h2>Импорт на продажби от Excel</h2>
          <button className="import-sales-close" onClick={handleClose}>×</button>
        </div>

        <div className="import-sales-content">
          {step === 'upload' && (
            <div
              className="import-sales-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                id="sales-excel-file-input"
                hidden
              />
              <label htmlFor="sales-excel-file-input" className="import-sales-upload-label">
                <div className="import-sales-upload-icon">📊</div>
                <p>Плъзнете Excel файл тук или кликнете за избор</p>
                <span className="import-sales-upload-hint">.xlsx или .xls файлове</span>
              </label>
              {isLoading && <div className="import-sales-loading">Зареждане...</div>}
            </div>
          )}

          {step === 'preview' && (
            <>
              <div className="import-sales-summary">
                <div className="import-sales-summary-item import-sales-summary-success">
                  <span className="import-sales-summary-count">{preview.length}</span>
                  <span className="import-sales-summary-label">реда готови за импорт</span>
                </div>
                <div className="import-sales-summary-item import-sales-summary-info">
                  <span className="import-sales-summary-count">{totalValue.toFixed(2)} €</span>
                  <span className="import-sales-summary-label">обща стойност</span>
                </div>
                {errors.length > 0 && (
                  <div className="import-sales-summary-item import-sales-summary-error">
                    <span className="import-sales-summary-count">{errors.length}</span>
                    <span className="import-sales-summary-label">грешки</span>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="import-sales-errors">
                  <h4>Грешки:</h4>
                  <ul className="import-sales-errors-list">
                    {errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li>...и още {errors.length - 10} грешки</li>
                    )}
                  </ul>
                </div>
              )}

              {preview.length > 0 && (
                <div className="import-sales-preview">
                  <h4>Преглед ({Math.min(preview.length, 15)} от {preview.length}):</h4>
                  <div className="import-sales-preview-table-wrapper">
                    <table className="import-sales-preview-table">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Артикул</th>
                          <th>Брой</th>
                          <th>Цена</th>
                          <th>Общо</th>
                          <th>Real дост.</th>
                          <th>Acc. доставка</th>
                          <th>Плащане</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 15).map((row, i) => (
                          <tr key={i}>
                            <td>{row.date}</td>
                            <td>{row.articleName}</td>
                            <td>{row.quantity}</td>
                            <td>{row.unitPrice.toFixed(2)} €</td>
                            <td>{(row.quantity * row.unitPrice).toFixed(2)} €</td>
                            <td>#{row.deliveryId}</td>
                            <td>
                              {String(row.deliveryId).toUpperCase().includes('A') && row.accountingDeliveryId
                                ? `#${row.accountingDeliveryId}`
                                : `#${row.deliveryId}`}
                            </td>
                            <td>{row.paymentMethod === 'no-cash' ? 'Без каса' : 'По каса'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="import-sales-footer">
          {step === 'preview' && (
            <button className="import-sales-btn-secondary" onClick={handleBack}>
              ← Назад
            </button>
          )}
          <button className="import-sales-btn-secondary" onClick={handleClose}>
            Отказ
          </button>
          {step === 'preview' && preview.length > 0 && (
            <button className="import-sales-btn-primary" onClick={handleImport}>
              Импортирай {preview.length} реда
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
