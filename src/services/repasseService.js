import { supabase } from '../lib/supabase.js';

/**
 * Serviço para gerenciar repasses de restaurantes
 * Integra com as tabelas: repasses_restaurantes, historico_repasses, restaurantes_app
 */

// Buscar dados de repasse do restaurante
export async function fetchDadosRepasse(restauranteId) {
  try {
    if (!restauranteId) {
      throw new Error('ID do restaurante é obrigatório');
    }

    // Buscar dados da tabela repasses_restaurantes
    const { data: repasseData, error: repasseError } = await supabase
      .from('repasses_restaurantes')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .single();

    if (repasseError && repasseError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar dados de repasse: ${repasseError.message}`);
    }

    // Buscar chave PIX do restaurante
    const { data: restauranteData, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('chave_pix')
      .eq('id', restauranteId)
      .single();

    if (restauranteError) {
      console.warn('Erro ao buscar chave PIX:', restauranteError);
    }

    // Se não existir registro, criar um novo
    if (!repasseData) {
      const { data: novoRepasse, error: criarError } = await supabase
        .from('repasses_restaurantes')
        .insert({
          id_restaurante: restauranteId,
          total_vendas_confirmadas: 0,
          total_repassado: 0,
          saldo_pendente: 0,
          taxa_plataforma: 0.05 // 5% padrão
        })
        .select()
        .single();

      if (criarError) {
        throw new Error(`Erro ao criar registro de repasse: ${criarError.message}`);
      }

      return {
        saldoDisponivel: 0,
        saldoPendente: 0,
        totalVendas: 0,
        totalRepassado: 0,
        taxaPlataforma: 0.05,
        chavePixCadastrada: restauranteData?.chave_pix || null
      };
    }

    return {
      saldoDisponivel: parseFloat(repasseData.saldo_pendente) || 0,
      saldoPendente: 0, // Será calculado dos repasses em processamento
      totalVendas: parseFloat(repasseData.total_vendas_confirmadas) || 0,
      totalRepassado: parseFloat(repasseData.total_repassado) || 0,
      taxaPlataforma: parseFloat(repasseData.taxa_plataforma) || 0.05,
      chavePixCadastrada: restauranteData?.chave_pix || null
    };

  } catch (error) {
    console.error('Erro ao buscar dados de repasse:', error);
    throw error;
  }
}

// Buscar histórico de repasses
export async function fetchHistoricoRepasses(restauranteId, limite = 20) {
  try {
    if (!restauranteId) {
      throw new Error('ID do restaurante é obrigatório');
    }

    const { data, error } = await supabase
      .from('historico_repasses')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .order('criado_em', { ascending: false })
      .limit(limite);

    if (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Erro ao buscar histórico de repasses:', error);
    throw error;
  }
}

// Solicitar novo repasse
export async function solicitarRepasse({ restauranteId, valor, diasPrazo, observacao, chavePix }) {
  try {
    if (!restauranteId) {
      throw new Error('ID do restaurante é obrigatório');
    }

    if (!chavePix) {
      throw new Error('Chave PIX não cadastrada');
    }

    if (valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    // Verificar saldo disponível
    const dadosRepasse = await fetchDadosRepasse(restauranteId);
    
    if (valor > dadosRepasse.saldoDisponivel) {
      throw new Error('Saldo insuficiente para esta solicitação');
    }

    // Criar registro no histórico de repasses
    const { data: novoRepasse, error: insertError } = await supabase
      .from('historico_repasses')
      .insert({
        id_restaurante: restauranteId,
        valor: valor,
        metodo: 'pix_manual',
        observacao: observacao,
        status: 'pendente', // Será processado pelo admin
        criado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar solicitação: ${insertError.message}`);
    }

    // Atualizar saldo pendente na tabela repasses_restaurantes
    const { error: updateError } = await supabase
      .from('repasses_restaurantes')
      .update({
        saldo_pendente: dadosRepasse.saldoDisponivel - valor,
        ultima_atualizacao: new Date().toISOString()
      })
      .eq('id_restaurante', restauranteId);

    if (updateError) {
      console.warn('Erro ao atualizar saldo:', updateError);
    }

    return novoRepasse;

  } catch (error) {
    console.error('Erro ao solicitar repasse:', error);
    throw error;
  }
}

// Configurar realtime para repasses
export function configurarRealtimeRepasses(restauranteId, callback) {
  const canal = supabase
    .channel('repasses_realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'historico_repasses',
      filter: `id_restaurante=eq.${restauranteId}`
    }, (payload) => {
      console.log('Repasse atualizado:', payload);
      if (callback) callback(payload);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'repasses_restaurantes',
      filter: `id_restaurante=eq.${restauranteId}`
    }, (payload) => {
      console.log('Dados de repasse atualizados:', payload);
      if (callback) callback(payload);
    })
    .subscribe();

  return canal;
}

// Remover subscription
export function removerRealtimeRepasses(canal) {
  if (canal) {
    supabase.removeChannel(canal);
  }
}

// Calcular valores de repasse (para uso interno)
export function calcularValoresRepasse(valorBruto, taxaPlataforma = 0.05) {
  const valorTaxa = valorBruto * taxaPlataforma;
  const valorLiquido = valorBruto - valorTaxa;

  return {
    valorBruto,
    valorTaxa,
    valorLiquido,
    taxaPercentual: taxaPlataforma * 100
  };
}
