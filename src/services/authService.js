import { supabase } from '../lib/supabase';

// Função para cadastrar um novo restaurante
// Fluxo correto: Auth signUp com metadata → Trigger cria profile → Front-end cria restaurantes_app
export async function cadastrarRestaurante(dadosRestaurante, senha) {
  let userId = null;
  
  try {
    console.log('🚀 Iniciando processo de cadastro de RESTAURANTE...');
    
    // 1. Verificar se o usuário já existe
    console.log('🔍 Verificando se o email já está registrado...');
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', dadosRestaurante.email)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existingUser) {
      throw new Error('Email já cadastrado. Por favor, use outro email ou faça login.');
    }
    
    // 2. Criar usuário no Supabase Auth COM METADATA tipo_usuario = "restaurante"
    // IMPORTANTE: O trigger do banco vai criar automaticamente o profile com base nessa metadata
    console.log('👤 Criando usuário no Supabase Auth com tipo_usuario = "restaurante"...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dadosRestaurante.email,
      password: senha,
      options: {
        data: {
          tipo_usuario: 'restaurante' // ✅ OBRIGATÓRIO para o trigger criar o profile corretamente
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário no Auth');
    
    userId = authData.user.id;
    const emailConfirmationRequired = !authData.session;
    
    console.log('✅ Usuário criado no Auth. ID:', userId);
    console.log('✅ Trigger do banco criou automaticamente o profile com tipo_usuario = "restaurante"');
    
    // 3. Aguardar um pouco para garantir que o trigger executou
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Criar registro COMPLETO em restaurantes_app
    // Este é o "galho" da árvore profiles que contém todos os dados específicos do restaurante
    console.log('🏪 Criando registro em restaurantes_app...');
    console.log('📋 Dados que serão inseridos:', {
      id: userId,
      user_id: userId,
      nome_fantasia: dadosRestaurante.nomeFantasia || dadosRestaurante.nome_fantasia || '',
      tipo_restaurante: dadosRestaurante.tipoRestaurante || dadosRestaurante.tipo_restaurante || '',
      cnpj: dadosRestaurante.cnpj || '',
      telefone: dadosRestaurante.telefone || '',
      email: dadosRestaurante.email,
      nome_responsavel: dadosRestaurante.nomeResponsavel || dadosRestaurante.nome_responsavel || '',
      efi_payee_code: dadosRestaurante.efiPayeeCode || '',
      ativo: false
    });
    
    const { data: restauranteData, error: restauranteError } = await supabase
      .from('restaurantes_app')
      .insert({
        id: userId, // Mesmo ID do profiles
        user_id: userId, // Cópia do ID para referência
        nome_fantasia: dadosRestaurante.nomeFantasia || dadosRestaurante.nome_fantasia || '',
        tipo_restaurante: dadosRestaurante.tipoRestaurante || dadosRestaurante.tipo_restaurante || '',
        cnpj: dadosRestaurante.cnpj || '',
        telefone: dadosRestaurante.telefone || '',
        email: dadosRestaurante.email,
        nome_responsavel: dadosRestaurante.nomeResponsavel || dadosRestaurante.nome_responsavel || '',
        rua: dadosRestaurante.rua || '',
        numero: dadosRestaurante.numero || '',
        bairro: dadosRestaurante.bairro || '',
        cidade: dadosRestaurante.cidade || '',
        complemento: dadosRestaurante.complemento || '',
        ativo: false,
        imagem_url: dadosRestaurante.imagem_url || null,
        latitude: dadosRestaurante.latitude || null,
        longitude: dadosRestaurante.longitude || null,
        conta_bancaria: dadosRestaurante.conta_bancaria || null,
        efi_payee_code: dadosRestaurante.efiPayeeCode || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (restauranteError) {
      console.error('❌ Erro ao criar restaurante em restaurantes_app:', restauranteError);
      console.error('❌ Detalhes completos do erro:', JSON.stringify(restauranteError, null, 2));
      console.error('❌ Código do erro:', restauranteError.code);
      console.error('❌ Mensagem do erro:', restauranteError.message);
      console.error('❌ Hint:', restauranteError.hint);
      console.error('❌ Details:', restauranteError.details);
      
      // Compensação: deletar profile e auth user
      console.log('🔄 Revertendo cadastro...');
      console.log('🔄 Deletando profile...');
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .catch(err => console.error('Erro ao deletar profile:', err));
      
      console.log('🔄 Deletando usuário do Auth...');
      await supabase.auth.admin.deleteUser(userId)
        .catch(err => console.error('Erro ao deletar auth user:', err));
      
      throw new Error(`Erro ao criar registro do restaurante: ${restauranteError.message || 'Erro desconhecido'}. Verifique as permissões RLS. Por favor, tente novamente.`);
    }
    
    console.log('✅ Restaurante criado com sucesso em restaurantes_app:', restauranteData);
    console.log('🎉 Cadastro concluído com sucesso!');
    console.log('📊 Estrutura criada:');
    console.log('   - auth.users ✅');
    console.log('   - profiles (tipo_usuario = "restaurante") ✅');
    console.log('   - restaurantes_app (dados completos) ✅');
    
    return { 
      userId, 
      success: true, 
      emailConfirmationRequired,
      message: 'Cadastro realizado com sucesso!'
    };
    
  } catch (error) {
    console.error('❌ Erro no processo de cadastro:', error);
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
export async function buscarDadosRestaurante(forcedUserId = null) {
  try {
    let userId = forcedUserId;
    
    // Se não passou ID, busca o usuário atual do Auth
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ buscarDadosRestaurante: Usuário não autenticado');
        return null;
      }
      userId = user.id;
    }

    console.log('Buscando dados do restaurante para o ID:', userId);

    // Buscar dados do restaurante em restaurantes_app
    const { data, error } = await supabase
      .from('restaurantes_app')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar dados do restaurante:', error);
      
      // Se o restaurante não foi encontrado, pode ser que a trigger ainda não executou
      // ou houve algum problema. Retornar null e deixar o usuário atualizar depois.
      if (error.code === 'PGRST116') {
        console.warn('⚠️ Restaurante não encontrado em restaurantes_app');
        console.warn('⚠️ A trigger pode não ter executado corretamente');
        console.warn('⚠️ O usuário precisará atualizar os dados nas configurações');
        return null;
      }
      
      throw error;
    }

    console.log('✅ Dados do restaurante encontrados:', data);
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

    // Mapear campos do front-end para o banco de dados
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (dadosAtualizados.nomeFantasia !== undefined) updateData.nome_fantasia = dadosAtualizados.nomeFantasia;
    if (dadosAtualizados.tipoRestaurante !== undefined) updateData.tipo_restaurante = dadosAtualizados.tipoRestaurante;
    if (dadosAtualizados.cnpj !== undefined) updateData.cnpj = dadosAtualizados.cnpj;
    if (dadosAtualizados.telefone !== undefined) updateData.telefone = dadosAtualizados.telefone;
    if (dadosAtualizados.nomeResponsavel !== undefined) updateData.nome_responsavel = dadosAtualizados.nomeResponsavel;
    if (dadosAtualizados.imagemUrl !== undefined) updateData.imagem_url = dadosAtualizados.imagemUrl;
    if (dadosAtualizados.efiPayeeCode !== undefined) updateData.efi_payee_code = dadosAtualizados.efiPayeeCode;
    if (dadosAtualizados.ativo !== undefined) updateData.ativo = dadosAtualizados.ativo;
    if (dadosAtualizados.pausado !== undefined) updateData.pausado = dadosAtualizados.pausado;
    
    // Suporte para nomes de campos diretos (snake_case)
    if (dadosAtualizados.nome_fantasia !== undefined) updateData.nome_fantasia = dadosAtualizados.nome_fantasia;
    if (dadosAtualizados.tipo_restaurante !== undefined) updateData.tipo_restaurante = dadosAtualizados.tipo_restaurante;
    if (dadosAtualizados.nome_responsavel !== undefined) updateData.nome_responsavel = dadosAtualizados.nome_responsavel;
    if (dadosAtualizados.imagem_url !== undefined) updateData.imagem_url = dadosAtualizados.imagem_url;
    if (dadosAtualizados.efi_payee_code !== undefined) updateData.efi_payee_code = dadosAtualizados.efi_payee_code;
    if (dadosAtualizados.pausado !== undefined) updateData.pausado = dadosAtualizados.pausado;
    if (dadosAtualizados.ultimo_fechamento_em !== undefined) updateData.ultimo_fechamento_em = dadosAtualizados.ultimo_fechamento_em;

    // Atualizar dados do restaurante
    const { data, error} = await supabase
      .from('restaurantes_app')
      .update(updateData)
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

// Função para obter coordenadas (latitude/longitude) a partir do endereço
async function obterCoordenadas(endereco) {
  try {
    // Montar endereço completo para geocoding
    const enderecoCompleto = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, Brasil`;
    
    console.log('🌍 Buscando coordenadas para:', enderecoCompleto);
    
    // Usar API Nominatim (OpenStreetMap) - gratuita e sem necessidade de API key
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FomeNinja/1.0' // Nominatim requer User-Agent
      }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar coordenadas, continuando sem elas');
      return { latitude: null, longitude: null };
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      
      console.log('✅ Coordenadas encontradas:', { latitude, longitude });
      
      return { latitude, longitude };
    } else {
      console.warn('⚠️ Nenhuma coordenada encontrada para o endereço');
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error('❌ Erro ao obter coordenadas:', error);
    // Não falhar a atualização do endereço se o geocoding falhar
    return { latitude: null, longitude: null };
  }
}

// Função para atualizar o endereço do restaurante
export async function atualizarEndereco(novoEndereco) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    console.log('📍 Atualizando endereço do restaurante...');
    console.log('📋 Dados do endereço:', novoEndereco);
    
    // Obter coordenadas do endereço
    const { latitude, longitude } = await obterCoordenadas(novoEndereco);
    
    // Atualizar endereço E coordenadas em restaurantes_app
    const { data, error } = await supabase
      .from('restaurantes_app')
      .update({
        rua: novoEndereco.rua,
        numero: novoEndereco.numero,
        bairro: novoEndereco.bairro,
        cidade: novoEndereco.cidade,
        complemento: novoEndereco.complemento || '',
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      throw error;
    }
    
    console.log('✅ Endereço atualizado com sucesso:', data[0]);
    
    if (latitude && longitude) {
      console.log('✅ Coordenadas salvas:', { latitude, longitude });
    } else {
      console.warn('⚠️ Endereço salvo, mas coordenadas não foram obtidas');
    }
    
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
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