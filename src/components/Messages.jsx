import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
const { MessageSquareIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon } = Icons;

export const Messages = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, system

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de mensagens
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockMessages = [
        {
          id: 1,
          type: 'system',
          title: 'Sistema Atualizado',
          message: 'O sistema foi atualizado com novas funcionalidades de controle de caixa.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: false,
          priority: 'info'
        },
        {
          id: 2,
          type: 'order',
          title: 'Novo Pedido Recebido',
          message: 'Pedido #1234 foi recebido e está aguardando confirmação.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: true,
          priority: 'normal'
        },
        {
          id: 3,
          type: 'alert',
          title: 'Estoque Baixo',
          message: 'O item "Hambúrguer Clássico" está com estoque baixo.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          read: false,
          priority: 'warning'
        },
        {
          id: 4,
          type: 'system',
          title: 'Backup Realizado',
          message: 'Backup automático dos dados foi realizado com sucesso.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          read: true,
          priority: 'success'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, read: true }))
    );
  };

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.read;
    if (filter === 'system') return msg.type === 'system';
    return true;
  });

  const unreadCount = messages.filter(msg => !msg.read).length;

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-success';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'warning':
        return <AlertCircleIcon className="w-4 h-4" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <MessageSquareIcon className="w-4 h-4" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mensagens ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}>
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md ${
                filter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs rounded-md ${
                filter === 'unread' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Não Lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-3 py-1 text-xs rounded-md ${
                filter === 'system' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Sistema
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary/80"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Lista de mensagens */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMessages.map(message => (
              <div 
                key={message.id} 
                className={`p-3 rounded-md border transition-colors ${
                  message.read 
                    ? 'bg-secondary/30 border-border' 
                    : 'bg-primary/10 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={getPriorityColor(message.priority)}>
                      {getPriorityIcon(message.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{message.title}</h4>
                        {!message.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{message.message}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <ClockIcon className="w-3 h-3" />
                        <span>{getRelativeTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!message.read && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Marcar como lida
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="text-xs text-destructive hover:text-destructive/80 ml-2"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquareIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>
                  {filter === 'unread' 
                    ? 'Nenhuma mensagem não lida.' 
                    : filter === 'system'
                      ? 'Nenhuma mensagem do sistema.'
                      : 'Nenhuma mensagem encontrada.'
                  }
                </p>
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

export default Messages;