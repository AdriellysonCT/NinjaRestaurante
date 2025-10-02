// Sistema de logs para debug de problemas
class DebugLogger {
  constructor() {
    this.logs = [];
    this.isEnabled = true; // Pode ser controlado via localStorage ou env
    this.maxLogs = 1000;
    
    // Verificar se está em desenvolvimento
    this.isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    console.log('🔧 DebugLogger inicializado - Modo:', this.isDev ? 'DEV' : 'PROD');
  }

  log(category, message, data = null, level = 'info') {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      message,
      data,
      level,
      stack: level === 'error' ? new Error().stack : null
    };

    this.logs.push(logEntry);
    
    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output com cores
    const colors = {
      error: '🔴',
      warn: '🟡', 
      info: '🔵',
      success: '🟢',
      debug: '⚪'
    };

    const color = colors[level] || '⚪';
    const prefix = `${color} [${category}]`;
    
    if (this.isDev) {
      switch (level) {
        case 'error':
          console.error(prefix, message, data);
          break;
        case 'warn':
          console.warn(prefix, message, data);
          break;
        case 'success':
          console.log(`%c${prefix} ${message}`, 'color: green; font-weight: bold', data);
          break;
        default:
          console.log(prefix, message, data);
      }
    }

    // Salvar logs críticos no localStorage
    if (level === 'error') {
      this.saveErrorToStorage(logEntry);
    }
  }

  error(category, message, data = null) {
    this.log(category, message, data, 'error');
  }

  warn(category, message, data = null) {
    this.log(category, message, data, 'warn');
  }

  info(category, message, data = null) {
    this.log(category, message, data, 'info');
  }

  success(category, message, data = null) {
    this.log(category, message, data, 'success');
  }

  debug(category, message, data = null) {
    this.log(category, message, data, 'debug');
  }

  // Logs específicos para importações
  importSuccess(module, component) {
    this.success('IMPORT', `✅ ${component} importado com sucesso de ${module}`);
  }

  importError(module, component, error) {
    this.error('IMPORT', `❌ Falha ao importar ${component} de ${module}`, {
      module,
      component,
      error: error.message,
      stack: error.stack
    });
  }

  // Logs específicos para componentes
  componentMount(componentName) {
    this.info('COMPONENT', `🚀 ${componentName} montado`);
  }

  componentError(componentName, error, errorInfo = null) {
    this.error('COMPONENT', `💥 Erro em ${componentName}`, {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  // Logs específicos para API/Supabase
  apiCall(endpoint, method = 'GET') {
    this.info('API', `📡 Chamada ${method} para ${endpoint}`);
  }

  apiSuccess(endpoint, data) {
    this.success('API', `✅ Sucesso em ${endpoint}`, { dataLength: data?.length || 'N/A' });
  }

  apiError(endpoint, error) {
    this.error('API', `❌ Erro em ${endpoint}`, {
      error: error.message,
      status: error.status || 'N/A'
    });
  }

  // Salvar erros críticos
  saveErrorToStorage(logEntry) {
    try {
      const errorLogs = JSON.parse(localStorage.getItem('fome-ninja-error-logs') || '[]');
      errorLogs.push(logEntry);
      
      // Manter apenas os últimos 50 erros
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }
      
      localStorage.setItem('fome-ninja-error-logs', JSON.stringify(errorLogs));
    } catch (e) {
      console.error('Erro ao salvar log no localStorage:', e);
    }
  }

  // Obter todos os logs
  getAllLogs() {
    return [...this.logs];
  }

  // Obter logs por categoria
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  // Obter logs por nível
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Obter erros salvos no localStorage
  getSavedErrors() {
    try {
      return JSON.parse(localStorage.getItem('fome-ninja-error-logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('fome-ninja-error-logs');
    this.info('SYSTEM', '🧹 Logs limpos');
  }

  // Exportar logs para análise
  exportLogs() {
    const allLogs = {
      runtime: this.logs,
      saved: this.getSavedErrors(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fome-ninja-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.info('SYSTEM', '📥 Logs exportados');
  }

  // Relatório resumido
  getReport() {
    const errors = this.getLogsByLevel('error');
    const warnings = this.getLogsByLevel('warn');
    const imports = this.getLogsByCategory('IMPORT');
    const components = this.getLogsByCategory('COMPONENT');
    const apis = this.getLogsByCategory('API');

    return {
      total: this.logs.length,
      errors: errors.length,
      warnings: warnings.length,
      categories: {
        imports: imports.length,
        components: components.length,
        apis: apis.length
      },
      lastError: errors[errors.length - 1] || null,
      mostCommonErrors: this.getMostCommonErrors()
    };
  }

  getMostCommonErrors() {
    const errors = this.getLogsByLevel('error');
    const errorCounts = {};
    
    errors.forEach(error => {
      const key = error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }
}

// Instância global
const debugLogger = new DebugLogger();

// Interceptar erros globais
window.addEventListener('error', (event) => {
  debugLogger.error('GLOBAL', 'Erro JavaScript não capturado', event.error || {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Interceptar erros de Promise rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  debugLogger.error('PROMISE', 'Promise rejeitada não capturada', event.reason);
});

export default debugLogger;