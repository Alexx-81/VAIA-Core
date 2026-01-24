import { useState, useRef } from 'react';
import { parseQualitiesExcel, validateQualityImportRows } from '../utils/importQualities';
import type { QualityImportRow } from '../utils/importQualities';
import './ImportQualitiesDialog.css';

interface ImportQualitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (names: string[]) => void;
  existingNames: string[];
}

export function ImportQualitiesDialog({
  isOpen,
  onClose,
  onImport,
  existingNames,
}: ImportQualitiesDialogProps) {
  const [preview, setPreview] = useState<QualityImportRow[]>([]);
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
      const rows = await parseQualitiesExcel(selectedFile);
      const { valid, errors: validationErrors } = validateQualityImportRows(rows, existingNames);

      setPreview(valid);
      setErrors(validationErrors);
      setStep('preview');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Грешка при обработка']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const names = preview.map((row) => row.name);
    onImport(names);
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

  return (
    <div className="import-qualities-overlay" onClick={handleClose}>
      <div className="import-qualities-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="import-qualities-header">
          <h2>Импорт на качества от Excel</h2>
          <button className="import-qualities-close" onClick={handleClose}>×</button>
        </div>

        <div className="import-qualities-content">
          {step === 'upload' && (
            <div
              className="import-qualities-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                id="qualities-excel-file-input"
                hidden
              />
              <label htmlFor="qualities-excel-file-input" className="import-qualities-upload-label">
                <div className="import-qualities-upload-icon">📋</div>
                <p>Плъзнете Excel файл тук или кликнете за избор</p>
                <span className="import-qualities-upload-hint">.xlsx или .xls файлове</span>
              </label>
              {isLoading && <div className="import-qualities-loading">Зареждане...</div>}
            </div>
          )}

          {step === 'preview' && (
            <>
              <div className="import-qualities-summary">
                <div className="import-qualities-summary-item import-qualities-summary-success">
                  <span className="import-qualities-summary-count">{preview.length}</span>
                  <span className="import-qualities-summary-label">готови за импорт</span>
                </div>
                {errors.length > 0 && (
                  <div className="import-qualities-summary-item import-qualities-summary-error">
                    <span className="import-qualities-summary-count">{errors.length}</span>
                    <span className="import-qualities-summary-label">грешки</span>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="import-qualities-errors">
                  <h4>Грешки:</h4>
                  <ul className="import-qualities-errors-list">
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
                <div className="import-qualities-preview">
                  <h4>Преглед ({Math.min(preview.length, 20)} от {preview.length}):</h4>
                  <div className="import-qualities-preview-list">
                    {preview.slice(0, 20).map((row, i) => (
                      <div key={i} className="import-qualities-preview-item">
                        <span className="import-qualities-preview-number">{i + 1}.</span>
                        <span className="import-qualities-preview-name">{row.name}</span>
                      </div>
                    ))}
                    {preview.length > 20 && (
                      <div className="import-qualities-preview-more">
                        ...и още {preview.length - 20}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="import-qualities-footer">
          {step === 'preview' && (
            <button className="import-qualities-btn-secondary" onClick={handleBack}>
              ← Назад
            </button>
          )}
          <button className="import-qualities-btn-secondary" onClick={handleClose}>
            Отказ
          </button>
          {step === 'preview' && preview.length > 0 && (
            <button className="import-qualities-btn-primary" onClick={handleImport}>
              Импортирай {preview.length} качества
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
