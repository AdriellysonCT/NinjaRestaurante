/**
 * Utilitários para formatação de números de telefone
 */

/**
 * Formata um número de telefone para o padrão exigido pelo WhatsApp (com código do país)
 * @param phone - O número de telefone original
 * @returns O número formatado ou null se inválido
 */
export const formatPhoneForWhatsApp = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Remover todos os caracteres não numéricos
  const numericOnly = phone.replace(/\D/g, '');
  
  // Validar número brasileiro (mínimo 10 dígitos: DDD + número)
  if (numericOnly.length < 10) {
    return null;
  }
  
  // Se já tem DDI 55
  if (numericOnly.startsWith('55')) {
    // Se tem 12 ou 13 dígitos (55 + DDD + 8 ou 9 dígitos)
    if (numericOnly.length >= 12 && numericOnly.length <= 13) {
      return numericOnly;
    }
  }
  
  // Se não tem DDI, adiciona 55
  // Para números com 10 ou 11 dígitos
  if (numericOnly.length === 10 || numericOnly.length === 11) {
    return `55${numericOnly}`;
  }
  
  // Caso genérico: se for maior que 11 e não começar com 55, retornamos como está 
  // assumindo que já pode ter outro DDI, ou tentamos tratar.
  // Por enquanto, seguimos a lógica do Brasil.
  return numericOnly.startsWith('55') ? numericOnly : `55${numericOnly}`;
};

/**
 * Formata um telefone para exibição amigável: (XX) XXXXX-XXXX
 * @param phone - O número de telefone
 * @returns Telefone formatado
 */
export const formatDisplayPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'Não informado';
  
  const digits = phone.replace(/\D/g, '');
  
  // Se tiver DDI 55
  let ddd: string = '';
  let number: string = '';
  
  if (digits.startsWith('55') && digits.length > 10) {
    ddd = digits.substring(2, 4);
    number = digits.substring(4);
  } else if (digits.length >= 10) {
    ddd = digits.substring(0, 2);
    number = digits.substring(2);
  } else {
    return phone; // Não reconhecido
  }
  
  if (number.length === 9) {
    return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
  } else if (number.length === 8) {
    return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
  }
  
  return phone;
};
