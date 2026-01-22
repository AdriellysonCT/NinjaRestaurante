/**
 * Utilitários para formatação de datas e horas
 */

/**
 * Formata uma data para o padrão brasileiro: DD/MM/AAAA
 * @param date - A data a ser formatada (string ou Date)
 * @returns Data formatada
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
};

/**
 * Formata data e hora para o padrão brasileiro: DD/MM/AAAA HH:MM:SS
 * @param date - A data/hora a ser formatada
 * @param options - Opções adicionais do toLocaleString
 * @returns Data e hora formatada
 */
export const formatDateTime = (
  date: string | Date | null | undefined, 
  options: Intl.DateTimeFormatOptions = { hour12: false }
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', options);
};

/**
 * Formata apenas a hora: HH:MM
 * @param date - A data/hora a ser formatada
 * @returns Hora formatada
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Retorna uma string descritiva de tempo relativo (ex: "há 5 minutos")
 * @param date - A data passada
 * @returns Tempo relativo
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
    return formatDate(d);
};
