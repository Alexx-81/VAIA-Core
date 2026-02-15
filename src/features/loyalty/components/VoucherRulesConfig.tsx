import { useState, useCallback } from 'react';
import type { VoucherRule } from '../../../lib/supabase/types';
import type { VoucherRuleFormData, VoucherRuleFormErrors } from '../types';
import { validateVoucherRule, hasErrors } from '../utils/validation';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface VoucherRulesConfigProps {
  rules: VoucherRule[];
  loading: boolean;
  isReadOnly: boolean;
  isAdmin: boolean;
  onCreateRule: (data: VoucherRuleFormData) => Promise<boolean>;
  onUpdateRule: (id: number, data: Partial<VoucherRuleFormData>) => Promise<boolean>;
  onDeleteRule: (id: number) => Promise<boolean>;
}

const emptyForm: VoucherRuleFormData = {
  trigger_turnover_12m_eur: 0,
  voucher_amount_eur: 0,
  valid_days: 90,
  min_purchase_eur: 0,
  is_active: true,
};

function getVoucherIcon(amountEur: number): string {
  if (amountEur >= 100) return '💎';
  if (amountEur >= 50) return '🎁';
  if (amountEur >= 20) return '🎫';
  return '🏷️';
}

export const VoucherRulesConfig = ({
  rules, loading, isReadOnly, isAdmin,
  onCreateRule, onUpdateRule, onDeleteRule,
}: VoucherRulesConfigProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<VoucherRuleFormData>(emptyForm);
  const [editErrors, setEditErrors] = useState<VoucherRuleFormErrors>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<VoucherRuleFormData>(emptyForm);
  const [addErrors, setAddErrors] = useState<VoucherRuleFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; ruleId: number | null }>({
    isOpen: false, ruleId: null,
  });

  const handleEdit = useCallback((rule: VoucherRule) => {
    setEditingId(rule.id);
    setEditForm({
      trigger_turnover_12m_eur: rule.trigger_turnover_12m_eur,
      voucher_amount_eur: rule.voucher_amount_eur,
      valid_days: rule.valid_days,
      min_purchase_eur: rule.min_purchase_eur ?? 0,
      is_active: rule.is_active,
    });
    setEditErrors({});
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditErrors({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editingId === null) return;
    const errors = validateVoucherRule(editForm);
    if (hasErrors(errors)) {
      setEditErrors(errors);
      return;
    }
    setSaving(true);
    const ok = await onUpdateRule(editingId, editForm);
    setSaving(false);
    if (ok) {
      setEditingId(null);
      setEditForm(emptyForm);
    }
  }, [editingId, editForm, onUpdateRule]);

  const handleStartAdd = useCallback(() => {
    setAddForm(emptyForm);
    setAddErrors({});
    setIsAdding(true);
  }, []);

  const handleSaveAdd = useCallback(async () => {
    const errors = validateVoucherRule(addForm);
    if (hasErrors(errors)) {
      setAddErrors(errors);
      return;
    }
    setSaving(true);
    const ok = await onCreateRule(addForm);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setAddForm(emptyForm);
    }
  }, [addForm, onCreateRule]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm.ruleId === null) return;
    await onDeleteRule(deleteConfirm.ruleId);
    setDeleteConfirm({ isOpen: false, ruleId: null });
  }, [deleteConfirm.ruleId, onDeleteRule]);

  if (loading) {
    return (
      <div className="voucher-rule-cards__loading">
        <div className="voucher-rule-cards__spinner"></div>
        <p>Зареждане на правилата за ваучери...</p>
      </div>
    );
  }

  // Sort rules by turnover amount
  const sortedRules = [...rules].sort((a, b) => a.trigger_turnover_12m_eur - b.trigger_turnover_12m_eur);

  return (
    <>
      <div className="voucher-rule-cards">
        <div className="voucher-rule-cards__header">
          <div className="voucher-rule-cards__title-section">
            <h3 className="voucher-rule-cards__title">Правила за ваучери</h3>
            <p className="voucher-rule-cards__subtitle">
              При достигане на определен оборот за 12 месеца, клиентът получава ваучер за отстъпка.
              Ваучер + ниво отстъпка не могат да се комбинират — клиентът избира едно от двете.
            </p>
          </div>
          {isAdmin && !isReadOnly && (
            <button
              type="button"
              className="voucher-rule-cards__add-btn"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ново правило
            </button>
          )}
        </div>

        {/* Add New Rule Card (if adding) */}
        {isAdding && (
          <div className="voucher-rule-cards__grid">
            <div className="voucher-rule-card voucher-rule-card--editing">
              <div className="voucher-rule-card__header">
                <div className="voucher-rule-card__icon">➕</div>
                <div className="voucher-rule-card__info">
                  <h4 className="voucher-rule-card__name">Ново правило за ваучери</h4>
                  <p className="voucher-rule-card__subtitle">Попълнете данните за новото правило</p>
                </div>
              </div>

              <div className="voucher-rule-card__body">
                <div className="voucher-rule-card__field">
                  <label className="voucher-rule-card__label">Оборот за активиране (€)</label>
                  <input
                    type="number"
                    className="voucher-rule-card__input"
                    value={addForm.trigger_turnover_12m_eur}
                    onChange={e => setAddForm(f => ({ ...f, trigger_turnover_12m_eur: Number(e.target.value) }))}
                    min={0}
                    step={10}
                    placeholder="Мин. оборот за 12 месеца"
                    autoFocus
                  />
                  {addErrors.trigger_turnover_12m_eur && <div className="voucher-rule-card__error">{addErrors.trigger_turnover_12m_eur}</div>}
                </div>

                <div className="voucher-rule-card__field">
                  <label className="voucher-rule-card__label">Стойност на ваучера (€)</label>
                  <input
                    type="number"
                    className="voucher-rule-card__input"
                    value={addForm.voucher_amount_eur}
                    onChange={e => setAddForm(f => ({ ...f, voucher_amount_eur: Number(e.target.value) }))}
                    min={0}
                    step={1}
                    placeholder="Стойност на ваучера"
                  />
                  {addErrors.voucher_amount_eur && <div className="voucher-rule-card__error">{addErrors.voucher_amount_eur}</div>}
                </div>

                <div className="voucher-rule-card__field">
                  <label className="voucher-rule-card__label">Валидност (дни)</label>
                  <input
                    type="number"
                    className="voucher-rule-card__input"
                    value={addForm.valid_days}
                    onChange={e => setAddForm(f => ({ ...f, valid_days: Number(e.target.value) }))}
                    min={1}
                    placeholder="Брой дни валидност"
                  />
                  {addErrors.valid_days && <div className="voucher-rule-card__error">{addErrors.valid_days}</div>}
                </div>

                <div className="voucher-rule-card__field">
                  <label className="voucher-rule-card__label">Минимална покупка (€)</label>
                  <input
                    type="number"
                    className="voucher-rule-card__input"
                    value={addForm.min_purchase_eur}
                    onChange={e => setAddForm(f => ({ ...f, min_purchase_eur: Number(e.target.value) }))}
                    min={0}
                    step={1}
                    placeholder="Мин. покупка (0 = няма минимум)"
                  />
                  {addErrors.min_purchase_eur && <div className="voucher-rule-card__error">{addErrors.min_purchase_eur}</div>}
                </div>

                <div className="voucher-rule-card__field">
                  <label className="voucher-rule-card__label">Статус</label>
                  <label className="loyalty-toggle">
                    <input
                      type="checkbox"
                      checked={addForm.is_active}
                      onChange={e => setAddForm(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="loyalty-toggle__slider" />
                    <span className="loyalty-toggle__label">{addForm.is_active ? 'Активно' : 'Неактивно'}</span>
                  </label>
                </div>
              </div>

              <div className="voucher-rule-card__footer">
                <button
                  type="button"
                  className="voucher-rule-card__btn voucher-rule-card__btn--save"
                  onClick={handleSaveAdd}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="voucher-rule-card__btn-spinner"></div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Запази
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="voucher-rule-card__btn voucher-rule-card__btn--cancel"
                  onClick={() => setIsAdding(false)}
                  disabled={saving}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Откажи
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules Grid */}
        <div className="voucher-rule-cards__grid">
          {sortedRules.map(rule => {
            const isEditing = editingId === rule.id;

            return (
              <div
                key={rule.id}
                className={`voucher-rule-card ${!rule.is_active ? 'voucher-rule-card--inactive' : ''} ${isEditing ? 'voucher-rule-card--editing' : ''}`}
              >
                {isEditing ? (
                  <>
                    {/* Edit Mode */}
                    <div className="voucher-rule-card__header">
                      <div className="voucher-rule-card__icon">{getVoucherIcon(editForm.voucher_amount_eur)}</div>
                      <div className="voucher-rule-card__info">
                        <h4 className="voucher-rule-card__name">Редактиране на правило</h4>
                        <p className="voucher-rule-card__subtitle">Актуализирайте данните</p>
                      </div>
                    </div>

                    <div className="voucher-rule-card__body">
                      <div className="voucher-rule-card__field">
                        <label className="voucher-rule-card__label">Оборот за активиране (€)</label>
                        <input
                          type="number"
                          className="voucher-rule-card__input"
                          value={editForm.trigger_turnover_12m_eur}
                          onChange={e => setEditForm(f => ({ ...f, trigger_turnover_12m_eur: Number(e.target.value) }))}
                          min={0}
                          step={10}
                        />
                        {editErrors.trigger_turnover_12m_eur && <div className="voucher-rule-card__error">{editErrors.trigger_turnover_12m_eur}</div>}
                      </div>

                      <div className="voucher-rule-card__field">
                        <label className="voucher-rule-card__label">Стойност на ваучера (€)</label>
                        <input
                          type="number"
                          className="voucher-rule-card__input"
                          value={editForm.voucher_amount_eur}
                          onChange={e => setEditForm(f => ({ ...f, voucher_amount_eur: Number(e.target.value) }))}
                          min={0}
                          step={1}
                        />
                        {editErrors.voucher_amount_eur && <div className="voucher-rule-card__error">{editErrors.voucher_amount_eur}</div>}
                      </div>

                      <div className="voucher-rule-card__field">
                        <label className="voucher-rule-card__label">Валидност (дни)</label>
                        <input
                          type="number"
                          className="voucher-rule-card__input"
                          value={editForm.valid_days}
                          onChange={e => setEditForm(f => ({ ...f, valid_days: Number(e.target.value) }))}
                          min={1}
                        />
                        {editErrors.valid_days && <div className="voucher-rule-card__error">{editErrors.valid_days}</div>}
                      </div>

                      <div className="voucher-rule-card__field">
                        <label className="voucher-rule-card__label">Минимална покупка (€)</label>
                        <input
                          type="number"
                          className="voucher-rule-card__input"
                          value={editForm.min_purchase_eur}
                          onChange={e => setEditForm(f => ({ ...f, min_purchase_eur: Number(e.target.value) }))}
                          min={0}
                          step={1}
                        />
                        {editErrors.min_purchase_eur && <div className="voucher-rule-card__error">{editErrors.min_purchase_eur}</div>}
                      </div>

                      <div className="voucher-rule-card__field">
                        <label className="voucher-rule-card__label">Статус</label>
                        <label className="loyalty-toggle">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                          />
                          <span className="loyalty-toggle__slider" />
                          <span className="loyalty-toggle__label">{editForm.is_active ? 'Активно' : 'Неактивно'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="voucher-rule-card__footer">
                      <button
                        type="button"
                        className="voucher-rule-card__btn voucher-rule-card__btn--save"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? (
                          <div className="voucher-rule-card__btn-spinner"></div>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Запази
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="voucher-rule-card__btn voucher-rule-card__btn--cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Откажи
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="voucher-rule-card__header">
                      <div className="voucher-rule-card__icon">{getVoucherIcon(rule.voucher_amount_eur)}</div>
                      <div className="voucher-rule-card__info">
                        <h4 className="voucher-rule-card__name">
                          Ваучер €{rule.voucher_amount_eur.toFixed(2)}
                        </h4>
                        <p className="voucher-rule-card__subtitle">
                          При оборот €{rule.trigger_turnover_12m_eur.toFixed(2)}
                        </p>
                      </div>
                      <div className="voucher-rule-card__status">
                        <span className={`loyalty-badge ${rule.is_active ? 'loyalty-badge--active' : 'loyalty-badge--inactive'}`}>
                          {rule.is_active ? 'Активно' : 'Неактивно'}
                        </span>
                      </div>
                    </div>

                    <div className="voucher-rule-card__body">
                      <div className="voucher-rule-card__detail">
                        <span className="voucher-rule-card__detail-label">Стойност ваучер</span>
                        <span className="voucher-rule-card__detail-value voucher-rule-card__detail-value--highlight">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M20 12v8H4v-8M2 5h20v5H2z" />
                          </svg>
                          €{rule.voucher_amount_eur.toFixed(2)}
                        </span>
                      </div>

                      <div className="voucher-rule-card__detail">
                        <span className="voucher-rule-card__detail-label">Оборот за активиране</span>
                        <span className="voucher-rule-card__detail-value">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          €{rule.trigger_turnover_12m_eur.toFixed(2)}
                        </span>
                      </div>

                      <div className="voucher-rule-card__detail">
                        <span className="voucher-rule-card__detail-label">Валидност</span>
                        <span className="voucher-rule-card__detail-value">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {rule.valid_days} дни
                        </span>
                      </div>

                      <div className="voucher-rule-card__detail">
                        <span className="voucher-rule-card__detail-label">Мин. покупка</span>
                        <span className="voucher-rule-card__detail-value">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          {rule.min_purchase_eur ? `€${Number(rule.min_purchase_eur).toFixed(2)}` : 'Няма минимум'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && !isReadOnly && (
                      <div className="voucher-rule-card__footer">
                        <button
                          type="button"
                          className="voucher-rule-card__btn voucher-rule-card__btn--edit"
                          onClick={() => handleEdit(rule)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Редактирай
                        </button>
                        <button
                          type="button"
                          className="voucher-rule-card__btn voucher-rule-card__btn--delete"
                          onClick={() => setDeleteConfirm({ isOpen: true, ruleId: rule.id })}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Изтрий
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {sortedRules.length === 0 && !isAdding && (
            <div className="voucher-rule-cards__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                <path d="M20 12v8H4v-8M2 5h20v5H2z" />
              </svg>
              <p>Няма конфигурирани правила за ваучери. Натиснете "Ново правило" за да създадете.</p>
            </div>
          )}
        </div>
      </div>


      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Изтриване на правило"
        message="Сигурни ли сте, че искате да изтриете това правило за ваучери? Вече издадените ваучери по това правило ще останат."
        confirmText="Изтрий"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, ruleId: null })}
      />
    </>
  );
};
