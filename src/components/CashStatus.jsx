import React, { useState, useEffect } from 'react';
import * as Icons from './icons/index.jsx';
const { DollarSignIcon, AlertCircleIcon, CheckCircleIcon } = Icons;
import * as cashService from '../services/cashService';

export const CashStatus = () => {
  const [caixaAtual, setCaixaAtual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verificarCaixa = async () => {
      try {
        const caixa = await cashService.verificarCaixaAberto();
        setCaixaAtual(caixa);
      } catch (error) {
        console.error('Erro ao verificar caixa:', error);
        // Fallback para localStorage
        const caixaOffline = cashService.verificarCaixaOffline();
        setCaixaAtual(caixaOffline);
      } finally {
        setIsLoading(false);
      }
    };

    verificarCaixa();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Verificando caixa...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      caixaAtual 
        ? 'bg-success/20 text-success' 
        : 'bg-destructive/20 text-destructive'
    }`}>
      {caixaAtual ? (
        <>
          <CheckCircleIcon className="w-4 h-4" />
          <span>Caixa Aberto</span>
          <span className="font-medium">R$ {caixaAtual.valor_abertura.toFixed(2)}</span>
        </>
      ) : (
        <>
          <AlertCircleIcon className="w-4 h-4" />
          <span>Caixa Fechado</span>
        </>
      )}
    </div>
  );
};

export default CashStatus;