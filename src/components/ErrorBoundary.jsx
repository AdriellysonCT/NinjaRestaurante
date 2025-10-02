import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debug
    console.error('🔴 [ERROR BOUNDARY] Erro capturado:', error);
    console.error('🔴 [ERROR BOUNDARY] Info do erro:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ninja-card p-6 m-4 border-destructive">
          <h2 className="text-xl font-bold text-destructive mb-4">
            ⚠️ Algo deu errado!
          </h2>
          <details className="text-sm">
            <summary className="cursor-pointer mb-2">Ver detalhes do erro</summary>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80"
          >
            🔄 Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;