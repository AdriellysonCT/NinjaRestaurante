import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Ícones inline simples
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const navItems = [
  { name: 'Pedidos', icon: DashboardIcon, path: '/dashboard' },
  { name: 'Info', icon: BellIcon, path: '/dashboard?tab=info' },
  { name: 'Ajustes', icon: SettingsIcon, path: '/configuracoes' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Verificar se está na tab "info"
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'pedidos';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;
          
          if (item.path === '/dashboard') {
            isActive = location.pathname === '/dashboard' && activeTab === 'pedidos';
          } else if (item.path === '/dashboard?tab=info') {
            isActive = location.pathname === '/dashboard' && activeTab === 'info';
          } else {
            isActive = location.pathname === item.path;
          }

          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.path.includes('?')) {
                  navigate(item.path);
                } else {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon />
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
