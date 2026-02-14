import { useCustomerLoyalty } from '../hooks/useCustomerLoyalty';
import './CustomerLoyaltyBadge.css';

interface CustomerLoyaltyBadgeProps {
  customerId: string;
  compact?: boolean;
}

interface CustomerLoyaltySectionProps {
  customerId: string;
}

function getTierBadgeClass(tierName: string): string {
  const name = tierName.toUpperCase();
  if (name === 'START') return 'customer-loyalty-badge--start';
  if (name === 'SILVER') return 'customer-loyalty-badge--silver';
  if (name === 'GOLD') return 'customer-loyalty-badge--gold';
  if (name === 'VIP') return 'customer-loyalty-badge--vip';
  if (name === 'ELITE') return 'customer-loyalty-badge--elite';
  return 'customer-loyalty-badge--start';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Compact badge for table cells
export const CustomerLoyaltyBadge = ({ customerId, compact = true }: CustomerLoyaltyBadgeProps) => {
  const { loyaltyInfo, loading } = useCustomerLoyalty(customerId);

  if (loading) {
    return <span className="customer-loyalty-badge customer-loyalty-badge--compact customer-loyalty-badge--loading">⏳</span>;
  }

  // If no loyalty info, customer doesn't participate (no barcode)
  if (!loyaltyInfo) {
    return (
      <span 
        className="customer-loyalty-badge customer-loyalty-badge--compact customer-loyalty-badge--inactive"
        title="Клиентът не участва в програмата за лоялност (няма баркод)"
      >
        —
      </span>
    );
  }

  const tierClass = getTierBadgeClass(loyaltyInfo.tier_name);

  return (
    <div className={`customer-loyalty-badge ${tierClass} ${compact ? 'customer-loyalty-badge--compact' : ''}`}>
      <span className="customer-loyalty-badge__icon">🏆</span>
      <span className="customer-loyalty-badge__text">{loyaltyInfo.tier_name}</span>
    </div>
  );
};

// Full loyalty section for dialog
export const CustomerLoyaltySection = ({ customerId }: CustomerLoyaltySectionProps) => {
  const { loyaltyInfo, vouchers, loading, error, refresh } = useCustomerLoyalty(customerId);

  if (loading) {
    return (
      <div className="customer-loyalty-section">
        <div className="customer-loyalty-section__loading">Зареждане на лоялна информация...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-loyalty-section">
        <div className="customer-loyalty-section__error">{error}</div>
      </div>
    );
  }

  // If no loyalty info, customer doesn't participate (no barcode)
  if (!loyaltyInfo) {
    return (
      <div className="customer-loyalty-section">
        <div className="customer-loyalty-section__no-barcode">
          <div className="customer-loyalty-section__no-barcode-icon">ℹ️</div>
          <h4 className="customer-loyalty-section__no-barcode-title">
            Клиентът не участва в програмата за лоялност
          </h4>
          <p className="customer-loyalty-section__no-barcode-text">
            За да участва в програмата за лоялност, клиентът трябва да има баркод.
            Моля, добавете баркод в основните данни на клиента.
          </p>
          <p className="customer-loyalty-section__no-barcode-hint">
            💡 След добавяне на баркод, клиентът автоматично ще бъде включен в програмата
            за лоялност с начално ниво.
          </p>
        </div>
      </div>
    );
  }

  const tierClass = getTierBadgeClass(loyaltyInfo.tier_name);
  const progressPercent = loyaltyInfo.progress_to_next_tier
    ? Math.min(100, (loyaltyInfo.turnover_12m_eur / (loyaltyInfo.turnover_12m_eur + loyaltyInfo.progress_to_next_tier)) * 100)
    : 100;

  return (
    <div className="customer-loyalty-section">
      <div className="customer-loyalty-section__header">
        <h3 className="customer-loyalty-section__title">
          🏆 Програма за лоялност
        </h3>
        <button
          type="button"
          className="customer-loyalty-section__refresh"
          onClick={refresh}
          disabled={loading}
        >
          ↻ Обнови
        </button>
      </div>

      <div className="customer-loyalty-section__content">
        {/* Current tier */}
        <div className="customer-loyalty-card">
          <span className="customer-loyalty-card__label">Текущо ниво</span>
          <div className="customer-loyalty-card__value">
            <div className={`customer-loyalty-badge ${tierClass}`}>
              <span className="customer-loyalty-badge__icon">🏆</span>
              <span className="customer-loyalty-badge__text">{loyaltyInfo.tier_name}</span>
            </div>
          </div>
          {loyaltyInfo.discount_percent > 0 && (
            <div className="customer-loyalty-card__subtitle">
              Отстъпка: {loyaltyInfo.discount_percent}%
            </div>
          )}
        </div>

        {/* Turnover 12m */}
        <div className="customer-loyalty-card">
          <span className="customer-loyalty-card__label">Оборот 12 месеца</span>
          <div className="customer-loyalty-card__value customer-loyalty-card__value--eur">
            €{loyaltyInfo.turnover_12m_eur.toFixed(2)}
          </div>
        </div>

        {/* Active vouchers count */}
        <div className="customer-loyalty-card">
          <span className="customer-loyalty-card__label">Активни ваучери</span>
          <div className="customer-loyalty-card__value">
            {vouchers.length > 0 ? (
              <>
                🎟️ {vouchers.length} × €{vouchers.reduce((sum, v) => sum + v.amount_eur, 0).toFixed(2)}
              </>
            ) : (
              <span style={{ color: '#888', fontSize: '0.875rem' }}>Няма</span>
            )}
          </div>
        </div>

        {/* Progress to next tier */}
        {loyaltyInfo.next_tier_name && loyaltyInfo.progress_to_next_tier !== null && (
          <div className="customer-loyalty-progress">
            <span className="customer-loyalty-progress__label">
              Прогрес до {loyaltyInfo.next_tier_name}
            </span>
            <div className="customer-loyalty-progress__bar-container">
              <div
                className="customer-loyalty-progress__bar-fill"
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent > 20 && `${progressPercent.toFixed(0)}%`}
              </div>
            </div>
            <div className="customer-loyalty-progress__text">
              Остават €{loyaltyInfo.progress_to_next_tier.toFixed(2)} до {loyaltyInfo.next_tier_name}
            </div>
          </div>
        )}

        {loyaltyInfo.next_tier_name === null && (
          <div className="customer-loyalty-progress">
            <span className="customer-loyalty-progress__label">Максимално ниво постигнато</span>
            <div className="customer-loyalty-progress__bar-container">
              <div
                className="customer-loyalty-progress__bar-fill customer-loyalty-progress__bar-fill--complete"
                style={{ width: '100%' }}
              >
                100%
              </div>
            </div>
            <div className="customer-loyalty-progress__text">
              🎉 Поздравления! Достигнали сте най-високото ниво.
            </div>
          </div>
        )}

        {/* Vouchers list */}
        {vouchers.length > 0 && (
          <div className="customer-loyalty-vouchers">
            <span className="customer-loyalty-vouchers__label">Активни ваучери</span>
            <div className="customer-loyalty-vouchers__list">
              {vouchers.map(v => (
                <div key={v.id} className="customer-loyalty-voucher-item">
                  <span className="customer-loyalty-voucher-item__amount">€{v.amount_eur.toFixed(2)}</span>
                  <span className="customer-loyalty-voucher-item__expires">
                    до {formatDate(v.expires_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
