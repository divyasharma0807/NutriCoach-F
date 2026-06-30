import React from 'react';
import './Toggle.css';

interface ToggleProps { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string; }

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description }) => (
  <div className="toggle-row">
    <div className="toggle-content">
      <span className="toggle-label">{label}</span>
      {description && <span className="toggle-description">{description}</span>}
    </div>
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  </div>
);
