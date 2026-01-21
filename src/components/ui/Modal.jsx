import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Ícone definido diretamente - solução definitiva
const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const maxWidths = {
    sm: '400px',
    md: '550px',
    lg: '800px',
    xl: '1200px'
  };
  
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl p-6 w-full max-h-[90vh] overflow-y-auto relative shadow-2xl transition-all"
        style={{
          maxWidth: maxWidths[size] || maxWidths.md,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-bold text-card-foreground">{title}</h2>}
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary rounded-full"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};