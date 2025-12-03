import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar horários de funcionamento do restaurante
 */

// Mapeamento de dias da semana (inglês para texto em português)
const DAY_MAP = {
  sunday: 'domingo',
  monday: 'segunda',
  tuesday: 'terca',
  wednesday: 'quarta',
  thursday: 'quinta',
  friday: 'sexta',
  saturday: 'sabado'
};

// Mapeamento inverso (texto para inglês)
const DAY_MAP_REVERSE = {
  'domingo': 'sunday',
  'segunda': 'monday',
  'terca': 'tuesday',
  'quarta': 'wednesday',
  'quinta': 'thursday',
  'sexta': 'friday',
  'sabado': 'saturday'
};

/**
 * Buscar horários do restaurante
 */
export const buscarHorarios = async (restauranteId) => {
  try {
    console.log('🔍 Buscando horários para restaurante:', restauranteId);
    
    const { data, error } = await supabase
      .from('restaurantes_horarios')
      .select('*')
      .eq('restaurante_id', restauranteId);
    
    if (error) {
      console.error('❌ Erro ao buscar horários:', error);
      throw error;
    }
    
    console.log('✅ Horários encontrados:', data);
    
    // Converter para o formato usado no front-end
    const horariosFormatados = {};
    
    // Inicializar todos os dias com valores padrão
    Object.keys(DAY_MAP).forEach(day => {
      horariosFormatados[day] = {
        open: '11:00',
        close: '22:00',
        isOpen: true,
        id: null
      };
    });
    
    // Preencher com dados do banco
    if (data && data.length > 0) {
      data.forEach(horario => {
        const dayKey = DAY_MAP_REVERSE[horario.dia_semana];
        if (dayKey) {
          horariosFormatados[dayKey] = {
            open: horario.hora_abre || '11:00',
            close: horario.hora_fecha || '22:00',
            isOpen: horario.ativo !== false, // Se ativo for null ou true, considera aberto
            id: horario.id
          };
        }
      });
    }
    
    return horariosFormatados;
  } catch (error) {
    console.error('❌ Erro ao buscar horários:', error);
    throw error;
  }
};

/**
 * Salvar ou atualizar horário de um dia específico
 */
export const salvarHorario = async (restauranteId, day, horario) => {
  try {
    const diaSemana = DAY_MAP[day];
    
    console.log('💾 Salvando horário:', {
      restauranteId,
      day,
      diaSemana,
      horario
    });
    
    // Verificar se já existe um registro para este dia
    const { data: existente, error: erroConsulta } = await supabase
      .from('restaurantes_horarios')
      .select('id')
      .eq('restaurante_id', restauranteId)
      .eq('dia_semana', diaSemana)
      .single();
    
    if (erroConsulta && erroConsulta.code !== 'PGRST116') {
      // PGRST116 = nenhum registro encontrado (não é erro)
      console.error('❌ Erro ao verificar horário existente:', erroConsulta);
      throw erroConsulta;
    }
    
    const dadosHorario = {
      restaurante_id: restauranteId,
      dia_semana: diaSemana,
      hora_abre: horario.open,
      hora_fecha: horario.close,
      ativo: horario.isOpen
    };
    
    let resultado;
    
    if (existente?.id) {
      // Atualizar registro existente
      console.log('📝 Atualizando horário existente:', existente.id);
      
      const { data, error } = await supabase
        .from('restaurantes_horarios')
        .update(dadosHorario)
        .eq('id', existente.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao atualizar horário:', error);
        throw error;
      }
      
      resultado = data;
    } else {
      // Criar novo registro
      console.log('➕ Criando novo horário');
      
      const { data, error } = await supabase
        .from('restaurantes_horarios')
        .insert(dadosHorario)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar horário:', error);
        throw error;
      }
      
      resultado = data;
    }
    
    console.log('✅ Horário salvo com sucesso:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao salvar horário:', error);
    throw error;
  }
};

/**
 * Salvar todos os horários de uma vez
 */
export const salvarTodosHorarios = async (restauranteId, horarios) => {
  try {
    console.log('💾 Salvando todos os horários...');
    
    const promises = Object.keys(horarios).map(day => 
      salvarHorario(restauranteId, day, horarios[day])
    );
    
    await Promise.all(promises);
    
    console.log('✅ Todos os horários salvos com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar todos os horários:', error);
    throw error;
  }
};

/**
 * Verificar se o restaurante está aberto agora usando a RPC v2
 * Retorna informações completas sobre o status
 */
export const verificarRestauranteAberto = async (restauranteId) => {
  try {
    console.log('🔍 Verificando se restaurante está aberto:', restauranteId);
    
    const { data, error } = await supabase.rpc('restaurante_esta_aberto', {
      restaurante_id_param: restauranteId
    });
    
    if (error) {
      console.error('❌ Erro ao verificar se restaurante está aberto:', error);
      console.error('❌ Código:', error.code);
      console.error('❌ Mensagem:', error.message);
      
      // Se for erro 401/403 (RLS), avisar
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.error('🚨 ERRO DE PERMISSÃO RLS! Execute: GRANT EXECUTE ON FUNCTION restaurante_esta_aberto TO authenticated;');
      }
      
      throw error;
    }
    
    console.log('✅ Status do restaurante:', data);
    
    return {
      aberto: data?.aberto || false,
      metodo: data?.metodo || 'desconhecido',
      horaAtual: data?.hora_atual || null,
      dia: data?.dia || null,
      abre: data?.abre || null,
      fecha: data?.fecha || null
    };
  } catch (error) {
    console.error('❌ Erro ao verificar se restaurante está aberto:', error);
    // Retornar fechado em caso de erro
    return {
      aberto: false,
      metodo: 'erro',
      horaAtual: null,
      dia: null,
      abre: null,
      fecha: null
    };
  }
};

/**
 * Inicializar horários padrão para um restaurante novo
 */
export const inicializarHorariosPadrao = async (restauranteId) => {
  try {
    console.log('🆕 Inicializando horários padrão para restaurante:', restauranteId);
    
    const horariosPadrao = [
      { dia_semana: 'domingo', hora_abre: '11:00', hora_fecha: '22:00', ativo: true },
      { dia_semana: 'segunda', hora_abre: '11:00', hora_fecha: '22:00', ativo: true },
      { dia_semana: 'terca', hora_abre: '11:00', hora_fecha: '22:00', ativo: true },
      { dia_semana: 'quarta', hora_abre: '11:00', hora_fecha: '22:00', ativo: true },
      { dia_semana: 'quinta', hora_abre: '11:00', hora_fecha: '22:00', ativo: true },
      { dia_semana: 'sexta', hora_abre: '11:00', hora_fecha: '23:00', ativo: true },
      { dia_semana: 'sabado', hora_abre: '11:00', hora_fecha: '23:00', ativo: true },
    ];
    
    const horariosComRestaurante = horariosPadrao.map(h => ({
      ...h,
      restaurante_id: restauranteId
    }));
    
    const { data, error } = await supabase
      .from('restaurantes_horarios')
      .insert(horariosComRestaurante)
      .select();
    
    if (error) {
      console.error('❌ Erro ao inicializar horários padrão:', error);
      throw error;
    }
    
    console.log('✅ Horários padrão inicializados:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao inicializar horários padrão:', error);
    throw error;
  }
};

/**
 * Obter nome do dia em português
 */
export const obterNomeDia = (dayKey) => {
  const nomes = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado'
  };
  
  return nomes[dayKey] || dayKey;
};
