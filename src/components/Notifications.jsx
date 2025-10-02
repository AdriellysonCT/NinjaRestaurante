import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import * as Icons from "./icons/index.jsx";
const { BellIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon, XIcon, ClipboardListIcon, DollarSignIcon } = Icons;

export const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de notificações
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockNotifications = [
        {
          id: 1,
          type: "order",
          title: "Novo Pedido Recebido",
          message: "Pedido #1234 foi recebido e precisa de confirmação.",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min atrás
          read: false,
          priority: "high",
        },
        {
          id: 2,
          type: "cash",
          title: "Caixa Próximo do Limite",
          message: "O caixa atual tem R$ 850,00. Considere fazer uma sangria.",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
          read: false,
          priority: "medium",
        },
        {
          id: 3,
          type: "system",
          title: "Backup Concluído",
          message: "Backup automático dos dados foi realizado com sucesso.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
          read: true,
          priority: "low",
        },
        {
          id: 4,
          type: "inventory",
          title: "Estoque Baixo",
          message: "Hambúrguer Clássico está com apenas 3 unidades em estoque.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h atrás
          read: false,
          priority: "medium",
        },
        {
          id: 5,
          type: "order",
          title: "Pedido Cancelado",
          message: "Pedido #1230 foi cancelado pelo cliente.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
          read: true,
          priority: "low",
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? "s" : ""} atrás`;
  };

  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case "order":
        return <ClipboardListIcon className="w-4 h-4" />;
      case "cash":
        return <DollarSignIcon className="w-4 h-4" />;
      case "inventory":
        return <AlertCircleIcon className="w-4 h-4" />;
      case "system":
        return priority === "high" ? (
          <AlertCircleIcon className="w-4 h-4" />
        ) : (
          <CheckCircleIcon className="w-4 h-4" />
        );
      default:
        return <InfoIcon className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "text-destructive";
    if (priority === "medium") return "text-yellow-500";

    switch (type) {
      case "order":
        return "text-blue-500";
      case "cash":
        return "text-primary";
      case "system":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded">
            Alta
          </span>
        );
      case "medium":
        return (
          <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded">
            Média
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notificações ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
    >
      <div className="space-y-4">
        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-destructive hover:text-destructive/80"
            >
              Limpar todas
            </button>
          )}
        </div>

        {/* Lista de notificações */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-md border transition-colors ${
                  notification.read
                    ? "bg-secondary/30 border-border"
                    : "bg-primary/10 border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div
                      className={getNotificationColor(
                        notification.type,
                        notification.priority
                      )}
                    >
                      {getNotificationIcon(
                        notification.type,
                        notification.priority
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClockIcon className="w-3 h-3" />
                        <span>{getRelativeTime(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-primary hover:text-primary/80 px-2 py-1"
                      >
                        Marcar como lida
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação no momento.</p>
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

// Componente para mostrar o contador de notificações não lidas
export const NotificationBell = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(3); // Simulação

  return (
    <div className="relative">
      <BellIcon
        className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={onClick}
      />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-destructive border border-card"></span>
      )}
    </div>
  );
};

export default Notifications;
