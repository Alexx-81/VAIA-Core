import { useState, useCallback } from 'react';
import type { LoyaltyTier } from '../../../lib/supabase/types';
import type { TierFormData, TierFormErrors } from '../types';
import { validateTier, hasErrors } from '../utils/validation';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface TiersConfigProps {
  tiers: LoyaltyTier[];
  loading: boolean;
  isReadOnly: boolean;
  isAdmin: boolean;
  onCreateTier: (data: TierFormData) => Promise<boolean>;
  onUpdateTier: (id: number, data: Partial<TierFormData>) => Promise<boolean>;
  onDeleteTier: (id: number) => Promise<boolean>;
}

const emptyForm: TierFormData = {
  name: '',
  sort_order: 0,
  min_turnover_12m_eur: 0,
  discount_percent: 0,
  is_active: true,
};

function getTierBadgeClass(name: string): string {
  const n = name.toUpperCase();
  if (n === 'START') return 'loyalty-badge--start';
  if (n === 'SILVER') return 'loyalty-badge--silver';
  if (n === 'GOLD') return 'loyalty-badge--gold';
  if (n === 'VIP') return 'loyalty-badge--vip';
  if (n === 'ELITE') return 'loyalty-badge--elite';
  return 'loyalty-badge--start';
}

export const TiersConfig = ({
  tiers, loading, isReadOnly, isAdmin,
  onCreateTier, onUpdateTier, onDeleteTier,
}: TiersConfigProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TierFormData>(emptyForm);
  const [editErrors, setEditErrors] = useState<TierFormErrors>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<TierFormData>(emptyForm);
  const [addErrors, setAddErrors] = useState<TierFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tierId: number | null }>({
    isOpen: false, tierId: null,
  });

  // Start editing
  const handleEdit = useCallback((tier: LoyaltyTier) => {
    setEditingId(tier.id);
    setEditForm({
      name: tier.name,
      sort_order: tier.sort_order,
      min_turnover_12m_eur: tier.min_turnover_12m_eur,
      discount_percent: tier.discount_percent,
      is_active: tier.is_active,
    });
    setEditErrors({});
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditErrors({});
  }, []);

  // Save edit
  const handleSaveEdit = useCallback(async () => {
    if (editingId === null) return;
    const errors = validateTier(editForm, tiers, editingId);
    if (hasErrors(errors)) {
      setEditErrors(errors);
      return;
    }
    setSaving(true);
    const ok = await onUpdateTier(editingId, editForm);
    setSaving(false);
    if (ok) {
      setEditingId(null);
      setEditForm(emptyForm);
    }
  }, [editingId, editForm, tiers, onUpdateTier]);

  // Start adding
  const handleStartAdd = useCallback(() => {
    const nextOrder = tiers.length > 0 ? Math.max(...tiers.map(t => t.sort_order)) + 1 : 0;
    setAddForm({ ...emptyForm, sort_order: nextOrder });
    setAddErrors({});
    setIsAdding(true);
  }, [tiers]);

  // Save add
  const handleSaveAdd = useCallback(async () => {
    const errors = validateTier(addForm, tiers);
    if (hasErrors(errors)) {
      setAddErrors(errors);
      return;
    }
    setSaving(true);
    const ok = await onCreateTier(addForm);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setAddForm(emptyForm);
    }
  }, [addForm, tiers, onCreateTier]);

  // Delete
  const handleDelete = useCallback(async () => {
    if (deleteConfirm.tierId === null) return;
    await onDeleteTier(deleteConfirm.tierId);
    setDeleteConfirm({ isOpen: false, tierId: null });
  }, [deleteConfirm.tierId, onDeleteTier]);

  if (loading) return <div className="loyalty__loading">Зареждане на нивата...</div>;

  return (
    <>
      <div className="loyalty-config">
        <div className="loyalty-config__header">
          <div>
            <h3 className="loyalty-config__title">Нива на лоялност</h3>
            <p className="loyalty-config__subtitle">
              Определете нивата и процентите отстъпка. Подредбата (0, 1, 2...) определя йерархията.
            </p>
          </div>
          {isAdmin && !isReadOnly && (
            <button
              type="button"
              className="loyalty__add-btn"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              + Ново ниво
            </button>
          )}
        </div>

        <table className="loyalty-table">
          <thead>
            <tr>
              <th>Ред</th>
              <th>Име</th>
              <th>Мин. оборот 12м (€)</th>
              <th>Отстъпка %</th>
              <th>Статус</th>
              {isAdmin && !isReadOnly && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {tiers.map(tier => (
              <tr key={tier.id}>
                {editingId === tier.id ? (
                  <>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.sort_order}
                        onChange={e => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                        min={0}
                        style={{ maxWidth: '60px' }}
                      />
                      {editErrors.sort_order && <div className="loyalty-field-error">{editErrors.sort_order}</div>}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="loyalty-table__input loyalty-table__input--name"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                      {editErrors.name && <div className="loyalty-field-error">{editErrors.name}</div>}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.min_turnover_12m_eur}
                        onChange={e => setEditForm(f => ({ ...f, min_turnover_12m_eur: Number(e.target.value) }))}
                        min={0}
                        step={10}
                      />
                      {editErrors.min_turnover_12m_eur && <div className="loyalty-field-error">{editErrors.min_turnover_12m_eur}</div>}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="loyalty-table__input"
                        value={editForm.discount_percent}
                        onChange={e => setEditForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      {editErrors.discount_percent && <div className="loyalty-field-error">{editErrors.discount_percent}</div>}
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
                    <td>{tier.sort_order}</td>
                    <td>
                      <span className={`loyalty-badge ${getTierBadgeClass(tier.name)}`}>{tier.name}</span>
                    </td>
                    <td><span className="loyalty-eur">€{tier.min_turnover_12m_eur.toFixed(2)}</span></td>
                    <td><strong>{tier.discount_percent}%</strong></td>
                    <td>
                      <span className={`loyalty-badge ${tier.is_active ? 'loyalty-badge--active' : 'loyalty-badge--inactive'}`}>
                        {tier.is_active ? 'Активно' : 'Неактивно'}
                      </span>
                    </td>
                    {isAdmin && !isReadOnly && (
                      <td>
                        <div className="loyalty-table__btn-group">
                          <button type="button" className="loyalty-table__btn" onClick={() => handleEdit(tier)}>Редактирай</button>
                          <button
                            type="button"
                            className="loyalty-table__btn loyalty-table__btn--danger"
                            onClick={() => setDeleteConfirm({ isOpen: true, tierId: tier.id })}
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

            {/* Add new row */}
            {isAdding && (
              <tr>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.sort_order}
                    onChange={e => setAddForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    min={0}
                    style={{ maxWidth: '60px' }}
                  />
                  {addErrors.sort_order && <div className="loyalty-field-error">{addErrors.sort_order}</div>}
                </td>
                <td>
                  <input
                    type="text"
                    className="loyalty-table__input loyalty-table__input--name"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Име на ниво"
                  />
                  {addErrors.name && <div className="loyalty-field-error">{addErrors.name}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.min_turnover_12m_eur}
                    onChange={e => setAddForm(f => ({ ...f, min_turnover_12m_eur: Number(e.target.value) }))}
                    min={0}
                    step={10}
                    placeholder="0.00"
                  />
                  {addErrors.min_turnover_12m_eur && <div className="loyalty-field-error">{addErrors.min_turnover_12m_eur}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    className="loyalty-table__input"
                    value={addForm.discount_percent}
                    onChange={e => setAddForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="0"
                  />
                  {addErrors.discount_percent && <div className="loyalty-field-error">{addErrors.discount_percent}</div>}
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

            {tiers.length === 0 && !isAdding && (
              <tr>
                <td colSpan={isAdmin && !isReadOnly ? 6 : 5} className="loyalty__empty">
                  Няма конфигурирани нива. Натиснете "+ Ново ниво" за да създадете.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Изтриване на ниво"
        message="Сигурни ли сте, че искате да изтриете това ниво? Ако има клиенти на това ниво, операцията ще бъде отказана."
        confirmText="Изтрий"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, tierId: null })}
      />
    </>
  );
};
