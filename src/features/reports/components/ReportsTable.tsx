import React from 'react';
import type { 
  DeliveryReportRow, 
  QualityReportRow, 
  ArticleReportRow, 
  TransactionReportRow,
  ReportType,
  ReportMode,
} from '../types';
import './ReportsTable.css';

interface ReportsTableProps {
  reportType: ReportType;
  mode: ReportMode;
  deliveryRows: DeliveryReportRow[];
  qualityRows: QualityReportRow[];
  articleRows: ArticleReportRow[];
  transactionRows: TransactionReportRow[];
  onViewDeliveryDetail: (deliveryId: string) => void;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('bg-BG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('bg-BG');
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('bg-BG', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'В брой';
    case 'card': return 'Карта';
    case 'other': return 'Друго';
    default: return method;
  }
};

// Таблица По доставки
const DeliveriesTable: React.FC<{
  rows: DeliveryReportRow[];
  mode: ReportMode;
  onViewDetail: (deliveryId: string) => void;
}> = ({ rows, mode, onViewDetail }) => (
  <div className="reports-table__wrapper">
    <table className="reports-table">
      <thead>
        <tr>
          <th>Доставка</th>
          <th>Дата</th>
          <th>Качество</th>
          <th>Фактура №</th>
          {mode === 'real' && <th>Фактурна?</th>}
          <th className="text-right">kg продадени</th>
          <th className="text-right">Бройки</th>
          <th className="text-right">Оборот (€)</th>
          <th className="text-right">Себестойност (€)</th>
          <th className="text-right">Печалба (€)</th>
          <th className="text-right">Марж %</th>
          <th className="text-right">€/kg (продажба)</th>
          {mode === 'real' && (
            <>
              <th className="text-right">€/kg (достав.)</th>
              <th className="text-right">Цена доставка (€)</th>
              <th className="text-right">Изкарани (€)</th>
            </>
          )}
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.deliveryId}>
            <td className="font-medium">{row.deliveryDisplayId}</td>
            <td>{formatDate(row.deliveryDate)}</td>
            <td>{row.qualityName}</td>
            <td>{row.invoiceNumber || '—'}</td>
            {mode === 'real' && (
              <td>
                <span className={`reports-table__badge ${row.isInvoiced ? 'reports-table__badge--yes' : 'reports-table__badge--no'}`}>
                  {row.isInvoiced ? 'Да' : 'Не'}
                </span>
              </td>
            )}
            <td className="text-right">{formatNumber(row.kgSold)}</td>
            <td className="text-right">{row.piecesSold}</td>
            <td className="text-right font-medium">{formatCurrency(row.revenueEur)}</td>
            <td className="text-right">{formatCurrency(row.cogsEur)}</td>
            <td className={`text-right font-medium ${row.profitEur >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(row.profitEur)}
            </td>
            <td className={`text-right ${row.marginPercent >= 30 ? 'text-positive' : row.marginPercent >= 15 ? '' : 'text-warning'}`}>
              {formatNumber(row.marginPercent, 1)}%
            </td>
            <td className="text-right">{formatNumber(row.avgPricePerKgEur)}</td>
            {mode === 'real' && (
              <>
                <td className="text-right">{formatNumber(row.eurPerKgDelivery)}</td>
                <td className="text-right">{formatCurrency(row.totalDeliveryCostEur)}</td>
                <td className={`text-right font-medium ${row.earnedFromDeliveryEur >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatCurrency(row.earnedFromDeliveryEur)}
                </td>
              </>
            )}
            <td>
              <button
                className="reports-table__action-btn"
                onClick={() => onViewDetail(row.deliveryId)}
                title="Виж детайли"
              >
                🔍
              </button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={mode === 'real' ? 16 : 12} className="reports-table__empty">
              Няма данни за избрания период
            </td>
          </tr>
        )}
      </tbody>
      {rows.length > 0 && (
        <tfoot>
          <tr>
            <td colSpan={mode === 'real' ? 5 : 4}><strong>ОБЩО</strong></td>
            <td className="text-right"><strong>{formatNumber(rows.reduce((s, r) => s + r.kgSold, 0))}</strong></td>
            <td className="text-right"><strong>{rows.reduce((s, r) => s + r.piecesSold, 0)}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.revenueEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.cogsEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profitEur, 0))}</strong></td>
            <td colSpan={mode === 'real' ? 6 : 3}></td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

