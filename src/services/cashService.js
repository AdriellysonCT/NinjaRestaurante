import { supabase } from '../lib/supabase';

// Função para verificar se há um caixa aberto
export async function verificarCaixaAberto() {
  try {
    const { data, error } = await supabase
      .from('controle_caixa')
      .select('*')
      .is('data_fechamento', null)
      .order('data_abertura', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro ao verificar caixa aberto:', error);
    throw error;
  }
}

// Função para abrir o caixa
export async function abrirCaixa(valorInicial, observacoes = '') {
  try {
    // Verificar se já existe um caixa aberto
    const caixaAberto = await verificarCaixaAberto();
    if (caixaAberto) {
      throw new Error('Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.');
    }

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('controle_caixa')
      .insert([{
        usuario_id: user.id,
        valor_abertura: valorInicial,
        data_abertura: new Date().toISOString(),
        observacoes_abertura: observacoes,
        status: 'aberto'
      }])
      .select();
      
    if (error) throw error;
    
    // Salvar no localStorage para acesso offline
    localStorage.setItem('fome-ninja-caixa-atual', JSON.stringify(data[0]));
    
    return data[0];
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    throw error;
  }
}

// Função para fechar o caixa
export async function fecharCaixa(valorFechamento, observacoes = '') {
  try {
    // Verificar se há um caixa aberto
    const caixaAberto = await verificarCaixaAberto();
    if (!caixaAberto) {
      throw new Error('Não há caixa aberto para fechar.');
    }

    // Calcular diferença
    const diferenca = valorFechamento - caixaAberto.valor_abertura;

    const { data, error } = await supabase
      .from('controle_caixa')
      .update({
        valor_fechamento: valorFechamento,
        data_fechamento: new Date().toISOString(),
        diferenca: diferenca,
        observacoes_fechamento: observacoes,
        status: 'fechado'
      })
      .eq('id', caixaAberto.id)
      .select();
      
    if (error) throw error;
    
    // Remover do localStorage
    localStorage.removeItem('fome-ninja-caixa-atual');
    
    return data[0];
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    throw error;
  }
}

// Função para registrar sangria (retirada de dinheiro)
export async function registrarSangria(valor, motivo, observacoes = '') {
  try {
    const caixaAberto = await verificarCaixaAberto();
    if (!caixaAberto) {
      throw new Error('Não há caixa aberto para registrar sangria.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .insert([{
        caixa_id: caixaAberto.id,
        usuario_id: user.id,
        tipo: 'sangria',
        valor: -Math.abs(valor), // Sempre negativo para sangria
        motivo: motivo,
        observacoes: observacoes,
        data_movimentacao: new Date().toISOString()
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao registrar sangria:', error);
    throw error;
  }
}

// Função para registrar reforço (entrada de dinheiro)
export async function registrarReforco(valor, motivo, observacoes = '') {
  try {
    const caixaAberto = await verificarCaixaAberto();
    if (!caixaAberto) {
      throw new Error('Não há caixa aberto para registrar reforço.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .insert([{
        caixa_id: caixaAberto.id,
        usuario_id: user.id,
        tipo: 'reforco',
        valor: Math.abs(valor), // Sempre positivo para reforço
        motivo: motivo,
        observacoes: observacoes,
        data_movimentacao: new Date().toISOString()
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao registrar reforço:', error);
    throw error;
  }
}

// Função para buscar movimentações do caixa atual
export async function buscarMovimentacoesCaixa(caixaId = null) {
  try {
    let targetCaixaId = caixaId;
    
    if (!targetCaixaId) {
      const caixaAberto = await verificarCaixaAberto();
      if (!caixaAberto) return [];
      targetCaixaId = caixaAberto.id;
    }

    const { data, error } = await supabase
      .from('movimentacoes_caixa')
      .select('*')
      .eq('caixa_id', targetCaixaId)
      .order('data_movimentacao', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar movimentações do caixa:', error);
    throw error;
  }
}

// Função para calcular total de vendas do caixa atual
export async function calcularVendasCaixa() {
  try {
    const caixaAberto = await verificarCaixaAberto();
    if (!caixaAberto) return { total: 0, vendas: [] };

    // Buscar vendas desde a abertura do caixa
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .gte('timestamp', caixaAberto.data_abertura)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    
    const total = data.reduce((sum, order) => sum + order.total, 0);
    
    return { total, vendas: data };
  } catch (error) {
    console.error('Erro ao calcular vendas do caixa:', error);
    throw error;
  }
}

// Função para buscar histórico de caixas
export async function buscarHistoricoCaixas(limite = 30) {
  try {
    const { data, error } = await supabase
      .from('controle_caixa')
      .select('*')
      .order('data_abertura', { ascending: false })
      .limit(limite);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar histórico de caixas:', error);
    throw error;
  }
}

// Função para gerar relatório de fechamento
export async function gerarRelatorioFechamento(caixaId) {
  try {
    // Buscar dados do caixa
    const { data: caixa, error: caixaError } = await supabase
      .from('controle_caixa')
      .select('*')
      .eq('id', caixaId)
      .single();
      
    if (caixaError) throw caixaError;

    // Buscar vendas do período
    const { data: vendas, error: vendasError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .gte('timestamp', caixa.data_abertura)
      .lte('timestamp', caixa.data_fechamento || new Date().toISOString());
      
    if (vendasError) throw vendasError;

    // Buscar movimentações
    const movimentacoes = await buscarMovimentacoesCaixa(caixaId);

    // Calcular totais por método de pagamento
    const totaisPorMetodo = vendas.reduce((acc, venda) => {
      const metodo = venda.payment_method || 'nao_informado';
      acc[metodo] = (acc[metodo] || 0) + venda.total;
      return acc;
    }, {});

    // Calcular total de sangrias e reforços
    const totalSangrias = movimentacoes
      .filter(m => m.tipo === 'sangria')
      .reduce((sum, m) => sum + Math.abs(m.valor), 0);
      
    const totalReforcos = movimentacoes
      .filter(m => m.tipo === 'reforco')
      .reduce((sum, m) => sum + m.valor, 0);

    const totalVendas = vendas.reduce((sum, venda) => sum + venda.total, 0);
    const valorEsperado = caixa.valor_abertura + totalVendas + totalReforcos - totalSangrias;

    return {
      caixa,
      vendas,
      movimentacoes,
      totaisPorMetodo,
      totalVendas,
      totalSangrias,
      totalReforcos,
      valorEsperado,
      diferenca: caixa.valor_fechamento ? (caixa.valor_fechamento - valorEsperado) : 0
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de fechamento:', error);
    throw error;
  }
}

// Função para verificar caixa offline (localStorage)
export function verificarCaixaOffline() {
  try {
    const caixaLocal = localStorage.getItem('fome-ninja-caixa-atual');
    return caixaLocal ? JSON.parse(caixaLocal) : null;
  } catch (error) {
    console.error('Erro ao verificar caixa offline:', error);
    return null;
  }
}