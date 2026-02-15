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

function getTierIcon(name: string): string {
  const n = name.toUpperCase();
  if (n === 'START') return '🌱';
  if (n === 'SILVER') return '🥈';
  if (n === 'GOLD') return '🥇';
  if (n === 'VIP') return '⭐';
  if (n === 'ELITE') return '👑';
  return '🏅';
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

  if (loading) {
    return (
      <div className="tier-cards__loading">
        <div className="tier-cards__spinner"></div>
        <p>Зареждане на нивата...</p>
      </div>
    );
  }

  // Sort tiers by sort_order
  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="tier-cards">
        <div className="tier-cards__header">
          <div className="tier-cards__title-section">
            <h3 className="tier-cards__title">Нива на лоялност</h3>
            <p className="tier-cards__subtitle">
              Определете нивата и процентите отстъпка. Подредбата (0, 1, 2...) определя йерархията.
            </p>
          </div>
          {isAdmin && !isReadOnly && (
            <button
              type="button"
              className="tier-cards__add-btn"
              onClick={handleStartAdd}
              disabled={isAdding}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ново ниво
            </button>
          )}
        </div>

        {/* Add New Tier Card (if adding) */}
        {isAdding && (
          <div className="tier-cards__grid">
            <div className="tier-card tier-card--editing">
              <div className="tier-card__header">
                <div className="tier-card__icon">➕</div>
                <div className="tier-card__info">
                  <input
                    type="text"
                    className="tier-card__name-input"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Име на ниво (START, SILVER, GOLD...)"
                    autoFocus
                  />
                  {addErrors.name && <div className="tier-card__error">{addErrors.name}</div>}
                </div>
              </div>

              <div className="tier-card__body">
                <div className="tier-card__field">
                  <label className="tier-card__label">Подредба</label>
                  <input
                    type="number"
                    className="tier-card__input"
                    value={addForm.sort_order}
                    onChange={e => setAddForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    min={0}
                  />
                  {addErrors.sort_order && <div className="tier-card__error">{addErrors.sort_order}</div>}
                </div>

                <div className="tier-card__field">
                  <label className="tier-card__label">Мин. оборот 12м (€)</label>
                  <input
                    type="number"
                    className="tier-card__input"
                    value={addForm.min_turnover_12m_eur}
                    onChange={e => setAddForm(f => ({ ...f, min_turnover_12m_eur: Number(e.target.value) }))}
                    min={0}
                    step={10}
                  />
                  {addErrors.min_turnover_12m_eur && <div className="tier-card__error">{addErrors.min_turnover_12m_eur}</div>}
                </div>

                <div className="tier-card__field">
                  <label className="tier-card__label">Отстъпка %</label>
                  <input
                    type="number"
                    className="tier-card__input"
                    value={addForm.discount_percent}
                    onChange={e => setAddForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  {addErrors.discount_percent && <div className="tier-card__error">{addErrors.discount_percent}</div>}
                </div>

                <div className="tier-card__field">
                  <label className="tier-card__label">Статус</label>
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

              <div className="tier-card__footer">
                <button
                  type="button"
                  className="tier-card__btn tier-card__btn--save"
                  onClick={handleSaveAdd}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="tier-card__btn-spinner"></div>
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
                  className="tier-card__btn tier-card__btn--cancel"
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

        {/* Tiers Grid */}
        <div className="tier-cards__grid">
          {sortedTiers.map(tier => {
            const isEditing = editingId === tier.id;

            return (
              <div
                key={tier.id}
                className={`tier-card ${!tier.is_active ? 'tier-card--inactive' : ''} ${isEditing ? 'tier-card--editing' : ''}`}
              >
                {isEditing ? (
                  <>
                    {/* Edit Mode */}
                    <div className="tier-card__header">
                      <div className="tier-card__icon">{getTierIcon(editForm.name)}</div>
                      <div className="tier-card__info">
                        <input
                          type="text"
                          className="tier-card__name-input"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                        {editErrors.name && <div className="tier-card__error">{editErrors.name}</div>}
                      </div>
                    </div>

                    <div className="tier-card__body">
                      <div className="tier-card__field">
                        <label className="tier-card__label">Подредба</label>
                        <input
                          type="number"
                          className="tier-card__input"
                          value={editForm.sort_order}
                          onChange={e => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                          min={0}
                        />
                        {editErrors.sort_order && <div className="tier-card__error">{editErrors.sort_order}</div>}
                      </div>

                      <div className="tier-card__field">
                        <label className="tier-card__label">Мин. оборот 12м (€)</label>
                        <input
                          type="number"
                          className="tier-card__input"
                          value={editForm.min_turnover_12m_eur}
                          onChange={e => setEditForm(f => ({ ...f, min_turnover_12m_eur: Number(e.target.value) }))}
                          min={0}
                          step={10}
                        />
                        {editErrors.min_turnover_12m_eur && <div className="tier-card__error">{editErrors.min_turnover_12m_eur}</div>}
                      </div>

                      <div className="tier-card__field">
                        <label className="tier-card__label">Отстъпка %</label>
                        <input
                          type="number"
                          className="tier-card__input"
                          value={editForm.discount_percent}
                          onChange={e => setEditForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
                          min={0}
                          max={100}
                          step={0.5}
                        />
                        {editErrors.discount_percent && <div className="tier-card__error">{editErrors.discount_percent}</div>}
                      </div>

                      <div className="tier-card__field">
                        <label className="tier-card__label">Статус</label>
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

                    <div className="tier-card__footer">
                      <button
                        type="button"
                        className="tier-card__btn tier-card__btn--save"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? (
                          <div className="tier-card__btn-spinner"></div>
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
                        className="tier-card__btn tier-card__btn--cancel"
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
                    <div className="tier-card__header">
                      <div className="tier-card__icon">{getTierIcon(tier.name)}</div>
                      <div className="tier-card__info">
                        <h4 className="tier-card__name">
                          <span className={`loyalty-badge ${getTierBadgeClass(tier.name)}`}>{tier.name}</span>
                        </h4>
                        <p className="tier-card__order">Подредба: {tier.sort_order}</p>
                      </div>
                      <div className="tier-card__status">
                        <span className={`loyalty-badge ${tier.is_active ? 'loyalty-badge--active' : 'loyalty-badge--inactive'}`}>
                          {tier.is_active ? 'Активно' : 'Неактивно'}
                        </span>
                      </div>
                    </div>

                    <div className="tier-card__body">
                      <div className="tier-card__detail">
                        <span className="tier-card__detail-label">Мин. оборот 12м</span>
                        <span className="tier-card__detail-value">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          €{tier.min_turnover_12m_eur.toFixed(2)}
                        </span>
                      </div>

                      <div className="tier-card__detail">
                        <span className="tier-card__detail-label">Отстъпка</span>
                        <span className="tier-card__detail-value tier-card__detail-value--highlight">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            <polyline points="12 2 12 12 16 14" />
                          </svg>
                          {tier.discount_percent}%
                        </span>
                      </div>
                    </div>

                    {isAdmin && !isReadOnly && (
                      <div className="tier-card__footer">
                        <button
                          type="button"
                          className="tier-card__btn tier-card__btn--edit"
                          onClick={() => handleEdit(tier)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Редактирай
                        </button>
                        <button
                          type="button"
                          className="tier-card__btn tier-card__btn--delete"
                          onClick={() => setDeleteConfirm({ isOpen: true, tierId: tier.id })}
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

          {sortedTiers.length === 0 && !isAdding && (
            <div className="tier-cards__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p>Няма конфигурирани нива. Натиснете "Ново ниво" за да създадете.</p>
            </div>
          )}
        </div>
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
