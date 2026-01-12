import { supabase } from '../lib/supabase';

/**
 * Busca todos os cupons do restaurante
 */
export async function fetchCupons(restauranteId, filters = {}) {
  try {
    let query = supabase
      .from('cupons')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .order('criado_em', { ascending: false });

    if (filters.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
    }

    if (filters.tipo_desconto) {
      query = query.eq('tipo_desconto', filters.tipo_desconto);
    }

    if (filters.search) {
      query = query.or(`codigo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      // Se a tabela não existir, retornar erro amigável
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('A tabela de cupons ainda não foi criada no banco de dados. Execute o script criar_tabela_cupons.sql no Supabase.');
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    throw error;
  }
}

/**
 * Busca cupons ativos para o cliente
 */
export async function fetchCuponsAtivos(restauranteId) {
  const { data, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('id_restaurante', restauranteId)
    .eq('ativo', true)
    .lte('data_inicio', new Date().toISOString())
    .or(`data_fim.is.null,data_fim.gte.${new Date().toISOString()}`)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Cria um novo cupom
 */
export async function createCupom(payload) {
  const { data, error } = await supabase
    .from('cupons')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualiza um cupom
 */
export async function updateCupom(cupomId, payload) {
  const { data, error } = await supabase
    .from('cupons')
    .update(payload)
    .eq('id', cupomId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deleta um cupom
 */
export async function deleteCupom(cupomId) {
  const { error } = await supabase
    .from('cupons')
    .delete()
    .eq('id', cupomId);

  if (error) throw error;
}

/**
 * Valida um cupom (chama a função SQL)
 */
export async function validarCupom(codigo, clienteId, restauranteId, valorPedido, itensPedido = null) {
  const { data, error } = await supabase.rpc('validar_cupom', {
    p_codigo: codigo,
    p_cliente_id: clienteId,
    p_restaurante_id: restauranteId,
    p_valor_pedido: valorPedido,
    p_itens_pedido: itensPedido
  });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Registra o uso de um cupom
 */
export async function registrarUsoCupom(cupomId, clienteId, pedidoId, valorPedido, valorDescontoAplicado) {
  const { data, error } = await supabase.rpc('registrar_uso_cupom', {
    p_cupom_id: cupomId,
    p_cliente_id: clienteId,
    p_pedido_id: pedidoId,
    p_valor_pedido: valorPedido,
    p_valor_desconto_aplicado: valorDescontoAplicado
  });

  if (error) throw error;
  return data;
}

/**
 * Busca histórico de uso de um cupom
 */
export async function fetchHistoricoUsoCupom(cupomId) {
  const { data, error } = await supabase
    .from('cupons_uso')
    .select(`
      *,
      cliente:clientes_app!cupons_uso_cliente_id_fkey(nome, telefone),
      pedido:pedidos_padronizados(numero_pedido, valor_total)
    `)
    .eq('cupom_id', cupomId)
    .order('usado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Busca estatísticas de um cupom
 */
export async function fetchEstatisticasCupom(cupomId) {
  const { data, error } = await supabase
    .from('cupons_uso')
    .select('valor_desconto_aplicado, valor_pedido')
    .eq('cupom_id', cupomId);

  if (error) throw error;

  const usos = data || [];
  const totalUsos = usos.length;
  const totalDescontoAplicado = usos.reduce((sum, u) => sum + Number(u.valor_desconto_aplicado || 0), 0);
  const totalVendas = usos.reduce((sum, u) => sum + Number(u.valor_pedido || 0), 0);
  const ticketMedio = totalUsos > 0 ? totalVendas / totalUsos : 0;

  return {
    totalUsos,
    totalDescontoAplicado,
    totalVendas,
    ticketMedio
  };
}

/**
 * Duplica um cupom (útil para criar variações)
 */
export async function duplicarCupom(cupomId, novoCodigo) {
  // Buscar cupom original
  const { data: original, error: fetchError } = await supabase
    .from('cupons')
    .select('*')
    .eq('id', cupomId)
    .single();

  if (fetchError) throw fetchError;

  // Criar novo cupom com dados do original
  const { id, codigo, criado_em, atualizado_em, uso_atual, ...dadosCupom } = original;

  const novoCupom = {
    ...dadosCupom,
    codigo: novoCodigo,
    uso_atual: 0
  };

  return await createCupom(novoCupom);
}

/**
 * Ativa/Desativa um cupom
 */
export async function toggleCupomAtivo(cupomId, ativo) {
  return await updateCupom(cupomId, { ativo });
}

/**
 * Busca cupons que estão prestes a expirar (próximos 7 dias)
 */
export async function fetchCuponsExpirando(restauranteId) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + 7);

  const { data, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('id_restaurante', restauranteId)
    .eq('ativo', true)
    .not('data_fim', 'is', null)
    .lte('data_fim', dataLimite.toISOString())
    .gte('data_fim', new Date().toISOString())
    .order('data_fim', { ascending: true });

  if (error) throw error;
  return data || [];
}
