/**
 * Utilitários para mensagens do WhatsApp
 */

// Interface básica para o objeto order, expandindo conforme necessário
interface Order {
  numero_pedido?: string | number;
  id?: string;
  nome_cliente?: string;
  customerName?: string;
  [key: string]: any;
}

export const whatsappMessages = {
  /**
   * Formata uma mensagem para o cliente sobre o status do pedido
   * @param order - O objeto do pedido
   * @param status - O novo status do pedido
   * @returns A mensagem formatada
   */
  getStatusBarMessage: (order: Order, status: string): string => {
    const orderNumber = order.numero_pedido || order.id?.substring(0, 8) || 'N/A';
    const customerName = order.nome_cliente || order.customerName || 'Cliente';
    
    switch (status) {
      case 'aceito':
        return `Olá ${customerName}! seu pedido #${orderNumber} foi aceito e já está em preparação. 🚀`;
      case 'em_preparo':
        return `Olá ${customerName}! seu pedido #${orderNumber} está sendo preparado com muito carinho. 🍳`;
      case 'pronto':
        return `Boas notícias, ${customerName}! Seu pedido #${orderNumber} já está pronto e aguardando a retirada/saída para entrega. ✅`;
      case 'saiu_para_entrega':
        return `Olá ${customerName}! Seu pedido #${orderNumber} acabou de sair para entrega. O entregador chegará em breve! 🛵`;
      case 'concluido':
        return `Olá ${customerName}! Seu pedido #${orderNumber} foi entregue. Esperamos que goste! Bom apetite! 😋`;
      default:
        return `Olá ${customerName}! Estamos atualizando o status do seu pedido #${orderNumber}.`;
    }
  },

  /**
   * Abre o WhatsApp com uma mensagem pré-definida
   * @param phone - Número de telefone formatado
   * @param message - Mensagem a ser enviada
   */
  openWhatsApp: (phone: string, message: string): void => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodedMessage}`, '_blank');
  }
};

export default whatsappMessages;
