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
  }, [editingId, editForm, rules, onUpdateRule]);

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
  }, [addForm, rules, onCreateRule]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm.ruleId === null) return;
    await onDeleteRule(deleteConfirm.ruleId);
    setDeleteConfirm({ isOpen: false, ruleId: null });
  }, [deleteConfirm.ruleId, onDeleteRule]);

  if (loading) return <div className="loyalty__loading">Зареждане на правилата за ваучери...</div>;

  return (
    <>
      <div className="loyalty-config">
        <div className="loyalty-config__header">
          <div>
            <h3 className="loyalty-config__title">Правила за ваучери</h3>
            <p className="loyalty-config__subtitle">
              При достигане на определен оборот за 12 месеца, клиентът получава ваучер за отстъпка.
              Ваучер + ниво отстъпка не могат да се комбинират — клиентът избира едно от двете.
            </p>
          </div>
          {isAdmin && !isReadOnly && (
            <button
              type="button"
              className="loyalty__add-btn"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              + Ново правило
            </button>
          )}
        </div>

        <table className="loyalty-table">
          <thead>
            <tr>
              <th>Оборот (€)</th>
              <th>Ваучер (€)</th>
              <th>Валидност (дни)</th>
              <th>Мин. покупка (€)</th>
              <th>Статус</th>
              {isAdmin && !isReadOnly && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id}>
                {editingId === rule.id ? (
                  <>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.trigger_turnover_12m_eur}
                        onChange={e => setEditForm(f => ({ ...f, trigger_turnover_12m_eur: Number(e.target.value) }))}
                        min={0}
                        step={10}
                      />
                      {editErrors.trigger_turnover_12m_eur && <div className="loyalty-field-error">{editErrors.trigger_turnover_12m_eur}</div>}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.voucher_amount_eur}
                        onChange={e => setEditForm(f => ({ ...f, voucher_amount_eur: Number(e.target.value) }))}
                        min={0}
                        step={1}
                      />
                      {editErrors.voucher_amount_eur && <div className="loyalty-field-error">{editErrors.voucher_amount_eur}</div>}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.valid_days}
                        onChange={e => setEditForm(f => ({ ...f, valid_days: Number(e.target.value) }))}
                        min={1}
                        style={{ maxWidth: '80px' }}
                      />
                      {editErrors.valid_days && <div className="loyalty-field-error">{editErrors.valid_days}</div>}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.min_purchase_eur}
                        onChange={e => setEditForm(f => ({ ...f, min_purchase_eur: Number(e.target.value) }))}
                        min={0}
                        step={1}
                      />
                      {editErrors.min_purchase_eur && <div className="loyalty-field-error">{editErrors.min_purchase_eur}</div>}
                    </td>
                    <td>
                      <label className="loyalty-toggle">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                        />
                        <span className="loyalty-toggle__slider" />
                      </label>
                    </td>
                    <td>
                      <div className="loyalty-table__btn-group">
                        <button type="button" className="loyalty-table__btn loyalty-table__btn--save" onClick={handleSaveEdit} disabled={saving}>
                          {saving ? '...' : 'Запази'}
                        </button>
                        <button type="button" className="loyalty-table__btn" onClick={handleCancelEdit}>Откажи</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td><span className="loyalty-eur">€{rule.trigger_turnover_12m_eur.toFixed(2)}</span></td>
                    <td><strong className="loyalty-eur">€{rule.voucher_amount_eur.toFixed(2)}</strong></td>
                    <td>{rule.valid_days} дни</td>
                    <td>{rule.min_purchase_eur ? `€${Number(rule.min_purchase_eur).toFixed(2)}` : '—'}</td>
                    <td>
                      <span className={`loyalty-badge ${rule.is_active ? 'loyalty-badge--active' : 'loyalty-badge--inactive'}`}>
                        {rule.is_active ? 'Активно' : 'Неактивно'}
                      </span>
                    </td>
                    {isAdmin && !isReadOnly && (
                      <td>
                        <div className="loyalty-table__btn-group">
                          <button type="button" className="loyalty-table__btn" onClick={() => handleEdit(rule)}>Редактирай</button>
                          <button
                            type="button"
                            className="loyalty-table__btn loyalty-table__btn--danger"
                            onClick={() => setDeleteConfirm({ isOpen: true, ruleId: rule.id })}
                          >
                            Изтрий
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}

            {isAdding && (
              <tr>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.trigger_turnover_12m_eur}
                    onChange={e => setAddForm(f => ({ ...f, trigger_turnover_12m_eur: Number(e.target.value) }))}
                    min={0}
                    step={10}
                    placeholder="0.00"
                  />
                  {addErrors.trigger_turnover_12m_eur && <div className="loyalty-field-error">{addErrors.trigger_turnover_12m_eur}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.voucher_amount_eur}
                    onChange={e => setAddForm(f => ({ ...f, voucher_amount_eur: Number(e.target.value) }))}
                    min={0}
                    step={1}
                    placeholder="0.00"
                  />
                  {addErrors.voucher_amount_eur && <div className="loyalty-field-error">{addErrors.voucher_amount_eur}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.valid_days}
                    onChange={e => setAddForm(f => ({ ...f, valid_days: Number(e.target.value) }))}
                    min={1}
                    style={{ maxWidth: '80px' }}
                    placeholder="90"
                  />
                  {addErrors.valid_days && <div className="loyalty-field-error">{addErrors.valid_days}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.min_purchase_eur}
                    onChange={e => setAddForm(f => ({ ...f, min_purchase_eur: Number(e.target.value) }))}
                    min={0}
                    step={1}
                    placeholder="0.00"
                  />
                  {addErrors.min_purchase_eur && <div className="loyalty-field-error">{addErrors.min_purchase_eur}</div>}
                </td>
                <td>
                  <label className="loyalty-toggle">
                    <input
                      type="checkbox"
                      checked={addForm.is_active}
                      onChange={e => setAddForm(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span className="loyalty-toggle__slider" />
                  </label>
                </td>
                <td>
                  <div className="loyalty-table__btn-group">
                    <button type="button" className="loyalty-table__btn loyalty-table__btn--save" onClick={handleSaveAdd} disabled={saving}>
                      {saving ? '...' : 'Добави'}
                    </button>
                    <button type="button" className="loyalty-table__btn" onClick={() => setIsAdding(false)}>Откажи</button>
                  </div>
                </td>
              </tr>
            )}

            {rules.length === 0 && !isAdding && (
              <tr>
                <td colSpan={isAdmin && !isReadOnly ? 6 : 5} className="loyalty__empty">
                  Няма конфигурирани правила за ваучери. Натиснете "+ Ново правило" за да създадете.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
