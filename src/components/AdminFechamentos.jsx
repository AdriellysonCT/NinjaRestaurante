import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Componente para o painel administrativo gerenciar fechamentos de caixa
 * Este componente deve ser usado na área administrativa
 */
export default function AdminFechamentos() {
  const [fechamentos, setFechamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pendente');
  const [selectedFechamento, setSelectedFechamento] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadFechamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('fechamentos_caixa')
        .select(`
          *,
          restaurante:restaurantes_app!fechamentos_caixa_id_usuario_fkey(
            nome,
            email,
            telefone
          )
        `)
        .eq('tipo_usuario', 'restaurante')
        .order('data_fechamento', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setFechamentos(data || []);
    } catch (err) {
      console.error('Erro ao carregar fechamentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFechamentos();
  }, [filter]);

  // Realtime: escutar novos fechamentos
  useEffect(() => {
    const channel = supabase
      .channel('admin_fechamentos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fechamentos_caixa'
        },
        (payload) => {
          console.log('Fechamento atualizado:', payload);
          loadFechamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAprovar = async (fechamentoId) => {
    if (!window.confirm('Deseja aprovar este fechamento?')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fechamentos_caixa')
        .update({
          status: 'aprovado',
          observacoes: observacoes || null,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', fechamentoId);

      if (error) throw error;

      alert('✅ Fechamento aprovado com sucesso!');
      setSelectedFechamento(null);
      setObservacoes('');
      loadFechamentos();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      alert('❌ Erro ao aprovar fechamento: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarcarPago = async (fechamentoId) => {
    if (!window.confirm('Confirmar que o pagamento foi realizado?')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fechamentos_caixa')
        .update({
          status: 'pago',
          observacoes: observacoes || null,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', fechamentoId);

      if (error) throw error;

      alert('✅ Fechamento marcado como pago!');
      setSelectedFechamento(null);
      setObservacoes('');
      loadFechamentos();
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      alert('❌ Erro ao marcar como pago: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeitar = async (fechamentoId) => {
    const motivo = window.prompt('Motivo da rejeição:');
    if (!motivo) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('fechamentos_caixa')
        .update({
          status: 'pendente',
          observacoes: `REJEITADO: ${motivo}`,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', fechamentoId);

      if (error) throw error;

      alert('✅ Fechamento rejeitado. O restaurante foi notificado.');
      setSelectedFechamento(null);
      loadFechamentos();
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      alert('❌ Erro ao rejeitar fechamento: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Carregando fechamentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">❌ {error}</p>
        <button
          onClick={loadFechamentos}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const totalPendente = fechamentos.filter(f => f.status === 'pendente').length;
  const totalAprovado = fechamentos.filter(f => f.status === 'aprovado').length;
  const valorTotalPendente = fechamentos
    .filter(f => f.status === 'pendente')
    .reduce((sum, f) => sum + Number(f.total_liquido || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-800">{totalPendente}</p>
          <p className="text-xs text-yellow-600 mt-1">
            R$ {valorTotalPendente.toFixed(2)} a aprovar
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Aprovados</p>
          <p className="text-2xl font-bold text-green-800">{totalAprovado}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-800">{fechamentos.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['pendente', 'aprovado', 'pago', 'todos'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de fechamentos */}
      {fechamentos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>Nenhum fechamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fechamentos.map((fechamento) => (
            <div
              key={fechamento.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {fechamento.restaurante?.nome || 'Restaurante'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {fechamento.id.slice(0, 8)} • {new Date(fechamento.data_fechamento).toLocaleString('pt-BR')}
                  </p>
                  {fechamento.restaurante?.telefone && (
                    <p className="text-sm text-muted-foreground">
                      📱 {fechamento.restaurante.telefone}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    fechamento.status === 'pendente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : fechamento.status === 'aprovado'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {fechamento.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/30 p-3 rounded-md mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Bruto</p>
                  <p className="font-semibold text-success">
                    R$ {Number(fechamento.total_bruto || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Descontos</p>
                  <p className="font-semibold text-destructive">
                    -R$ {Number(fechamento.total_descontos || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Líquido</p>
                  <p className="font-bold text-primary">
                    R$ {Number(fechamento.total_liquido || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transações</p>
                  <p className="font-semibold">{fechamento.qtd_transacoes}</p>
                </div>
              </div>

              {fechamento.observacoes && (
                <div className="bg-secondary/50 p-2 rounded-md mb-3 text-sm">
                  <strong>Observações:</strong> {fechamento.observacoes}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                {fechamento.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedFechamento(fechamento);
                        setObservacoes('');
                      }}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      onClick={() => handleRejeitar(fechamento.id)}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      ❌ Rejeitar
                    </button>
                  </>
                )}
                {fechamento.status === 'aprovado' && (
                  <button
                    onClick={() => {
                      setSelectedFechamento(fechamento);
                      setObservacoes('');
                    }}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    💰 Marcar como Pago
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      {selectedFechamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedFechamento.status === 'pendente' ? 'Aprovar Fechamento' : 'Marcar como Pago'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Restaurante: {selectedFechamento.restaurante?.nome}
              <br />
              Valor: R$ {Number(selectedFechamento.total_liquido).toFixed(2)}
            </p>
            <div className="mb-4">
              <label className="block text-sm mb-2">Observações (opcional)</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md"
                rows={3}
                placeholder="Adicione observações sobre este fechamento..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedFechamento(null);
                  setObservacoes('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedFechamento.status === 'pendente') {
                    handleAprovar(selectedFechamento.id);
                  } else {
                    handleMarcarPago(selectedFechamento.id);
                  }
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
