/**
 * Utilitário para lidar com Notificações Nativas do Navegador (Web Notifications API)
 */

export const notificationHelper = {
  /**
   * Solicita permissão ao usuário para enviar notificações
   * @returns {Promise<string>} 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop.');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return 'error';
    }
  },

  /**
   * Verifica se tem permissão concedida
   * @returns {boolean}
   */
  hasPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  /**
   * Envia uma notificação desktop
   * @param {string} title Título da notificação
   * @param {Object} options Opções (body, icon, tag, etc)
   */
  sendNotification(title, options = {}) {
    if (!this.hasPermission()) {
      return null;
    }

    // Configurações padrão
    const defaultOptions = {
      icon: '/logo-fome-ninja.png', 
      badge: '/logo-fome-ninja.png',
      silent: true, // Silencioso pois o sistema já toca som próprio
      tag: 'new-order', // Agrupa notificações similares
      renotify: true,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);

      // Foca na aba ao clicar
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        if (options.onClickAction) {
          options.onClickAction();
        }
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return null;
    }
  }
};
