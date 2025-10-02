import React from 'react';

// Teste sem importar XIcon primeiro
export const ModalSimple = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="ninja-card w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-card-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
};