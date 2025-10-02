import { supabase } from '../lib/supabase';

// Função para buscar todas as mesas do restaurante
export async function fetchTables() {
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

    // Buscar mesas sem join, depois buscar pedidos separadamente
    const { data: mesas, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('id_restaurante', restaurante.id)
      .order('numero', { ascending: true });

    if (error) throw error;

    // Se houver mesas com pedidos, buscar os pedidos relacionados
    if (mesas && mesas.length > 0) {
      const mesasComPedidos = mesas.filter(mesa => mesa.id_pedido);
      
      if (mesasComPedidos.length > 0) {
        const pedidoIds = mesasComPedidos.map(mesa => mesa.id_pedido);
        
        const { data: pedidos, error: pedidosError } = await supabase
          .from('pedidos_padronizados')
          .select('*')
          .in('id', pedidoIds);

        if (pedidosError) {
          console.warn('Erro ao buscar pedidos relacionados:', pedidosError);
        } else if (pedidos && pedidos.length > 0) {
          // Associar pedidos às mesas
          const pedidosMap = pedidos.reduce((map, pedido) => {
            map[pedido.id] = pedido;
            return map;
          }, {});

          mesas.forEach(mesa => {
            if (mesa.id_pedido && pedidosMap[mesa.id_pedido]) {
              mesa.pedido = pedidosMap[mesa.id_pedido];
            }
          });
        }
      }
    }

    const data = mesas;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    throw error;
  }
}

// Função para atualizar status da mesa
export async function updateTableStatus(tableId, status, updates = {}) {
  try {
    const updateData = { status, ...updates };

    // Se estiver mudando para disponível, limpar dados de ocupação
    if (status === 'disponivel') {
      updateData.started_at = null;
      updateData.id_pedido = null;
    }

    const { data, error } = await supabase
      .from('mesas')
      .update(updateData)
      .eq('id', tableId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    throw error;
  }
}

// Função para criar nova mesa
export async function createTable(tableData) {
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
      .from('mesas')
      .insert([{
        ...tableData,
        id_restaurante: restaurante.id,
        status: 'disponivel'
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    throw error;
  }
}

// Função para liberar mesa quando o pedido for finalizado
export async function releaseTable(tableId) {
  try {
    const { data, error } = await supabase
      .from('mesas')
      .update({
        status: 'disponivel',
        id_pedido: null,
        started_at: null
      })
      .eq('id', tableId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao liberar mesa:', error);
    throw error;
  }
}

// Função para associar pedido à mesa
export async function associateOrderToTable(tableId, orderId) {
  try {
    const { data, error } = await supabase
      .from('mesas')
      .update({
        id_pedido: orderId,
        status: 'ocupada',
        started_at: new Date().toISOString()
      })
      .eq('id', tableId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao associar pedido à mesa:', error);
    throw error;
  }
}