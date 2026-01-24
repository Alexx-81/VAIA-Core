import type { Article } from '../types';
import { formatKgPerPiece, formatPiecesPerKg, formatDate } from '../utils/articleUtils';
import { DataCards } from '../../../shared/components/DataCards';
import './ArticleTable.css';

interface ArticleTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onToggleStatus: (id: string) => void;
}

export const ArticleTable = ({
  articles,
  onEdit,
  onToggleStatus,
}: ArticleTableProps) => {
  if (articles.length === 0) {
    return (
      <div className="article-table__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>Няма намерени артикули</p>
        <span>Опитайте с различни филтри или създайте нов артикул</span>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="article-table__wrapper desktop-only">
        <table className="article-table">
          <thead>
            <tr>
              <th className="article-table__th-name">Артикул</th>
              <th className="article-table__th-weight">kg/бр</th>
              <th className="article-table__th-pieces">бр./kg</th>
              <th className="article-table__th-status">Статус</th>
              <th className="article-table__th-date">Последно продаван</th>
              <th className="article-table__th-actions">Действия</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className={`article-table__row ${!article.isActive ? 'article-table__row--inactive' : ''}`}
              >
                <td className="article-table__td-name">
                  <span className="article-table__name">{article.name}</span>
                </td>
                <td className="article-table__td-weight">
                  <span className="article-table__weight">
                    {formatKgPerPiece(article.gramsPerPiece)}
                  </span>
                </td>
                <td className="article-table__td-pieces">
                  <span className="article-table__pieces">
                    {formatPiecesPerKg(article.gramsPerPiece)}
                  </span>
                </td>
                <td className="article-table__td-status">
                  <span
                    className={`article-table__status ${
                      article.isActive
                        ? 'article-table__status--active'
                        : 'article-table__status--inactive'
                    }`}
                  >
                    {article.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="article-table__td-date">
                  {formatDate(article.lastSoldAt)}
                </td>
                <td className="article-table__td-actions">
                  <div className="article-table__actions">
                    <button
                      className="article-table__action-btn article-table__action-btn--edit"
                      onClick={() => onEdit(article)}
                      title="Редакция"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                      <span className="article-table__action-label">Редактирай</span>
                    </button>
                    <button
                      className={`article-table__action-btn ${
                        article.isActive
                          ? 'article-table__action-btn--deactivate'
                          : 'article-table__action-btn--activate'
                      }`}
                      onClick={() => onToggleStatus(article.id)}
                      title={article.isActive ? 'Деактивирай' : 'Активирай'}
                    >
                      {article.isActive ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6" />
                            <path d="m9 9 6 6" />
                          </svg>
                          <span className="article-table__action-label">Деактивирай</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          <span className="article-table__action-label">Активирай</span>
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <DataCards
        data={articles}
        keyExtractor={(a) => a.id}
        onItemClick={(a) => onEdit(a)}
        cardClassName={(a) => (!a.isActive ? 'inactive' : '')}
        fields={[
          {
            key: 'gramsPerPiece',
            label: 'kg/бр',
            render: (a) => (
              <span className="article-table__weight">{formatKgPerPiece(a.gramsPerPiece)}</span>
            ),
          },
          {
            key: 'piecesPerKg',
            label: 'бр./kg',
            render: (a) => (
              <span className="article-table__pieces">{formatPiecesPerKg(a.gramsPerPiece)}</span>
            ),
          },
          {
            key: 'lastSoldAt',
            label: 'Последно продаван',
            render: (a) => formatDate(a.lastSoldAt),
          },
        ]}
        renderCardTitle={(a) => a.name}
        renderCardBadge={(a) => (
          <span
            className={`article-table__status ${
              a.isActive ? 'article-table__status--active' : 'article-table__status--inactive'
            }`}
          >
            {a.isActive ? 'Активен' : 'Неактивен'}
          </span>
        )}
        renderCardActions={(a) => (
          <>
            <button className="edit" onClick={() => onEdit(a)}>
              ✏️ Редакция
            </button>
            <button
              className={a.isActive ? 'danger' : 'success'}
              onClick={() => onToggleStatus(a.id)}
            >
              {a.isActive ? '⏸️ Деактивирай' : '▶️ Активирай'}
            </button>
          </>
        )}
      />
    </>
  );
};
