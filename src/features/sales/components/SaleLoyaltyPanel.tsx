import { useState, useEffect, useRef } from 'react';
import type { LoyaltyMode } from '../types';
import { useCustomerLoyalty } from '../../customers/hooks/useCustomerLoyalty';
import './SaleLoyaltyPanel.css';

interface EligibleVoucher {
  id: string;
  amount_eur: number;
  min_purchase_eur: number;
  expires_at: string;
  status: string;
}

interface SaleLoyaltyPanelProps {
  customerId?: string | null;
  regularSubtotalEur: number;
  promoSubtotalEur: number;
  loyaltyMode: LoyaltyMode;
  selectedVoucherId?: string | null;
  onLoyaltyChange: (mode: LoyaltyMode, voucherId?: string | null) => void;
}

function getTierBadgeClass(tierName: string): string {
  const name = tierName.toUpperCase();
  if (name === 'SILVER') return 'slp-tier--silver';
  if (name === 'GOLD') return 'slp-tier--gold';
  if (name === 'VIP') return 'slp-tier--vip';
  if (name === 'ELITE') return 'slp-tier--elite';
  return 'slp-tier--start';
}

export function SaleLoyaltyPanel({
  customerId,
  regularSubtotalEur,
  promoSubtotalEur,
  loyaltyMode,
  selectedVoucherId,
  onLoyaltyChange,
}: SaleLoyaltyPanelProps) {
  const { loyaltyInfo, loading } = useCustomerLoyalty(customerId || null);
  const [eligibleVouchers, setEligibleVouchers] = useState<EligibleVoucher[]>([]);
  const autoAppliedRef = useRef<string | null>(null);

  // Автоматично прилагане на tier отстъпка при зареждане на loyalty info
  useEffect(() => {
    if (!loyaltyInfo || loading) return;
    const tierPercent = loyaltyInfo.discount_percent || 0;
    // Auto-apply tier when loyalty loads (and not already in voucher mode)
    if (tierPercent > 0 && loyaltyMode === 'none' && autoAppliedRef.current !== customerId) {
      autoAppliedRef.current = customerId || null;
      onLoyaltyChange('tier');
    }
    // If customer has no discount, ensure mode stays 'none'
    if (tierPercent === 0 && loyaltyMode === 'tier') {
      onLoyaltyChange('none');
    }
  }, [loyaltyInfo, loading, loyaltyMode, customerId, onLoyaltyChange]);

  // Reset auto-apply ref when customer changes
  useEffect(() => {
    autoAppliedRef.current = null;
  }, [customerId]);

  // Филтър на валидни ваучери
  useEffect(() => {
    if (!loyaltyInfo?.active_vouchers) {
      setEligibleVouchers([]);
      return;
    }

    const eligible = loyaltyInfo.active_vouchers.filter((v) => {
      if (v.status !== 'issued') return false;
      const minPurchase = v.min_purchase_eur || 0;
      if (regularSubtotalEur < minPurchase) return false;
      return true;
    });

    setEligibleVouchers(eligible);

    // Ако текущо избрания ваучер вече не е валиден → tier (или none)
    if (loyaltyMode === 'voucher' && selectedVoucherId) {
      const isStillEligible = eligible.some((v) => v.id === selectedVoucherId);
      if (!isStillEligible) {
        const tierPercent = loyaltyInfo?.discount_percent || 0;
        onLoyaltyChange(tierPercent > 0 ? 'tier' : 'none');
      }
    }
  }, [loyaltyInfo, regularSubtotalEur, loyaltyMode, selectedVoucherId, onLoyaltyChange]);

  if (!customerId) return null;

  // Изчисления
  const tierDiscountPercent = loyaltyInfo?.discount_percent || 0;
  const tierDiscountAmountEur =
    loyaltyMode === 'tier' ? (regularSubtotalEur * tierDiscountPercent) / 100 : 0;

  const selectedVoucher = eligibleVouchers.find((v) => v.id === selectedVoucherId);
  const voucherAmountEur =
    loyaltyMode === 'voucher' && selectedVoucher ? selectedVoucher.amount_eur : 0;

  const totalBeforeDiscountEur = regularSubtotalEur + promoSubtotalEur;
  const totalDiscountEur = tierDiscountAmountEur + voucherAmountEur;
  const totalPaidEur = Math.max(0, totalBeforeDiscountEur - totalDiscountEur);

  const hasVouchers = eligibleVouchers.length > 0;
  const hasRegularLines = regularSubtotalEur > 0;
  const tierName = loyaltyInfo?.tier_name || '';
  const hasDiscount = totalDiscountEur > 0;

  // Ако няма лоялност (няма баркод) → не показвай панела
  if (!loading && !loyaltyInfo) return null;

  const handleToggleVoucher = () => {
    if (loyaltyMode === 'voucher') {
      // Откажи ваучер → върни се на tier (или none)
      onLoyaltyChange(tierDiscountPercent > 0 ? 'tier' : 'none');
    } else {
      // Активирай ваучер → избери първия
      const first = eligibleVouchers[0];
      onLoyaltyChange('voucher', first?.id || null);
    }
  };

  return (
    <div className="slp">
      {/* Ред 1: Tier инфо + ваучер бутон */}
      <div className="slp-bar">
        <div className="slp-tier-info">
          {loading ? (
            <span className="slp-loading">Зареждане...</span>
          ) : (
            <>
              <span className={`slp-tier-badge ${getTierBadgeClass(tierName)}`}>
                🏆 {tierName}
              </span>
              {tierDiscountPercent > 0 ? (
                <span className="slp-tier-discount">
                  {tierDiscountPercent.toFixed(0)}% отстъпка
                </span>
              ) : (
                <span className="slp-tier-no-discount">без отстъпка</span>
              )}
            </>
          )}
        </div>

        {hasVouchers && (
          <button
            type="button"
            className={`slp-voucher-btn ${loyaltyMode === 'voucher' ? 'active' : ''}`}
            onClick={handleToggleVoucher}
            disabled={!hasRegularLines}
            title={
              !hasRegularLines
                ? 'Добавете артикули на редовна цена за да използвате ваучер'
                : `${eligibleVouchers.length} налични ваучера`
            }
          >
            {loyaltyMode === 'voucher' ? '✕ Откажи ваучер' : '🎟️ Ваучер'}
          </button>
        )}
      </div>

      {/* Ред 2: Voucher dropdown (conditional) */}
      {loyaltyMode === 'voucher' && eligibleVouchers.length > 0 && (
        <div className="slp-voucher-row">
          <select
            className="slp-voucher-select"
            value={selectedVoucherId || ''}
            onChange={(e) => onLoyaltyChange('voucher', e.target.value || null)}
          >
            <option value="">-- Избери ваучер --</option>
            {eligibleVouchers.map((v) => (
              <option key={v.id} value={v.id}>
                €{v.amount_eur.toFixed(2)}
                {v.min_purchase_eur && v.min_purchase_eur > 0
                  ? ` (мин €${v.min_purchase_eur.toFixed(2)})`
                  : ''}
                {v.expires_at &&
                  ` · до ${new Date(v.expires_at).toLocaleDateString('bg-BG')}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ред 3: Компактен summary — само когато има отстъпка */}
      {hasDiscount && totalBeforeDiscountEur > 0 && (
        <div className="slp-summary">
          {loyaltyMode === 'tier' && tierDiscountAmountEur > 0 && (
            <span className="slp-summary-discount">
              −€{tierDiscountAmountEur.toFixed(2)} ({tierDiscountPercent.toFixed(0)}%)
            </span>
          )}
          {loyaltyMode === 'voucher' && voucherAmountEur > 0 && (
            <span className="slp-summary-discount">
              −€{voucherAmountEur.toFixed(2)} ваучер
            </span>
          )}
          <span className="slp-summary-total">
            ОБЩО: €{totalPaidEur.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
