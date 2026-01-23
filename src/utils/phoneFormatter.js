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

/**
 * Formata um número de telefone para exibição visual (ex: (11) 99999-9999)
 * @param {string} phone - O número de telefone
 * @returns {string} - Telefone formatado visualmente
 */
export const formatDisplayPhone = (phone) => {
  if (!phone) return 'Não informado';
  
  // Limpar caracteres não numéricos
  const numericOnly = phone.toString().replace(/\D/g, '');
  
  // Se estiver vazio
  if (!numericOnly) return 'Não informado';
  
  // Lógica simples de formatação baseada no tamanho
  // Celular BR com DDI: 5511999999999 (13 dígitos) -> +55 (11) 99999-9999
  if (numericOnly.length === 13 && numericOnly.startsWith('55')) {
    return `+55 (${numericOnly.slice(2, 4)}) ${numericOnly.slice(4, 9)}-${numericOnly.slice(9)}`;
  }
  
  // Celular BR sem DDI: 11999999999 (11 dígitos) -> (11) 99999-9999
  if (numericOnly.length === 11) {
    return `(${numericOnly.slice(0, 2)}) ${numericOnly.slice(2, 7)}-${numericOnly.slice(7)}`;
  }
  
  // Fixo BR: 1133334444 (10 dígitos) -> (11) 3333-4444
  if (numericOnly.length === 10) {
    return `(${numericOnly.slice(0, 2)}) ${numericOnly.slice(2, 6)}-${numericOnly.slice(6)}`;
  }
  
  // Retornar original se não casar com padrões conhecidos
  return phone;
};
