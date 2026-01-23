export const whatsappMessages = {
  orderUpdate: (customerName, orderNumber, status) => 
    `Olá ${customerName}, seu pedido #${orderNumber} foi atualizado para: *${status}*.`,
  
  orderReady: (customerName, orderNumber) =>
    `Olá ${customerName}, seu pedido #${orderNumber} está pronto para entrega/retirada! 🛵`,
    
  generalContact: (customerName, orderNumber) =>
    `Olá ${customerName}, estamos entrando em contato sobre o pedido #${orderNumber}.`
};
