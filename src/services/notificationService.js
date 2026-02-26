import { logger } from "../utils/logger";

const AGENT_URL = 'http://localhost:5001';

/**
 * Serviço para enviar notificações via Agente Local (NinjaTalk AI)
 */
export const notificationService = {
  /**
   * Envia uma notificação de mudança de status para o cliente
   * @param {Object} order Pedido completo
   * @param {string} status Novo status do pedido
   */
  notifyStatusChange: async (order, status) => {
    // Só envia se tiver telefone
    const phone = order.customerPhone || order.telefone_cliente;
    if (!phone || phone === 'Telefone não cadastrado') {
      logger.log('ℹ️ Notificação cancelada: Telefone não disponível.');
      return;
    }

    try {
      logger.log(`🤖 NinjaTalk: Solicitando notificação para ${order.customerName} - Status: ${status}`);
      
      const response = await fetch(`${AGENT_URL}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          customer_name: order.customerName,
          phone: phone
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o Agente Ninja');
      }

      logger.log('✅ Solicitação de notificação enviada com sucesso ao agente!');
      return true;
    } catch (error) {
      logger.log('❌ Erro ao enviar notificação via agente:', error.message);
      return false;
    }
  }
};
