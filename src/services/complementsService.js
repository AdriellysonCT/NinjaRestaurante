import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * Serviço para gerenciar Complementos no FomeNinja
 * 
 * ESTRUTURA DO BANCO:
 * 1. grupos_complementos = Grupos (ex: "Saladas", "Bordas")
 * 2. grupos_complementos_itens = Complementos individuais (ex: "Caesar R$ 5,00")
 * 3. item_complemento_grupo = Liga item do cardápio ao grupo
 */

// ==================== COMPLEMENTOS (grupos_complementos_itens) ====================

/**
 * Buscar todos os complementos de um restaurante com seus grupos
 */
export const getComplements = async (restauranteId) => {
  try {
    // Buscar complementos
    const { data: complementos, error: compError } = await supabase
      .from('complementos')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .order('nome');

    if (compError) throw compError;

    // Buscar associações com grupos para cada complemento
    const complementsWithGroups = await Promise.all(
      (complementos || []).map(async (comp) => {
        const { data: associations, error: assocError } = await supabase
          .from('grupos_complementos_itens')
          .select('id_grupo')
          .eq('id_complemento', comp.id);

        if (assocError) {
          logger.error('Erro ao buscar grupos do complemento:', assocError);
          return { ...comp, groupIds: [] };
        }

        return {
          ...comp,
          groupIds: (associations || []).map(a => a.id_grupo)
        };
      })
    );

    return { success: true, data: complementsWithGroups };
  } catch (error) {
    logger.error('Erro ao buscar complementos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Criar novo complemento
 */
export const createComplement = async (restauranteId, complementData) => {
  try {
    const { data, error } = await supabase
      .from('complementos')
      .insert([{
        id_restaurante: restauranteId,
        nome: complementData.name,
        descricao: complementData.description || null,
        preco: complementData.price,
        imagem_url: complementData.image || null,
        disponivel: complementData.available ?? true
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao criar complemento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualizar complemento
 */
export const updateComplement = async (complementId, complementData) => {
  try {
    const { data, error } = await supabase
      .from('complementos')
      .update({
        nome: complementData.name,
        descricao: complementData.description || null,
        preco: complementData.price,
        imagem_url: complementData.image || null,
        disponivel: complementData.available ?? true
      })
      .eq('id', complementId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao atualizar complemento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Deletar complemento
 */
export const deleteComplement = async (complementId) => {
  try {
    const { error } = await supabase
      .from('complementos')
      .delete()
      .eq('id', complementId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('Erro ao deletar complemento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle disponibilidade do complemento
 */
export const toggleComplementAvailability = async (complementId) => {
  try {
    // Buscar estado atual
    const { data: current, error: fetchError } = await supabase
      .from('complementos')
      .select('disponivel')
      .eq('id', complementId)
      .single();

    if (fetchError) {
      // Se a coluna não existir, mostrar mensagem específica
      if (fetchError.code === '42703' || fetchError.message.includes('does not exist')) {
        logger.error('❌ Coluna "disponivel" não existe na tabela complementos');
        return { 
          success: false, 
          error: 'A coluna "disponivel" não existe. Execute o script: adicionar_coluna_disponivel.sql' 
        };
      }
      throw fetchError;
    }

    // Inverter disponibilidade
    const newAvailability = !current.disponivel;
    const { data, error } = await supabase
      .from('complementos')
      .update({ disponivel: newAvailability })
      .eq('id', complementId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao alternar disponibilidade:', error);
    return { success: false, error: error.message };
  }
};

// ==================== GRUPOS ====================

/**
 * Buscar todos os grupos do restaurante
 */
export const getGroups = async (restauranteId) => {
  try {
    const { data, error } = await supabase
      .from('grupos_complementos')
      .select('*')
      .eq('id_restaurante', restauranteId)
      .order('nome');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao buscar grupos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Criar novo grupo
 */
export const createGroup = async (restauranteId, groupData) => {
  try {
    const { data, error } = await supabase
      .from('grupos_complementos')
      .insert([{
        id_restaurante: restauranteId,
        nome: groupData.name,
        descricao: groupData.description || null,
        secao: groupData.section || null,
        tipo_selecao: groupData.selectionType,
        obrigatorio: groupData.required ?? false,
        min_selecao: groupData.minItems || 0,
        max_selecao: groupData.maxItems || 1
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao criar grupo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualizar grupo
 */
export const updateGroup = async (groupId, groupData) => {
  try {
    const { data, error } = await supabase
      .from('grupos_complementos')
      .update({
        nome: groupData.name,
        descricao: groupData.description || null,
        secao: groupData.section || null,
        tipo_selecao: groupData.selectionType,
        obrigatorio: groupData.required,
        min_selecao: groupData.minItems || 0,
        max_selecao: groupData.maxItems || 1
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Erro ao atualizar grupo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Deletar grupo
 */
export const deleteGroup = async (groupId) => {
  try {
    const { error } = await supabase
      .from('grupos_complementos')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('Erro ao deletar grupo:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ASSOCIAÇÕES ====================

/**
 * Buscar complementos de um grupo específico
 */
export const getGroupComplements = async (groupId) => {
  try {
    const { data, error } = await supabase
      .from('grupos_complementos_itens')
      .select(`
        *,
        complementos (*)
      `)
      .eq('id_grupo', groupId);

    if (error) throw error;
    
    // Retornar apenas os dados dos complementos
    const complements = data.map(item => item.complementos);
    return { success: true, data: complements };
  } catch (error) {
    logger.error('Erro ao buscar complementos do grupo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Associar complementos a um grupo
 */
export const associateComplementsToGroup = async (groupId, complementIds) => {
  try {
    // Remover associações antigas
    await supabase
      .from('grupos_complementos_itens')
      .delete()
      .eq('id_grupo', groupId);

    // Criar novas associações
    if (complementIds.length > 0) {
      const associations = complementIds.map(complementId => ({
        id_grupo: groupId,
        id_complemento: complementId
      }));

      const { error } = await supabase
        .from('grupos_complementos_itens')
        .insert(associations);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro ao associar complementos ao grupo:', error);
    return { success: false, error: error.message };
  }
};



/**
 * Associar grupos a um item do cardápio
 * Usa apenas: item_complemento_grupo (singular)
 * @param {string} menuItemId - ID do item do cardápio
 * @param {Array} groupsData - Array de objetos { groupId, complementIds } ou array simples de IDs
 */
export const associateGroupsToMenuItem = async (menuItemId, groupsData) => {
  try {
    logger.log('💾 Salvando associação:', { menuItemId, groupsData });
    
    // Converter para array simples de IDs se necessário
    let groupIds = [];
    if (groupsData.length > 0) {
      if (typeof groupsData[0] === 'string') {
        // Já é array simples de IDs
        groupIds = groupsData;
      } else {
        // É array de objetos, extrair os IDs
        groupIds = groupsData.map(g => g.groupId);
      }
    }
    
    // 1. Remover associações antigas
    const { error: deleteError } = await supabase
      .from('item_complemento_grupo')
      .delete()
      .eq('item_id', menuItemId);

    if (deleteError) {
      logger.error('Erro ao remover associações antigas:', deleteError);
      throw deleteError;
    }

    // 2. Criar novas associações
    if (groupIds.length > 0) {
      const associations = groupIds.map(groupId => ({
        item_id: menuItemId,
        grupo_id: groupId,
        ativo: true
      }));

      logger.log('📦 Inserindo associações:', associations);

      const { error: insertError } = await supabase
        .from('item_complemento_grupo')
        .insert(associations);

      if (insertError) {
        logger.error('Erro ao inserir associações:', insertError);
        throw insertError;
      }
    }

    logger.log('✅ Grupos salvos com sucesso!');
    return { success: true };
  } catch (error) {
    logger.error('❌ Erro ao associar grupos ao item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar grupos associados a um item do cardápio
 * Usa: item_complemento_grupo (singular)
 */
export const getMenuItemGroups = async (menuItemId) => {
  try {
    logger.log('🔍 Buscando grupos do item:', menuItemId);
    
    const { data, error } = await supabase
      .from('item_complemento_grupo')
      .select(`
        *,
        grupos_complementos (*)
      `)
      .eq('item_id', menuItemId)
      .eq('ativo', true);

    if (error) {
      logger.error('Erro na query:', error);
      throw error;
    }
    
    logger.log('📦 Grupos encontrados:', data);
    return { success: true, data };
  } catch (error) {
    logger.error('❌ Erro ao buscar grupos do item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar grupos e complementos de um item do cardápio
 * Usa: item_complemento_grupo (singular) + grupos_complementos_itens
 */
export const getMenuItemComplements = async (menuItemId) => {
  try {
    // Buscar grupos associados ao item com seus complementos
    const { data: grupos, error: gruposError } = await supabase
      .from('item_complemento_grupo')
      .select(`
        *,
        grupos_complementos (
          *,
          grupos_complementos_itens (
            *,
            complementos (*)
          )
        )
      `)
      .eq('item_id', menuItemId)
      .eq('ativo', true);

    if (gruposError) throw gruposError;
    return { success: true, data: grupos };
  } catch (error) {
    logger.error('Erro ao buscar complementos do item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar complementos de um grupo específico
 * Usa: grupos_complementos_itens
 */
export const getGroupComplementsWithDetails = async (groupId) => {
  try {
    logger.log('🔍 Buscando complementos do grupo:', groupId);
    
    const { data, error } = await supabase
      .from('grupos_complementos_itens')
      .select(`
        *,
        complementos (*)
      `)
      .eq('id_grupo', groupId);

    if (error) {
      logger.error('Erro na query:', error);
      throw error;
    }
    
    logger.log('📦 Complementos do grupo encontrados:', data);
    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('❌ Erro ao buscar complementos do grupo:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Export default com todas as funções
export default {
  // Complementos (complementos)
  getComplements,
  createComplement,
  updateComplement,
  deleteComplement,
  toggleComplementAvailability,
  
  // Grupos (grupos_complementos)
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  
  // Associações
  getGroupComplements,
  getGroupComplementsWithDetails,
  associateComplementsToGroup,
  associateGroupsToMenuItem,
  getMenuItemGroups,
  getMenuItemComplements
};
