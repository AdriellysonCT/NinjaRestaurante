import { supabase } from '../lib/supabase';

const mapOrder = (order) => {
  const items = (order.itens_pedido || []).map(item => ({
    name: item.itens_cardapio?.nome || 'Item desconhecido',
    qty: item.quantidade || 0,
    price: parseFloat(item.itens_cardapio?.preco) || 0,
    note: item.observacao_item || '',
    prepTime: item.itens_cardapio?.tempo_preparo || 0
  }));

  // Calculate total prep time with intelligent logic
  // Instead of summing all times (unrealistic), we use the longest item as base
  // and add buffers for additional complex items
  let totalPrepTime = 0;
  let sortedItems = [];
  let complexItems = [];
  
  if (items.length === 0) {
    totalPrepTime = 0;
  } else {
    // Sort items by prep time (descending)
    sortedItems = [...items].sort((a, b) => b.prepTime - a.prepTime);
    
    // Base time is the longest item
    totalPrepTime = sortedItems[0].prepTime || 0;
    
    // Count items with 25+ minutes (excluding the first/longest one)
    complexItems = sortedItems.slice(1).filter(item => item.prepTime >= 25);
    
    // For each additional complex item, add only 15 minutes (parallel cooking)
    totalPrepTime += complexItems.length * 15;
  }

  return {
    id: order.id,
    numero_pedido: order.numero_pedido || order.id.substring(0, 8),
    customerName: order.nome_cliente || order.clientes_app?.nome || 'Cliente não informado',
    customerPhone: order.telefone_cliente || order.clientes_app?.telefone || 'Telefone não cadastrado',
    timestamp: order.criado_em,
    total: parseFloat(order.valor_total) || parseFloat(order.subtotal) || 0,
    status: order.status,
    tipo_pedido: order.tipo_pedido, // Front agora deve enviar explicitamente
    items: items,
    isVip: order.is_vip,
    prepTime: totalPrepTime,
    started_at: order.started_at,
    comments: order.observacoes,
    deliveryTime: order.delivery_time,
    paymentMethod: order.metodo_pagamento,
    paymentStatus: order.status_pagamento || (order.pagamento_recebido_pelo_sistema ? 'pago' : 'pendente'),
    troco: parseFloat(order.troco) || 0,
    paymentType: order.metodo_pagamento || 'Não informado',
    taxa_entrega: parseFloat(order.taxa_entrega) || 0,
    desconto: parseFloat(order.desconto) || 0,
    endereco_rua: order.endereco_rua,
    endereco_numero: order.endereco_numero,
    endereco_bairro: order.endereco_bairro,
    endereco_cidade: order.endereco_cidade,
    endereco_referencia: order.endereco_referencia,
    endereco_complemento: order.endereco_complemento,
    nome_entregador: order.nome_entregador,
    id_entregador: order.id_entregador
  };
};

// Função para buscar todos os pedidos do restaurante logado
export async function fetchOrders() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o ID do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) throw new Error('Restaurante não encontrado');

    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .select(`
        id,
        numero_pedido,
        nome_cliente,
        tipo_pedido,
        status,
        valor_total,
        subtotal,
        criado_em,
        is_vip,
        mesa_numero,
        observacoes,
        metodo_pagamento,
        telefone_cliente,
        prep_time,
        started_at,
        pagamento_recebido_pelo_sistema,
        status_pagamento,
        troco,
        taxa_entrega,
        desconto,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_referencia,
        endereco_complemento,
        nome_entregador,
        id_entregador,
        itens_pedido!itens_pedido_id_pedido_fkey(
          id,
          quantidade,
          preco_unitario,
          preco_total,
          id_item_cardapio,
          itens_cardapio!fk_itens_pedido_itens_cardapio(nome, preco, tempo_preparo)
        )
      `)
      .eq('id_restaurante', restaurante.id)
      // Excluir pedidos de mesa (tipo_pedido = 'local') do dashboard principal
      .neq('tipo_pedido', 'local')
      // Filtrar apenas pedidos com status_pagamento válido (pago ou pendente)
      .in('status_pagamento', ['pago', 'pendente'])
      .in('status', ['pendente', 'novo', 'disponivel', 'aceito', 'pronto_para_entrega', 'coletado', 'concluido'])
      .order('criado_em', { ascending: false });
      
    if (error) throw error;
    return data.map(mapOrder);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    throw error;
  }
}

