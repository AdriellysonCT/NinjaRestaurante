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

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="ninja-card w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <XIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-card-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
};