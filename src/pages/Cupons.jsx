import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CuponsManager from '../components/CuponsManager';

const Cupons = () => {
  const { restauranteId, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Carregando...</span>
      </div>
    );
  }

  if (!restauranteId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-4">❌ Erro: Restaurante não identificado</p>
          <p className="text-sm text-muted-foreground">Faça logout e login novamente</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Cupons de Desconto
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie cupons promocionais para seus clientes
          </p>
        </div>
      </div>

      {/* Componente de Gerenciamento de Cupons */}
      <CuponsManager restauranteId={restauranteId} />
    </motion.div>
  );
};

export default Cupons;
