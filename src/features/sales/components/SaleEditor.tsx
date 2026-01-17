import { useState, useCallback, useMemo } from 'react';
import type { 
  PaymentMethod, 
  SaleLineFormData, 
  ArticleOption, 
  DeliveryOption,
  SaleWithComputed 
} from '../types';
import { formatDateTimeForInput, formatEur, formatKg, formatPercent, generateId, getMarginClass, getProfitClass } from '../utils/salesUtils';
import './SaleEditor.css';

interface SaleEditorProps {
  articleOptions: ArticleOption[];
  getDeliveryOptionsReal: (excludeKgForLines?: { deliveryId: string; kg: number }[]) => DeliveryOption[];
  getDeliveryOptionsAccounting: (excludeKgForLines?: { deliveryId: string; kg: number }[]) => DeliveryOption[];
  onSave: (
    formData: { dateTime: Date; paymentMethod: PaymentMethod; note?: string },
    lines: SaleLineFormData[]
  ) => { success: boolean; error?: string; sale?: SaleWithComputed };
  onCancel: () => void;
  onSaleCreated: (sale: SaleWithComputed) => void;
}

interface LineFormState extends SaleLineFormData {
  // Computed values for display
  kgPerPiece?: number;
  unitCostPerKgReal?: number;
  unitCostPerKgAcc?: number;
  isRealInvoiced?: boolean;
}

