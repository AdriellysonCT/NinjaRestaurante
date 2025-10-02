import { supabase } from '../lib/supabase';

// Função para buscar todos os itens do cardápio do restaurante logado
export async function fetchMenuItems() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Primeiro, buscar o ID do restaurante na tabela restaurantes_app
    const { data: restaurante, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restauranteError) {
      console.error('Erro ao buscar restaurante:', restauranteError);
      throw new Error('Restaurante não encontrado');
    }

    const { data, error } = await supabase
      .from('itens_cardapio')
      .select('*')
      .eq('id_restaurante', restaurante.id)
      .order('nome');
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar itens do cardápio:', error);
    throw error;
  }
}

// Função para buscar um item específico do cardápio
export async function fetchMenuItemById(id) {
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
      .from('itens_cardapio')
      .select('*')
      .eq('id', id)
      .eq('id_restaurante', restaurante.id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar item do cardápio ${id}:`, error);
    throw error;
  }
}

// Função para criar um novo item no cardápio
export async function createMenuItem(item) {
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
      .from('itens_cardapio')
      .insert([{
        nome: item.name,
        descricao: item.description,
        preco: item.price,
        categoria: item.category,
        imagem_url: item.image,
        disponivel: item.available,
        destaque: item.featured,
        tempo_preparo: item.prepTime,
        ingredientes: item.ingredients,
        id_restaurante: restaurante.id
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao criar item do cardápio:', error);
    throw error;
  }
}

// Função para atualizar um item do cardápio
export async function updateMenuItem(id, updates) {
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
      .from('itens_cardapio')
      .update({
        nome: updates.name,
        descricao: updates.description,
        preco: updates.price,
        categoria: updates.category,
        imagem_url: updates.image,
        disponivel: updates.available,
        destaque: updates.featured,
        tempo_preparo: updates.prepTime,
        ingredientes: updates.ingredients
      })
      .eq('id', id)
      .eq('id_restaurante', restaurante.id)
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Erro ao atualizar item do cardápio ${id}:`, error);
    throw error;
  }
}

// Função para atualizar apenas a disponibilidade de um item
export async function updateMenuItemAvailability(id, available) {
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
      .from('itens_cardapio')
      .update({ disponivel: available })
      .eq('id', id)
      .eq('id_restaurante', restaurante.id)
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Erro ao atualizar disponibilidade do item ${id}:`, error);
    throw error;
  }
}

// Função para excluir um item do cardápio
export async function deleteMenuItem(id) {
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

    const { error } = await supabase
      .from('itens_cardapio')
      .delete()
      .eq('id', id)
      .eq('id_restaurante', restaurante.id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao excluir item do cardápio ${id}:`, error);
    throw error;
  }
}