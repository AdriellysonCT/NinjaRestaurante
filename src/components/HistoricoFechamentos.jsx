import React, { useState, useEffect } from 'react';
import * as fechamentoCaixaService from '../services/fechamentoCaixaService';
import { supabase } from '../lib/supabase';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pendente: { label: '🕐 Aguardando Aprovação', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    aprovado: { label: '✅ Aprovado', className: 'bg-green-100 text-green-800 border-green-300' },
    pago: { label: '💰 Pago', className: 'bg-blue-100 text-blue-800 border-blue-300' }
  };

  const config = statusConfig[status] || statusConfig.pendente;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

const FechamentoCard = ({ fechamento }) => {
  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground">
            Fechamento #{fechamento.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(fechamento.data_fechamento).toLocaleString('pt-BR')}
          </p>
        </div>
        <StatusBadge status={fechamento.status} />
      </div>

      <div className="space-y-2 bg-secondary/30 p-3 rounded-md">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Bruto:</span>
          <span className="font-semibold text-success">R$ {Number(fechamento.total_bruto || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Descontos:</span>
          <span className="font-semibold text-destructive">-R$ {Number(fechamento.total_descontos || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="font-semibold text-foreground">Líquido:</span>
          <span className="font-bold text-primary">R$ {Number(fechamento.total_liquido || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {fechamento.qtd_transacoes} {fechamento.qtd_transacoes === 1 ? 'transação' : 'transações'}
      </div>

      {fechamento.observacoes && (
        <div className="mt-3 text-sm text-muted-foreground italic">
          "{fechamento.observacoes}"
        </div>
      )}
    </div>
  );
};

export default function HistoricoFechamentos({ restauranteId }) {
  const [fechamentos, setFechamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const loadFechamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {})
      };

      const data = await fechamentoCaixaService.fetchFechamentos(restauranteId, filterParams);
      setFechamentos(data || []);
      setPage(1);
    } catch (err) {
      console.error('Erro ao carregar fechamentos:', err);
      setError(err.message || 'Erro ao carregar fechamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restauranteId) {
      loadFechamentos();
    }
  }, [restauranteId]);

  // Realtime: escutar mudanças nos fechamentos
  useEffect(() => {
    if (!restauranteId) return;

    const channel = supabase
      .channel('fechamentos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fechamentos_caixa',
          filter: `id_usuario=eq.${restauranteId}`
        },
        (payload) => {
          console.log('Fechamento atualizado:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new.status === 'aprovado') {
            // Mostrar notificação
            if (window.Notification && Notification.permission === 'granted') {
              new Notification('Fechamento Aprovado! 🎉', {
                body: `Seu fechamento de R$ ${Number(payload.new.total_liquido).toFixed(2)} foi aprovado!`,
                icon: '/icon.png'
              });
            }
          }
          
          // Recarregar lista
          loadFechamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restauranteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Carregando fechamentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">❌ {error}</p>
        <button
          onClick={loadFechamentos}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const start = (page - 1) * pageSize;
  const paged = fechamentos.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(fechamentos.length / pageSize));

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs mb-1 text-muted-foreground">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="all">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="pago">Pago</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 text-muted-foreground">De</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-muted-foreground">Até</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
        </div>
        <button
          onClick={loadFechamentos}
          className="px-4 py-2 border border-border rounded-md hover:bg-secondary"
        >
          Filtrar
        </button>
      </div>

      {/* Lista de Fechamentos */}
      {fechamentos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-lg mb-2">📋 Nenhum fechamento encontrado</p>
          <p className="text-sm">Quando você fechar o caixa, os registros aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((fechamento) => (
              <FechamentoCard key={fechamento.id} fechamento={fechamento} />
            ))}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages} • {fechamentos.length} {fechamentos.length === 1 ? 'fechamento' : 'fechamentos'}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-border rounded disabled:opacity-50 hover:bg-secondary"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-border rounded disabled:opacity-50 hover:bg-secondary"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
