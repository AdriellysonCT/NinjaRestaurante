import { supabase } from '../lib/supabase';

/**
 * Busca o último fechamento de caixa do restaurante
 */
export async function fetchUltimoFechamento(restauranteId) {
  const { data, error } = await supabase
    .from('fechamentos_caixa')
    .select('*')
    .eq('id_usuario', restauranteId)
    .eq('tipo_usuario', 'restaurante')
    .order('data_fechamento', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

/**
 * Busca todas as movimentações desde o último fechamento ou início do dia
 */
export async function fetchMovimentacoesPeriodo(idCarteira, dataInicio) {
  const { data, error } = await supabase
    .from('movimentacoes_carteira')
    .select('*')
    .eq('id_carteira', idCarteira)
    .eq('tipo', 'entrada')
    .eq('origem', 'pedido')
    .eq('status', 'confirmado')
    .gte('criado_em', dataInicio);

  if (error) throw error;
  return data || [];
}

/**
 * Calcula os valores do fechamento
 */
export function calcularValoresFechamento(movimentacoes, taxaPlataformaPercent = 10) {
  const totalBruto = movimentacoes.reduce((sum, m) => sum + Number(m.valor || 0), 0);
  const taxaPlataforma = totalBruto * (taxaPlataformaPercent / 100);
  
  // Calcular taxas de entrega (se houver campo específico)
  const taxaEntrega = movimentacoes.reduce((sum, m) => sum + Number(m.taxa_entrega || 0), 0);
  
  const totalDescontos = taxaPlataforma + taxaEntrega;
  const totalLiquido = totalBruto - totalDescontos;
  
  return {
    totalBruto,
    taxaPlataforma,
    taxaEntrega,
    totalDescontos,
    totalLiquido,
    qtdTransacoes: movimentacoes.length
  };
}

/**
 * Cria um novo fechamento de caixa
 */
export async function criarFechamento(payload) {
  const { data, error } = await supabase
    .from('fechamentos_caixa')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Busca todos os fechamentos do restaurante
 */
export async function fetchFechamentos(restauranteId, filters = {}) {
  let query = supabase
    .from('fechamentos_caixa')
    .select('*')
    .eq('id_usuario', restauranteId)
    .eq('tipo_usuario', 'restaurante')
    .order('data_fechamento', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('data_fechamento', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('data_fechamento', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Busca a carteira do restaurante
 */
export async function fetchCarteiraRestaurante(restauranteId) {
  const { data, error } = await supabase
    .from('carteiras')
    .select('id')
    .eq('id_usuario', restauranteId)
    .eq('tipo_usuario', 'restaurante')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verifica se há pedidos em andamento (não confirmados)
 */
export async function verificarPedidosEmAndamento(restauranteId) {
  const { data, error } = await supabase
    .from('pedidos_padronizados')
    .select('id')
    .eq('restaurante_id', restauranteId)
    .in('status', ['pendente', 'preparando', 'pronto'])
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}
