import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';

// Criar o contexto
export const AuthContext = createContext();

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto
export const AuthProvider = ({ children }) => {
  // Estados
  const [user, setUser] = useState(null);
  const [restaurante, setRestaurante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs para controle de validação de sessão
  const sessionCheckInterval = useRef(null);
  const lastActivityTime = useRef(Date.now());
  const sessionValidationInProgress = useRef(false);
  
  // Configurações de sessão
  const SESSION_CHECK_INTERVAL = 60000; // Verificar a cada 1 minuto
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inatividade
  const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // Renovar 5 minutos antes de expirar

  // Função para validar sessão atual
  const validateSession = async () => {
    if (sessionValidationInProgress.current) return;
    
    try {
      sessionValidationInProgress.current = true;
      
      // Verificar se a sessão ainda é válida
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Sessão inválida detectada, fazendo logout automático');
        await forceLogout();
        return false;
      }
      
      // Verificar se o token está próximo do vencimento
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      
      if (expiresAt && (expiresAt - now) < SESSION_REFRESH_THRESHOLD / 1000) {
        console.log('Token próximo do vencimento, tentando renovar...');
        
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Erro ao renovar sessão:', refreshError);
            await forceLogout();
            return false;
          }
          
          console.log('Sessão renovada com sucesso');
        } catch (refreshError) {
          console.error('Erro ao renovar sessão:', refreshError);
          await forceLogout();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro na validação de sessão:', error);
      await forceLogout();
      return false;
    } finally {
      sessionValidationInProgress.current = false;
    }
  };

  // Função para logout forçado (quando sessão é inválida)
  const forceLogout = async () => {
    console.log('Executando logout forçado devido a sessão inválida');
    
    // Limpar intervalos
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    // Limpar estado
    setUser(null);
    setRestaurante(null);
    setError('Sua sessão expirou. Por favor, faça login novamente.');
    
    // Limpar localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('fome-ninja-active-page');
    
    // Fazer logout no Supabase (sem aguardar para não travar)
    supabase.auth.signOut().catch(console.error);
    
    // Redirecionar para login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  // Função para registrar atividade do usuário
  const updateActivity = () => {
    lastActivityTime.current = Date.now();
  };

  // Função para verificar inatividade
  const checkInactivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      console.log('Usuário inativo por muito tempo, fazendo logout automático');
      forceLogout();
    }
  };

  // Função para iniciar monitoramento de sessão
  const startSessionMonitoring = () => {
    // Limpar intervalo anterior se existir
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }
    
    // Iniciar novo intervalo
    sessionCheckInterval.current = setInterval(async () => {
      if (user) {
        checkInactivity();
        await validateSession();
      }
    }, SESSION_CHECK_INTERVAL);
    
    // Adicionar listeners para atividade do usuário
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Listener para quando a aba fica visível novamente
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && user) {
        updateActivity();
        await validateSession();
      }
    });
  };

  // Função para parar monitoramento de sessão
  const stopSessionMonitoring = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    // Remover listeners de atividade
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };

  // Função para carregar dados do restaurante
  const carregarDadosRestaurante = async (userId) => {
    try {
      console.log('Carregando dados do restaurante para o usuário:', userId);
      const dadosRestaurante = await authService.buscarDadosRestaurante();
      
      if (dadosRestaurante) {
        console.log('Dados do restaurante carregados:', dadosRestaurante);
        setRestaurante(dadosRestaurante);
        
        // Atualizar localStorage com os dados reais
        if (dadosRestaurante.nome_fantasia) {
          localStorage.setItem('fome-ninja-restaurant-name', dadosRestaurante.nome_fantasia);
        }
        
        // ✅ SALVAR O ID DO RESTAURANTE NO LOCALSTORAGE
        if (dadosRestaurante.id) {
          localStorage.setItem('restaurante_id', dadosRestaurante.id);
          console.log('✅ Restaurante ID salvo:', dadosRestaurante.id);
        }
      } else {
        console.log('Dados do restaurante não encontrados, criando estrutura básica');
        // Se não houver dados, criar uma estrutura básica com o email do usuário
        setRestaurante({
          nome_fantasia: '',
          tipo_restaurante: '',
          cnpj: '',
          telefone: '',
          email: userId.email,
          nome_responsavel: '',
          rua: '',
          numero: '',
          bairro: '',
          cidade: '',
          complemento: ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do restaurante:', error);
      // Em caso de erro, criar estrutura básica
      setRestaurante({
        nome_fantasia: '',
        tipo_restaurante: '',
        cnpj: '',
        telefone: '',
        email: userId.email,
        nome_responsavel: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        complemento: ''
      });
    }
  };

  // Verificar autenticação ao iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Verificar se há uma sessão ativa
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
          setRestaurante(null);
          return;
        }
        
        if (session && session.user) {
          console.log('Sessão encontrada:', session.user.id);
          setUser(session.user);
          
          // Carregar dados reais do restaurante do banco de dados
          await carregarDadosRestaurante(session.user);
          
          // Iniciar monitoramento de sessão
          startSessionMonitoring();
        } else {
          console.log('Nenhuma sessão ativa encontrada');
          setUser(null);
          setRestaurante(null);
          stopSessionMonitoring();
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setError(error.message);
        setUser(null);
        setRestaurante(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session && session.user) {
          setUser(session.user);
          
          // Definir dados básicos do restaurante sem buscar no banco
          setRestaurante({
            nome_fantasia: 'Meu Restaurante',
            tipo_restaurante: 'Restaurante',
            cnpj: '',
            telefone: '',
            email: session.user.email,
            nome_responsavel: '',
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            complemento: ''
          });
          
          // Iniciar monitoramento de sessão
          startSessionMonitoring();
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('Usuário deslogado, limpando estado');
          setUser(null);
          setRestaurante(null);
          setError(null);
          
          // Parar monitoramento de sessão
          stopSessionMonitoring();
          
          // Limpar localStorage
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('fome-ninja-active-page');
        }
      }
    );
    
    // Limpar listener ao desmontar
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      // Parar monitoramento de sessão ao desmontar
      stopSessionMonitoring();
    };
  }, []);

  // Função para cadastrar restaurante
  const cadastrar = async (dadosRestaurante, senha) => {
    try {
      setLoading(true);
      setError(null);
      
      const resultado = await authService.cadastrarRestaurante(dadosRestaurante, senha);
      
      // Após cadastro bem-sucedido, verificar se precisa de confirmação de email
      if (resultado.success) {
        // No Supabase, quando confirmEmail está habilitado, o usuário não pode fazer login imediatamente
        if (resultado.emailConfirmationRequired) {
          return { 
            success: true, 
            emailConfirmationRequired: true,
            message: 'Cadastro realizado com sucesso! Por favor, verifique seu email para confirmar sua conta.'
          };
        } else {
          // Cadastro concluído sem necessidade de confirmação de email
          // Retornar sucesso e deixar o usuário fazer login manualmente
          return { 
            success: true, 
            emailConfirmationRequired: false,
            message: 'Cadastro realizado com sucesso! Você já pode fazer login.'
          };
        }
      }
      
      return resultado;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer login
  const login = async (email, senha) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando processo de login...');
      
      // Fazer login diretamente com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      
      if (error) {
        console.error('❌ Erro ao fazer login:', error);
        throw error;
      }
      
      console.log('✅ Login bem-sucedido:', data.user.id);
      
      // Definir o usuário no estado
      setUser(data.user);
      
      // ✅ PRIMEIRO: Atualizar status ativo para true
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 INICIANDO ATUALIZAÇÃO DE STATUS ATIVO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 User ID:', data.user.id);
        console.log('📋 Email:', data.user.email);
        
        console.log('\n🔎 PASSO 1: Buscando restaurante...');
        const { data: restauranteData, error: selectError } = await supabase
          .from('restaurantes_app')
          .select('id, user_id, nome_fantasia, ativo')
          .eq('user_id', data.user.id)
          .single();
        
        console.log('📊 Resultado da busca:', {
          restauranteData,
          selectError
        });
        
        if (selectError) {
          console.error('❌ ERRO AO BUSCAR RESTAURANTE:', selectError);
          console.error('❌ Código do erro:', selectError.code);
          console.error('❌ Mensagem:', selectError.message);
          console.error('❌ Detalhes:', selectError.details);
          throw selectError;
        }
        
        if (restauranteData?.id) {
          console.log('\n✅ RESTAURANTE ENCONTRADO!');
          console.log('📋 ID do restaurante:', restauranteData.id);
          console.log('📋 Nome:', restauranteData.nome_fantasia);
          console.log('📋 Status atual (antes do update):', restauranteData.ativo);
          
          console.log('\n🔄 PASSO 2: Atualizando status para TRUE...');
          const { data: updateData, error: updateError } = await supabase
            .from('restaurantes_app')
            .update({ ativo: true })
            .eq('id', restauranteData.id)
            .select();
          
          console.log('📊 Resultado do UPDATE:', {
            updateData,
            updateError
          });
          
          if (updateError) {
            console.error('❌ ERRO AO ATUALIZAR STATUS:', updateError);
            console.error('❌ Código do erro:', updateError.code);
            console.error('❌ Mensagem:', updateError.message);
            console.error('❌ Detalhes:', updateError.details);
            console.error('❌ Hint:', updateError.hint);
            throw updateError;
          }
          
          console.log('\n✅✅✅ SUCESSO! Restaurante marcado como ONLINE');
          console.log('📋 Dados atualizados:', updateData);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
          console.warn('\n⚠️⚠️⚠️ NENHUM RESTAURANTE ENCONTRADO!');
          console.warn('⚠️ User ID buscado:', data.user.id);
          console.warn('⚠️ Resultado da query:', restauranteData);
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      } catch (updateError) {
        console.error('\n❌❌❌ ERRO CAPTURADO NO CATCH:');
        console.error('❌ Tipo:', updateError.constructor.name);
        console.error('❌ Mensagem:', updateError.message);
        console.error('❌ Stack:', updateError.stack);
        console.error('❌ Objeto completo:', updateError);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // Não impedir login se falhar ao atualizar status
      }
      
      // DEPOIS: Carregar dados reais do restaurante
      await carregarDadosRestaurante(data.user);
      
      // Iniciar monitoramento de sessão
      startSessionMonitoring();
      
      console.log('✅ Login concluído com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Iniciando processo de logout...');
      
      // ✅ Atualizar status ativo para false antes de deslogar
      if (user?.id) {
        try {
          const { data: restauranteData } = await supabase
            .from('restaurantes_app')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (restauranteData?.id) {
            await supabase
              .from('restaurantes_app')
              .update({ ativo: false })
              .eq('id', restauranteData.id);
            
            console.log('✅ Restaurante marcado como OFFLINE (ativo = false)');
          }
        } catch (updateError) {
          console.error('⚠️ Erro ao atualizar status ativo:', updateError);
          // Não impedir logout se falhar ao atualizar status
        }
      }
      
      // Parar monitoramento de sessão
      stopSessionMonitoring();
      
      // Limpar estado local imediatamente
      setUser(null);
      setRestaurante(null);
      
      // Limpar localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('fome-ninja-active-page');
      localStorage.removeItem('restaurante_id');
      
      // Fazer logout no Supabase
      await authService.logout();
      
      console.log('✅ Logout concluído com sucesso');
      
      // Forçar um refresh da página para garantir que tudo seja limpo
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setError(error.message);
      
      // Mesmo com erro, limpar estado local e redirecionar
      setUser(null);
      setRestaurante(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('fome-ninja-active-page');
      localStorage.removeItem('restaurante_id');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar dados do restaurante
  const atualizarDadosRestaurante = async (dados) => {
    try {
      setError(null);
      setLoading(true);
      
      // Atualizar no banco de dados
      const { error } = await authService.atualizarDadosRestaurante(dados);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      // Atualizar estado local
      setRestaurante(prev => ({
        ...prev,
        ...dados
      }));
      
      // Atualizar localStorage se o nome mudou
      if (dados.nome_fantasia) {
        localStorage.setItem('fome-ninja-restaurant-name', dados.nome_fantasia);
      }
      
      // Recarregar dados do restaurante para garantir que estão sincronizados
      if (user) {
        await carregarDadosRestaurante(user);
      }
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Valor do contexto
  const contextValue = {
    user,
    restaurante,
    restauranteId: user?.id || null,  // ✅ Usar user.id diretamente (auth.users.id)
    loading,
    error,
    isAuthenticated: !!user,
    cadastrar,
    login,
    logout,
    atualizarDadosRestaurante
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;