import { useState, useEffect } from 'react';
import type { LoyaltyMode } from '../types';
import { CustomerLoyaltyBadge } from '../../customers/components/CustomerLoyaltyBadge';
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
  regularSubtotalEur: number; // Сума само от редове с isRegularPrice=true
  promoSubtotalEur: number; // Сума от редове с isRegularPrice=false
  loyaltyMode: LoyaltyMode;
  selectedVoucherId?: string | null;
  onLoyaltyChange: (mode: LoyaltyMode, voucherId?: string | null) => void;
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

  // Филтър на валидни ваучери
  useEffect(() => {
    if (!loyaltyInfo?.active_vouchers) {
      setEligibleVouchers([]);
      return;
    }

    const eligible = loyaltyInfo.active_vouchers.filter((v) => {
      // Само active (issued) ваучери
      if (v.status !== 'issued') return false;
      
      // Провери дали покрива минималната сума (ако имаме редовни редове)
      const minPurchase = v.min_purchase_eur || 0;
      if (regularSubtotalEur < minPurchase) return false;

      return true;
    });

    setEligibleVouchers(eligible);

    // Ако текущо избрания ваучер вече не е валиден → само 'none'
    if (loyaltyMode === 'voucher' && selectedVoucherId) {
      const isStillEligible = eligible.some((v) => v.id === selectedVoucherId);
      if (!isStillEligible) {
        onLoyaltyChange('none');
      }
    }
  }, [loyaltyInfo, regularSubtotalEur, loyaltyMode, selectedVoucherId, onLoyaltyChange]);

  // Ако няма клиент → скрий панела
  if (!customerId) {
    return null;
  }

  // Изчисли отстъпки и крайна сума
  const tierDiscountPercent = loyaltyInfo?.discount_percent || 0;
  const tierDiscountAmountEur =
    loyaltyMode === 'tier' ? (regularSubtotalEur * tierDiscountPercent) / 100 : 0;

  const selectedVoucher = eligibleVouchers.find((v) => v.id === selectedVoucherId);
  const voucherAmountEur =
    loyaltyMode === 'voucher' && selectedVoucher ? selectedVoucher.amount_eur : 0;

  const totalBeforeDiscountEur = regularSubtotalEur + promoSubtotalEur;
  const totalDiscountEur = tierDiscountAmountEur + voucherAmountEur;
  const totalPaidEur = Math.max(0, totalBeforeDiscountEur - totalDiscountEur);

  const canUseTier = tierDiscountPercent > 0 && regularSubtotalEur > 0;
  const canUseVoucher = eligibleVouchers.length > 0 && regularSubtotalEur > 0;

  return (
    <div className="sale-loyalty-panel">
      <div className="sale-loyalty-header">
        <h3>Лоялност</h3>
        {loading ? (
          <span className="sale-loyalty-loading">Зареждане...</span>
        ) : (
          customerId && <CustomerLoyaltyBadge customerId={customerId} />
        )}
      </div>

      {/* Radio бутони за избор на режим */}
      <div className="sale-loyalty-modes">
        <label className="sale-loyalty-radio">
          <input
            type="radio"
            name="loyaltyMode"
            value="none"
            checked={loyaltyMode === 'none'}
            onChange={() => onLoyaltyChange('none')}
          />
          <span>Без отстъпка</span>
        </label>

        <label
          className={`sale-loyalty-radio ${!canUseTier ? 'disabled' : ''}`}
          title={
            !canUseTier
              ? regularSubtotalEur === 0
                ? 'Няма редове на редовна цена'
                : 'Клиентът няма ниво с отстъпка'
              : undefined
          }
        >
          <input
            type="radio"
            name="loyaltyMode"
            value="tier"
            checked={loyaltyMode === 'tier'}
            onChange={() => onLoyaltyChange('tier')}
            disabled={!canUseTier}
          />
          <span>
            Ниво отстъпка{' '}
            <strong className="tier-discount-percent">
              {tierDiscountPercent.toFixed(0)}%
            </strong>
          </span>
        </label>

        <label
          className={`sale-loyalty-radio ${!canUseVoucher ? 'disabled' : ''}`}
          title={
            !canUseVoucher
              ? regularSubtotalEur === 0
                ? 'Няма редове на редовна цена'
                : 'Няма налични ваучери'
              : undefined
          }
        >
          <input
            type="radio"
            name="loyaltyMode"
            value="voucher"
            checked={loyaltyMode === 'voucher'}
            onChange={() => {
              // Автоматично избери първия валичен ваучер ако има
              const firstVoucher = eligibleVouchers[0];
              onLoyaltyChange('voucher', firstVoucher?.id || null);
            }}
            disabled={!canUseVoucher}
          />
          <span>Ваучер</span>
        </label>
      </div>

      {/* Dropdown за избор на ваучер (само ако режим = 'voucher') */}
      {loyaltyMode === 'voucher' && eligibleVouchers.length > 0 && (
        <div className="sale-loyalty-voucher-select">
          <label>
            Избери ваучер:
            <select
              value={selectedVoucherId || ''}
              onChange={(e) => onLoyaltyChange('voucher', e.target.value || null)}
            >
              <option value="">-- Избери --</option>
              {eligibleVouchers.map((v) => (
                <option key={v.id} value={v.id}>
                  €{v.amount_eur.toFixed(2)}
                  {v.min_purchase_eur && v.min_purchase_eur > 0
                    ? ` (мин €${v.min_purchase_eur.toFixed(2)})`
                    : ''}
                  {v.expires_at && ` - валиден до ${new Date(v.expires_at).toLocaleDateString('bg-BG')}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Обобщение на сумите */}
      <div className="sale-loyalty-summary">
        <div className="sale-loyalty-summary-row">
          <span>Редовна цена:</span>
          <span className="sale-loyalty-amount">€{regularSubtotalEur.toFixed(2)}</span>
        </div>
        {promoSubtotalEur > 0 && (
          <div className="sale-loyalty-summary-row secondary">
            <span>Промоция:</span>
            <span className="sale-loyalty-amount">€{promoSubtotalEur.toFixed(2)}</span>
          </div>
        )}
        <div className="sale-loyalty-summary-row secondary">
          <span>Междинна сума:</span>
          <span className="sale-loyalty-amount">€{totalBeforeDiscountEur.toFixed(2)}</span>
        </div>

        {loyaltyMode === 'tier' && tierDiscountAmountEur > 0 && (
          <div className="sale-loyalty-summary-row discount">
            <span>Отстъпка от ниво ({tierDiscountPercent.toFixed(0)}%):</span>
            <span className="sale-loyalty-amount">-€{tierDiscountAmountEur.toFixed(2)}</span>
          </div>
        )}

        {loyaltyMode === 'voucher' && voucherAmountEur > 0 && (
          <div className="sale-loyalty-summary-row discount">
            <span>Отстъпка от ваучер:</span>
            <span className="sale-loyalty-amount">-€{voucherAmountEur.toFixed(2)}</span>
          </div>
        )}

        <div className="sale-loyalty-summary-row total">
          <span>ОБЩО ЗА ПЛАЩАНЕ:</span>
          <span className="sale-loyalty-amount total">€{totalPaidEur.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
