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

    // Buscar identificador de split do restaurante
    const { data: restauranteData, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('efi_payee_code')
      .eq('id', restauranteId)
      .single();

    if (restauranteError) {
      console.warn('Erro ao buscar Efi Payee Code:', restauranteError);
    }

    // NOVA LÓGICA: Buscar resumo consolidado da VIEW
    const { data: resumoView, error: viewError } = await supabase
      .from('view_resumo_financeiro_restaurante')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .single();

    if (viewError && viewError.code !== 'PGRST116') {
      console.warn('Erro ao buscar resumo da view (talvez não exista registro no ledger ainda):', viewError);
    }

    return {
      saldoDisponivel: parseFloat(resumoView?.saldo_disponivel || 0),
      saldoPendente: 0,
      totalVendas: parseFloat(resumoView?.total_vendido || 0),
      totalRepassado: parseFloat(resumoView?.total_repassado || 0),
      taxaPlataforma: 0.05, // Valor padrão ou buscar de config do restaurante se houver
      efiPayeeCode: restauranteData?.efi_payee_code || null
    };

  } catch (error) {
    console.error('Erro ao buscar dados de repasse:', error);
    throw error;
  }
}

// Buscar histórico de repasses (Via Ledger)
export async function fetchHistoricoRepasses(restauranteId, limite = 20) {
  try {
    if (!restauranteId) {
      throw new Error('ID do restaurante é obrigatório');
    }

    // Busca via ledger para garantir o histórico real
    const { data, error } = await supabase
      .from('view_extrato_restaurante')
      .select('*')
      .eq('conta_recebedora_id', restauranteId)
      .eq('tipo_lancamento', 'PAGAMENTO_RESTAURANTE')
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
    export async function solicitarRepasse({ restauranteId, valor, diasPrazo, observacao, efiPayeeCode }) {
      try {
        if (!restauranteId) {
          throw new Error('ID do restaurante é obrigatório');
        }
    
        if (!efiPayeeCode) {
          throw new Error('Identificador Efi Payee Code não cadastrado');
        }
    
        if (valor <= 0) {
          throw new Error('Valor deve ser maior que zero');
        }
    
        // Verificar saldo disponível
        const dadosRepasse = await fetchDadosRepasse(restauranteId);
        
        if (valor > dadosRepasse.saldoDisponivel) {
          throw new Error('Saldo insuficiente para esta solicitação');
        }
    
        // 1. Criar registro no Ledger via RPC
        const { data, error: ledgerError } = await supabase
          .rpc('solicitar_repasse_ledger', {
            p_restaurante_id: restauranteId,
            p_valor: valor
          });
    
        if (ledgerError) {
          throw new Error(`Erro ao criar solicitação no Ledger: ${ledgerError.message}`);
        }
    
        return data;

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
