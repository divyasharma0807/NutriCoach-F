import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalProps { isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode; customWidth?: string; }

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, customWidth }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={customWidth ? { maxWidth: customWidth } : {}}>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};
