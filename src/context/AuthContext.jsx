import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as autoReplyService from '../services/autoReplyService';

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
      if (!userId) return;
      
      const id = typeof userId === 'string' ? userId : (userId.id || userId);
      if (!id || typeof id !== 'string') {
        console.warn('⚠️ AuthContext: ID de usuário inválido para carregar restaurante');
        return;
      }

      console.log('🔄 AuthContext: Carregando dados do restaurante p/ ID:', id);
      const dadosRestaurante = await authService.buscarDadosRestaurante(id);
      
      if (dadosRestaurante) {
        console.log('✅ AuthContext: Dados do restaurante carregados');
        
        sessionStorage.setItem('fome-ninja-initialized', 'true');

        setRestaurante(prev => {
          if (!prev) return dadosRestaurante;
          return { ...prev, ...dadosRestaurante };
        });

        if (dadosRestaurante.nome_fantasia) {
          localStorage.setItem('fome-ninja-restaurant-name', dadosRestaurante.nome_fantasia);
        }
        if (dadosRestaurante.id) {
          localStorage.setItem('restaurante_id', dadosRestaurante.id);
        }

        // 🤖 Registra restaurante no Agent Python para auto-resposta WhatsApp
        autoReplyService.registerRestauranteNoAgent(dadosRestaurante);
      } else {
        console.warn('⚠️ AuthContext: Restaurante não encontrado em restaurantes_app');
        setRestaurante(prev => prev || {
          nome_fantasia: 'Restaurante',
          email: typeof userId === 'object' ? userId.email : null,
          ativo: false 
        });
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro crítico ao carregar restaurante:', error);
    }
  };

  // Verificar autenticação ao iniciar
  useEffect(() => {
    // Safety Net: Garantir que o loading NUNCA trave a aplicação
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 6000);

    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('🔍 AuthContext: [1/3] Iniciando checkAuth...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          console.log('👤 AuthContext: [2/3] Sessão ativa para:', session.user.id);
          setUser(session.user);
          // 🚀 LIBERAÇÃO INSTANTÂNEA: Não espera o DB para mostrar a UI
          setLoading(false);
          clearTimeout(timeout);
          
          carregarDadosRestaurante(session.user);
          startSessionMonitoring();
        } else {
          console.log('ℹ️ AuthContext: [2/3] Nenhuma sessão ativa');
          setUser(null);
          setRestaurante(null);
          setLoading(false);
          clearTimeout(timeout);
        }
      } catch (error) {
        console.error('❌ AuthContext: Erro fatal no checkAuth:', error);
        setUser(null);
        setRestaurante(null);
        setLoading(false);
        clearTimeout(timeout);
      } finally {
        console.log('🏁 AuthContext: [3/3] checkAuth concluído');
      }
    };
    
    checkAuth();
    return () => clearTimeout(timeout);
  }, []);

  // Configurar listeners e Realtime
  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 AuthContext: Evento SIGNED_IN');
          setUser(session.user);
          // Não usar await aqui para não bloquear o listener
          carregarDadosRestaurante(session.user);
          startSessionMonitoring();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('Usuário deslogado, limpando estado');
          setUser(null);
          setRestaurante(null);
          setError(null);
          stopSessionMonitoring();
          
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('fome-ninja-active-page');
          localStorage.removeItem('restaurante_id');
        }
      }
    );

    // ✅ Realtime para o status do restaurante
    let channel;
    if (user?.id) {
      console.log('📡 Iniciando Realtime para status do restaurante...', user.id);
      channel = supabase
        .channel(`restaurante_status_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'restaurantes_app',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Mudança detectada no restaurante (Realtime):', payload.new);
            setRestaurante(prev => ({
              ...prev,
              ...payload.new
            }));
          }
        )
        .subscribe();
    }
    
    // Limpar listener ao desmontar
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      if (channel) {
        supabase.removeChannel(channel);
      }
      
      // Parar monitoramento de sessão ao desmontar
      stopSessionMonitoring();
    };
  }, [user?.id]); // Adicionar user?.id como dependência para reinicializar o realtime se necessário

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
      
      // Logout simples sem alterar status do restaurante no banco
      
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