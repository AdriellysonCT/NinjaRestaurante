import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { logger } from '../utils/logger';

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

const PauseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const PlayIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const LogOutIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TruckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="12" height="13" rx="2" />
    <path d="M13 8h5l4 4v4h-3" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const AlertCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const ShareIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CopyIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const ExternalLinkIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const QRCodeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M3 12h.01" />
    <path d="M12 3h.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h1" />
    <path d="M21 12v.01" />
    <path d="M12 21v-1" />
  </svg>
);

// Componente de QR Code simples usando canvas
const SimpleQRCode = ({ value, size = 160 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    // Usar a API pública do QR Server para gerar o QR Code
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      // Background branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      // Desenhar o QR code
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=000000&margin=8`;
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      style={{ width: size, height: size, borderRadius: 12, border: '1px solid #e5e7eb' }}
    />
  );
};

// Modal de Compartilhamento de Link
const ShareLinkModal = ({ isOpen, onClose, restaurante, userId }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'qrcode'
  const modalRef = useRef(null);

  // Gerar URL do cardápio digital baseado no ID do restaurante
  const menuUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    const restaurantId = restaurante?.id || userId;
    return `${baseUrl}/cardapio/${restaurantId}`;
  }, [restaurante, userId]);

  const restaurantName = restaurante?.nome_fantasia || 'Meu Restaurante';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para browsers mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = menuUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🍽️ Confira o cardápio do *${restaurantName}*!\n\n📱 Acesse pelo link:\n${menuUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenMenu = () => {
    window.open(menuUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        style={{ animation: 'shareModalIn 0.3s ease-out' }}
      >
        {/* Header do Modal */}
        <div 
          className="relative px-6 pt-6 pb-4 text-center"
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary) / 0.8) 100%)',
          }}
        >
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <XIcon className="w-4 h-4 text-white" />
          </button>

          {/* Ícone de compartilhamento */}
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)' }}>
            <ShareIcon className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">
            Compartilhe seu Cardápio
          </h2>
          <p className="text-xs text-white/80">
            Envie o link do seu cardápio digital para seus clientes
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'link' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            Link
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'qrcode' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QRCodeIcon className="w-3.5 h-3.5" />
            QR Code
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {activeTab === 'link' ? (
            <>
              {/* Nome do restaurante */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {restaurantName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">{restaurantName}</p>
                  <p className="text-[10px] text-muted-foreground">Cardápio Digital</p>
                </div>
              </div>

              {/* Campo do Link */}
              <div className="flex items-center gap-2 p-2.5 bg-secondary/50 rounded-lg border border-border mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {menuUrl}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Enviar link
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* Abrir cardápio */}
              <button
                onClick={handleOpenMenu}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                Abrir cardápio em nova aba
              </button>
            </>
          ) : (
            /* QR Code Tab */
            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-4 text-center">
                Seus clientes podem escanear este QR Code para acessar o cardápio
              </p>
              
              <div className="p-4 bg-white rounded-xl shadow-sm mb-4">
                <SimpleQRCode value={menuUrl} size={180} />
              </div>

              <p className="text-[10px] text-muted-foreground text-center mb-3 font-mono">
                {menuUrl}
              </p>

              {/* Botão de copiar abaixo do QR */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Imprima o QR Code e coloque na mesa, no balcão ou na vitrine!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shareModalIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pedidos': 'Pedidos',
  '/pdv': 'PDV Balcão',
  '/mesas': 'Pedidos Mesa',
  '/agendados': 'Agendados',
  '/cardapio': 'Cardápio',
  '/complementos': 'Complementos',
  '/cupons': 'Cupons',
  '/financeiro': 'Financeiro',
  '/configuracoes': 'Configurações',
  '/comanda-demo': 'Demo Comanda',
  '/teste-comanda': 'Teste Comanda',
};

export const Header = ({ toggleTheme, theme }) => {
  const { logout, user, restaurante, atualizarDadosRestaurante } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEndDayConfirm, setShowEndDayConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPause, setIsUpdatingPause] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Status ativo e pausado do restaurante
  const isOnline = restaurante?.ativo || false;
  const isPaused = restaurante?.pausado || false;
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const { orders } = useAppContext() || { orders: [] };

  // Gerar notificações baseadas nos pedidos
  useEffect(() => {
    const generateNotifications = () => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const newNotifications = [];

      // Novos pedidos (últimos 5 minutos)
      const recentOrders = orders.filter(order => {
        const orderTime = new Date(order.created_at || order.timestamp).getTime();
        return (now - orderTime) < fiveMinutes && order.status === 'disponivel';
      });

      recentOrders.forEach(order => {
        newNotifications.push({
          id: `new-${order.id}`,
          type: 'new_order',
          title: 'Novo Pedido!',
          message: `Pedido #${order.numero_pedido} - ${order.customerName}`,
          timestamp: order.created_at || order.timestamp,
          icon: 'bell',
          read: false
        });
      });

      // Pedidos aceitos recentemente
      const acceptedOrders = orders.filter(order => {
        const startTime = order.started_at ? new Date(order.started_at).getTime() : null;
        return startTime && (now - startTime) < fiveMinutes && order.status === 'aceito';
      });

      acceptedOrders.forEach(order => {
        newNotifications.push({
          id: `accepted-${order.id}`,
          type: 'order_accepted',
          title: 'Pedido Aceito',
          message: `Pedido #${order.numero_pedido} em preparo`,
          timestamp: order.started_at,
          icon: 'check',
          read: false
        });
      });

      // Pedidos prontos para entrega
      const readyOrders = orders.filter(order => order.status === 'pronto_para_entrega');
      readyOrders.forEach(order => {
        newNotifications.push({
          id: `ready-${order.id}`,
          type: 'order_ready',
          title: 'Pedido Pronto!',
          message: `Pedido #${order.numero_pedido} aguardando entregador`,
          timestamp: order.updated_at || order.created_at,
          icon: 'truck',
          read: false
        });
      });

      // Ordenar por mais recente
      newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Limitar a 20 notificações
      const limitedNotifications = newNotifications.slice(0, 20);
      
      setNotifications(limitedNotifications);
      setUnreadCount(limitedNotifications.filter(n => !n.read).length);
    };

    generateNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(generateNotifications, 30000);
    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setShowEndDayConfirm(false); // Fechar confirmação se clicar fora
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
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

  const handleToggleStatus = async () => {
    if (isUpdatingStatus || !user) return;
    
    try {
      setIsUpdatingStatus(true);
      const novoStatus = !isOnline;
      
      console.log(`🔄 Alterando status para: ${novoStatus ? 'ABERTO' : 'FECHADO'}`);
      
      // Usar a função de atualização do contexto que já lida com o banco
      await atualizarDadosRestaurante({ ativo: novoStatus });
      
      logger.log(`✅ Restaurante agora está ${novoStatus ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('Erro ao alternar status do restaurante:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTogglePause = async () => {
    if (isUpdatingPause || !user) return;
    
    try {
      setIsUpdatingPause(true);
      const novoStatusPausa = !isPaused;
      
      console.log(`🔄 Alterando status de PAUSA para: ${novoStatusPausa ? 'PAUSADO' : 'ATIVO'}`);
      
      await atualizarDadosRestaurante({ pausado: novoStatusPausa });
      
      logger.log(`✅ Restaurante agora está ${novoStatusPausa ? 'PAUSADO' : 'RECEBENDO PEDIDOS'}`);
    } catch (error) {
      console.error('Erro ao alternar pausa do restaurante:', error);
    } finally {
      setIsUpdatingPause(false);
    }
  };

  const handleEndDay = async () => {
    try {
      console.log('🌙 Encerrando o dia...');
      setShowEndDayConfirm(false);
      
      // O logout já cuida de marcar o restaurante como offline (ativo = false)
      // Veja a função logout() no AuthContext
      await logout();
    } catch (error) {
      console.error('❌ Erro ao encerrar o dia:', error);
      // Mesmo com erro, tentar fazer logout
      await logout();
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <BellIcon className="w-5 h-5 text-orange-500" />;
      case 'order_accepted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'order_ready':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircleIcon className="w-5 h-5 text-gray-500" />;
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
      {title !== 'PDV Balcão' && <h1 className="text-xs font-bold text-card-foreground m-0 p-0">{title}</h1>}
      {title === 'PDV Balcão' && <div />} 

      <div className="flex items-center gap-4">
        {/* Toggle de Status Online/Offline */}
        <div className="flex items-center">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
            className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all duration-300 ${
              isOnline 
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            } border ${isOnline ? 'border-green-500/50' : 'border-border'}`}
            title={isOnline ? 'Clique para fechar o restaurante' : 'Clique para abrir o restaurante'}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              {isUpdatingStatus ? 'Aguarde...' : (isOnline ? 'Aberto' : 'Fechado')}
            </span>
          </button>
        </div>

        {/* Toggle de Pausa das Vendas */}
        {isOnline && (
          <div className="flex items-center">
            <button
              onClick={handleTogglePause}
              disabled={isUpdatingPause}
              className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all duration-300 ${
                isPaused 
                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/50 hover:bg-orange-500/20' 
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20'
              } border`}
              title={isPaused ? 'Clique para normalizar vendas' : 'Clique para pausar vendas temporariamente'}
            >
              {isUpdatingPause ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isPaused ? <PlayIcon className="w-3 h-3" /> : <PauseIcon className="w-3 h-3" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                {isUpdatingPause ? '...' : (isPaused ? 'Retomar Vendas' : 'Pausar Vendas')}
              </span>
            </button>
          </div>
        )}

        {/* Botão Compartilhar Link */}
        <button 
          onClick={() => setShowShareModal(true)}
          className="text-muted-foreground hover:text-primary p-1 m-0 transition-all hover:scale-110"
          title="Compartilhar link do cardápio"
        >
          <ShareIcon className="w-5 h-5" />
        </button>

        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground p-1 m-0 transition-transform hover:scale-110">
          {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
        </button>
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1 m-0 transition-transform hover:scale-110"
          >
            <BellIcon className={`w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-all ${unreadCount > 0 ? 'animate-bounce' : ''}`}/>
            {unreadCount > 0 && (
              <>
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-destructive border border-card"></span>
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 bg-card rounded-md shadow-lg border border-border z-20 overflow-hidden">
              {/* Header do Dropdown */}
              <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-secondary/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-card-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-destructive text-[8px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-secondary"
                        title="Marcar todas como lidas"
                      >
                        Marcar lidas
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="p-1 hover:bg-secondary rounded transition-transform hover:scale-110"
                        title="Limpar todas"
                      >
                        <XIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Lista de Notificações */}
              <div className="overflow-y-auto max-h-80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <BellIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-500/5' : ''
                      }`}
                      onClick={() => {
                        // Marcar como lida ao clicar
                        setNotifications(prev => 
                          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                        );
                        setUnreadCount(prev => Math.max(0, prev - 1));
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-xs font-semibold text-card-foreground truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Footer (opcional) */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border bg-secondary/30">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/dashboard');
                    }}
                    className="text-[10px] text-blue-500 hover:text-blue-600 w-full text-center font-medium"
                  >
                    Ver Todos os Pedidos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={profileMenuRef}>
          <img 
            src="https://placehold.co/40x40/1a1a1a/ffffff?text=K" 
            alt="[Avatar do usuário]" 
            className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-orange-500"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-card rounded-md shadow-lg border border-border z-20">
              {!showEndDayConfirm ? (
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    Perfil do Usuário
                  </div>
                  
                  <button 
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary transition-colors"
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>Histórico de Atividades</span>
                  </button>
                  
                  <button 
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary transition-colors"
                  >
                    <MessageSquareIcon className="w-4 h-4 mr-2" />
                    <span>Mensagens</span>
                  </button>
                  
                  <button 
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-secondary transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    <span>Preferências</span>
                  </button>
                  
                  <div className="border-t border-border"></div>
                  
                  <button 
                    onClick={() => setShowEndDayConfirm(true)}
                    className="flex items-center w-full text-left px-4 py-2 text-xs text-orange-500 hover:bg-secondary transition-colors font-medium"
                  >
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    <span>Encerrar o Dia</span>
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-sm font-bold text-card-foreground mb-2">Encerrar o Dia?</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Isso irá marcar o estabelecimento como inativo e você será deslogado do sistema.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEndDayConfirm(false)}
                      className="flex-1 px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 text-card-foreground rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEndDay}
                      className="flex-1 px-3 py-2 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-semibold"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      <ShareLinkModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        restaurante={restaurante}
        userId={user?.id}
      />
    </header>
  );
};