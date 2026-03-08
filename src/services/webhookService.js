import { supabase } from '../lib/supabase';

/**
 * Serviço de Webhook para InfinitePay
 * 
 * Este serviço processa webhooks de pagamento da InfinitePay
 * e cria pedidos apenas se o pagamento for aprovado.
 * 
 * Fluxo:
 * 1. Webhook recebe notificação de pagamento
 * 2. Se aprovado → cria pedido com status_pagamento = 'pago'
 * 3. Se recusado → não cria pedido
 * 4. Se dinheiro → cria pedido imediato com status_pagamento = 'pendente'
 */

/**
 * Processa webhook de pagamento da InfinitePay
 * @param {Object} webhookData - Dados do webhook
 * @returns {Promise<Object>} - Resultado do processamento
 */
export async function processarWebhookInfinitePay(webhookData) {
  try {
    console.log('🔔 Webhook InfinitePay recebido:', webhookData);

    // Validar dados do webhook
    if (!webhookData || !webhookData.status) {
      throw new Error('Dados do webhook inválidos');
    }

    const { 
      status, 
      transaction_id, 
      amount, 
      payment_method,
      order_data // dados do pedido que veio do app do cliente
    } = webhookData;

    // Verificar se já existe um pedido com este transaction_id
    const { data: pedidoExistente } = await supabase
      .from('pedidos_padronizados')
      .select('id')
      .eq('transacao_id', transaction_id)
      .single();

    if (pedidoExistente) {
      console.log('⚠️ Pedido já processado para esta transação:', transaction_id);
      return { success: true, message: 'Pedido já processado', pedido: pedidoExistente };
    }

    // Processar baseado no status do pagamento
    switch (status) {
      case 'approved':
      case 'paid':
        // Pagamento aprovado - criar pedido com status_pagamento = 'pago'
        return await criarPedidoPago(transaction_id, amount, payment_method, order_data);

      case 'pending':
        // Pagamento pendente (ex: boleto gerado mas não pago)
        console.log('⏳ Pagamento pendente, aguardando confirmação');
        return { success: true, message: 'Pagamento pendente', aguardando: true };

      case 'rejected':
      case 'cancelled':
        // Pagamento recusado - NÃO criar pedido
        console.log('❌ Pagamento recusado, pedido não será criado');
        await registrarTentativaRecusada(transaction_id, amount, payment_method, order_data);
        return { success: false, message: 'Pagamento recusado', recusado: true };

      default:
        console.warn('⚠️ Status de pagamento desconhecido:', status);
        return { success: false, message: 'Status desconhecido', status };
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    throw error;
  }
}

/**
 * Cria pedido com pagamento aprovado
 * @param {string} transactionId - ID da transação
 * @param {number} amount - Valor do pedido
 * @param {string} paymentMethod - Método de pagamento
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<Object>} - Pedido criado
 */
async function criarPedidoPago(transactionId, amount, paymentMethod, orderData) {
  try {
    console.log('✅ Criando pedido com pagamento aprovado');

    // Validar dados do pedido
    if (!orderData || !orderData.id_restaurante) {
      throw new Error('Dados do pedido incompletos');
    }

    // Gerar número sequencial do pedido
    const { data: ultimoPedido } = await supabase
      .from('pedidos_padronizados')
      .select('numero_pedido, numero_pedido_sequencial')
      .eq('id_restaurante', orderData.id_restaurante)
      .order('numero_pedido_sequencial', { ascending: false })
      .limit(1)
      .single();

    const numeroSequencial = (ultimoPedido?.numero_pedido_sequencial || 0) + 1;
    const numeroPedido = (ultimoPedido?.numero_pedido || 0) + 1;

    // Criar pedido com status_pagamento = 'pago'
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_padronizados')
      .insert([{
        id_cliente: orderData.id_cliente,
        id_restaurante: orderData.id_restaurante,
        numero_pedido: numeroPedido,
        numero_pedido_sequencial: numeroSequencial,
        tipo_pedido: orderData.tipo_pedido || 'delivery',
        status: 'disponivel', // pedido criado, aguardando aceitação do restaurante
        valor_total: amount,
        subtotal: orderData.subtotal || amount,
        taxa_entrega: orderData.taxa_entrega || 0,
        desconto: orderData.desconto || 0,
        metodo_pagamento: paymentMethod,
        status_pagamento: 'pago', // ✅ PAGAMENTO APROVADO
        pagamento_recebido_pelo_sistema: true,
        transacao_id: transactionId,
        nome_cliente: orderData.nome_cliente,
        telefone_cliente: orderData.telefone_cliente,
        endereco_entrega: orderData.endereco_entrega,
        observacoes: orderData.observacoes,
        is_vip: orderData.is_vip || false,
        criado_em: new Date().toISOString()
      }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // Criar itens do pedido
    if (orderData.itens && orderData.itens.length > 0) {
      const itensParaInserir = orderData.itens.map(item => ({
        id_pedido: pedido.id,
        id_item_cardapio: item.id_item_cardapio,
        id_restaurante: orderData.id_restaurante,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        preco_total: item.preco_total || (item.preco_unitario * item.quantidade),
        observacao_item: item.observacao || null
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);

      if (itensError) {
        console.error('Erro ao criar itens do pedido:', itensError);
        // Continuar mesmo se houver erro nos itens
      }
    }

    console.log('✅ Pedido criado com sucesso:', pedido.id);

    // 💰 GERAR LANÇAMENTOS NO LEDGER (Oficializando Ledger como Fonte da Verdade)
    try {
      await gerarLancamentosLedgerPedido(pedido);
      console.log('✅ Lançamentos no Ledger gerados para o pedido:', pedido.id);
    } catch (ledgerError) {
      console.error('⚠️ Erro ao gerar lançamentos no Ledger:', ledgerError);
      // Não falhar o fluxo de pagamento se o ledger falhar por algum motivo (embora deva ser raríssimo)
    }

    return { 
      success: true, 
      message: 'Pedido criado com pagamento aprovado', 
      pedido 
    };

  } catch (error) {
    console.error('❌ Erro ao criar pedido pago:', error);
    throw error;
  }
}

/**
 * Registra tentativa de pagamento recusada (para auditoria)
 * @param {string} transactionId - ID da transação
 * @param {number} amount - Valor
 * @param {string} paymentMethod - Método de pagamento
 * @param {Object} orderData - Dados do pedido
 */
async function registrarTentativaRecusada(transactionId, amount, paymentMethod, orderData) {
  try {
    // Criar tabela de log de pagamentos recusados (se não existir)
    const { error } = await supabase
      .from('pagamentos_recusados')
      .insert([{
        transacao_id: transactionId,
        id_restaurante: orderData?.id_restaurante,
        id_cliente: orderData?.id_cliente,
        valor: amount,
        metodo_pagamento: paymentMethod,
        dados_pedido: orderData,
        criado_em: new Date().toISOString()
      }]);

    if (error && error.code !== '42P01') { // Ignora erro de tabela não existente
      console.error('Erro ao registrar pagamento recusado:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar tentativa recusada:', error);
  }
}

/**
 * Cria pedido com pagamento em dinheiro (pendente)
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<Object>} - Pedido criado
 */
export async function criarPedidoDinheiro(orderData) {
  try {
    console.log('💵 Criando pedido com pagamento em dinheiro (pendente)');

    // Validar dados do pedido
    if (!orderData || !orderData.id_restaurante) {
      throw new Error('Dados do pedido incompletos');
    }

    // Gerar número sequencial do pedido
    const { data: ultimoPedido } = await supabase
      .from('pedidos_padronizados')
      .select('numero_pedido, numero_pedido_sequencial')
      .eq('id_restaurante', orderData.id_restaurante)
      .order('numero_pedido_sequencial', { ascending: false })
      .limit(1)
      .single();

    const numeroSequencial = (ultimoPedido?.numero_pedido_sequencial || 0) + 1;
    const numeroPedido = (ultimoPedido?.numero_pedido || 0) + 1;

    // Criar pedido com status_pagamento = 'pendente'
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_padronizados')
      .insert([{
        id_cliente: orderData.id_cliente,
        id_restaurante: orderData.id_restaurante,
        numero_pedido: numeroPedido,
        numero_pedido_sequencial: numeroSequencial,
        tipo_pedido: orderData.tipo_pedido || 'delivery',
        status: 'disponivel',
        valor_total: orderData.valor_total,
        subtotal: orderData.subtotal || orderData.valor_total,
        taxa_entrega: orderData.taxa_entrega || 0,
        desconto: orderData.desconto || 0,
        metodo_pagamento: 'dinheiro',
        status_pagamento: 'pendente', // 🟡 PAGAMENTO PENDENTE
        pagamento_recebido_pelo_sistema: false,
        troco: orderData.troco || 0,
        nome_cliente: orderData.nome_cliente,
        telefone_cliente: orderData.telefone_cliente,
        endereco_entrega: orderData.endereco_entrega,
        observacoes: orderData.observacoes,
        is_vip: orderData.is_vip || false,
        criado_em: new Date().toISOString()
      }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // Criar itens do pedido
    if (orderData.itens && orderData.itens.length > 0) {
      const itensParaInserir = orderData.itens.map(item => ({
        id_pedido: pedido.id,
        id_item_cardapio: item.id_item_cardapio,
        id_restaurante: orderData.id_restaurante,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        preco_total: item.preco_total || (item.preco_unitario * item.quantidade),
        observacao_item: item.observacao || null
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);

      if (itensError) {
        console.error('Erro ao criar itens do pedido:', itensError);
      }
    }

    console.log('✅ Pedido com dinheiro criado:', pedido.id);

    return { 
      success: true, 
      message: 'Pedido criado com pagamento pendente (dinheiro)', 
      pedido 
    };

  } catch (error) {
    console.error('❌ Erro ao criar pedido com dinheiro:', error);
    throw error;
  }
}

/**
 * Marca pedido pendente como pago (quando entregador confirma recebimento)
 * @param {string} pedidoId - ID do pedido
 * @returns {Promise<Object>} - Pedido atualizado
 */
export async function confirmarPagamentoPendente(pedidoId) {
  try {
    console.log('✅ Confirmando pagamento pendente do pedido:', pedidoId);

    const { data: pedido, error } = await supabase
      .from('pedidos_padronizados')
      .update({
        status_pagamento: 'pago',
        pagamento_recebido_pelo_sistema: true,
        pago_em: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .eq('status_pagamento', 'pendente') // só atualiza se ainda estiver pendente
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Pagamento confirmado para pedido:', pedidoId);

    // 💰 GERAR LANÇAMENTOS NO LEDGER (Oficializando Ledger como Fonte da Verdade)
    try {
      if (pedido) {
        await gerarLancamentosLedgerPedido(pedido);
        console.log('✅ Lançamentos no Ledger gerados para o pedido:', pedidoId);
      }
    } catch (ledgerError) {
      console.error('⚠️ Erro ao gerar lançamentos no Ledger:', ledgerError);
    }

    return { success: true, pedido };

  } catch (error) {
    console.error('❌ Erro ao confirmar pagamento:', error);
    throw error;
  }
}

/**
 * Registra estorno de pagamento
 * @param {string} pedidoId - ID do pedido
 * @param {string} motivo - Motivo do estorno
 * @returns {Promise<Object>} - Pedido atualizado
 */
export async function registrarEstorno(pedidoId, motivo) {
  try {
    console.log('🔴 Registrando estorno do pedido:', pedidoId);

    const { data: pedido, error } = await supabase
      .from('pedidos_padronizados')
      .update({
        status_pagamento: 'estornado',
        status: 'cancelado',
        motivo_estorno: motivo,
        estornado_em: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Estorno registrado para pedido:', pedidoId);

    return { success: true, pedido };

  } catch (error) {
    console.error('❌ Erro ao registrar estorno:', error);
    throw error;
  }
}

/**
 * Gera os lançamentos financeiros no ledger_lancamentos para um pedido pago de forma atômica via RPC
 * @param {Object} pedido - Dados do pedido completo
 */
async function gerarLancamentosLedgerPedido(pedido) {
  const { id } = pedido;

  // 👉 Garante ATOMICIDADE: chama função do banco que roda em um bloco BEGIN...COMMIT
  const { error } = await supabase.rpc('processar_confirmacao_pagamento', {
    p_pedido_id: id
  });

  if (error) {
    // Se falhar por duplicidade (idx_ledger_obrigacao_restaurante_unica), o banco fará o ROLLBACK 
    // mas o erro será propagado para registrarmos no log.
    if (error.code === '23505') {
       console.log('ℹ️ Registro de Ledger já existente para o pedido:', id);
       return;
    }
    throw error;
  }
}

export default {
  processarWebhookInfinitePay,
  criarPedidoDinheiro,
  confirmarPagamentoPendente,
  registrarEstorno,
  gerarLancamentosLedgerPedido
};


