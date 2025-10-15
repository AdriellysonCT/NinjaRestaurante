import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Ícones definidos diretamente - solução definitiva
const SunIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m4.93 19.07 1.41-1.41" />
    <path d="m17.66 6.34 1.41-1.41" />
  </svg>
);

const MoonIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const BellIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MessageSquareIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SettingsIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PowerOffIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
    <path d="M12 2v10" />
  </svg>
);

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pedidos': 'Pedidos',
  '/pdv': 'PDV Balcão',
  '/mesas': 'Pedidos Mesa',
  '/agendados': 'Agendados',
  '/cardapio': 'Cardápio',
  '/financeiro': 'Financeiro',
  '/configuracoes': 'Configurações',
  '/comanda-demo': 'Demo Comanda',
  '/teste-comanda': 'Teste Comanda',
};

export const Header = ({ toggleTheme, theme }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  };

  const getTitle = (pathname) => {
    if (pathname.startsWith('/pedidos/')) {
      return 'Detalhes do Pedido';
    }
    return pageTitles[pathname] || 'Dashboard';
  };

  const title = getTitle(location.pathname);

  return (
    <header className="h-8 min-h-[32px] max-h-[32px] py-0 flex items-center justify-between px-3 border-b border-border bg-card sticky top-0 z-10">
      <h1 className="text-xs font-bold text-card-foreground m-0 p-0">{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground p-0 m-0">
          {theme === 'dark' ? <SunIcon className="w-4 h-4"/> : <MoonIcon className="w-4 h-4"/>}
        </button>
        <div className="relative">
          <BellIcon className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"/>
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-destructive border border-card"></span>
        </div>
        <div className="relative" ref={profileMenuRef}>
          <img 
            src="https://placehold.co/40x40/1a1a1a/ffffff?text=K" 
            alt="[Avatar do usuário]" 
            className="w-5 h-5 rounded-full cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-lg border border-border z-20">
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  Perfil do Usuário
                </div>
                
                <button 
                  onClick={() => alert('Funcionalidade em desenvolvimento')}
                  className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary"
                >
                  <ClockIcon className="w-3 h-3 mr-2" />
                  <span>Histórico de Atividades</span>
                </button>
                
                <button 
                  onClick={() => alert('Funcionalidade em desenvolvimento')}
                  className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary"
                >
                  <MessageSquareIcon className="w-3 h-3 mr-2" />
                  <span>Mensagens</span>
                </button>
                
                <button 
                  onClick={() => alert('Funcionalidade em desenvolvimento')}
                  className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary"
                >
                  <SettingsIcon className="w-3 h-3 mr-2" />
                  <span>Preferências</span>
                </button>
                
                <div className="border-t border-border"></div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-xs text-destructive hover:bg-secondary"
                >
                  <PowerOffIcon className="w-3 h-3 mr-2" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};