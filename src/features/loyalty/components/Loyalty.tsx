import { useState } from 'react';
import { TiersConfig } from './TiersConfig';
import { VoucherRulesConfig } from './VoucherRulesConfig';
import { VouchersList } from './VouchersList';
import { useLoyaltyConfig } from '../hooks/useLoyaltyConfig';
import { useVouchers } from '../hooks/useVouchers';
import { useAuth } from '../../../shared/context/AuthContext';
import { Toast } from '../../../shared/components/Toast';
import type { LoyaltySection, TierFormData, VoucherRuleFormData } from '../types';
import './Loyalty.css';

export const Loyalty = () => {
  const { isReadOnly, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<LoyaltySection>('tiers');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const config = useLoyaltyConfig();
  const vouchersData = useVouchers();

  const showToast = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, variant });
  };

  if (config.loading && vouchersData.loading) {
    return <div className="loyalty__loading">Зареждане на програмата за лоялност...</div>;
  }

  return (
    <div className="loyalty">
      <div className="loyalty__header">
        <h1 className="loyalty__title">Програма за лоялност</h1>
      </div>

      {/* Section tabs */}
      <div className="loyalty__tabs">
        <button
          type="button"
          className={`loyalty__tab ${activeSection === 'tiers' ? 'loyalty__tab--active' : ''}`}
          onClick={() => setActiveSection('tiers')}
        >
          🏆 Нива
        </button>
        <button
          type="button"
          className={`loyalty__tab ${activeSection === 'voucher-rules' ? 'loyalty__tab--active' : ''}`}
          onClick={() => setActiveSection('voucher-rules')}
        >
          🎟️ Правила за ваучери
        </button>
        <button
          type="button"
          className={`loyalty__tab ${activeSection === 'vouchers' ? 'loyalty__tab--active' : ''}`}
          onClick={() => setActiveSection('vouchers')}
        >
          📋 Издадени ваучери ({vouchersData.stats.issued})
        </button>
      </div>

      {/* Section content */}
      <div className="loyalty__section">
        {activeSection === 'tiers' && (
          <TiersConfig
            tiers={config.tiers}
            loading={config.loading}
            isReadOnly={isReadOnly}
            isAdmin={isAdmin}
            onCreateTier={async (data: TierFormData) => {
              const ok = await config.createTier(data);
              if (ok) showToast('Нивото е създадено успешно.');
              else showToast(config.error || 'Грешка при създаване.', 'error');
              return ok;
            }}
            onUpdateTier={async (id: number, data: Partial<TierFormData>) => {
              const ok = await config.updateTier(id, data);
              if (ok) showToast('Нивото е обновено.');
              else showToast(config.error || 'Грешка при обновяване.', 'error');
              return ok;
            }}
            onDeleteTier={async (id: number) => {
              const ok = await config.deleteTier(id);
              if (ok) showToast('Нивото е изтрито.');
              else showToast(config.error || 'Грешка при изтриване.', 'error');
              return ok;
            }}
          />
        )}

        {activeSection === 'voucher-rules' && (
          <VoucherRulesConfig
            rules={config.voucherRules}
            loading={config.loading}
            isReadOnly={isReadOnly}
            isAdmin={isAdmin}
            onCreateRule={async (data: VoucherRuleFormData) => {
              const ok = await config.createRule(data);
              if (ok) showToast('Правилото за ваучер е създадено.');
              else showToast(config.error || 'Грешка при създаване.', 'error');
              return ok;
            }}
            onUpdateRule={async (id: number, data: Partial<VoucherRuleFormData>) => {
              const ok = await config.updateRule(id, data);
              if (ok) showToast('Правилото е обновено.');
              else showToast(config.error || 'Грешка при обновяване.', 'error');
              return ok;
            }}
            onDeleteRule={async (id: number) => {
              const ok = await config.deleteRule(id);
              if (ok) showToast('Правилото е изтрито.');
              else showToast(config.error || 'Грешка при изтриване.', 'error');
              return ok;
            }}
          />
        )}

        {activeSection === 'vouchers' && (
          <VouchersList
            vouchers={vouchersData.vouchers}
            loading={vouchersData.loading}
            filters={vouchersData.filters}
            stats={vouchersData.stats}
            onUpdateFilters={vouchersData.updateFilters}
            onRefresh={vouchersData.refreshVouchers}
          />
        )}
      </div>

      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
