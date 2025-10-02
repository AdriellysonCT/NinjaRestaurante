import { supabase } from '../lib/supabase';

// Função para cadastrar um novo restaurante
export async function cadastrarRestaurante(dadosRestaurante, senha) {
  try {
    console.log('Iniciando processo de cadastro...');
    
    // 1. Verificar se o usuário já existe
    console.log('Verificando se o email já está registrado...');
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', dadosRestaurante.email)
      .maybeSingle();
    
    if (checkError) throw checkError;
    if (existingUser) {
      throw new Error('Email já cadastrado. Por favor, use outro email ou faça login.');
    }
    
    // 1. Criar novo usuário no Supabase Auth com metadados
    console.log('Criando novo usuário no Supabase Auth com metadados...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dadosRestaurante.email,
      password: senha,
      options: {
        data: {
          user_type: 'restaurante',
          nome_fantasia: dadosRestaurante.nomeFantasia,
          tipo_restaurante: dadosRestaurante.tipoRestaurante,
          cnpj: dadosRestaurante.cnpj,
          telefone: dadosRestaurante.telefone,
          nome_responsavel: dadosRestaurante.nomeResponsavel
        }
      }
    });
    if (authError) throw authError;
    
    const user = authData.user;
    if (!user) throw new Error('Falha ao criar usuário');
    
    const userId = authData.user.id;
    const emailConfirmationRequired = !authData.session;
    
    // O trigger cuidará da inserção em profiles e restaurantes_app
    
    return { userId, success: true, emailConfirmationRequired };
  } catch (error) {
    console.error('Erro ao cadastrar restaurante:', error);
    throw error;
  }
}

// Função para fazer login
export async function loginRestaurante(email, senha) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Função para buscar dados do restaurante logado
export async function buscarDadosRestaurante() {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    console.log('Buscando dados do restaurante para o usuário:', user.id);

    // Buscar dados do restaurante
    const { data, error } = await supabase
      .from('restaurantes_app')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar dados do restaurante:', error);
      // Se for erro de "não encontrado", retornar null em vez de lançar erro
      if (error.code === 'PGRST116') {
        console.log('Dados do restaurante não encontrados, criando registro vazio');
        // Criar um registro vazio para o usuário
        const { data: newData, error: insertError } = await supabase
          .from('restaurantes_app')
          .insert([
            {
              id: user.id,
              nome_fantasia: '',
              tipo_restaurante: '',
              cnpj: '',
              telefone: '',
              email: user.email,
              nome_responsavel: '',
              rua: '',
              numero: '',
              bairro: '',
              cidade: '',
              complemento: ''
            }
          ])
          .select();
        
        if (insertError) {
          console.error('Erro ao criar registro vazio:', insertError);
          return null;
        }
        
        return newData[0];
      }
      throw error;
    }

    console.log('Dados do restaurante encontrados:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do restaurante:', error);
    // Retornar null em vez de lançar erro para evitar quebrar o fluxo de login
    return null;
  }
}

// Função para atualizar dados do restaurante
export async function atualizarDadosRestaurante(dadosAtualizados) {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    // Atualizar dados do restaurante
    const { data, error } = await supabase
      .from('restaurantes_app')
      .update({
        nome_fantasia: dadosAtualizados.nomeFantasia,
        tipo_restaurante: dadosAtualizados.tipoRestaurante,
        cnpj: dadosAtualizados.cnpj,
        telefone: dadosAtualizados.telefone,
        nome_responsavel: dadosAtualizados.nomeResponsavel,
      })
      .eq('id', user.id)
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erro ao atualizar dados do restaurante:', error);
    throw error;
  }
}

// Função para fazer logout
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

// Função para buscar o endereço ativo do restaurante
export async function buscarEnderecoAtivo() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('restaurantes_app')
      .select('rua, bairro, cidade, numero, complemento')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço ativo:', error);
    return null;
  }
}

// Função para atualizar o endereço do restaurante
export async function atualizarEndereco(novoEndereco) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('restaurantes_app')
      .update({
        rua: novoEndereco.rua,
        numero: novoEndereco.numero,
        bairro: novoEndereco.bairro,
        cidade: novoEndereco.cidade,
        complemento: novoEndereco.complemento
      })
      .eq('id', user.id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    throw error;
  }
}

// Função para verificar se o usuário está autenticado
export async function verificarAutenticacao() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { autenticado: !!session, session };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return { autenticado: false, error };
  }
}