// Таблица По качества
const QualitiesTable: React.FC<{ rows: QualityReportRow[] }> = ({ rows }) => (
  <div className="reports-table__wrapper">
    <table className="reports-table">
      <thead>
        <tr>
          <th>Качество</th>
          <th className="text-right">kg продадени</th>
          <th className="text-right">Бройки</th>
          <th className="text-right">Оборот (€)</th>
          <th className="text-right">Себестойност (€)</th>
          <th className="text-right">Печалба (€)</th>
          <th className="text-right">Марж %</th>
          <th className="text-right">€/kg</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.qualityId}>
            <td className="font-medium">{row.qualityName}</td>
            <td className="text-right">{formatNumber(row.kgSold)}</td>
            <td className="text-right">{row.piecesSold}</td>
            <td className="text-right font-medium">{formatCurrency(row.revenueEur)}</td>
            <td className="text-right">{formatCurrency(row.cogsEur)}</td>
            <td className={`text-right font-medium ${row.profitEur >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(row.profitEur)}
            </td>
            <td className={`text-right ${row.marginPercent >= 30 ? 'text-positive' : row.marginPercent >= 15 ? '' : 'text-warning'}`}>
              {formatNumber(row.marginPercent, 1)}%
            </td>
            <td className="text-right">{formatNumber(row.avgPricePerKgEur)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="reports-table__empty">Няма данни за избрания период</td>
          </tr>
        )}
      </tbody>
      {rows.length > 0 && (
        <tfoot>
          <tr>
            <td><strong>ОБЩО</strong></td>
            <td className="text-right"><strong>{formatNumber(rows.reduce((s, r) => s + r.kgSold, 0))}</strong></td>
            <td className="text-right"><strong>{rows.reduce((s, r) => s + r.piecesSold, 0)}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.revenueEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.cogsEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profitEur, 0))}</strong></td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

// Таблица По артикули
const ArticlesTable: React.FC<{ rows: ArticleReportRow[] }> = ({ rows }) => (
  <div className="reports-table__wrapper">
    <table className="reports-table">
      <thead>
        <tr>
          <th>Артикул</th>
          <th className="text-right">Бройки</th>
          <th className="text-right">kg</th>
          <th className="text-right">Оборот (€)</th>
          <th className="text-right">Себестойност (€)</th>
          <th className="text-right">Печалба (€)</th>
          <th className="text-right">Марж %</th>
          <th className="text-right">€/бр</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.articleId}>
            <td className="font-medium">{row.articleName}</td>
            <td className="text-right">{row.piecesSold}</td>
            <td className="text-right">{formatNumber(row.kgSold)}</td>
            <td className="text-right font-medium">{formatCurrency(row.revenueEur)}</td>
            <td className="text-right">{formatCurrency(row.cogsEur)}</td>
            <td className={`text-right font-medium ${row.profitEur >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(row.profitEur)}
            </td>
            <td className={`text-right ${row.marginPercent >= 30 ? 'text-positive' : row.marginPercent >= 15 ? '' : 'text-warning'}`}>
              {formatNumber(row.marginPercent, 1)}%
            </td>
            <td className="text-right">{formatNumber(row.avgPricePerPieceEur)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="reports-table__empty">Няма данни за избрания период</td>
          </tr>
        )}
      </tbody>
      {rows.length > 0 && (
        <tfoot>
          <tr>
            <td><strong>ОБЩО</strong></td>
            <td className="text-right"><strong>{rows.reduce((s, r) => s + r.piecesSold, 0)}</strong></td>
            <td className="text-right"><strong>{formatNumber(rows.reduce((s, r) => s + r.kgSold, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.revenueEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.cogsEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profitEur, 0))}</strong></td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

// Детайлен отчет (транзакции)
const TransactionsTable: React.FC<{ rows: TransactionReportRow[]; mode: ReportMode }> = ({ rows, mode }) => (
  <div className="reports-table__wrapper">
    <table className="reports-table reports-table--detailed">
      <thead>
        <tr>
          <th>Дата/час</th>
          <th>№ продажба</th>
          <th>Плащане</th>
          <th>Артикул</th>
          <th className="text-right">Бройки</th>
          <th className="text-right">kg</th>
          <th className="text-right">€/бр</th>
          <th className="text-right">Оборот (€)</th>
          <th>Real дост.</th>
          <th>Acc. дост.</th>
          <th className="text-right">€/kg (R)</th>
          <th className="text-right">€/kg (A)</th>
          <th className="text-right">COGS R (€)</th>
          <th className="text-right">COGS A (€)</th>
          <th className="text-right">Печ. R (€)</th>
          <th className="text-right">Печ. A (€)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={`${row.saleNumber}-${idx}`}>
            <td>{formatDateTime(row.saleDateTime)}</td>
            <td className="font-medium">{row.saleNumber}</td>
            <td>
              <span className={`reports-table__payment reports-table__payment--${row.paymentMethod}`}>
                {getPaymentMethodLabel(row.paymentMethod)}
              </span>
            </td>
            <td>{row.articleName}</td>
            <td className="text-right">{row.pieces}</td>
            <td className="text-right">{formatNumber(row.kg)}</td>
            <td className="text-right">{formatNumber(row.pricePerPieceEur)}</td>
            <td className="text-right font-medium">{formatCurrency(row.revenueEur)}</td>
            <td>{row.realDeliveryDisplayId}</td>
            <td>{row.accountingDeliveryDisplayId}</td>
            <td className="text-right">{formatNumber(row.eurPerKgRealSnapshot)}</td>
            <td className="text-right">{formatNumber(row.eurPerKgAccSnapshot)}</td>
            <td className={`text-right ${mode === 'real' ? 'highlight-cell' : ''}`}>
              {formatCurrency(row.cogsRealEur)}
            </td>
            <td className={`text-right ${mode === 'accounting' ? 'highlight-cell' : ''}`}>
              {formatCurrency(row.cogsAccEur)}
            </td>
            <td className={`text-right ${mode === 'real' ? 'highlight-cell' : ''} ${row.profitRealEur >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(row.profitRealEur)}
            </td>
            <td className={`text-right ${mode === 'accounting' ? 'highlight-cell' : ''} ${row.profitAccEur >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(row.profitAccEur)}
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={16} className="reports-table__empty">Няма данни за избрания период</td>
          </tr>
        )}
      </tbody>
      {rows.length > 0 && (
        <tfoot>
          <tr>
            <td colSpan={4}><strong>ОБЩО ({rows.length} реда)</strong></td>
            <td className="text-right"><strong>{rows.reduce((s, r) => s + r.pieces, 0)}</strong></td>
            <td className="text-right"><strong>{formatNumber(rows.reduce((s, r) => s + r.kg, 0))}</strong></td>
            <td></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.revenueEur, 0))}</strong></td>
            <td colSpan={4}></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.cogsRealEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.cogsAccEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profitRealEur, 0))}</strong></td>
            <td className="text-right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profitAccEur, 0))}</strong></td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reportType,
  mode,
  deliveryRows,
  qualityRows,
  articleRows,
  transactionRows,
  onViewDeliveryDetail,
}) => {
  const getTitle = () => {
    switch (reportType) {
      case 'by-deliveries': return '📦 Отчет по доставки';
      case 'by-qualities': return '⭐ Отчет по качества';
      case 'by-articles': return '🏷️ Отчет по артикули';
      case 'detailed': return '📋 Детайлен отчет (транзакции)';
      default: return 'Отчет';
    }
  };

  return (
    <div className="reports-table-container">
      <h3 className="reports-table-container__title">{getTitle()}</h3>
      
      {reportType === 'by-deliveries' && (
        <DeliveriesTable rows={deliveryRows} mode={mode} onViewDetail={onViewDeliveryDetail} />
      )}
      
      {reportType === 'by-qualities' && (
        <QualitiesTable rows={qualityRows} />
      )}
      
      {reportType === 'by-articles' && (
        <ArticlesTable rows={articleRows} />
      )}
      
      {reportType === 'detailed' && (
        <TransactionsTable rows={transactionRows} mode={mode} />
      )}
    </div>
  );
};
