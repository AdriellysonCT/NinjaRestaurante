import React from 'react';
import { motion } from 'framer-motion';
import CuponsManager from '../components/CuponsManager';

const Cupons = () => {
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
      <CuponsManager />
    </motion.div>
  );
};

export default Cupons;
