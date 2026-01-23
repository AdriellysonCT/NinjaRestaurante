import { supabase } from '../lib/supabase';

export const ratingService = {
  async createDriverRating({ pedidoId, restauranteId, entregadorId, estrelas, comentario }) {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_entregadores')
        .insert([{
          pedido_id: pedidoId,
          restaurante_id: restauranteId,
          entregador_id: entregadorId,
          estrelas,
          comentario
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao avaliar entregador:', error);
      throw error;
    }
  },

  async getRatingByPedido(pedidoId) {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_entregadores')
        .select('*')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar avaliação:', error);
      return null;
    }
  }
};
