import { supabase } from '../lib/supabase';

// Adicionar item à mesa
export async function addItemToMesa(mesaId, itemCardapioId, quantidade, observacao = '') {
  try {
    // Buscar preço atual do item
    const { data: item, error: itemError } = await supabase
      .from('itens_cardapio')
      .select('preco')
      .eq('id', itemCardapioId)
      .single();

    if (itemError) throw itemError;

    const { data, error } = await supabase
      .from('itens_mesa')
      .insert([{
        id_mesa: mesaId,
        id_item_cardapio: itemCardapioId,
        quantidade: quantidade,
        preco_unitario: item.preco,
        observacao: observacao
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao adicionar item à mesa:', error);
    throw error;
  }
}

// Buscar itens da mesa
export async function fetchMesaItems(mesaId) {
  try {
    const { data, error } = await supabase
      .from('itens_mesa')
      .select('id, quantidade, preco_unitario, observacao, id_item_cardapio')
      .eq('id_mesa', mesaId);

    if (error) throw error;

    // Buscar dados dos itens do cardápio separadamente
    if (data && data.length > 0) {
      const itemIds = data.map(item => item.id_item_cardapio);
      const { data: cardapioItems, error: cardapioError } = await supabase
        .from('itens_cardapio')
        .select('id, nome, preco')
        .in('id', itemIds);

      if (cardapioError) throw cardapioError;

      // Mapear os dados
      const cardapioMap = cardapioItems.reduce((map, item) => {
        map[item.id] = item;
        return map;
      }, {});

      return data.map(item => ({
        ...item,
        itens_cardapio: cardapioMap[item.id_item_cardapio]
      }));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar itens da mesa:', error);
    throw error;
  }
}

// Remover item da mesa
export async function removeItemFromMesa(itemMesaId) {
  try {
    const { error } = await supabase
      .from('itens_mesa')
      .delete()
      .eq('id', itemMesaId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao remover item da mesa:', error);
    throw error;
  }
}

// Atualizar quantidade do item
export async function updateMesaItemQuantity(itemMesaId, novaQuantidade) {
  try {
    const { data, error } = await supabase
      .from('itens_mesa')
      .update({ quantidade: novaQuantidade })
      .eq('id', itemMesaId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    throw error;
  }
}

// Limpar todos os itens da mesa
export async function clearMesaItems(mesaId) {
  try {
    const { error } = await supabase
      .from('itens_mesa')
      .delete()
      .eq('id_mesa', mesaId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao limpar itens da mesa:', error);
    throw error;
  }
}

// Finalizar mesa e criar pedido
export async function finalizarMesa(mesaId, metodoPagamento, nomeCliente = '') {
  try {
    // 1. Buscar itens da mesa
    const itens = await fetchMesaItems(mesaId);
    
    if (itens.length === 0) {
      throw new Error('Não há itens na mesa para finalizar');
    }

    // 2. Buscar dados da mesa
    const { data: mesa, error: mesaError } = await supabase
      .from('mesas')
      .select('numero, id_restaurante')
      .eq('id', mesaId)
      .single();

    if (mesaError) throw mesaError;

    // 3. Calcular total
    const total = itens.reduce((sum, item) => {
      return sum + (item.quantidade * item.preco_unitario);
    }, 0);

    // 4. Criar pedido como CONCLUÍDO
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_padronizados')
      .insert([{
        id_restaurante: mesa.id_restaurante,
        nome_cliente: nomeCliente || `Mesa ${mesa.numero}`,
        tipo_pedido: 'local',
        status: 'concluido', // JÁ FINALIZADO
        mesa_numero: mesa.numero.toString(),
        valor_total: total,
        subtotal: total,
        metodo_pagamento: metodoPagamento,
        pagamento_recebido_pelo_sistema: true,
        status_pagamento: 'pago'
      }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // 5. Criar itens do pedido
    const itensPedido = itens.map(item => ({
      id_pedido: pedido.id,
      id_item_cardapio: item.itens_cardapio.id,
      id_restaurante: mesa.id_restaurante,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      observacao_item: item.observacao
    }));

    const { error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensPedido);

    if (itensError) throw itensError;

    // 6. Limpar itens da mesa
    await clearMesaItems(mesaId);

    // 7. Liberar mesa
    const { error: updateError } = await supabase
      .from('mesas')
      .update({
        status: 'disponivel',
        id_pedido: null,
        started_at: null
      })
      .eq('id', mesaId);

    if (updateError) throw updateError;

    return pedido;
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    throw error;
  }
}
