/**
 * Sistema de Logs centralizado
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log padrão (apenas em desenvolvimento)
   */
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de erro (sempre visível)
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Log de aviso (apenas em desenvolvimento)
   */
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log informativo (apenas em desenvolvimento)
   */
  info: (...args: any[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log de depuração detalhado (apenas em desenvolvimento)
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

export default logger;
