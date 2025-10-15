import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Fluxo de status baseado no tipo de pedido
const getStatusFlow = (tipo_pedido) => {
  const isLocalOrder = tipo_pedido === 'balcao' || tipo_pedido === 'mesa';
  
  if (isLocalOrder) {
    // Fluxo simplificado para pedidos locais
    return {
      disponivel: { next: 'aceito', text: 'Aceitar Missão', color: 'bg-green-500 hover:bg-green-600' },
      aceito: { next: 'concluido', text: 'Finalizar Pedido', color: 'bg-green-500 hover:bg-green-600' },
      concluido: { next: null, text: 'Finalizado', color: 'bg-gray-400', disabled: true },
    };
  } else {
    // Fluxo completo para pedidos de entrega
    return {
      disponivel: { next: 'aceito', text: 'Aceitar Missão', color: 'bg-green-500 hover:bg-green-600' },
      aceito: { next: 'pronto_para_entrega', text: 'Pronto para Entrega', color: 'bg-blue-500 hover:bg-blue-600' },
      pronto_para_entrega: { next: 'coletado', text: 'Coletado', color: 'bg-yellow-500 hover:bg-yellow-600' },
      coletado: { next: 'concluido', text: 'Concluído', color: 'bg-purple-500 hover:bg-purple-600' },
      concluido: { next: null, text: 'Finalizado', color: 'bg-gray-400', disabled: true },
    };
  }
};

const StatusManager = ({ order, onUpdateStatus }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  // Removido: cópia manual para entregas agora é feita pela trigger no banco

  const handleUpdateStatus = async () => {
    const statusFlow = getStatusFlow(order.tipo_pedido);
    const currentAction = statusFlow[currentStatus];
    if (!currentAction || !currentAction.next) return;

    setIsLoading(true);
    setError(null);

    const nextStatus = currentAction.next;

    // Preparar os dados para atualização
    const updateData = { status: nextStatus };
    
    // Se estiver mudando para aceito (em_preparo), adicionar started_at
    if (nextStatus === 'aceito') {
      updateData.started_at = new Date().toISOString();
    }

    const { data, error: updateError } = await supabase
      .from('pedidos_padronizados')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError);
      setError('Erro ao atualizar status.');
      setIsLoading(false);
      return;
    }

    // Sincronização com entregas é feita pela trigger no banco

    setCurrentStatus(nextStatus);
    if (onUpdateStatus) {
      onUpdateStatus(order.id, nextStatus);
    }
    
    setIsLoading(false);
  };

  const statusFlow = getStatusFlow(order.tipo_pedido);
  const currentAction = statusFlow[currentStatus];

  if (!currentAction || currentAction.disabled || currentStatus === 'aceito') {
    const isLocalOrder = order.tipo_pedido === 'balcao' || order.tipo_pedido === 'mesa';
    const displayText = currentStatus === 'aceito' 
      ? (isLocalOrder ? 'Preparando Pedido Local' : 'Em Preparo') 
      : (currentAction ? currentAction.text : 'Status Desconhecido');
      
    return (
      <button
        className={`px-4 py-2 rounded text-white font-bold ${currentAction && currentStatus !== 'aceito' ? currentAction.color : 'bg-gray-400'}`}
        disabled
      >
        {displayText}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleUpdateStatus}
        disabled={isLoading}
        className={`px-4 py-2 rounded text-white font-bold transition-colors duration-200 ${currentAction.color} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Atualizando...' : currentAction.text}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default StatusManager;