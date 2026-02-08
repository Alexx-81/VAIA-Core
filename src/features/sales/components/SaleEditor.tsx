import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  ) => Promise<{ success: boolean; error?: string; sale?: SaleWithComputed }>;
  onCancel: () => void;
  onSaleCreated: (sale: SaleWithComputed) => void;
}

interface LineFormState extends SaleLineFormData {
  kgPerPiece?: number;
  unitCostPerKgReal?: number;
  unitCostPerKgAcc?: number;
  isRealInvoiced?: boolean;
}

// Inline field errors for the add-line form
interface AddLineErrors {
  articleId?: string;
  realDeliveryId?: string;
  accountingDeliveryId?: string;
  quantity?: string;
  unitPriceEur?: string;
}

export const SaleEditor = ({
  articleOptions,
  getDeliveryOptionsReal,
  getDeliveryOptionsAccounting,
  onSave,
  onCancel,
  onSaleCreated,
}: SaleEditorProps) => {
  // Header form state
  const [dateTime, setDateTime] = useState(formatDateTimeForInput(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  // Committed lines
  const [lines, setLines] = useState<LineFormState[]>([]);
  
  // Add-line form state
  const [addArticleId, setAddArticleId] = useState('');
  const [addRealDeliveryId, setAddRealDeliveryId] = useState('');
  const [addAccDeliveryId, setAddAccDeliveryId] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [addUnitPrice, setAddUnitPrice] = useState('');
  const [addErrors, setAddErrors] = useState<AddLineErrors>({});

  // Inline edit state
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LineFormState>>({});

  // Global state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for auto-focus
  const articleSelectRef = useRef<HTMLSelectElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus article select on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      articleSelectRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get current kg committed in lines (for stock deduction)
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

  // Delivery options accounting for already-committed lines
  const deliveryOptionsReal = useMemo(() => {
    return getDeliveryOptionsReal(getCurrentKgPerDelivery().realKg);
  }, [getDeliveryOptionsReal, getCurrentKgPerDelivery]);

  const deliveryOptionsAccounting = useMemo(() => {
    return getDeliveryOptionsAccounting(getCurrentKgPerDelivery().accKg);
  }, [getDeliveryOptionsAccounting, getCurrentKgPerDelivery]);

  // Check if the selected real delivery in the add form needs accounting
  const addRealDelivery = useMemo(() => {
    return deliveryOptionsReal.find(d => d.id === addRealDeliveryId);
  }, [deliveryOptionsReal, addRealDeliveryId]);
  const addNeedsAccounting = addRealDelivery && !addRealDelivery.isInvoiced;

  // Live preview for add-line form
  const addPreview = useMemo(() => {
    const article = articleOptions.find(a => a.id === addArticleId);
    const qty = parseInt(addQuantity, 10) || 0;
    const price = parseFloat(addUnitPrice) || 0;
    const kgPerPiece = article?.kgPerPiece || 0;
    const kgLine = qty * kgPerPiece;
    const revenue = qty * price;
    return { kgPerPiece, kgLine, revenue, qty, price };
  }, [addArticleId, addQuantity, addUnitPrice, articleOptions]);

  // Calculate line computed values (for committed lines)
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
      kgPerPiece, kgLine, revenueEur, unitCostReal, unitCostAcc,
      cogsReal, cogsAcc, profitReal, profitAcc, marginReal, marginAcc,
      isRealInvoiced: realDelivery?.isInvoiced ?? true,
      articleName: article?.name || '—',
      deliveryDisplay: realDelivery ? `${realDelivery.displayId}` : '—',
    };
  }, [articleOptions, deliveryOptionsReal, deliveryOptionsAccounting]);

  // Calculate totals from committed lines
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
      totalPieces, totalKg, totalRevenue,
      totalCogsReal, totalCogsAcc,
      totalProfitReal, totalProfitAcc,
      totalMarginReal, totalMarginAcc,
    };
  }, [lines, calculateLineValues]);

  // Reset add-line form and re-focus article select
  const resetAddForm = useCallback(() => {
    setAddArticleId('');
    setAddRealDeliveryId('');
    setAddAccDeliveryId('');
    setAddQuantity('');
    setAddUnitPrice('');
    setAddErrors({});
    // Re-focus article select after React re-renders
    setTimeout(() => articleSelectRef.current?.focus(), 50);
  }, []);

  // Validate and add a line from the add-line form
  const handleAddLine = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: AddLineErrors = {};
    if (!addArticleId) errors.articleId = 'Избери артикул';
    if (!addRealDeliveryId) errors.realDeliveryId = 'Избери доставка';
    if (addNeedsAccounting && !addAccDeliveryId) errors.accountingDeliveryId = 'Избери сч. доставка';
    
    const qty = parseInt(addQuantity, 10);
    if (!addQuantity || isNaN(qty) || qty <= 0) errors.quantity = 'Въведи бройки > 0';
    
    const price = parseFloat(addUnitPrice);
    if (!addUnitPrice || isNaN(price) || price <= 0) errors.unitPriceEur = 'Въведи цена > 0';

    // Check stock sufficiency
    if (addRealDeliveryId && qty > 0 && addArticleId) {
      const article = articleOptions.find(a => a.id === addArticleId);
      const kgNeeded = qty * (article?.kgPerPiece || 0);
      const delivery = deliveryOptionsReal.find(d => d.id === addRealDeliveryId);
      if (delivery && kgNeeded > delivery.kgRemaining) {
        errors.quantity = `Нужни ${formatKg(kgNeeded)} kg, налични ${formatKg(delivery.kgRemaining)} kg`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    const newLine: LineFormState = {
      id: generateId(),
      articleId: addArticleId,
      quantity: addQuantity,
      unitPriceEur: addUnitPrice,
      realDeliveryId: addRealDeliveryId,
      accountingDeliveryId: addNeedsAccounting ? addAccDeliveryId : '',
    };

    setLines(prev => [...prev, newLine]);
    setError(null);
    resetAddForm();

    // Scroll to bottom of lines
    setTimeout(() => linesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [addArticleId, addRealDeliveryId, addAccDeliveryId, addQuantity, addUnitPrice, addNeedsAccounting, articleOptions, deliveryOptionsReal, resetAddForm]);

  // Clear accounting delivery when real delivery changes to invoiced
  const handleAddRealDeliveryChange = useCallback((deliveryId: string) => {
    setAddRealDeliveryId(deliveryId);
    const delivery = deliveryOptionsReal.find(d => d.id === deliveryId);
    if (delivery?.isInvoiced) {
      setAddAccDeliveryId('');
    }
    setAddErrors(prev => ({ ...prev, realDeliveryId: undefined }));
  }, [deliveryOptionsReal]);

  // Inline edit handlers
  const startEditLine = useCallback((line: LineFormState) => {
    setEditingLineId(line.id);
    setEditValues({
      articleId: line.articleId,
      quantity: line.quantity,
      unitPriceEur: line.unitPriceEur,
      realDeliveryId: line.realDeliveryId,
      accountingDeliveryId: line.accountingDeliveryId,
    });
  }, []);

  const saveEditLine = useCallback(() => {
    if (!editingLineId) return;
    setLines(prev => prev.map(line => {
      if (line.id !== editingLineId) return line;
      const updatedLine = { ...line, ...editValues };
      // Clear accounting if delivery is invoiced
      if (editValues.realDeliveryId) {
        const rd = deliveryOptionsReal.find(d => d.id === editValues.realDeliveryId);
        if (rd?.isInvoiced) updatedLine.accountingDeliveryId = '';
      }
      return updatedLine;
    }));
    setEditingLineId(null);
    setEditValues({});
  }, [editingLineId, editValues, deliveryOptionsReal]);

  const cancelEditLine = useCallback(() => {
    setEditingLineId(null);
    setEditValues({});
  }, []);

  // Delete line
  const deleteLine = useCallback((lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
    setError(null);
    if (editingLineId === lineId) {
      setEditingLineId(null);
      setEditValues({});
    }
  }, [editingLineId]);

  // Submit (finalize) sale
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await onSave(
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

  // Cancel with confirmation if lines exist
  const handleCancel = useCallback(() => {
    if (lines.length > 0) {
      if (!window.confirm('Имате добавени редове. Сигурни ли сте, че искате да откажете?')) return;
    }
    onCancel();
  }, [lines.length, onCancel]);

  // Editing inline: check if the editing real delivery needs accounting
  
  return (
    <div className="sale-editor">
      {/* ─── Header: Title + Meta fields ─── */}
      <div className="sale-editor__header">
        <div className="sale-editor__header-title">
          <h2 className="sale-editor__title">Нова продажба</h2>
          <span className="sale-editor__shortcut-hint">Ctrl+N от списъка</span>
        </div>
        <div className="sale-editor__meta">
          <div className="sale-editor__meta-field">
            <label className="sale-editor__meta-label">Дата / час</label>
            <input
              type="datetime-local"
              className="sale-editor__meta-input"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
          <div className="sale-editor__meta-field">
            <label className="sale-editor__meta-label">Плащане</label>
            <select
              className="sale-editor__meta-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="cash">По каса</option>
              <option value="card">Карта</option>
              <option value="no-cash">Без каса</option>
              <option value="other">Друго</option>
            </select>
          </div>
          <div className="sale-editor__meta-field sale-editor__meta-field--note">
            <label className="sale-editor__meta-label">Бележка</label>
            <input
              type="text"
              className="sale-editor__meta-input"
              placeholder="По избор..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="sale-editor__header-actions">
          <button
            className="sale-editor__btn sale-editor__btn--save"
            onClick={handleSubmit}
            disabled={isSubmitting || lines.length === 0}
          >
            {isSubmitting ? 'Записване...' : 'Запази продажбата'}
          </button>
          <button className="sale-editor__btn sale-editor__btn--cancel" onClick={handleCancel}>
            Откажи
          </button>
        </div>
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="sale-editor__error">
          <span className="sale-editor__error-icon">!</span>
          <span>{error}</span>
          <button className="sale-editor__error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* ─── Add-line card ─── */}
      <div className="sale-editor__add-card">
        <div className="sale-editor__add-card-label">Добави артикул</div>
        <form className="sale-editor__add-form" onSubmit={handleAddLine} autoComplete="off">
          {/* Row 1: Article + Delivery */}
          <div className="sale-editor__add-row">
            <div className={`sale-editor__add-field sale-editor__add-field--article ${addErrors.articleId ? 'has-error' : ''}`}>
              <label className="sale-editor__add-label">Артикул</label>
              <select
                ref={articleSelectRef}
                className="sale-editor__add-input"
                value={addArticleId}
                onChange={(e) => { setAddArticleId(e.target.value); setAddErrors(prev => ({ ...prev, articleId: undefined })); }}
              >
                <option value="">Избери артикул...</option>
                {articleOptions.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {addErrors.articleId && <span className="sale-editor__add-hint sale-editor__add-hint--error">{addErrors.articleId}</span>}
            </div>

            <div className={`sale-editor__add-field sale-editor__add-field--delivery ${addErrors.realDeliveryId ? 'has-error' : ''}`}>
              <label className="sale-editor__add-label">Доставка</label>
              <select
                className="sale-editor__add-input"
                value={addRealDeliveryId}
                onChange={(e) => handleAddRealDeliveryChange(e.target.value)}
              >
                <option value="">Избери доставка...</option>
                {deliveryOptionsReal.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.displayId} – {d.qualityName} ({formatKg(d.kgRemaining)} kg)
                    {!d.isInvoiced ? ' [A]' : ''}
                  </option>
                ))}
              </select>
              {addErrors.realDeliveryId && <span className="sale-editor__add-hint sale-editor__add-hint--error">{addErrors.realDeliveryId}</span>}
            </div>

            {addNeedsAccounting && (
              <div className={`sale-editor__add-field sale-editor__add-field--delivery ${addErrors.accountingDeliveryId ? 'has-error' : ''}`}>
                <label className="sale-editor__add-label">Сч. доставка</label>
                <select
                  className="sale-editor__add-input"
                  value={addAccDeliveryId}
                  onChange={(e) => { setAddAccDeliveryId(e.target.value); setAddErrors(prev => ({ ...prev, accountingDeliveryId: undefined })); }}
                >
                  <option value="">Избери...</option>
                  {deliveryOptionsAccounting.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.displayId} – {d.qualityName} ({formatKg(d.kgRemaining)} kg)
                    </option>
                  ))}
                </select>
                {addErrors.accountingDeliveryId && <span className="sale-editor__add-hint sale-editor__add-hint--error">{addErrors.accountingDeliveryId}</span>}
              </div>
            )}
          </div>

          {/* Row 2: Qty + Price + Preview + Add button */}
          <div className="sale-editor__add-row sale-editor__add-row--bottom">
            <div className={`sale-editor__add-field sale-editor__add-field--qty ${addErrors.quantity ? 'has-error' : ''}`}>
              <label className="sale-editor__add-label">Бройки</label>
              <input
                type="number"
                className="sale-editor__add-input sale-editor__add-input--number"
                placeholder="0"
                min="1"
                value={addQuantity}
                onChange={(e) => { setAddQuantity(e.target.value); setAddErrors(prev => ({ ...prev, quantity: undefined })); }}
              />
              {addErrors.quantity && <span className="sale-editor__add-hint sale-editor__add-hint--error">{addErrors.quantity}</span>}
            </div>
            
            <div className={`sale-editor__add-field sale-editor__add-field--price ${addErrors.unitPriceEur ? 'has-error' : ''}`}>
              <label className="sale-editor__add-label">Цена/бр. EUR</label>
              <input
                type="number"
                step="0.01"
                className="sale-editor__add-input sale-editor__add-input--number"
                placeholder="0.00"
                min="0"
                value={addUnitPrice}
                onChange={(e) => { setAddUnitPrice(e.target.value); setAddErrors(prev => ({ ...prev, unitPriceEur: undefined })); }}
              />
              {addErrors.unitPriceEur && <span className="sale-editor__add-hint sale-editor__add-hint--error">{addErrors.unitPriceEur}</span>}
            </div>

            {/* Live preview */}
            <div className="sale-editor__add-preview">
              {addPreview.kgPerPiece > 0 && (
                <span className="sale-editor__add-preview-item">
                  <span className="sale-editor__add-preview-label">kg/бр.</span>
                  <span className="sale-editor__add-preview-value">{formatKg(addPreview.kgPerPiece)}</span>
                </span>
              )}
              {addPreview.kgLine > 0 && (
                <span className="sale-editor__add-preview-item">
                  <span className="sale-editor__add-preview-label">Тегло</span>
                  <span className="sale-editor__add-preview-value">{formatKg(addPreview.kgLine)} kg</span>
                </span>
              )}
              {addPreview.revenue > 0 && (
                <span className="sale-editor__add-preview-item sale-editor__add-preview-item--revenue">
                  <span className="sale-editor__add-preview-label">Приход</span>
                  <span className="sale-editor__add-preview-value">{formatEur(addPreview.revenue)} €</span>
                </span>
              )}
            </div>

            <button type="submit" className="sale-editor__add-btn">
              Добави
            </button>
          </div>
        </form>
      </div>

      {/* ─── Lines table ─── */}
      <div className="sale-editor__lines-section">
        <div className="sale-editor__lines-table-header">
          <span className="sale-editor__lines-count">
            {lines.length > 0 ? `${lines.length} ${lines.length === 1 ? 'ред' : 'реда'}` : 'Няма добавени редове'}
          </span>
        </div>

        {lines.length === 0 ? (
          <div className="sale-editor__empty">
            <div className="sale-editor__empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"/>
                <path d="M20 24h8M24 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="sale-editor__empty-text">Изберете артикул отгоре и натиснете <strong>Добави</strong> или <strong>Enter</strong></p>
          </div>
        ) : (
          <div className="sale-editor__lines-wrapper">
            <table className="sale-editor__table">
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th className="col-article">Артикул</th>
                  <th className="col-delivery">Доставка</th>
                  <th className="col-qty">Бр.</th>
                  <th className="col-price">Цена/бр.</th>
                  <th className="col-revenue">Приход</th>
                  <th className="col-kg">kg</th>
                  <th className="col-profit">Печалба</th>
                  <th className="col-margin">Марж</th>
                  <th className="col-actions">Действия</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const isEditing = editingLineId === line.id;
                  const values = calculateLineValues(line);

                  if (isEditing) {
                    const editRd = editValues.realDeliveryId 
                      ? deliveryOptionsReal.find(d => d.id === editValues.realDeliveryId) 
                      : null;
                    const editNeedsAcc = editRd && !editRd.isInvoiced;

                    return (
                      <tr key={line.id} className="sale-editor__row sale-editor__row--editing">
                        <td className="col-num">{index + 1}</td>
                        <td className="col-article">
                          <select
                            className="sale-editor__inline-input"
                            value={editValues.articleId || ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, articleId: e.target.value }))}
                          >
                            <option value="">—</option>
                            {articleOptions.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="col-delivery">
                          <select
                            className="sale-editor__inline-input"
                            value={editValues.realDeliveryId || ''}
                            onChange={(e) => {
                              const rd = deliveryOptionsReal.find(d => d.id === e.target.value);
                              setEditValues(prev => ({
                                ...prev,
                                realDeliveryId: e.target.value,
                                accountingDeliveryId: rd?.isInvoiced ? '' : prev.accountingDeliveryId,
                              }));
                            }}
                          >
                            <option value="">—</option>
                            {deliveryOptionsReal.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.displayId} – {d.qualityName} ({formatKg(d.kgRemaining)} kg){!d.isInvoiced ? ' [A]' : ''}
                              </option>
                            ))}
                          </select>
                          {editNeedsAcc && (
                            <select
                              className="sale-editor__inline-input sale-editor__inline-input--acc"
                              value={editValues.accountingDeliveryId || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, accountingDeliveryId: e.target.value }))}
                            >
                              <option value="">Сч. доставка...</option>
                              {deliveryOptionsAccounting.map(d => (
                                <option key={d.id} value={d.id}>{d.displayId} ({formatKg(d.kgRemaining)} kg)</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="col-qty">
                          <input
                            type="number"
                            className="sale-editor__inline-input sale-editor__inline-input--num"
                            value={editValues.quantity || ''}
                            min="1"
                            onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEditLine(); if (e.key === 'Escape') cancelEditLine(); }}
                          />
                        </td>
                        <td className="col-price">
                          <input
                            type="number"
                            step="0.01"
                            className="sale-editor__inline-input sale-editor__inline-input--num"
                            value={editValues.unitPriceEur || ''}
                            min="0"
                            onChange={(e) => setEditValues(prev => ({ ...prev, unitPriceEur: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEditLine(); if (e.key === 'Escape') cancelEditLine(); }}
                          />
                        </td>
                        <td className="col-revenue">—</td>
                        <td className="col-kg">—</td>
                        <td className="col-profit">—</td>
                        <td className="col-margin">—</td>
                        <td className="col-actions">
                          <div className="sale-editor__row-actions">
                            <button className="sale-editor__row-btn sale-editor__row-btn--confirm" onClick={saveEditLine} title="Запази">✓</button>
                            <button className="sale-editor__row-btn sale-editor__row-btn--cancel-edit" onClick={cancelEditLine} title="Откажи">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={line.id} className="sale-editor__row">
                      <td className="col-num">{index + 1}</td>
                      <td className="col-article">{values.articleName}</td>
                      <td className="col-delivery">
                        <span>{values.deliveryDisplay}</span>
                        {!values.isRealInvoiced && <span className="sale-editor__acc-badge">A</span>}
                      </td>
                      <td className="col-qty">{line.quantity}</td>
                      <td className="col-price">{formatEur(parseFloat(line.unitPriceEur) || 0)}</td>
                      <td className="col-revenue">{formatEur(values.revenueEur)}</td>
                      <td className="col-kg">{formatKg(values.kgLine)}</td>
                      <td className={`col-profit ${getProfitClass(values.profitReal)}`}>{formatEur(values.profitReal)}</td>
                      <td className="col-margin">
                        {values.revenueEur > 0 ? (
                          <span className={`sale-editor__margin-badge ${getMarginClass(values.marginReal)}`}>
                            {formatPercent(values.marginReal)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="col-actions">
                        <div className="sale-editor__row-actions">
                          <button className="sale-editor__row-btn sale-editor__row-btn--edit" onClick={() => startEditLine(line)} title="Редактирай">✎</button>
                          <button className="sale-editor__row-btn sale-editor__row-btn--delete" onClick={() => deleteLine(line.id)} title="Изтрий">×</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="sale-editor__totals-row">
                  <td className="col-num"></td>
                  <td className="col-article"><strong>Общо</strong></td>
                  <td className="col-delivery"></td>
                  <td className="col-qty"><strong>{totals.totalPieces}</strong></td>
                  <td className="col-price"></td>
                  <td className="col-revenue"><strong>{formatEur(totals.totalRevenue)}</strong></td>
                  <td className="col-kg"><strong>{formatKg(totals.totalKg)}</strong></td>
                  <td className={`col-profit ${getProfitClass(totals.totalProfitReal)}`}><strong>{formatEur(totals.totalProfitReal)}</strong></td>
                  <td className="col-margin">
                    {totals.totalRevenue > 0 && (
                      <span className={`sale-editor__margin-badge ${getMarginClass(totals.totalMarginReal)}`}>
                        {formatPercent(totals.totalMarginReal)}
                      </span>
                    )}
                  </td>
                  <td className="col-actions"></td>
                </tr>
              </tfoot>
            </table>
            <div ref={linesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Mobile cards view (hidden on desktop) ─── */}
      {lines.length > 0 && (
        <div className="sale-editor__mobile-lines">
          {lines.map((line, index) => {
            const values = calculateLineValues(line);
            return (
              <div key={line.id} className="sale-editor__mobile-card">
                <div className="sale-editor__mobile-card-header">
                  <span className="sale-editor__mobile-card-num">#{index + 1}</span>
                  <span className="sale-editor__mobile-card-article">{values.articleName}</span>
                  <div className="sale-editor__mobile-card-actions">
                    <button className="sale-editor__row-btn sale-editor__row-btn--edit" onClick={() => startEditLine(line)}>✎</button>
                    <button className="sale-editor__row-btn sale-editor__row-btn--delete" onClick={() => deleteLine(line.id)}>×</button>
                  </div>
                </div>
                <div className="sale-editor__mobile-card-body">
                  <div className="sale-editor__mobile-card-detail">
                    <span className="sale-editor__mobile-card-label">Доставка</span>
                    <span>{values.deliveryDisplay}</span>
                  </div>
                  <div className="sale-editor__mobile-card-row">
                    <div className="sale-editor__mobile-card-detail">
                      <span className="sale-editor__mobile-card-label">Бр.</span>
                      <span>{line.quantity}</span>
                    </div>
                    <div className="sale-editor__mobile-card-detail">
                      <span className="sale-editor__mobile-card-label">Цена</span>
                      <span>{formatEur(parseFloat(line.unitPriceEur) || 0)} €</span>
                    </div>
                    <div className="sale-editor__mobile-card-detail">
                      <span className="sale-editor__mobile-card-label">Приход</span>
                      <span>{formatEur(values.revenueEur)} €</span>
                    </div>
                    <div className="sale-editor__mobile-card-detail">
                      <span className="sale-editor__mobile-card-label">kg</span>
                      <span>{formatKg(values.kgLine)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Mobile totals */}
          <div className="sale-editor__mobile-totals">
            <div className="sale-editor__mobile-totals-row">
              <span>Общо бройки</span><strong>{totals.totalPieces}</strong>
            </div>
            <div className="sale-editor__mobile-totals-row">
              <span>Общо kg</span><strong>{formatKg(totals.totalKg)}</strong>
            </div>
            <div className="sale-editor__mobile-totals-row">
              <span>Общ приход</span><strong>{formatEur(totals.totalRevenue)} €</strong>
            </div>
            <div className="sale-editor__mobile-totals-row">
              <span>Печалба</span>
              <strong className={getProfitClass(totals.totalProfitReal)}>{formatEur(totals.totalProfitReal)} €</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
