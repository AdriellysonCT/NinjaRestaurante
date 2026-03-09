import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CuponsManager from '../components/CuponsManager';

const Cupons = () => {
  const { restauranteId, loading } = useAuth();

  if (loading && !restauranteId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 font-bold text-foreground">Sincronizando dados...</span>
      </div>
    );
  }

  if (!restauranteId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center bg-card p-8 rounded-2xl border border-border shadow-xl">
          <p className="text-destructive font-black text-xl mb-4">❌ Restaurante não identificado</p>
          <p className="text-sm text-muted-foreground mb-6">Não conseguimos vincular sua sessão ao restaurante.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Recarregar Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
             🎟️ Cupons de Desconto
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie cupons promocionais para seus clientes
          </p>
        </div>
      </div>

      {/* Componente de Gerenciamento de Cupons */}
      <div className="bg-card/50 rounded-2xl border border-border/50 p-1">
        <CuponsManager restauranteId={restauranteId} />
      </div>
    </div>
  );
};

export default Cupons;
