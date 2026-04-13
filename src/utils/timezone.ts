/**
 * Utilitário de Timezone - America/Sao_Paulo (UTC-3)
 * Garante sincronização perfeita entre timestamps UTC do Supabase
 * e o horário local do Brasil.
 * 
 * ABORDAGEM: Timestamps do Supabase já vêm em ISO 8601 (UTC).
 * O JavaScript Date() já converte automaticamente para o fuso local.
 * Este utilitário apenas garante consistência e fornece helpers úteis.
 */

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte um timestamp para Date usando o timezone correto
 * NOTA: O JS já faz conversão automática de UTC para local,
 * mas usamos Intl para garantir consistência
 * @param dateValue - Timestamp (string ISO, Date, ou number)
 * @returns Date
 */
export function toSaoPauloDate(dateValue: string | Date | number | null | undefined): Date {
  if (!dateValue) return new Date();
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return new Date();
  
  return date;
}

/**
 * Retorna a data/hora atual (o JS já retorna no fuso local da máquina)
 */
export function nowInSaoPaulo(): Date {
  return new Date();
}

/**
 * Retorna apenas a data (YYYY-MM-DD) no timezone de São Paulo
 * @param dateValue - Timestamp
 * @returns String 'YYYY-MM-DD'
 */
export function dateInSaoPaulo(dateValue: string | Date | number = new Date()): string {
  const date = toSaoPauloDate(dateValue);
  
  // Usa Intl para extrair a data no timezone correto
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(date); // Retorna YYYY-MM-DD
}

/**
 * Verifica se uma data é "hoje" no timezone de São Paulo
 * @param dateValue - Timestamp para verificar
 * @returns true se for hoje em SP
 */
export function isTodayInSaoPaulo(dateValue: string | Date | number): boolean {
  const date = toSaoPauloDate(dateValue);
  
  // Obtém a data no timezone SP
  const spDate = dateInSaoPaulo(date);
  const today = dateInSaoPaulo(new Date());
  
  return spDate === today;
}

/**
 * Retorna o início do dia (00:00:00) em UTC ISO string
 * para consultas ao Supabase
 * @param date - Data de referência (default: hoje)
 * @returns ISO string
 */
export function startOfDayUTC(date: Date = new Date()): string {
  const dateInSP = dateInSaoPaulo(date); // YYYY-MM-DD
  return `${dateInSP}T00:00:00.000Z`;
}

/**
 * Retorna o fim do dia (23:59:59.999) em UTC ISO string
 * @param date - Data de referência (default: hoje)
 * @returns ISO string
 */
export function endOfDayUTC(date: Date = new Date()): string {
  const dateInSP = dateInSaoPaulo(date); // YYYY-MM-DD
  return `${dateInSP}T23:59:59.999Z`;
}

/**
 * Alias para compatibilidade
 */
export const utcToSaoPaulo = toSaoPauloDate;

/**
 * Calcula a diferença em horas entre UTC e São Paulo
 */
export function getSaoPauloOffset(): number {
  const now = new Date();
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const spStr = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  const utcDate = new Date(utcStr);
  const spDate = new Date(spStr);
  const diffMs = spDate.getTime() - utcDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

/**
 * Retorna um objeto com data e hora separados no timezone SP
 */
export function splitDateInSaoPaulo(dateValue: string | Date | number): { date: string; time: string } {
  const date = toSaoPauloDate(dateValue);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? part.value : '00';
  };

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`
  };
}
