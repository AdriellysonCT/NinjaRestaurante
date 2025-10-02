import React, { useState, useEffect } from 'react';
import debugLogger from '../utils/debugLogger.js';

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateLogs = () => {
      const allLogs = debugLogger.getAllLogs();
      setLogs(allLogs.slice(-50)); // Últimos 50 logs
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'errors') return log.level === 'error';
    if (filter === 'imports') return log.category === 'IMPORT' || log.category === 'IMPORT_TRACKER';
    if (filter === 'components') return log.category === 'COMPONENT';
    return log.category === filter;
  });

  const report = debugLogger.getReport();

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-destructive text-destructive-foreground px-3 py-2 rounded-full shadow-lg hover:bg-destructive/90 text-sm font-medium"
        >
          🐛 Debug ({report.errors > 0 ? `${report.errors} erros` : 'OK'})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">🐛 Debug Panel</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-success">✅ {report.total - report.errors}</span>
              <span className="text-destructive">❌ {report.errors}</span>
              <span className="text-yellow-500">⚠️ {report.warnings}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <span className="text-sm font-medium">Filtros:</span>
          {['all', 'errors', 'imports', 'components', 'API'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => debugLogger.clearLogs()}
              className="px-3 py-1 rounded text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar
            </button>
            <button
              onClick={() => debugLogger.exportLogs()}
              className="px-3 py-1 rounded text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{report.categories.imports}</div>
            <div className="text-xs text-muted-foreground">Importações</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-foreground">{report.categories.components}</div>
            <div className="text-xs text-muted-foreground">Componentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-foreground">{report.categories.apis}</div>
            <div className="text-xs text-muted-foreground">APIs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{report.errors}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum log encontrado para o filtro selecionado
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border text-sm ${
                    log.level === 'error' 
                      ? 'border-destructive bg-destructive/10' 
                      : log.level === 'warn'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : log.level === 'success'
                      ? 'border-success bg-success/10'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.level === 'error' ? 'bg-destructive text-destructive-foreground' :
                          log.level === 'warn' ? 'bg-yellow-500 text-white' :
                          log.level === 'success' ? 'bg-success text-success-foreground' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {log.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-medium mb-1">{log.message}</div>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Common Errors */}
        {report.mostCommonErrors.length > 0 && (
          <div className="border-t border-border p-4">
            <h3 className="font-medium mb-2">Erros Mais Comuns:</h3>
            <div className="space-y-1">
              {report.mostCommonErrors.map((error, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{error.message}</span>
                  <span className="text-destructive font-medium">{error.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;