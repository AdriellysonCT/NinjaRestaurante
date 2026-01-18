import React from 'react';

// Ícone definido diretamente - solução definitiva
const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// Debug logging
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 [MODAL] Modal.jsx carregado');
  console.log('🔧 [MODAL] XIcon definido:', typeof XIcon);
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  // Definir largura máxima baseada no tamanho
  const maxWidths = {
    sm: '400px',
    md: '550px',
    lg: '800px',
    xl: '1200px'
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/75 z-[999999] flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl p-5 w-full max-h-[85vh] overflow-y-auto relative shadow-2xl transition-all"
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
};