import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
const { ClockIcon, UserIcon, ActivityIcon } = Icons;

export const ActivityHistory = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadActivityHistory();
    }
  }, [isOpen]);

  const loadActivityHistory = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de histórico de atividades
      // Em um ambiente real, isso viria de uma API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActivities = [
        {
          id: 1,
          type: 'login',
          description: 'Login realizado',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
          icon: 'user'
        },
        {
          id: 2,
          type: 'order',
          description: 'Pedido #1234 aceito',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min atrás
          icon: 'activity'
        },
        {
          id: 3,
          type: 'cash',
          description: 'Caixa aberto com R$ 100,00',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
          icon: 'activity'
        },
        {
          id: 4,
          type: 'menu',
          description: 'Item do cardápio atualizado',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h atrás
          icon: 'activity'
        },
        {
          id: 5,
          type: 'settings',
          description: 'Configurações alteradas',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
          icon: 'activity'
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login':
        return 'text-success';
      case 'cash':
        return 'text-primary';
      case 'order':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Atividades">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-secondary/50">
                <div className={`${getActivityColor(activity.type)} mt-0.5`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{getRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma atividade recente encontrada.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end pt-4 border-t border-border">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActivityHistory;