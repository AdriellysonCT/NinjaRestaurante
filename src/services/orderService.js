import { supabase } from '../lib/supabase';

const mapOrder = (order) => {
  const items = (order.itens_pedido || []).map(item => ({
    name: item.itens_cardapio?.nome || 'Item desconhecido',
    qty: item.quantidade || 0,
    price: parseFloat(item.itens_cardapio?.preco) || 0,
    note: item.observacao_item || '',
    prepTime: item.itens_cardapio?.tempo_preparo || 0
  }));

  // Calculate total prep time by summing up prepTime of all items
  const totalPrepTime = items.reduce((sum, item) => sum + item.prepTime, 0);

  return {
    id: order.id,
    numero_pedido: order.numero_pedido || order.id.substring(0, 8),
    customerName: order.clientes_app?.nome || 'Anônimo',
    customerPhone: order.telefone_cliente || order.clientes_app?.telefone || 'Telefone não cadastrado',
    timestamp: order.criado_em,
    total: parseFloat(order.valor_total) || 0,
    status: order.status,
    items: items,
    isVip: order.is_vip,
    prepTime: totalPrepTime,
    started_at: order.started_at,
    comments: order.observacoes,
    deliveryTime: order.delivery_time,
    paymentMethod: order.metodo_pagamento
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
        status,
        valor_total,
        criado_em,
        is_vip,
        mesa_numero,
        observacoes,
        metodo_pagamento,
        telefone_cliente,
        prep_time,
        started_at,
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
      .in('status', ['disponivel', 'aceito', 'em_preparo', 'pronto_para_entrega', 'a_caminho'])
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
        status,
        valor_total,
        criado_em,
        is_vip,
        mesa_numero,
        observacoes,
        metodo_pagamento,
        telefone_cliente,
        prep_time,
        started_at,
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
      .in('status', ['disponivel', 'aceito', 'em_preparo', 'pronto_para_entrega', 'a_caminho'])
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

    const { data, error } = await supabase
      .from('pedidos_padronizados')
      .insert([{
        id_cliente: order.idCliente || null,
        id_restaurante: restaurante.id,
        id_entregador: order.idEntregador || null,
        numero_pedido: order.numeroPedido,
        tipo_pedido: order.tipoPedido || 'delivery',
        status: order.status || 'disponivel',
        total: order.total,
        subtotal: order.subtotal,
        taxa_entrega: order.taxaEntrega || 0,
        desconto: order.desconto || 0,
        payment_method: order.paymentMethod,
        pagamento_recebido_pelo_sistema: order.pagamentoRecebido || false,
        prep_time: order.prepTime || 30,
        delivery_time: order.deliveryTime || null,
        is_vip: order.isVip || false,
        mesa_numero: order.mesaNumero,
        observacoes: order.observacoes
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