// Função para buscar um pedido específico
export async function fetchOrderById(id) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o ID do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) throw new Error('Restaurante não encontrado');

    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .select(`
        id,
        numero_pedido,
        nome_cliente,
        tipo_pedido,
        status,
        valor_total,
        subtotal,
        criado_em,
        is_vip,
        mesa_numero,
        observacoes,
        metodo_pagamento,
        telefone_cliente,
        prep_time,
        started_at,
        pagamento_recebido_pelo_sistema,
        status_pagamento,
        troco,
        taxa_entrega,
        desconto,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_referencia,
        endereco_complemento,
        nome_entregador,
        id_entregador,
        itens_pedido!itens_pedido_id_pedido_fkey(
          id,
          quantidade,
          preco_unitario,
          preco_total,
          id_item_cardapio,
          itens_cardapio!fk_itens_pedido_itens_cardapio(nome, preco, tempo_preparo)
        )
      `)
      .eq('id', id)
      .eq('id_restaurante', restaurante.id)
      // Filtrar apenas pedidos com status_pagamento válido (pago ou pendente)
      .in('status_pagamento', ['pago', 'pendente'])
      .in('status', ['pendente', 'novo', 'disponivel', 'aceito', 'pronto_para_entrega', 'coletado', 'concluido'])
      .single();
      
    if (error) throw error;
    return mapOrder(data);
  } catch (error) {
    console.error(`Erro ao buscar pedido ${id}:`, error);
    throw error;
  }
}

// Função para criar um novo pedido
export async function createOrder(order) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o ID do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) throw new Error('Restaurante não encontrado');

    // Validação obrigatória do tipo de pedido
    const providedTipo = order.tipo_pedido ?? order.tipoPedido;
    const allowedTipos = ['delivery', 'retirada', 'local'];
    if (!providedTipo) {
      throw new Error('Selecione o tipo de pedido antes de continuar.');
    }
    if (!allowedTipos.includes(providedTipo)) {
      throw new Error('Tipo de pedido inválido. Use delivery, retirada ou local.');
    }

    // Gerar número sequencial básico por restaurante (fallback)
    let numeroSequencial = null;
    let numeroPedidoCalc = null;
    try {
      const { data: ult, error: ultError } = await supabase
        .from('pedidos_padronizados')
        .select('numero_pedido, numero_pedido_sequencial')
        .eq('id_restaurante', restaurante.id)
        .order('numero_pedido_sequencial', { ascending: false })
        .limit(1);
      if (!ultError && Array.isArray(ult) && ult.length > 0) {
        numeroSequencial = (Number(ult[0]?.numero_pedido_sequencial) || 0) + 1;
        numeroPedidoCalc = (Number(ult[0]?.numero_pedido) || 0) + 1;
      } else {
        numeroSequencial = 1;
        numeroPedidoCalc = 1;
      }
    } catch (_) {}

    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .insert([{
        id_cliente: order.id_cliente ?? order.idCliente ?? null,
        id_restaurante: restaurante.id,
        id_entregador: order.id_entregador ?? order.idEntregador ?? null,
        numero_pedido: order.numero_pedido ?? order.numeroPedido ?? numeroPedidoCalc ?? 1,
        tipo_pedido: providedTipo,
        status: order.status ?? 'disponivel',
        valor_total: order.valor_total ?? order.total ?? 0,
        subtotal: order.subtotal ?? order.total ?? 0,
        taxa_entrega: order.taxa_entrega ?? order.taxaEntrega ?? 0,
        desconto: order.desconto ?? 0,
        metodo_pagamento: order.metodo_pagamento ?? order.paymentMethod ?? null,
        pagamento_recebido_pelo_sistema: order.pagamento_recebido_pelo_sistema ?? order.pagamentoRecebido ?? false,
        prep_time: order.prep_time ?? order.prepTime ?? null,
        delivery_time: order.delivery_time ?? order.deliveryTime ?? null,
        is_vip: order.is_vip ?? order.isVip ?? false,
        mesa_numero: order.mesa_numero ?? order.mesaNumero ?? null,
        observacoes: order.observacoes ?? null,
        numero_pedido_sequencial: order.numero_pedido_sequencial ?? numeroSequencial,
        criado_em: new Date().toISOString()
      }])
      .select();
      
    if (error) throw error;
    const fullOrder = await fetchOrderById(data[0].id);
    return fullOrder;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
}

// Função para atualizar um pedido
export async function updateOrder(id, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o ID do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) throw new Error('Restaurante não encontrado');

    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .update({
        status: updates.status,
        delivery_time: updates.deliveryTime,
        observacoes: updates.observacoes,
        delivered_at: updates.deliveredAt,
        pagamento_recebido_pelo_sistema: updates.pagamentoRecebido,
        id_entregador: updates.idEntregador,
        started_at: updates.status === 'aceito' ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .eq('id_restaurante', restaurante.id)
      .select();
      
    if (error) throw error;
    const fullOrder = await fetchOrderById(id);
    return fullOrder;
  } catch (error) {
    console.error(`Erro ao atualizar pedido ${id}:`, error);
    throw error;
  }
}

