export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  
  const numericOnly = phone.replace(/\D/g, '');
  
  // Se não tiver ao menos 10 dígitos (DDD + número), é inválido para zap normal
  if (numericOnly.length < 10) return null;
  
  // Se já começar com 55 e tiver tam apropriado (12 ou 13 digitos total), retorna
  // Ex: 55 11 99999 9999 = 13 digitos
  // Ex: 55 11 9999 9999 = 12 digitos
  if (numericOnly.startsWith('55') && numericOnly.length >= 12) {
    return numericOnly;
  }
  
  // Caso contrário, adiciona 55
  return `55${numericOnly}`;
};
