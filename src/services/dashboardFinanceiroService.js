import { supabase } from '../lib/supabase.js';

/**
 * Serviço para Dashboard Financeiro baseado em pedidos
 * Integra com a tabela pedidos_padronizados do Supabase
 */

// Função para buscar resumo financeiro de pedidos
export async function fetchPedidosFinanceiros(restauranteId, periodo = 'hoje') {
  try {
    if (!restauranteId) {
      throw new Error('ID do restaurante é obrigatório');
    }

    // Definir período de consulta
    const agora = new Date();
    let dataInicio, dataFim;

    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
        break;
      case 'semana':
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        dataInicio = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
        dataFim = agora;
        break;
      case 'mes':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        dataFim = agora;
        break;
      case 'ano':
        dataInicio = new Date(agora.getFullYear(), 0, 1);
        dataFim = agora;
        break;
      default:
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        dataFim = agora;
    }

    // Buscar pedidos concluídos do período
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos_padronizados")
      .select("valor_total, metodo_pagamento, criado_em, status, tipo_pedido")
      .eq("id_restaurante", restauranteId)
      .in("status", ["entregue"]) // considerar apenas pedidos entregues para faturamento
      .gte("criado_em", dataInicio.toISOString())
      .lte("criado_em", dataFim.toISOString())
      .order("criado_em", { ascending: false });

    if (pedidosError) {
      throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
    }

    return {
      pedidos: pedidos || [],
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
        tipo: periodo
      }
    };

  } catch (error) {
    console.error('Erro ao buscar dados financeiros de pedidos:', error);
    throw error;
  }
}

// Função para processar dados financeiros
export function processarDadosFinanceiros(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    return {
      totalPedidos: 0,
      totalFaturado: 0,
      porMetodoPagamento: {},
      porTipoPedido: {},
      ticketMedio: 0,
      pedidosPorDia: {}
    };
  }

  let totalFaturado = 0;
  let porMetodo = {};
  let porTipo = {};
  let pedidosPorDia = {};

  pedidos.forEach(pedido => {
    const valor = parseFloat(pedido.valor_total) || 0;
    totalFaturado += valor;
    
    // Agrupar por método de pagamento
    const metodo = pedido.metodo_pagamento || 'Não informado';
    porMetodo[metodo] = (porMetodo[metodo] || 0) + valor;
    
    // Agrupar por tipo de pedido
    const tipo = pedido.tipo_pedido || 'Não informado';
    porTipo[tipo] = (porTipo[tipo] || 0) + valor;
    
    // Agrupar por dia
    const dia = (pedido.criado_em || '').split('T')[0];
    if (!pedidosPorDia[dia]) {
      pedidosPorDia[dia] = { quantidade: 0, valor: 0 };
    }
    pedidosPorDia[dia].quantidade += 1;
    pedidosPorDia[dia].valor += valor;
  });

  const ticketMedio = pedidos.length > 0 ? totalFaturado / pedidos.length : 0;

  return {
    totalPedidos: pedidos.length,
    totalFaturado,
    porMetodoPagamento: porMetodo,
    porTipoPedido: porTipo,
    ticketMedio,
    pedidosPorDia
  };
}

