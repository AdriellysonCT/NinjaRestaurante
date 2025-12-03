import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar o status online do restaurante
 * Atualiza o campo 'ativo' na tabela restaurantes_app
 */
export const useRestaurantOnlineStatus = (userId, restauranteId) => {
  const hasSetOnline = useRef(false);
  const isSettingStatus = useRef(false);

  // Função para atualizar o status online
  const setOnlineStatus = async (isOnline) => {
    if (isSettingStatus.current) return;
    
    try {
      isSettingStatus.current = true;
      
      if (!restauranteId) {
        console.warn('restauranteId não disponível para atualizar status online');
        return;
      }

      console.log(`Atualizando status online para: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      const { error } = await supabase
        .from('restaurantes_app')
        .update({ ativo: isOnline })
        .eq('id', restauranteId);

      if (error) {
        console.error('Erro ao atualizar status online:', error);
      } else {
        console.log(`✅ Status atualizado: ativo = ${isOnline}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status online:', error);
    } finally {
      isSettingStatus.current = false;
    }
  };

  // Marcar como online quando o componente montar
  useEffect(() => {
    if (userId && restauranteId && !hasSetOnline.current) {
      hasSetOnline.current = true;
      setOnlineStatus(true);
    }
  }, [userId, restauranteId]);

  // Marcar como offline quando o painel fechar
  useEffect(() => {
    const handleOffline = async () => {
      if (restauranteId) {
        await setOnlineStatus(false);
      }
    };

    // Listener para quando a janela/aba fechar
    window.addEventListener('beforeunload', handleOffline);

    // Listener para quando a aba perder o foco (opcional, mas útil)
    const handleVisibilityChange = () => {
      if (document.hidden && restauranteId) {
        // Não marcar como offline imediatamente, apenas quando fechar de verdade
        // Este evento é útil para detectar quando o usuário minimiza ou troca de aba
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: marcar como offline quando o componente desmontar
    return () => {
      window.removeEventListener('beforeunload', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Marcar como offline ao desmontar (quando sair do painel)
      if (restauranteId) {
        handleOffline();
      }
    };
  }, [restauranteId]);

  return { setOnlineStatus };
};
