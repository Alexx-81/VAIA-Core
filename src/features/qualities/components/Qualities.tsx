import { useState, useEffect, useMemo, useCallback } from 'react';
import { DataCards } from '../../../shared/components/DataCards';
import { ImportQualitiesDialog } from './ImportQualitiesDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Toast } from '../../../shared/components/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { deleteQuality as deleteQualityApi, getQualityDependencies } from '../../../lib/api/qualities';
import type { Quality as DbQuality } from '../../../lib/supabase/types';
import './Qualities.css';

// Types
type StatusFilter = 'all' | 'active' | 'inactive';

interface Quality {
  id: number;
  name: string;
  note: string;
  isActive: boolean;
  createdAt: Date;
}

interface QualityWithStats extends Quality {
  deliveriesCount: number;
  lastDeliveryDate: Date | null;
}

interface QualityFormData {
  name: string;
  note: string;
  isActive: boolean;
}

// Helper functions
const formatDate = (date: Date | null): string => {
  if (!date) return '—';
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Convert DB quality to local format
const mapDbQuality = (q: DbQuality): Quality => ({
  id: q.id,
  name: q.name,
  note: q.note || '',
  isActive: q.is_active,
  createdAt: new Date(q.created_at),
});

export const Qualities = () => {
  const { isReadOnly, isAdmin } = useAuth();

  // State
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualityStats, setQualityStats] = useState<Map<number, { count: number; lastDate: Date | null }>>(new Map());

  // Fetch qualities from Supabase
  useEffect(() => {
    const fetchQualities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('qualities')
          .select('*')
          .order('name');

        if (error) throw error;

        const mapped = (data || []).map(mapDbQuality);
        setQualities(mapped);

        // Fetch delivery stats for each quality
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select('quality_id, date');

        const statsMap = new Map<number, { count: number; lastDate: Date | null }>();
        (deliveries || []).forEach(d => {
          const existing = statsMap.get(d.quality_id) || { count: 0, lastDate: null };
          existing.count++;
          const deliveryDate = new Date(d.date);
          if (!existing.lastDate || deliveryDate > existing.lastDate) {
            existing.lastDate = deliveryDate;
          }
          statsMap.set(d.quality_id, existing);
        });
        setQualityStats(statsMap);
      } catch (err) {
        console.error('Error fetching qualities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQualities();
  }, []);

  // Calculate stats for each quality
  const qualitiesWithStats = useMemo(() => {
    return qualities.map(q => {
      const stats = qualityStats.get(q.id) || { count: 0, lastDate: null };
      return {
        ...q,
        deliveriesCount: stats.count,
        lastDeliveryDate: stats.lastDate,
      };
    });
  }, [qualities, qualityStats]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuality, setEditingQuality] = useState<Quality | null>(null);
  const [formData, setFormData] = useState<QualityFormData>({ name: '', note: '', isActive: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; qualityId: number | null; action: 'deactivate' | 'activate' }>({
    isOpen: false,
    qualityId: null,
    action: 'deactivate',
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const filteredQualities = useMemo(() => {
    return qualitiesWithStats.filter(quality => {
      // Search filter
      const matchesSearch = quality.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && quality.isActive) ||
        (statusFilter === 'inactive' && !quality.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [qualitiesWithStats, searchTerm, statusFilter]);

  // Handlers
  const handleOpenNewDialog = useCallback(() => {
    setEditingQuality(null);
    setFormData({ name: '', note: '', isActive: true });
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((quality: QualityWithStats) => {
    setEditingQuality(quality);
    setFormData({ name: quality.name, note: quality.note, isActive: quality.isActive });
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingQuality(null);
    setFormData({ name: '', note: '', isActive: true });
    setFormError(null);
  }, []);

  const handleFormChange = useCallback((field: keyof QualityFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    const trimmedName = formData.name.trim();
    
    // Check for empty name
    if (!trimmedName) {
      setFormError('Името на качеството е задължително.');
      return false;
    }
    
    // Check for duplicate name
    const isDuplicate = qualities.some(q => 
      q.name.toLowerCase() === trimmedName.toLowerCase() && 
      q.id !== editingQuality?.id
    );
    
    if (isDuplicate) {
      setFormError('Вече има качество с това име.');
      return false;
    }
    
    return true;
  }, [formData.name, qualities, editingQuality]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    const trimmedName = formData.name.trim();
    const trimmedNote = formData.note.trim();

    setSaving(true);
    try {
      if (editingQuality) {
        // Update existing quality in Supabase
        const { data, error } = await supabase
          .from('qualities')
          .update({ 
            name: trimmedName, 
            note: trimmedNote, 
            is_active: formData.isActive 
          })
          .eq('id', editingQuality.id)
          .select()
          .single();

        if (error) throw error;

        setQualities(prev => prev.map(q => 
          q.id === editingQuality.id 
            ? mapDbQuality(data)
            : q
        ));
      } else {
        // Create new quality in Supabase
        const { data, error } = await supabase
          .from('qualities')
          .insert({ 
            name: trimmedName, 
            note: trimmedNote, 
            is_active: formData.isActive 
          })
          .select()
          .single();

        if (error) throw error;

        setQualities(prev => [...prev, mapDbQuality(data)].sort((a, b) => a.name.localeCompare(b.name)));
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving quality:', err);
      setFormError('Грешка при запазване. Моля опитай отново.');
    } finally {
      setSaving(false);
    }
  }, [formData, editingQuality, validateForm, handleCloseDialog]);

  const handleToggleStatus = useCallback((qualityId: number, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      qualityId,
      action: currentStatus ? 'deactivate' : 'activate',
    });
  }, []);

  const handleConfirmToggle = useCallback(async () => {
    if (confirmDialog.qualityId === null) return;
    
    const newStatus = confirmDialog.action === 'activate';

    try {
      const { error } = await supabase
        .from('qualities')
        .update({ is_active: newStatus })
        .eq('id', confirmDialog.qualityId);

      if (error) throw error;

      setQualities(prev => prev.map(q => 
        q.id === confirmDialog.qualityId 
          ? { ...q, isActive: newStatus }
          : q
      ));
    } catch (err) {
      console.error('Error toggling quality status:', err);
    }
    
    setConfirmDialog({ isOpen: false, qualityId: null, action: 'deactivate' });
  }, [confirmDialog.qualityId, confirmDialog.action]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmDialog({ isOpen: false, qualityId: null, action: 'deactivate' });
  }, []);

  // Import handlers
  const handleOpenImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleCloseImportDialog = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const handleImportQualities = useCallback(async (names: string[]) => {
    try {
      const qualityInserts = names.map(name => ({
        name,
        note: '',
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('qualities')
        .insert(qualityInserts)
        .select();

      if (error) throw error;

      const newQualities = (data || []).map(mapDbQuality);
      setQualities(prev => [...prev, ...newQualities].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error importing qualities:', err);
    }
  }, []);

  const existingQualityNames = useMemo(() => {
    return qualities.map(q => q.name);
  }, [qualities]);

  // Delete handler
  const handleDeleteQuality = useCallback(async (quality: Quality | QualityWithStats) => {
    try {
      const deps = await getQualityDependencies(quality.id);

      let message = `Сигурни ли сте, че искате да изтриете качество „${quality.name}“?`;
      if (deps.deliveryCount > 0 || deps.saleCount > 0) {
        message += `\n\n❗ Ще бъдат изтрити и:`;
        if (deps.deliveryCount > 0) message += `\n  • ${deps.deliveryCount} доставки`;
        if (deps.saleCount > 0) message += `\n  • ${deps.saleCount} продажби`;
      }
      message += '\n\nТова действие е необратимо.';

      setDeleteConfirm({
        isOpen: true,
        title: 'Изтриване на качество',
        message,
        onConfirm: async () => {
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
          try {
            await deleteQualityApi(quality.id);
            setQualities(prev => prev.filter(q => q.id !== quality.id));
            setToast({ message: `Качество „${quality.name}“ е изтрито успешно.`, variant: 'success' });
            handleCloseDialog();
          } catch (err) {
            console.error('Error deleting quality:', err);
            setToast({ message: 'Грешка при изтриване на качеството.', variant: 'error' });
          }
        },
      });
    } catch (err) {
      console.error('Error checking dependencies:', err);
      setToast({ message: 'Грешка при проверка на зависимости.', variant: 'error' });
    }
  }, [handleCloseDialog]);

  const getStatusFilterLabel = (status: StatusFilter): string => {
    const labels: Record<StatusFilter, string> = {
      all: 'Всички',
      active: 'Активни',
      inactive: 'Неактивни',
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="qualities">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Зареждане на качества...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qualities">
      {/* Header */}
      <div className="qualities-header">
        <div className="qualities-filters">
          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Търсене</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Търси качество…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="Изчисти"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">Статус</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">{getStatusFilterLabel('all')}</option>
              <option value="active">{getStatusFilterLabel('active')}</option>
              <option value="inactive">{getStatusFilterLabel('inactive')}</option>
            </select>
          </div>
        </div>

        <div className="qualities-actions">
          {!isReadOnly && (
            <>
              <button className="action-btn secondary" onClick={handleOpenImportDialog}>
                <span className="btn-icon">📥</span>
                Импорт
              </button>
              <button className="action-btn primary" onClick={handleOpenNewDialog}>
                <span className="btn-icon">+</span>
                Ново качество
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Качества</h2>
          <div className="table-info">
            <span className="results-count">
              {filteredQualities.length} от {qualities.length} качества
            </span>
          </div>
        </div>

        {filteredQualities.length === 0 ? (
          <div className="empty-state">
            {qualities.length === 0 ? (
              <>
                <div className="empty-icon">📋</div>
                <h3>Нямаш въведени качества</h3>
                <p>Започни като добавиш първото качество в каталога.</p>
                {!isReadOnly && (
                  <button className="action-btn primary" onClick={handleOpenNewDialog}>
                    <span className="btn-icon">+</span>
                    Ново качество
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>Няма намерени резултати</h3>
                <p>Опитай с различни филтри или търсене.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-wrapper desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Име на качество</th>
                    <th className="text-center">Статус</th>
                    <th className="text-center">Брой доставки</th>
                    <th className="text-center">Последна доставка</th>
                    <th className="text-center">Създадено на</th>
                    <th className="text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQualities.map(quality => (
                    <tr key={quality.id} className={!quality.isActive ? 'inactive-row' : ''}>
                      <td>
                        <button 
                          className="quality-name-btn"
                          onClick={() => !isReadOnly && handleOpenEditDialog(quality)}
                          title={isReadOnly ? quality.name : "Редактирай"}
                          style={isReadOnly ? { cursor: 'default' } : undefined}
                        >
                          {quality.name}
                        </button>
                        {quality.note && (
                          <div className="quality-note">{quality.note}</div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`status-badge ${quality.isActive ? 'active' : 'inactive'}`}>
                          {quality.isActive ? 'Активно' : 'Неактивно'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="deliveries-count">
                          {quality.deliveriesCount}
                        </span>
                      </td>
                      <td className="text-center text-muted">
                        {formatDate(quality.lastDeliveryDate)}
                      </td>
                      <td className="text-center text-muted">
                        {formatDate(quality.createdAt)}
                      </td>
                      <td className="text-center actions-cell">
                        {!isReadOnly && (
                          <>
                            <button 
                              className="row-action-btn edit"
                              onClick={() => handleOpenEditDialog(quality)}
                              title="Редакция"
                            >
                              ✏️
                            </button>
                            <button 
                              className={`row-action-btn ${quality.isActive ? 'deactivate' : 'activate'}`}
                              onClick={() => handleToggleStatus(quality.id, quality.isActive)}
                              title={quality.isActive ? 'Деактивирай' : 'Активирай'}
                            >
                              {quality.isActive ? '⏸️' : '▶️'}
                            </button>
                            {isAdmin && (
                              <button
                                className="row-action-btn delete"
                                onClick={() => handleDeleteQuality(quality)}
                                title="Изтрий"
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <DataCards
              data={filteredQualities}
              keyExtractor={(q) => q.id}
              onItemClick={(q) => !isReadOnly && handleOpenEditDialog(q)}
              cardClassName={(q) => (!q.isActive ? 'inactive' : '')}
              fields={[
                {
                  key: 'deliveriesCount',
                  label: 'Брой доставки',
                  render: (q) => (
                    <span className="deliveries-count">{q.deliveriesCount}</span>
                  ),
                },
                {
                  key: 'lastDeliveryDate',
                  label: 'Последна доставка',
                  render: (q) => formatDate(q.lastDeliveryDate),
                },
                {
                  key: 'createdAt',
                  label: 'Създадено',
                  render: (q) => formatDate(q.createdAt),
                },
              ]}
              renderCardTitle={(q) => q.name}
              renderCardSubtitle={(q) => q.note || undefined}
              renderCardBadge={(q) => (
                <span className={`status-badge ${q.isActive ? 'active' : 'inactive'}`}>
                  {q.isActive ? 'Активно' : 'Неактивно'}
                </span>
              )}
              renderCardActions={(q) => (
                <>
                  {!isReadOnly && (
                    <>
                      <button
                        className="edit"
                        onClick={() => handleOpenEditDialog(q)}
                      >
                        ✏️ Редакция
                      </button>
                      <button
                        className={q.isActive ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(q.id, q.isActive)}
                      >
                        {q.isActive ? '⏸️ Деактивирай' : '▶️ Активирай'}
                      </button>
                      {isAdmin && (
                        <button className="danger" onClick={() => handleDeleteQuality(q)}>
                          🗑️ Изтрий
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            />
          </>
        )}
      </div>

      {/* New/Edit Dialog */}
      {isDialogOpen && (
        <div className="dialog-overlay" onClick={handleCloseDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">
                {editingQuality ? 'Редакция на качество' : 'Ново качество'}
              </h2>
              <button className="dialog-close-btn" onClick={handleCloseDialog}>
                ✕
              </button>
            </div>

            <div className="dialog-content">
              {formError && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label required">Име на качество</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: АУТЛЕТ JACK & JONES"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Бележка</label>
                <textarea
                  className="form-textarea"
                  placeholder="Кратко описание, доставчик, особености..."
                  value={formData.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Статус</label>
                <div className="toggle-wrapper">
                  <button
                    className={`toggle-btn ${formData.isActive ? 'active' : ''}`}
                    onClick={() => handleFormChange('isActive', !formData.isActive)}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                  <span className="toggle-label">
                    {formData.isActive ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
              </div>
            </div>

            <div className="dialog-footer">
              {editingQuality && isAdmin && (
                <button 
                  className="dialog-btn danger"
                  onClick={() => handleDeleteQuality(editingQuality)}
                  disabled={saving}
                >
                  🗑️ Изтрий
                </button>
              )}
              <div className="dialog-footer-right">
                <button className="dialog-btn secondary" onClick={handleCloseDialog} disabled={saving}>
                  Откажи
                </button>
                <button className="dialog-btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Запазване...' : 'Запази'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="dialog-overlay" onClick={handleCancelConfirm}>
          <div className="dialog confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">
                {confirmDialog.action === 'deactivate' ? 'Деактивиране на качество' : 'Активиране на качество'}
              </h2>
              <button className="dialog-close-btn" onClick={handleCancelConfirm}>
                ✕
              </button>
            </div>

            <div className="dialog-content">
              <div className="confirm-message">
                {confirmDialog.action === 'deactivate' ? (
                  <>
                    <span className="confirm-icon">⚠️</span>
                    <p>Сигурен ли си? Това качество няма да се показва при нови доставки.</p>
                  </>
                ) : (
                  <>
                    <span className="confirm-icon">✅</span>
                    <p>Качеството ще бъде активирано и ще се показва при нови доставки.</p>
                  </>
                )}
              </div>
            </div>

            <div className="dialog-footer">
              <button className="dialog-btn secondary" onClick={handleCancelConfirm}>
                Откажи
              </button>
              <button 
                className={`dialog-btn ${confirmDialog.action === 'deactivate' ? 'warning' : 'primary'}`}
                onClick={handleConfirmToggle}
              >
                {confirmDialog.action === 'deactivate' ? 'Деактивирай' : 'Активирай'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <ImportQualitiesDialog
        isOpen={isImportDialogOpen}
        onClose={handleCloseImportDialog}
        onImport={handleImportQualities}
        existingNames={existingQualityNames}
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
    </div>
  );
};