// Função para buscar dados de comparação (período anterior)
export async function fetchDadosComparacao(restauranteId, periodo = 'hoje') {
  try {
    const agora = new Date();
    let dataInicio, dataFim;

    switch (periodo) {
      case 'hoje':
        // Ontem
        const ontem = new Date(agora);
        ontem.setDate(agora.getDate() - 1);
        dataInicio = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
        dataFim = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59);
        break;
      case 'semana':
        // Semana anterior
        const semanaAnterior = new Date(agora);
        semanaAnterior.setDate(agora.getDate() - 14);
        const inicioSemanaAnterior = new Date(semanaAnterior);
        inicioSemanaAnterior.setDate(semanaAnterior.getDate() - semanaAnterior.getDay());
        dataInicio = new Date(inicioSemanaAnterior.getFullYear(), inicioSemanaAnterior.getMonth(), inicioSemanaAnterior.getDate());
        dataFim = new Date(inicioSemanaAnterior);
        dataFim.setDate(inicioSemanaAnterior.getDate() + 6);
        break;
      case 'mes':
        // Mês anterior
        const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        dataInicio = mesAnterior;
        dataFim = new Date(agora.getFullYear(), agora.getMonth(), 0);
        break;
      default:
        return null;
    }

    const { data: pedidos, error } = await supabase
      .from("pedidos_padronizados")
      .select("valor_total, metodo_pagamento, criado_em")
      .eq("id_restaurante", restauranteId)
      .in("status", ["entregue"]) // período anterior, também só entregues
      .gte("criado_em", dataInicio.toISOString())
      .lte("criado_em", dataFim.toISOString());

    if (error) {
      console.warn('Erro ao buscar dados de comparação:', error);
      return null;
    }

    return processarDadosFinanceiros(pedidos || []);

  } catch (error) {
    console.warn('Erro ao buscar dados de comparação:', error);
    return null;
  }
}

// Função para calcular crescimento percentual
export function calcularCrescimento(valorAtual, valorAnterior) {
  if (!valorAnterior || valorAnterior === 0) {
    return valorAtual > 0 ? 100 : 0;
  }
  
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

// Função para buscar top produtos/itens mais vendidos
export async function fetchTopItens(restauranteId, periodo = 'mes', limite = 5) {
  try {
    const agora = new Date();
    let dataInicio;

    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        break;
      case 'semana':
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        dataInicio = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
        break;
      case 'mes':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        break;
      default:
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    }

    // Buscar itens dos pedidos (se houver tabela de itens)
    const { data: itens, error } = await supabase
      .from("itens_pedido")
      .select(`
        quantidade,
        preco_unitario,
        preco_total,
        itens_cardapio:itens_cardapio!fk_itens_pedido_itens_cardapio(
          nome,
          preco
        ),
        pedido:pedidos_padronizados!inner(
          criado_em,
          status,
          id_restaurante
        )
      `)
      .eq("pedido.id_restaurante", restauranteId)
      .in("pedido.status", ["entregue"]) // top itens com base em pedidos entregues
      .gte("pedido.criado_em", dataInicio.toISOString())
      .lte("pedido.criado_em", agora.toISOString());

    if (error) {
      console.warn('Erro ao buscar top itens:', error);
      return [];
    }

    // Processar dados dos itens
    const itensAgrupados = {};
    
    if (itens && itens.length > 0) {
      itens.forEach(item => {
        const nome = item?.itens_cardapio?.nome || 'Item';
        if (!itensAgrupados[nome]) {
          itensAgrupados[nome] = {
            nome,
            quantidade: 0,
            faturamento: 0
          };
        }
        
        const qtd = parseInt(item.quantidade) || 0;
        const precoBase = (item.preco_total != null)
          ? parseFloat(item.preco_total)
          : (parseFloat(item.preco_unitario) || parseFloat(item?.itens_cardapio?.preco) || 0) * qtd;

        itensAgrupados[nome].quantidade += qtd;
        itensAgrupados[nome].faturamento += precoBase;
      });
    }

    // Ordenar por faturamento e retornar top itens
    return Object.values(itensAgrupados)
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, limite);

  } catch (error) {
    console.warn('Erro ao buscar top itens:', error);
    return [];
  }
}

// Função para configurar realtime subscription
export function configurarRealtimePedidos(restauranteId, callback) {
  const canal = supabase
    .channel("pedidos_financeiro_realtime")
    .on("postgres_changes", { 
      event: "*", 
      schema: "public", 
      table: "pedidos_padronizados",
      filter: `id_restaurante=eq.${restauranteId}`
    }, (payload) => {
      console.log('Pedido atualizado:', payload);
      if (callback) callback(payload);
    })
    .subscribe();

  return canal;
}

// Função para remover subscription
export function removerRealtimePedidos(canal) {
  if (canal) {
    supabase.removeChannel(canal);
  }
}