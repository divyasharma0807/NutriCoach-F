import React from 'react';
import { Button } from '../Button/Button';
import './EmptyState.css';

interface EmptyStateProps { icon: string; title: string; subtitle?: string; ctaLabel?: string; onCta?: () => void; }

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, ctaLabel, onCta }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h4 className="empty-state-title">{title}</h4>
    {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
    {ctaLabel && onCta && <Button variant="secondary" size="sm" onClick={onCta}>{ctaLabel}</Button>}
  </div>
);