// Função para excluir um pedido
export async function deleteOrder(id) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o ID do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) throw new Error('Restaurante não encontrado');

    const { error } = await supabase
      .from('pedidos_padronizados')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restaurante.id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao excluir pedido ${id}:`, error);
    throw error;
  }
}

// Função para finalizar pedido e liberar mesa
export async function finalizeOrder(orderId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o pedido
    const order = await fetchOrderById(orderId);
    
    // Atualizar status do pedido
    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .update({ status: 'finalizado' })
      .eq('id', orderId)
      .select();
    if (error) throw error;

    // Se for pedido de mesa, liberar a mesa
    if (order.mesa_numero) {
      const { data: table } = await supabase
        .from('mesas')
        .select('id')
        .eq('numero', order.mesa_numero)
        .eq('id_pedido', orderId)
        .single();

      if (table) {
        await supabase
          .from('mesas')
          .update({
            status: 'disponivel',
            id_pedido: null,
            started_at: null
          })
          .eq('id', table.id);
      }
    }

    return data[0];
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    throw error;
  }
}

// Adicionar item ao pedido (mesa ou delivery)
export async function addItemToOrder({ orderId, restaurantId, menuItemId, quantity, note }) {
  try {
    const qty = Number(quantity || 1);
    if (!orderId) throw new Error('Pedido não informado');
    if (!restaurantId) throw new Error('Restaurante não informado');
    if (!menuItemId) throw new Error('Item do cardápio não informado');

    const { data: cardapioItem, error: cardapioError } = await supabase
      .from('itens_cardapio')
      .select('id, preco')
      .eq('id', menuItemId)
      .eq('id_restaurante', restaurantId)
      .single();
    if (cardapioError) throw cardapioError;
    const precoUnit = Number(cardapioItem?.preco || 0);

    const basePayload = {
      id_pedido: orderId,
      id_item_cardapio: menuItemId,
      quantidade: qty,
      preco_unitario: precoUnit,
      id_restaurante: restaurantId,
    };

    if (note && note.trim()) {
      const { error: errWithNote } = await supabase
        .from('itens_pedido')
        .insert([{ ...basePayload, observacao_item: note }]);
      if (errWithNote) {
        const { error: errFallback } = await supabase
          .from('itens_pedido')
          .insert([basePayload]);
        if (errFallback) throw errFallback;
      }
    } else {
      const { error: insertError } = await supabase
        .from('itens_pedido')
        .insert([basePayload]);
      if (insertError) throw insertError;
    }

    const { data: sumData, error: sumError } = await supabase
      .from('itens_pedido')
      .select('quantidade, preco_unitario, preco_total')
      .eq('id_pedido', orderId);
    if (sumError) throw sumError;

    const subtotal = (sumData || []).reduce((acc, it) => {
      const linha = it.preco_total != null ? Number(it.preco_total) : Number(it.quantidade||0) * Number(it.preco_unitario||0);
      return acc + linha;
    }, 0);

    const { error: updError } = await supabase
      .from('pedidos_padronizados')
      .update({ subtotal, valor_total: subtotal })
      .eq('id', orderId);
    if (updError) throw updError;

    return { success: true, subtotal };
  } catch (error) {
    console.error('Erro ao adicionar item ao pedido:', error);
    throw error;
  }
}

// Remover item do pedido e recalcular total
export async function removeItemFromOrder({ orderItemId, orderId }) {
  try {
    if (!orderItemId) throw new Error('Item do pedido não informado');
    if (!orderId) throw new Error('Pedido não informado');

    const { error: delError } = await supabase
      .from('itens_pedido')
      .delete()
      .eq('id', orderItemId);
    if (delError) throw delError;

    const { data: sumData, error: sumError } = await supabase
      .from('itens_pedido')
      .select('quantidade, preco_unitario, preco_total')
      .eq('id_pedido', orderId);
    if (sumError) throw sumError;

    const subtotal = (sumData || []).reduce((acc, it) => {
      const linha = it.preco_total != null ? Number(it.preco_total) : Number(it.quantidade||0) * Number(it.preco_unitario||0);
      return acc + linha;
    }, 0);

    const { error: updError } = await supabase
      .from('pedidos_padronizados')
      .update({ subtotal, valor_total: subtotal })
      .eq('id', orderId);
    if (updError) throw updError;

    return { success: true, subtotal };
  } catch (error) {
    console.error('Erro ao remover item do pedido:', error);
    throw error;
  }
}