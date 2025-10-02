// Rastreador de importações para debug
import debugLogger from './debugLogger.js';

// Função para verificar se um módulo/componente existe antes de importar
export const safeImport = async (modulePath, componentName = null) => {
  try {
    debugLogger.info('IMPORT_TRACKER', `🔍 Tentando importar ${componentName || 'módulo'} de ${modulePath}`);
    
    const module = await import(modulePath);
    
    if (componentName) {
      if (module[componentName]) {
        debugLogger.importSuccess(modulePath, componentName);
        return module[componentName];
      } else {
        const availableExports = Object.keys(module);
        debugLogger.importError(modulePath, componentName, new Error(`Componente não encontrado. Disponíveis: ${availableExports.join(', ')}`));
        return null;
      }
    } else {
      debugLogger.importSuccess(modulePath, 'módulo completo');
      return module;
    }
  } catch (error) {
    debugLogger.importError(modulePath, componentName || 'módulo', error);
    return null;
  }
};

// Função para verificar exportações de um módulo
export const checkModuleExports = async (modulePath) => {
  try {
    const module = await import(modulePath);
    const exports = Object.keys(module);
    
    debugLogger.info('MODULE_CHECK', `📋 Exportações disponíveis em ${modulePath}:`, exports);
    
    return {
      success: true,
      exports,
      module
    };
  } catch (error) {
    debugLogger.error('MODULE_CHECK', `❌ Erro ao verificar módulo ${modulePath}`, error);
    return {
      success: false,
      error: error.message,
      exports: []
    };
  }
};

// Wrapper para componentes React com error boundary
export const withErrorTracking = (WrappedComponent, componentName) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
      debugLogger.componentMount(componentName);
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      debugLogger.componentError(componentName, error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="ninja-card p-4 border-destructive bg-destructive/10">
            <h3 className="font-bold text-destructive mb-2">Erro no componente {componentName}</h3>
            <p className="text-sm text-muted-foreground mb-2">{this.state.error?.message}</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs bg-secondary px-2 py-1 rounded"
            >
              Tentar novamente
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

// Função para verificar dependências críticas
export const checkCriticalDependencies = async () => {
  debugLogger.info('DEPENDENCY_CHECK', '🔍 Verificando dependências críticas...');
  
  const criticalModules = [
    { path: '../components/icons/index.jsx', name: 'Icons' },
    { path: '../lib/supabase.js', name: 'Supabase' },
    { path: '../context/AppContext.jsx', name: 'AppContext' },
    { path: '../services/authService.js', name: 'AuthService' }
  ];

  const results = [];
  
  for (const module of criticalModules) {
    const result = await checkModuleExports(module.path);
    results.push({
      ...module,
      ...result
    });
  }
  
  const failed = results.filter(r => !r.success);
  const passed = results.filter(r => r.success);
  
  debugLogger.info('DEPENDENCY_CHECK', `✅ ${passed.length} módulos OK, ❌ ${failed.length} com problemas`);
  
  if (failed.length > 0) {
    debugLogger.warn('DEPENDENCY_CHECK', '⚠️ Módulos com problemas:', failed);
  }
  
  return {
    total: results.length,
    passed: passed.length,
    failed: failed.length,
    results
  };
};

export default {
  safeImport,
  checkModuleExports,
  withErrorTracking,
  checkCriticalDependencies
};