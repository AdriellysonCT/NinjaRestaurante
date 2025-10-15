import { supabase } from '../lib/supabase';

// Helper para obter o id do restaurante (tabela restaurantes_app)
async function getRestauranteIdOrThrow() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('restaurantes_app')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !data?.id) throw new Error('Restaurante não encontrado');
  return data.id;
}

// Função para buscar resumo financeiro
export async function fetchFinancialSummary(startDate = null, endDate = null, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    // Se não fornecidas, usar o mês atual
    if (!startDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (!endDate) {
      const now = new Date();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    // Chamar função do banco para calcular resumo
    const { data, error } = await supabase.rpc('calcular_resumo_financeiro', {
      p_id_restaurante: restauranteId,
      p_data_inicio: startDate,
      p_data_fim: endDate
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    throw error;
  }
}

// Função para buscar transações financeiras
export async function fetchTransactions(filters = {}, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    let query = supabase
      .from('transacoes_financeiras')
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor, icone)
      `)
      .eq('id_restaurante', restauranteId)
      .order('data_transacao', { ascending: false });

    // Aplicar filtros
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo);
    }
    if (filters.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('data_transacao', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('data_transacao', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
}

// Função para criar transação financeira
export async function createTransaction(transaction, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('transacoes_financeiras')
      .insert([{
        ...transaction,
        id_restaurante: restauranteId
      }])
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor, icone)
      `);

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    throw error;
  }
}

// Função para atualizar transação financeira
export async function updateTransaction(id, updates, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('transacoes_financeiras')
      .update(updates)
      .eq('id', id)
      .eq('id_restaurante', restauranteId)
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor, icone)
      `);

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    throw error;
  }
}

// Função para excluir transação financeira
export async function deleteTransaction(id, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { error } = await supabase
      .from('transacoes_financeiras')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restauranteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    throw error;
  }
}

// Função para buscar categorias financeiras
export async function fetchFinancialCategories(tipo = null, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    let query = supabase
      .from('categorias_financeiras')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .eq('ativa', true)
      .order('nome');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar categorias financeiras:', error);
    throw error;
  }
}

// Função para criar categoria financeira
export async function createFinancialCategory(category, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('categorias_financeiras')
      .insert([{
        ...category,
        id_restaurante: restauranteId
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar categoria financeira:', error);
    throw error;
  }
}

// Função para buscar fornecedores
export async function fetchSuppliers(restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    throw error;
  }
}

// Função para criar fornecedor
export async function createSupplier(supplier, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('fornecedores')
      .insert([{
        ...supplier,
        id_restaurante: restauranteId
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    throw error;
  }
}

// Atualizar fornecedor
export async function updateSupplier(id, updates, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();
    const { data, error } = await supabase
      .from('fornecedores')
      .update(updates)
      .eq('id', id)
      .eq('id_restaurante', restauranteId)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw error;
  }
}

// Excluir fornecedor
export async function deleteSupplier(id, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restauranteId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    throw error;
  }
}

// Função para buscar contas a pagar/receber
export async function fetchAccounts(tipo = null, status = null, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    let query = supabase
      .from('contas')
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor),
        fornecedor:fornecedores(nome)
      `)
      .eq('id_restaurante', restauranteId)
      .order('data_vencimento');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    throw error;
  }
}

// Função para criar conta a pagar/receber
export async function createAccount(account, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('contas')
      .insert([{
        ...account,
        id_restaurante: restauranteId
      }])
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor),
        fornecedor:fornecedores(nome)
      `);

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    throw error;
  }
}

// Atualizar conta a pagar/receber
export async function updateAccount(id, updates, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('contas')
      .update(updates)
      .eq('id', id)
      .eq('id_restaurante', restauranteId)
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor),
        fornecedor:fornecedores(nome)
      `);

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    throw error;
  }
}

// Excluir conta
export async function deleteAccount(id, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();
    const { error } = await supabase
      .from('contas')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restauranteId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    throw error;
  }
}

// Função para marcar conta como paga
export async function payAccount(id, paymentData, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    // Atualizar conta
    const { data: conta, error: contaError } = await supabase
      .from('contas')
      .update({
        status: 'paga',
        data_pagamento: paymentData.data_pagamento || new Date().toISOString().split('T')[0],
        valor_pago: paymentData.valor_pago,
        forma_pagamento: paymentData.forma_pagamento,
        observacoes: paymentData.observacoes
      })
      .eq('id', id)
      .eq('id_restaurante', restauranteId)
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor),
        fornecedor:fornecedores(nome)
      `);

    if (contaError) throw contaError;

    // Criar transação financeira correspondente
    if (conta[0]) {
      await createTransaction({
        descricao: `Pagamento: ${conta[0].descricao}`,
        valor: paymentData.valor_pago,
        tipo: conta[0].tipo === 'pagar' ? 'saida' : 'entrada',
        categoria_id: conta[0].categoria_id,
        data_transacao: paymentData.data_pagamento || new Date().toISOString().split('T')[0],
        forma_pagamento: paymentData.forma_pagamento,
        observacoes: `Ref. conta #${conta[0].id}`,
        status: 'confirmada'
      }, restauranteId);
    }

    return conta[0];
  } catch (error) {
    console.error('Erro ao pagar conta:', error);
    throw error;
  }
}

