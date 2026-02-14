import type { Customer } from '../../../lib/supabase/types';
import { useAuth } from '../../../shared/context/AuthContext';
import { DataCards } from '../../../shared/components/DataCards';
import { CustomerLoyaltyBadge } from './CustomerLoyaltyBadge';
import './CustomerTable.css';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const CustomerTable = ({
  customers,
  onEdit,
  onDelete,
}: CustomerTableProps) => {
  const { isReadOnly, isAdmin } = useAuth();

  if (customers.length === 0) {
    return (
      <div className="customer-table__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p>Няма намерени клиенти</p>
        <span>Опитайте с различни филтри или създайте нов клиент</span>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="customer-table__wrapper desktop-only">
        <table className="customer-table">
          <thead>
            <tr>
              <th className="customer-table__th-name">Име</th>
              <th className="customer-table__th-barcode">Баркод</th>
              <th className="customer-table__th-phone">Телефон</th>
              <th className="customer-table__th-email">Имейл</th>
              <th className="customer-table__th-company">Фирма</th>
              <th className="customer-table__th-gdpr">GDPR</th>
              <th className="customer-table__th-loyalty">Лоялност</th>
              <th className="customer-table__th-actions">Действия</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="customer-table__row"
                onClick={() => !isReadOnly && onEdit(customer)}
                style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
              >
                <td className="customer-table__td-name">
                  <span className="customer-table__name">{customer.name}</span>
                </td>
                <td className="customer-table__td-barcode">
                  <span className="customer-table__barcode">
                    {customer.barcode || '—'}
                  </span>
                </td>
                <td className="customer-table__td-phone">
                  {customer.phone || '—'}
                </td>
                <td className="customer-table__td-email">
                  {customer.email || '—'}
                </td>
                <td className="customer-table__td-company">
                  {customer.company_name || '—'}
                </td>
                <td className="customer-table__td-gdpr">
                  <span
                    className={`customer-table__gdpr ${
                      customer.gdpr_consent
                        ? 'customer-table__gdpr--yes'
                        : 'customer-table__gdpr--no'
                    }`}
                  >
                    {customer.gdpr_consent ? '✓ Да' : '✗ Не'}
                  </span>
                </td>
                <td className="customer-table__td-loyalty">
                  <CustomerLoyaltyBadge customerId={customer.id} compact={true} />
                </td>
                <td className="customer-table__td-actions" onClick={(e) => e.stopPropagation()}>
                  <div className="customer-table__actions">
                    {!isReadOnly && (
                      <>
                        <button
                          className="customer-table__action-btn customer-table__action-btn--edit"
                          onClick={() => onEdit(customer)}
                          title="Редакция"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          <span className="customer-table__action-label">Редактирай</span>
                        </button>
                        {isAdmin && onDelete && (
                          <button
                            className="customer-table__action-btn customer-table__action-btn--delete"
                            onClick={() => onDelete(customer)}
                            title="Изтрий"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span className="customer-table__action-label">Изтрий</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <DataCards
        data={customers}
        keyExtractor={(c) => c.id}
        onItemClick={(c) => !isReadOnly && onEdit(c)}
        fields={[
          {
            key: 'barcode',
            label: 'Баркод',
            render: (c) => c.barcode || '—',
          },
          {
            key: 'phone',
            label: 'Телефон',
            render: (c) => c.phone || '—',
          },
          {
            key: 'email',
            label: 'Имейл',
            render: (c) => c.email || '—',
          },
          {
            key: 'company_name',
            label: 'Фирма',
            render: (c) => c.company_name || '—',
          },
          {
            key: 'loyalty',
            label: 'Лоялност',
            render: (c) => <CustomerLoyaltyBadge customerId={c.id} compact={true} />,
          },
        ]}
        renderCardTitle={(c) => c.name}
        renderCardBadge={(c) => (
          <span
            className={`customer-table__gdpr ${
              c.gdpr_consent ? 'customer-table__gdpr--yes' : 'customer-table__gdpr--no'
            }`}
          >
            {c.gdpr_consent ? '✓ GDPR' : '✗ GDPR'}
          </span>
        )}
        renderCardActions={(c) => (
          <>
            {!isReadOnly && (
              <>
                <button className="edit" onClick={() => onEdit(c)}>
                  ✏️ Редакция
                </button>
                {isAdmin && onDelete && (
                  <button className="danger" onClick={() => onDelete(c)}>
                    🗑️ Изтрий
                  </button>
                )}
              </>
            )}
          </>
        )}
      />
    </>
  );
};
