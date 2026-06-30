import React, { useState } from 'react';
import './InputField.css';

interface InputFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, type = 'text', placeholder, value, onChange, required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="input-field">
      <label className="input-label">{label}{required && <span className="input-required">*</span>}</label>
      <div className="input-wrapper">
        <input type={inputType} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="input-element" />
        {type === 'password' && (
          <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
};
