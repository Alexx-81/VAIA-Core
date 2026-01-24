import { useState, useMemo, useCallback } from 'react';
import { DataCards } from '../../../shared/components/DataCards';
import { ImportQualitiesDialog } from './ImportQualitiesDialog';
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

// Mock data for deliveries (to calculate stats)
const mockDeliveries: { id: number; qualityId: number; date: Date }[] = [];

// Initial mock qualities - mutable array for persistence
let initialQualities: Quality[] = [];

// Helper functions
const formatDate = (date: Date | null): string => {
  if (!date) return '—';
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const calculateQualityStats = (quality: Quality, deliveries: typeof mockDeliveries): QualityWithStats => {
  const qualityDeliveries = deliveries.filter(d => d.qualityId === quality.id);
  const deliveriesCount = qualityDeliveries.length;
  const lastDeliveryDate = qualityDeliveries.length > 0
    ? new Date(Math.max(...qualityDeliveries.map(d => d.date.getTime())))
    : null;
  
  return {
    ...quality,
    deliveriesCount,
    lastDeliveryDate,
  };
};

export const Qualities = () => {
  // State - инициализираме от текущото състояние на initialQualities
  const [qualities, setQualities] = useState<Quality[]>(() => [...initialQualities]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuality, setEditingQuality] = useState<Quality | null>(null);
  const [formData, setFormData] = useState<QualityFormData>({ name: '', note: '', isActive: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; qualityId: number | null; action: 'deactivate' | 'activate' }>({
    isOpen: false,
    qualityId: null,
    action: 'deactivate',
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Computed values
  const qualitiesWithStats = useMemo(() => {
    return qualities.map(q => calculateQualityStats(q, mockDeliveries));
  }, [qualities]);

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

  const handleSave = useCallback(() => {
    if (!validateForm()) return;
    
    const trimmedName = formData.name.trim();
    const trimmedNote = formData.note.trim();
    
    if (editingQuality) {
      // Update existing quality
      setQualities(prev => prev.map(q => 
        q.id === editingQuality.id 
          ? { ...q, name: trimmedName, note: trimmedNote, isActive: formData.isActive }
          : q
      ));
      // Мутираме initialQualities за persistence
      const idx = initialQualities.findIndex(q => q.id === editingQuality.id);
      if (idx !== -1) {
        initialQualities[idx] = { ...initialQualities[idx], name: trimmedName, note: trimmedNote, isActive: formData.isActive };
      }
    } else {
      // Create new quality
      const newId = Math.max(...qualities.map(q => q.id), 0) + 1;
      const newQuality: Quality = {
        id: newId,
        name: trimmedName,
        note: trimmedNote,
        isActive: formData.isActive,
        createdAt: new Date(),
      };
      setQualities(prev => [...prev, newQuality]);
      // Мутираме initialQualities за persistence
      initialQualities.push(newQuality);
    }
    
    handleCloseDialog();
  }, [formData, editingQuality, qualities, validateForm, handleCloseDialog]);

  const handleToggleStatus = useCallback((qualityId: number, currentStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      qualityId,
      action: currentStatus ? 'deactivate' : 'activate',
    });
  }, []);

  const handleConfirmToggle = useCallback(() => {
    if (confirmDialog.qualityId === null) return;
    
    setQualities(prev => prev.map(q => 
      q.id === confirmDialog.qualityId 
        ? { ...q, isActive: !q.isActive }
        : q
    ));
    
    // Мутираме initialQualities за persistence
    const idx = initialQualities.findIndex(q => q.id === confirmDialog.qualityId);
    if (idx !== -1) {
      initialQualities[idx] = { ...initialQualities[idx], isActive: !initialQualities[idx].isActive };
    }
    
    setConfirmDialog({ isOpen: false, qualityId: null, action: 'deactivate' });
  }, [confirmDialog.qualityId]);

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

  const handleImportQualities = useCallback((names: string[]) => {
    const startId = Math.max(...qualities.map(q => q.id), 0) + 1;
    const newQualities: Quality[] = names.map((name, index) => ({
      id: startId + index,
      name,
      note: '',
      isActive: true,
      createdAt: new Date(),
    }));
    setQualities(prev => [...prev, ...newQualities]);
    // Мутираме initialQualities за persistence при навигация
    initialQualities.push(...newQualities);
  }, [qualities]);

  const existingQualityNames = useMemo(() => {
    return qualities.map(q => q.name);
  }, [qualities]);

  const getStatusFilterLabel = (status: StatusFilter): string => {
    const labels: Record<StatusFilter, string> = {
      all: 'Всички',
      active: 'Активни',
      inactive: 'Неактивни',
    };
    return labels[status];
  };

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
          <button className="action-btn secondary" onClick={handleOpenImportDialog}>
            <span className="btn-icon">📥</span>
            Импорт
          </button>
          <button className="action-btn primary" onClick={handleOpenNewDialog}>
            <span className="btn-icon">+</span>
            Ново качество
          </button>
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
                <button className="action-btn primary" onClick={handleOpenNewDialog}>
                  <span className="btn-icon">+</span>
                  Ново качество
                </button>
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
                          onClick={() => handleOpenEditDialog(quality)}
                          title="Редактирай"
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
              onItemClick={(q) => handleOpenEditDialog(q)}
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
              <button className="dialog-btn secondary" onClick={handleCloseDialog}>
                Откажи
              </button>
              <button className="dialog-btn primary" onClick={handleSave}>
                Запази
              </button>
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
    </div>
  );
};
