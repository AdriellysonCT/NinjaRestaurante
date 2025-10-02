import { supabase } from '../lib/supabase';

// Função para buscar as configurações do restaurante logado
export async function fetchSettings() {
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
      .from('configuracoes')
      .select('*')
      .eq('id_restaurante', restaurante.id)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    throw error;
  }
}

// Função para salvar as configurações
export async function saveSettings(settings) {
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

    // Primeiro, verificamos se já existem configurações
    const existingSettings = await fetchSettings();
    
    if (existingSettings) {
      // Se existirem, atualizamos
      const { data, error } = await supabase
        .from('configuracoes')
        .update({
          nome_restaurante: settings.restaurantName,
          endereco: settings.address,
          telefone: settings.phone,
          horarios_funcionamento: settings.openingHours,
          configuracoes_entrega: settings.deliverySettings,
          configuracoes_notificacao: settings.notificationSettings,
          formas_pagamento: settings.paymentMethods,
          logo_url: settings.logoUrl,
          cor_tema: settings.corTema,
          taxa_servico: settings.taxaServico,
          pedido_minimo: settings.pedidoMinimo,
          tempo_preparo_padrao: settings.tempoPreparoPadrao,
          aceita_agendamento: settings.aceitaAgendamento,
          observacoes_gerais: settings.observacoesGerais,
          ativo: settings.ativo
        })
        .eq('id', existingSettings.id)
        .select();
        
      if (error) throw error;
      return data[0];
    } else {
      // Se não existirem, criamos
      const { data, error } = await supabase
        .from('configuracoes')
        .insert([{
          nome_restaurante: settings.restaurantName,
          endereco: settings.address,
          telefone: settings.phone,
          horarios_funcionamento: settings.openingHours,
          configuracoes_entrega: settings.deliverySettings,
          configuracoes_notificacao: settings.notificationSettings,
          formas_pagamento: settings.paymentMethods,
          logo_url: settings.logoUrl,
          cor_tema: settings.corTema || '#ff6b35',
          taxa_servico: settings.taxaServico || 0,
          pedido_minimo: settings.pedidoMinimo || 0,
          tempo_preparo_padrao: settings.tempoPreparoPadrao || 30,
          aceita_agendamento: settings.aceitaAgendamento || false,
          observacoes_gerais: settings.observacoesGerais,
          ativo: settings.ativo !== false,
          id_restaurante: restaurante.id
        }])
        .select();
        
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
}