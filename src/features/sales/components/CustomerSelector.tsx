import { useState, useMemo } from 'react';
import type { Customer } from '../../../lib/supabase/types';
import './CustomerSelector.css';

interface CustomerSelectorProps {
  selectedCustomerId: string | null;
  onSelect: (customerId: string | null) => void;
  customers: Customer[];
}

export function CustomerSelector({ selectedCustomerId, onSelect, customers }: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter customers by search term (name, company_name, barcode)
  // Only show results when there's a search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const search = searchTerm.toLowerCase().trim();
    return customers.filter(customer => {
      const name = customer.name?.toLowerCase() || '';
      const companyName = customer.company_name?.toLowerCase() || '';
      const barcode = customer.barcode?.toLowerCase() || '';
      
      return name.includes(search) || 
             companyName.includes(search) || 
             barcode.includes(search);
    });
  }, [customers, searchTerm]);

  // Format customer display text: "Name (Company)" or just "Name"
  const formatCustomerDisplay = (customer: Customer): string => {
    if (customer.company_name) {
      return `${customer.name} (${customer.company_name})`;
    }
    return customer.name;
  };

  // Find selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleClear = () => {
    setSearchTerm('');
    onSelect(null);
  };

  const handleSelectCustomer = (customerId: string | null) => {
    onSelect(customerId);
    setSearchTerm(''); // Close the filter after selection
  };

  return (
    <div className="customer-selector">
      <label className="customer-selector__label">
        Клиент (опционално)
      </label>
      
      <div className="customer-selector__controls">
        <input
          type="text"
          className="customer-selector__search"
          placeholder="Търсене по име, фирма или баркод..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {selectedCustomerId && (
          <button
            type="button"
            className="customer-selector__clear"
            onClick={handleClear}
            title="Изчисти избора"
          >
            ✕
          </button>
        )}
      </div>

      {searchTerm.trim() ? (
        <select
          className="customer-selector__select"
          value={selectedCustomerId || ''}
          onChange={(e) => handleSelectCustomer(e.target.value || null)}
          size={Math.min(filteredCustomers.length + 1, 8)}
        >
          <option value="">Без клиент</option>
          {filteredCustomers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {formatCustomerDisplay(customer)}
              {customer.barcode && customer.barcode.toLowerCase().includes(searchTerm.toLowerCase()) 
                ? ` [${customer.barcode}]` 
                : ''}
            </option>
          ))}
        </select>
      ) : (
        <div className="customer-selector__placeholder">
          Започнете да въвеждате име, фирма или баркод...
        </div>
      )}

      {selectedCustomer && (
        <div className="customer-selector__selected">
          <strong>Избран:</strong> {formatCustomerDisplay(selectedCustomer)}
          {selectedCustomer.barcode && (
            <span className="customer-selector__barcode"> • Баркод: {selectedCustomer.barcode}</span>
          )}
        </div>
      )}
      
      {searchTerm && filteredCustomers.length === 0 && (
        <div className="customer-selector__no-results">
          Няма намерени клиенти
        </div>
      )}
    </div>
  );
}