export const SaleEditor = ({
  articleOptions,
  getDeliveryOptionsReal,
  getDeliveryOptionsAccounting,
  onSave,
  onCancel,
  onSaleCreated,
}: SaleEditorProps) => {
  // Form state
  const [dateTime, setDateTime] = useState(formatDateTimeForInput(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<LineFormState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current kg per delivery for exclusion
  const getCurrentKgPerDelivery = useCallback(() => {
    const realKg: { deliveryId: string; kg: number }[] = [];
    const accKg: { deliveryId: string; kg: number }[] = [];
    
    for (const line of lines) {
      const article = articleOptions.find(a => a.id === line.articleId);
      const qty = parseInt(line.quantity, 10) || 0;
      const kg = article ? qty * article.kgPerPiece : 0;
      
      if (line.realDeliveryId && kg > 0) {
        realKg.push({ deliveryId: line.realDeliveryId, kg });
      }
      if (line.accountingDeliveryId && kg > 0) {
        accKg.push({ deliveryId: line.accountingDeliveryId, kg });
      }
    }
    
    return { realKg, accKg };
  }, [lines, articleOptions]);

  // Get delivery options
  const deliveryOptionsReal = useMemo(() => {
    return getDeliveryOptionsReal(getCurrentKgPerDelivery().realKg);
  }, [getDeliveryOptionsReal, getCurrentKgPerDelivery]);

  const deliveryOptionsAccounting = useMemo(() => {
    return getDeliveryOptionsAccounting(getCurrentKgPerDelivery().accKg);
  }, [getDeliveryOptionsAccounting, getCurrentKgPerDelivery]);

  // Calculate line computed values
  const calculateLineValues = useCallback((line: LineFormState) => {
    const article = articleOptions.find(a => a.id === line.articleId);
    const realDelivery = deliveryOptionsReal.find(d => d.id === line.realDeliveryId);
    const accDelivery = deliveryOptionsAccounting.find(d => d.id === line.accountingDeliveryId);
    
    const qty = parseInt(line.quantity, 10) || 0;
    const price = parseFloat(line.unitPriceEur) || 0;
    const kgPerPiece = article?.kgPerPiece || 0;
    const kgLine = qty * kgPerPiece;
    const revenueEur = qty * price;
    const unitCostReal = realDelivery?.unitCostPerKg || 0;
    const unitCostAcc = accDelivery?.unitCostPerKg || unitCostReal;
    const cogsReal = kgLine * unitCostReal;
    const cogsAcc = kgLine * unitCostAcc;
    const profitReal = revenueEur - cogsReal;
    const profitAcc = revenueEur - cogsAcc;
    const marginReal = revenueEur > 0 ? (profitReal / revenueEur) * 100 : 0;
    const marginAcc = revenueEur > 0 ? (profitAcc / revenueEur) * 100 : 0;
    
    return {
      kgPerPiece,
      kgLine,
      revenueEur,
      unitCostReal,
      unitCostAcc,
      cogsReal,
      cogsAcc,
      profitReal,
      profitAcc,
      marginReal,
      marginAcc,
      isRealInvoiced: realDelivery?.isInvoiced ?? true,
    };
  }, [articleOptions, deliveryOptionsReal, deliveryOptionsAccounting]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalPieces = 0;
    let totalKg = 0;
    let totalRevenue = 0;
    let totalCogsReal = 0;
    let totalCogsAcc = 0;

    for (const line of lines) {
      const values = calculateLineValues(line);
      const qty = parseInt(line.quantity, 10) || 0;
      totalPieces += qty;
      totalKg += values.kgLine;
      totalRevenue += values.revenueEur;
      totalCogsReal += values.cogsReal;
      totalCogsAcc += values.cogsAcc;
    }

    const totalProfitReal = totalRevenue - totalCogsReal;
    const totalProfitAcc = totalRevenue - totalCogsAcc;
    const totalMarginReal = totalRevenue > 0 ? (totalProfitReal / totalRevenue) * 100 : 0;
    const totalMarginAcc = totalRevenue > 0 ? (totalProfitAcc / totalRevenue) * 100 : 0;

    return {
      totalPieces,
      totalKg,
      totalRevenue,
      totalCogsReal,
      totalCogsAcc,
      totalProfitReal,
      totalProfitAcc,
      totalMarginReal,
      totalMarginAcc,
    };
  }, [lines, calculateLineValues]);

  // Add new line
  const addLine = useCallback(() => {
    const newLine: LineFormState = {
      id: generateId(),
      articleId: '',
      quantity: '',
      unitPriceEur: '',
      realDeliveryId: '',
      accountingDeliveryId: '',
    };
    setLines(prev => [...prev, newLine]);
    setError(null);
  }, []);

  // Update line
  const updateLine = useCallback((lineId: string, updates: Partial<LineFormState>) => {
    setLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      
      const updatedLine = { ...line, ...updates };
      
      // Clear accounting delivery if real delivery becomes invoiced
      if (updates.realDeliveryId) {
        const realDelivery = deliveryOptionsReal.find(d => d.id === updates.realDeliveryId);
        if (realDelivery?.isInvoiced) {
          updatedLine.accountingDeliveryId = '';
        }
      }
      
      return updatedLine;
    }));
    setError(null);
  }, [deliveryOptionsReal]);

  // Delete line
  const deleteLine = useCallback((lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
    setError(null);
  }, []);

  // Submit
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    setError(null);

    const result = onSave(
      {
        dateTime: new Date(dateTime),
        paymentMethod,
        note: note.trim() || undefined,
      },
      lines
    );

    setIsSubmitting(false);

    if (result.success && result.sale) {
      onSaleCreated(result.sale);
    } else {
      setError(result.error || 'Възникна грешка при записа.');
    }
  }, [dateTime, paymentMethod, note, lines, onSave, onSaleCreated]);

  // Check if any line needs accounting delivery
  const hasADeliveryLines = lines.some(line => {
    const realDelivery = deliveryOptionsReal.find(d => d.id === line.realDeliveryId);
    return realDelivery && !realDelivery.isInvoiced;
  });

  return (
    <div className="sale-editor">
      {/* Header */}
      <div className="sale-editor__header">
        <div className="sale-editor__header-left">
          <h2 className="sale-editor__title">
            <span className="sale-editor__title-icon">🛒</span>
            Нова продажба
          </h2>
          
          <div className="sale-editor__fields">
            <div className="sale-editor__field">
              <label className="sale-editor__field-label">Дата/час</label>
              <input
                type="datetime-local"
                className="sale-editor__field-input sale-editor__field-input--datetime"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
            
            <div className="sale-editor__field">
              <label className="sale-editor__field-label">Метод плащане</label>
              <select
                className="sale-editor__field-input sale-editor__field-input--select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">💵 Кеш</option>
                <option value="card">💳 Карта</option>
                <option value="other">📄 Друго</option>
              </select>
            </div>
            
            <div className="sale-editor__field">
              <label className="sale-editor__field-label">Бележка (optional)</label>
              <input
                type="text"
                className="sale-editor__field-input sale-editor__field-input--note"
                placeholder="Добави бележка..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="sale-editor__header-actions">
          <button 
            className="sale-editor__btn sale-editor__btn--primary"
            onClick={addLine}
          >
            + Добави ред
          </button>
          <button
            className="sale-editor__btn sale-editor__btn--success"
            onClick={handleSubmit}
            disabled={isSubmitting || lines.length === 0}
          >
            ✓ Финализирай
          </button>
          <button
            className="sale-editor__btn sale-editor__btn--secondary"
            onClick={onCancel}
          >
            Откажи
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="sale-editor__error">
          <span className="sale-editor__error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Lines section */}
      <div className="sale-editor__lines-header">
        <h3 className="sale-editor__lines-title">Редове на продажбата</h3>
      </div>

      {lines.length === 0 ? (
        <div className="sale-editor__empty-lines">
          <div className="sale-editor__empty-lines-icon">📝</div>
          <p>Няма добавени редове. Натиснете "+ Добави ред" за да започнете.</p>
        </div>
      ) : (
        <>
          <div className="sale-editor__lines-wrapper">
            <table className="sale-editor__lines-table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th className="text-right">Бройки</th>
                  <th className="text-right">Цена/бр (EUR)</th>
                  <th className="text-right">Оборот (EUR)</th>
                  <th>Real доставка</th>
                  <th className="text-right">kg/бр</th>
                  <th className="text-right">kg (ред)</th>
                  <th className="text-right">EUR/kg</th>
                  <th className="text-right">Себест. (EUR)</th>
                  <th className="text-right">Печалба (EUR)</th>
                  <th className="text-center">Марж %</th>
                  {hasADeliveryLines && <th>Acc. доставка</th>}
                  <th className="text-center"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const values = calculateLineValues(line);
                  const realDelivery = deliveryOptionsReal.find(d => d.id === line.realDeliveryId);
                  const needsAccounting = realDelivery && !realDelivery.isInvoiced;
                  
                  return (
                    <tr key={line.id}>
                      <td>
                        <select
                          className="sale-editor__line-input sale-editor__line-input--select"
                          value={line.articleId}
                          onChange={(e) => updateLine(line.id, { articleId: e.target.value })}
                        >
                          <option value="">-- Избери --</option>
                          {articleOptions.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          className="sale-editor__line-input sale-editor__line-input--number"
                          placeholder="0"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          step="0.01"
                          className="sale-editor__line-input sale-editor__line-input--number"
                          placeholder="0.00"
                          min="0"
                          value={line.unitPriceEur}
                          onChange={(e) => updateLine(line.id, { unitPriceEur: e.target.value })}
                        />
                      </td>
                      <td className="text-right">
                        <span className="sale-editor__computed revenue">
                          {formatEur(values.revenueEur)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="sale-editor__line-input sale-editor__line-input--delivery"
                          value={line.realDeliveryId}
                          onChange={(e) => updateLine(line.id, { realDeliveryId: e.target.value })}
                        >
                          <option value="">-- Избери --</option>
                          {deliveryOptionsReal.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.displayId} - {d.qualityName} ({formatKg(d.kgRemaining)} kg)
                              {!d.isInvoiced && ' [A]'}
                            </option>
                          ))}
                        </select>
                        {needsAccounting && (
                          <div className="sale-editor__acc-required">⚠️ Нужна Acc. доставка</div>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="sale-editor__computed">
                          {values.kgPerPiece > 0 ? formatKg(values.kgPerPiece) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="sale-editor__computed">
                          {values.kgLine > 0 ? formatKg(values.kgLine) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="sale-editor__computed">
                          {values.unitCostReal > 0 ? formatEur(values.unitCostReal) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="sale-editor__computed">
                          {values.cogsReal > 0 ? formatEur(values.cogsReal) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`sale-editor__computed profit ${getProfitClass(values.profitReal)}`}>
                          {values.revenueEur > 0 ? formatEur(values.profitReal) : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        {values.revenueEur > 0 ? (
                          <span className={`sale-editor__margin-badge ${getMarginClass(values.marginReal)}`}>
                            {formatPercent(values.marginReal)}
                          </span>
                        ) : '—'}
                      </td>
                      {hasADeliveryLines && (
                        <td>
                          {needsAccounting ? (
                            <select
                              className="sale-editor__line-input sale-editor__line-input--delivery"
                              value={line.accountingDeliveryId}
                              onChange={(e) => updateLine(line.id, { accountingDeliveryId: e.target.value })}
                            >
                              <option value="">-- Избери --</option>
                              {deliveryOptionsAccounting.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.displayId} - {d.qualityName} ({formatKg(d.kgRemaining)} kg)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      )}
                      <td className="text-center">
                        <button
                          className="sale-editor__delete-btn"
                          onClick={() => deleteLine(line.id)}
                          title="Изтрий ред"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sale-editor__add-row">
            <button className="sale-editor__add-row-btn" onClick={addLine}>
              + Добави ред
            </button>
          </div>
        </>
      )}

      {/* Totals */}
      {lines.length > 0 && (
        <div className="sale-editor__totals">
          <div className="sale-editor__totals-block">
            <h4 className="sale-editor__totals-title real">📊 Реални суми</h4>
            <div className="sale-editor__totals-grid">
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Общо бройки</span>
                <span className="sale-editor__total-value">{totals.totalPieces}</span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Общо kg</span>
                <span className="sale-editor__total-value">{formatKg(totals.totalKg)}</span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Оборот (EUR)</span>
                <span className="sale-editor__total-value">{formatEur(totals.totalRevenue)}</span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Себестойност (EUR)</span>
                <span className="sale-editor__total-value">{formatEur(totals.totalCogsReal)}</span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Печалба (EUR)</span>
                <span className={`sale-editor__total-value ${totals.totalProfitReal >= 0 ? 'profit' : 'negative'}`}>
                  {formatEur(totals.totalProfitReal)}
                </span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Марж %</span>
                <span className={`sale-editor__total-value ${totals.totalProfitReal >= 0 ? 'profit' : 'negative'}`}>
                  {formatPercent(totals.totalMarginReal)}
                </span>
              </div>
            </div>
          </div>

          <div className="sale-editor__totals-block">
            <h4 className="sale-editor__totals-title accounting">📋 Счетоводни суми</h4>
            <div className="sale-editor__totals-grid">
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Себестойност (EUR)</span>
                <span className="sale-editor__total-value">{formatEur(totals.totalCogsAcc)}</span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Печалба (EUR)</span>
                <span className={`sale-editor__total-value ${totals.totalProfitAcc >= 0 ? 'profit' : 'negative'}`}>
                  {formatEur(totals.totalProfitAcc)}
                </span>
              </div>
              <div className="sale-editor__total-item">
                <span className="sale-editor__total-label">Марж %</span>
                <span className={`sale-editor__total-value ${totals.totalProfitAcc >= 0 ? 'profit' : 'negative'}`}>
                  {formatPercent(totals.totalMarginAcc)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
