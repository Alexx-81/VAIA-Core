import React from 'react';
import type { SettingsSection } from '../types';
import './SettingsSection.css';

interface SettingsSectionProps {
  id: SettingsSection;
  title: string;
  icon: string;
  description?: string;
  isExpanded: boolean;
  onToggle: (id: SettingsSection) => void;
  children: React.ReactNode;
  onSave?: () => void;
  hasChanges?: boolean;
}

export const SettingsSectionCard: React.FC<SettingsSectionProps> = ({
  id,
  title,
  icon,
  description,
  isExpanded,
  onToggle,
  children,
  onSave,
  hasChanges,
}) => {
  return (
    <div className={`settings-section ${isExpanded ? 'settings-section--expanded' : ''}`}>
      <button
        className="settings-section__header"
        onClick={() => onToggle(id)}
        aria-expanded={isExpanded}
      >
        <div className="settings-section__header-content">
          <span className="settings-section__icon">{icon}</span>
          <div className="settings-section__header-text">
            <h3 className="settings-section__title">{title}</h3>
            {description && <p className="settings-section__description">{description}</p>}
          </div>
        </div>
        <span className={`settings-section__chevron ${isExpanded ? 'rotated' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="settings-section__content">
          {children}
          
          {onSave && (
            <div className="settings-section__footer">
              <button
                className="settings-section__save-btn"
                onClick={onSave}
                disabled={!hasChanges}
              >
                💾 Запази
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper компоненти за форма

interface FormGroupProps {
  label: string;
  helper?: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, helper, children }) => (
  <div className="settings-form-group">
    <label className="settings-form-group__label">{label}</label>
    {children}
    {helper && <span className="settings-form-group__helper">{helper}</span>}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <label className="settings-toggle">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="settings-toggle__input"
    />
    <span className="settings-toggle__slider"></span>
    {label && <span className="settings-toggle__label">{label}</span>}
  </label>
);

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, disabled }) => (
  <select
    className="settings-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  value, 
  onChange, 
  type = 'text', 
  placeholder,
  disabled,
  readOnly,
}) => (
  <input
    type={type}
    className="settings-input"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    readOnly={readOnly}
  />
);

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  value, 
  onChange, 
  placeholder,
  rows = 3,
}) => (
  <textarea
    className="settings-textarea"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
  />
);
