import { useState, useCallback, useRef } from 'react';
import { useArticles } from '../hooks/useArticles';
import { ArticleFiltersBar } from './ArticleFiltersBar';
import { ArticleTable } from './ArticleTable';
import { ArticleDialog } from './ArticleDialog';
import { Toast } from '../../../shared/components/Toast';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useAuth } from '../../../shared/context/AuthContext';
import type { Article, ArticleFormData, ImportResult } from '../types';
import { importArticlesFromExcel, generateArticleImportTemplate } from '../utils/importArticles';
import './Articles.css';

export const Articles = () => {
  const {
    articles,
    allArticles,
    filters,
    loading,
    updateFilters,
    createArticle,
    updateArticle,
    toggleArticleStatus,
    deleteArticle,
    checkArticleDependencies,
  } = useArticles();

  const { isAdmin } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>();
  const [dialogKey, setDialogKey] = useState(0); // Key за рестарт на формата
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Отваря диалог за нов артикул
  const handleNewArticle = useCallback(() => {
    setEditingArticle(undefined);
    setDialogKey((prev) => prev + 1); // Нов key = нова форма
    setDialogOpen(true);
  }, []);

  // Отваря диалог за редакция
  const handleEditArticle = useCallback((article: Article) => {
    setEditingArticle(article);
    setDialogOpen(true);
  }, []);

  // Затваря диалога
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingArticle(undefined);
  }, []);

  // Submit handler
  const handleSubmit = useCallback(
    async (formData: ArticleFormData) => {
      if (editingArticle) {
        return updateArticle(editingArticle.id, formData);
      }
      return createArticle(formData);
    },
    [editingArticle, createArticle, updateArticle]
  );

  // Delete handler
  const handleDeleteArticle = useCallback(async (article: Article) => {
    const deps = await checkArticleDependencies(article.id);
    
    let message = `Сигурни ли сте, че искате да изтриете артикул „${article.name}“?`;
    if (deps.saleCount > 0) {
      message += `\n\n❗ Ще бъдат изтрити и ${deps.saleCount} свързани продажби!`;
    }
    message += '\n\nТова действие е необратимо.';

    setDeleteConfirm({
      isOpen: true,
      title: `Изтриване на артикул`,
      message,
      onConfirm: async () => {
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        const result = await deleteArticle(article.id);
        if (result.success) {
          setToast({ message: `Артикул „${article.name}“ е изтрит успешно.`, variant: 'success' });
          handleCloseDialog();
        } else {
          setToast({ message: result.error || 'Грешка при изтриване.', variant: 'error' });
        }
      },
    });
  }, [checkArticleDependencies, deleteArticle, handleCloseDialog]);

  // Списък с имена за валидация на уникалност
  const existingNames = allArticles.map((a) => a.name);

  // Download template handler
  const handleDownloadTemplate = useCallback(() => {
    generateArticleImportTemplate();
    setToast({ message: 'Шаблонът е изтеглен успешно!', variant: 'success' });
  }, []);

  // Import button click handler
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // File selection handler
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Провери разширението
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setToast({ 
          message: 'Моля изберете Excel файл (.xlsx или .xls)', 
          variant: 'error' 
        });
        return;
      }

      setImporting(true);
      setToast({ message: 'Импортиране на артикули...', variant: 'info' });

      try {
        const result = await importArticlesFromExcel(file, allArticles);
        setImportResult(result);

        if (result.success && result.validRecords.length > 0) {
          // Импортирай валидните записи
          for (const record of result.validRecords) {
            await createArticle({
              name: record.name!,
              piecesPerKg: String(1000 / record.gramsPerPiece!),
              isActive: record.isActive!,
            });
          }

          const successMsg = `Успешно импортирани ${result.validRecords.length} артикула`;
          const warningMsg = result.invalidRecords.length > 0 
            ? ` (${result.invalidRecords.length} пропуснати)` 
            : '';
          
          setToast({ 
            message: successMsg + warningMsg, 
            variant: result.invalidRecords.length > 0 ? 'warning' : 'success' 
          });
        } else {
          setToast({ 
            message: result.error || 'Няма валидни артикули за импорт', 
            variant: 'error' 
          });
        }
      } catch (error) {
        console.error('Грешка при импорт:', error);
        setToast({ 
          message: 'Грешка при импортиране на файла', 
          variant: 'error' 
        });
      } finally {
        setImporting(false);
        // Изчисти input за да може повторен импорт на същия файл
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [allArticles, createArticle]
  );

  if (loading) {
    return (
      <div className="articles">
        <div className="articles__loading">Зареждане на артикули...</div>
      </div>
    );
  }

  return (
    <div className="articles">
      <div className="articles__header">
        <div className="articles__title-section">
          <h1 className="articles__title">Артикули</h1>
          <p className="articles__subtitle">
            Управление на каталога с артикули и техните тегла
          </p>
        </div>
      </div>

      <ArticleFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onNewArticle={handleNewArticle}
        onImport={handleImport}
        onDownloadTemplate={handleDownloadTemplate}
        totalCount={allArticles.length}
        filteredCount={articles.length}
      />

      <ArticleTable
        articles={articles}
        onEdit={handleEditArticle}
        onToggleStatus={toggleArticleStatus}
        onDelete={isAdmin ? handleDeleteArticle : undefined}
      />

      <ArticleDialog
        key={dialogKey}
        isOpen={dialogOpen}
        article={editingArticle}
        existingNames={existingNames}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
        onDelete={isAdmin ? handleDeleteArticle : undefined}
      />

      {/* Hidden file input за импорт */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={importing}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Изтрий"
        variant="danger"
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Import result dialog */}
      {importResult && importResult.invalidRecords.length > 0 && (
        <div className="import-result-dialog" onClick={() => setImportResult(null)}>
          <div className="import-result-dialog__content" onClick={(e) => e.stopPropagation()}>
            <div className="import-result-dialog__header">
              <h3>Резултати от импорта</h3>
              <button 
                className="import-result-dialog__close" 
                onClick={() => setImportResult(null)}
              >
                ×
              </button>
            </div>
            <div className="import-result-dialog__body">
              <p className="import-result-dialog__summary">
                <strong>Успешни:</strong> {importResult.validRecords.length} | 
                <strong> Пропуснати:</strong> {importResult.invalidRecords.length}
              </p>
              
              {importResult.invalidRecords.length > 0 && (
                <div className="import-result-dialog__errors">
                  <h4>Пропуснати записи:</h4>
                  <ul>
                    {importResult.invalidRecords.map((record, idx) => {
                      const articleName = record.data['Артикул'] || record.data['Name'] || record.data['Article'];
                      const displayName = articleName ? ` (${String(articleName)})` : '';
                      return (
                        <li key={idx}>
                          <strong>Ред {record.row}:</strong> {record.error}{displayName}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="import-result-dialog__footer">
              <button 
                className="btn-primary" 
                onClick={() => setImportResult(null)}
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
