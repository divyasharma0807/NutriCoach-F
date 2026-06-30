import React from 'react';
import './Button.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'green' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', fullWidth = false, disabled = false, onClick, children, type = 'button'
}) => {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, fullWidth ? 'btn-full' : '', disabled ? 'btn-disabled' : ''].filter(Boolean).join(' ');
  return <button type={type} className={classes} onClick={onClick} disabled={disabled}>{children}</button>;
};
