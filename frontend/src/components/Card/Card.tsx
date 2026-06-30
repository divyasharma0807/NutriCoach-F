import React from 'react';
import './Card.css';

interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean; }

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
  const classes = ['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ');
  return <div className={classes} onClick={onClick}>{children}</div>;
};
