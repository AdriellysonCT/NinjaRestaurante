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
      className="fixed inset-0 bg-black/80 z-[999999] flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl p-5 w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{
          maxWidth: maxWidths[size] || maxWidths.md,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <XIcon className="w-5 h-5" />
        </button>
        {title && <h2 className="text-xl font-bold mb-4 text-card-foreground">{title}</h2>}
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};