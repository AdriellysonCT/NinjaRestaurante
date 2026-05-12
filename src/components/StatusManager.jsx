import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { printService } from '../services/printService';
import { notificationService } from '../services/notificationService';

// Fluxo de status baseado no tipo de pedido
const getStatusFlow = (tipo_pedido) => {
  const isLocalOrder = tipo_pedido === 'retirada' || tipo_pedido === 'local';
  
  if (isLocalOrder) {
    // Fluxo simplificado para pedidos locais
    return {
      disponivel: { next: 'aceito', text: 'Aceitar Missão', color: 'bg-green-500 hover:bg-green-600' },
      aceito: { next: 'concluido', text: 'Finalizar Pedido', color: 'bg-green-500 hover:bg-green-600' },
      concluido: { next: null, text: 'Finalizado', color: 'bg-gray-400', disabled: true },
    };
  } else {
    // Fluxo completo para pedidos de entrega (delivery)
    return {
      disponivel: { next: 'aceito', text: 'Aceitar Missão', color: 'bg-green-500 hover:bg-green-600' },
      aceito: { next: 'pronto_para_entrega', text: 'Pronto para Entrega', color: 'bg-blue-500 hover:bg-blue-600' },
      pronto_para_entrega: { next: 'coletado', text: 'Coletado', color: 'bg-yellow-500 hover:bg-yellow-600' },
      coletado: { next: 'concluido', text: 'Concluído', color: 'bg-purple-500 hover:bg-purple-600' },
      falha_entrega: { next: 'concluido', text: 'Tratar Falha', color: 'bg-red-500 hover:bg-red-600' },
      concluido: { next: null, text: 'Finalizado', color: 'bg-gray-400', disabled: true },
    };
  }
};

const StatusManager = ({ order, onUpdateStatus, restaurante }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Normalizar status iniciais para o fluxo
    const normalized = ['pendente', 'novo'].includes(order.status) ? 'disponivel' : order.status;
    setCurrentStatus(normalized);
  }, [order.status]);

  const normalizeStatus = (status) => {
    if (['pendente', 'novo'].includes(status)) return 'disponivel';
    return status;
  };

  const handleUpdateStatus = async () => {
    const normalizedCurrent = normalizeStatus(currentStatus);
    const statusFlow = getStatusFlow(order.tipo_pedido);
    const currentAction = statusFlow[normalizedCurrent];
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
    
    // 🥷 Lógica Ninja de Notificações e Impressão
    
    // 1. Impressão automática apenas ao aceitar
    if (nextStatus === 'aceito') {
      try {
        console.log('🖨️ Disparando impressão automática...');
        let restauranteData = restaurante;
        if (!restauranteData) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: restData } = await supabase
              .from('restaurantes_app')
              .select('*')
              .eq('user_id', user.id)
              .single();
            restauranteData = restData;
          }
        }
        printService.autoPrintOnAccept(order, restauranteData).catch(err => {
          console.warn('Erro na impressão automática:', err);
        });
      } catch (err) {
        console.warn('Erro ao tentar impressão automática:', err);
      }
    }

    // 2. Notificação via WhatsApp (NinjaTalk AI)
    try {
      const isLocalOrder = order.tipo_pedido === 'retirada' || order.tipo_pedido === 'local';
      
      // Mapeamento de status para o agente entender
      const statusMap = {
        'aceito': 'aceito',
        'pronto_para_entrega': 'pronto',
        'coletado': (isLocalOrder ? null : 'saiu_entrega') 
      };

      const mappedStatus = statusMap[nextStatus];

      if (mappedStatus) {
        // Se todos os itens forem tempo_preparo = 0 (bebidas, etc), não envia "preparando"
        if (mappedStatus === 'aceito') {
          const hasItemsToPrepare = order.items?.some(item => (Number(item.prepTime) || 0) > 0);
          if (!hasItemsToPrepare && order.items?.length > 0) {
              console.log('ℹ️ NinjaTalk: Ignorando "preparando" para itens sem tempo de preparo.');
              return; 
          }
        }

        console.log(`🤖 Disparando NinjaTalk para status: ${mappedStatus}...`);
        notificationService.notifyStatusChange(order, mappedStatus);
      }
    } catch (err) {
      console.warn('Erro ao disparar NinjaTalk:', err);
    }
    
    setIsLoading(false);
  };

  const normalizedCurrent = normalizeStatus(currentStatus);
  const statusFlow = getStatusFlow(order.tipo_pedido);
  const currentAction = statusFlow[normalizedCurrent];

  if (!currentAction || currentAction.disabled) {
    return (
      <button
        className={`px-4 py-2 rounded text-white font-bold bg-gray-400`}
        disabled
      >
        {currentAction ? currentAction.text : 'Status Desconhecido'}
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