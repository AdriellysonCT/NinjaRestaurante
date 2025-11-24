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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.25rem',
          width: '100%',
          maxWidth: maxWidths[size] || maxWidths.md,
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #2d2d2d'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '0.25rem',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.color = '#ffffff'}
          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
        >
          <XIcon className="w-5 h-5" />
        </button>
        {title && <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>}
        {children}
      </div>
    </div>
  );
};