// Função para buscar metas financeiras
export async function fetchFinancialGoals(restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .eq('ativa', true)
      .order('ano_referencia', { ascending: false })
      .order('mes_referencia');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar metas financeiras:', error);
    throw error;
  }
}

// Função para criar meta financeira
export async function createFinancialGoal(goal, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    const { data, error } = await supabase
      .from('metas_financeiras')
      .insert([{
        ...goal,
        id_restaurante: restauranteId
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar meta financeira:', error);
    throw error;
  }
}

// Atualizar meta
export async function updateFinancialGoal(id, updates, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();
    const { data, error } = await supabase
      .from('metas_financeiras')
      .update(updates)
      .eq('id', id)
      .eq('id_restaurante', restauranteId)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar meta financeira:', error);
    throw error;
  }
}

// Excluir meta
export async function deleteFinancialGoal(id, restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();
    const { error } = await supabase
      .from('metas_financeiras')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restauranteId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir meta financeira:', error);
    throw error;
  }
}

// Função para registrar venda do POS automaticamente
export async function registerSaleTransaction(order, restauranteIdParam = null) {
  try {
    const restauranteId = order?.id_restaurante || restauranteIdParam || await getRestauranteIdOrThrow();

    // Buscar categoria de vendas baseada no tipo de pedido
    const { data: categories } = await supabase
      .from('categorias_financeiras')
      .select('id')
      .eq('id_restaurante', restauranteId)
      .eq('tipo', 'entrada')
      .ilike('nome', order.type === 'delivery' ? '%delivery%' : 
                    order.type === 'comanda' ? '%comanda%' : '%balcão%')
      .limit(1);

    const categoria_id = categories && categories.length > 0 ? categories[0].id : null;

    // Criar transação de venda
    const transaction = {
      descricao: `Venda ${order.type === 'delivery' ? 'Delivery' : 
                          order.type === 'comanda' ? `Mesa ${order.comandaNumero}` : 'Balcão'} - ${order.customerName}`,
      valor: order.total,
      tipo: 'entrada',
      categoria_id,
      data_transacao: new Date().toISOString().split('T')[0],
      forma_pagamento: order.paymentMethod,
      observacoes: `Pedido #${order.id}`,
      pedido_id: order.id,
      status: 'confirmada'
    };

    return await createTransaction(transaction, restauranteId);
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    // Não falhar o pedido se não conseguir registrar a transação
    return null;
  }
}

// Função para obter dados para gráficos
export async function getChartData(period = 'month', restauranteIdParam = null) {
  try {
    const restauranteId = restauranteIdParam || await getRestauranteIdOrThrow();

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Buscar transações do período
    const { data: transactions, error } = await supabase
      .from('transacoes_financeiras')
      .select(`
        *,
        categoria:categorias_financeiras(nome, cor)
      `)
      .eq('id_restaurante', restauranteId)
      .eq('status', 'confirmada')
      .gte('data_transacao', startDate.toISOString().split('T')[0])
      .lte('data_transacao', endDate.toISOString().split('T')[0])
      .order('data_transacao');

    if (error) throw error;

    // Processar dados para gráficos
    const dailyData = {};
    const categoryData = { entradas: {}, saidas: {} };

    transactions.forEach(transaction => {
      const date = transaction.data_transacao;
      const category = transaction.categoria?.nome || 'Sem categoria';
      
      // Dados diários
      if (!dailyData[date]) {
        dailyData[date] = { entradas: 0, saidas: 0, saldo: 0 };
      }
      
      if (transaction.tipo === 'entrada') {
        dailyData[date].entradas += parseFloat(transaction.valor);
      } else {
        dailyData[date].saidas += parseFloat(transaction.valor);
      }
      dailyData[date].saldo = dailyData[date].entradas - dailyData[date].saidas;
      
      // Dados por categoria
      if (!categoryData[transaction.tipo][category]) {
        categoryData[transaction.tipo][category] = {
          valor: 0,
          cor: transaction.categoria?.cor || '#6B7280'
        };
      }
      categoryData[transaction.tipo][category].valor += parseFloat(transaction.valor);
    });

    return {
      daily: Object.entries(dailyData).map(([date, values]) => ({
        date,
        ...values
      })),
      categories: categoryData,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };
  } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    throw error;
  }
}