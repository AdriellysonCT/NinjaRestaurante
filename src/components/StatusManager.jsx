import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const statusFlow = {
  disponivel: { next: 'em_preparo', text: 'Aceitar Missão', color: 'bg-green-500 hover:bg-green-600' },
  em_preparo: { next: 'pronto_para_entrega', text: 'Pronto para Entrega', color: 'bg-blue-500 hover:bg-blue-600' },
  pronto_para_entrega: { next: 'coletado', text: 'Coletado', color: 'bg-yellow-500 hover:bg-yellow-600' },
  coletado: { next: 'entregue', text: 'Entregue', color: 'bg-purple-500 hover:bg-purple-600' },
  entregue: { next: 'finalizado', text: 'Finalizado', color: 'bg-gray-500 hover:bg-gray-600' },
  finalizado: { next: null, text: 'Concluído', color: 'bg-gray-400', disabled: true },
};

const StatusManager = ({ order, onUpdateStatus }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  const handleCopyOrder = async (orderData) => {
    const { data, error } = await supabase
      .from('entregas_padronizadas')
      .insert([
        {
          id_pedido: orderData.id,
          id_restaurante: orderData.id_restaurante,
          valor_total: orderData.valor_total,
          status: 'pendente', // Status inicial na tabela de entregas
          nome_cliente: orderData.customerName,
          endereco_cliente: `${orderData.customerAddress.street}, ${orderData.customerAddress.number}, ${orderData.customerAddress.neighborhood}, ${orderData.customerAddress.city} - ${orderData.customerAddress.state}, CEP: ${orderData.customerAddress.zipcode}`,
          telefone_cliente: orderData.customerPhone,
          observacoes: orderData.notes,
          numero_pedido: orderData.numero_pedido,
        },
      ]);

    if (error) {
      console.error('Erro ao copiar pedido para entregas:', error);
      setError('Erro ao copiar pedido.');
    }
  };

  const handleUpdateStatus = async () => {
    const currentAction = statusFlow[currentStatus];
    if (!currentAction || !currentAction.next) return;

    setIsLoading(true);
    setError(null);

    const nextStatus = currentAction.next;

    // Preparar os dados para atualização
    const updateData = { status: nextStatus };
    
    // Se estiver mudando para em_preparo, adicionar started_at
    if (nextStatus === 'em_preparo') {
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

    if (nextStatus === 'pronto_para_entrega') {
      await handleCopyOrder(order);
    }

    setCurrentStatus(nextStatus);
    if (onUpdateStatus) {
      onUpdateStatus(order.id, nextStatus);
    }
    
    setIsLoading(false);
  };

  const currentAction = statusFlow[currentStatus];

  if (!currentAction || currentAction.disabled || currentStatus === 'em_preparo') {
    return (
      <button
        className={`px-4 py-2 rounded text-white font-bold ${currentAction && currentStatus !== 'em_preparo' ? currentAction.color : 'bg-gray-400'}`}
        disabled
      >
        {currentAction && currentStatus !== 'em_preparo' ? currentAction.text : (currentStatus === 'em_preparo' ? 'Em Preparo' : 'Status Desconhecido')}
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