import { useState, useCallback } from 'react';
import { useArticles } from '../hooks/useArticles';
import { ArticleFiltersBar } from './ArticleFiltersBar';
import { ArticleTable } from './ArticleTable';
import { ArticleDialog } from './ArticleDialog';
import type { Article, ArticleFormData } from '../types';
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
  } = useArticles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>();
  const [dialogKey, setDialogKey] = useState(0); // Key за рестарт на формата

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

  // Списък с имена за валидация на уникалност
  const existingNames = allArticles.map((a) => a.name);

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
        totalCount={allArticles.length}
        filteredCount={articles.length}
      />

      <ArticleTable
        articles={articles}
        onEdit={handleEditArticle}
        onToggleStatus={toggleArticleStatus}
      />

      <ArticleDialog
        key={dialogKey}
        isOpen={dialogOpen}
        article={editingArticle}
        existingNames={existingNames}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />
    </div>
  );
};
