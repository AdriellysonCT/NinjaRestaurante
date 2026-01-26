import React, { useEffect, useState } from "react";
import { supabase } from '../lib/supabase.js';

function SolicitacaoRepasseSimples({ restauranteId }) {
  const [dados, setDados] = useState({
    saldoDisponivel: 0,
    saldoPendente: 0,
    totalVendas: 0,
    totalRepassado: 0,
    chavePixCadastrada: null
  });
  
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [diasSelecionados, setDiasSelecionados] = useState(1);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    carregarDados();
  }, [restauranteId]);

  async function carregarDados() {
    try {
      setLoading(false);
      setError(null);

      // Buscar dados de repasse
      const { data: repasseData, error: repasseError } = await supabase
        .from('repasses_restaurantes')
        .select('*')
        .eq('id_restaurante', restauranteId)
        .single();

      if (repasseError && repasseError.code !== 'PGRST116') {
        throw repasseError;
      }

      // Buscar chave PIX
      const { data: restauranteData } = await supabase
        .from('restaurantes_app')
        .select('chave_pix')
        .eq('id', restauranteId)
        .single();

      // Buscar histórico
      const { data: historicoData } = await supabase
        .from('historico_repasses')
        .select('*')
        .eq('id_restaurante', restauranteId)
        .order('criado_em', { ascending: false })
        .limit(10);

      setDados({
        saldoDisponivel: parseFloat(repasseData?.saldo_pendente || 0),
        saldoPendente: 0,
        totalVendas: parseFloat(repasseData?.total_vendas_confirmadas || 0),
        totalRepassado: parseFloat(repasseData?.total_repassado || 0),
        chavePixCadastrada: restauranteData?.chave_pix || null
      });

      setHistorico(historicoData || []);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSolicitarRepasse(e) {
    e.preventDefault();
    
    if (!dados.chavePixCadastrada) {
      setError('Você precisa cadastrar uma chave PIX em Configurações primeiro.');
      return;
    }

    if (dados.saldoDisponivel <= 0) {
      setError('Não há saldo disponível para solicitar repasse.');
      return;
    }

    try {
      setSolicitando(true);
      setError(null);
      setSuccess(null);

      const valorTotal = dados.saldoDisponivel;

      // Criar solicitação
      const { error: insertError } = await supabase
        .from('historico_repasses')
        .insert({
          id_restaurante: restauranteId,
          valor: valorTotal,
          metodo: 'pix_manual',
          observacao: observacao.trim() || null,
          status: 'pendente',
          criado_em: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Atualizar saldo
      const { error: updateError } = await supabase
        .from('repasses_restaurantes')
        .update({
          saldo_pendente: 0,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id_restaurante', restauranteId);

      if (updateError) throw updateError;

      setSuccess(`Solicitação de ${formatCurrency(valorTotal)} enviada com sucesso! Prazo: até ${diasSelecionados} ${diasSelecionados === 1 ? 'dia útil' : 'dias úteis'}.`);
      setObservacao('');
      await carregarDados();

    } catch (err) {
      console.error('Erro ao solicitar repasse:', err);
      setError(err.message);
    } finally {
      setSolicitando(false);
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      processando: { color: 'bg-blue-100 text-blue-800', label: 'Processando' },
      aprovado: { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
      pago: { color: 'bg-green-600 text-white', label: '✓ Pago' },
      cancelado: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };

    const badge = badges[status] || badges.pendente;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">💰 Solicitação de Repasse</h2>
        <p className="text-sm text-muted-foreground">
          Solicite o repasse dos seus ganhos de forma rápida e segura
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ninja-card p-6 border-2 border-success">
          <p className="text-sm text-muted-foreground mb-2">Saldo Disponível</p>
          <p className="text-3xl font-bold text-success">{formatCurrency(dados.saldoDisponivel)}</p>
          <p className="text-xs text-muted-foreground mt-2">Pronto para saque</p>
        </div>

        <div className="ninja-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Saldo Pendente</p>
          <p className="text-3xl font-bold text-yellow-600">{formatCurrency(dados.saldoPendente)}</p>
          <p className="text-xs text-muted-foreground mt-2">Em processamento</p>
        </div>

        <div className="ninja-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Total de Vendas</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(dados.totalVendas)}</p>
          <p className="text-xs text-muted-foreground mt-2">Confirmadas</p>
        </div>

        <div className="ninja-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Repassado</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(dados.totalRepassado)}</p>
          <p className="text-xs text-muted-foreground mt-2">Já recebido</p>
        </div>
      </div>

      {dados.chavePixCadastrada && (
        <div className="ninja-card p-6 bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-md">
                <svg className="w-10 h-10 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary mb-1">✓ Chave PIX Cadastrada</p>
                <p className="text-2xl font-bold text-foreground font-mono tracking-wider">{dados.chavePixCadastrada}</p>
                <p className="text-xs text-muted-foreground mt-1">Repasses serão enviados para esta chave</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(dados.chavePixCadastrada);
                setSuccess('Chave PIX copiada!');
                setTimeout(() => setSuccess(null), 2000);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </button>
          </div>
        </div>
      )}

      <div className="ninja-card p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Formulário de Solicitação</h3>
        
        <form onSubmit={handleSolicitarRepasse} className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-2">Valor Total a Receber</p>
              <p className="text-4xl font-bold text-blue-900">{formatCurrency(dados.saldoDisponivel)}</p>
              <p className="text-xs text-blue-600 mt-2">Todo o saldo disponível será solicitado</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prazo de Recebimento (dias úteis)</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 7, 15].map((dias) => (
                <button
                  key={dias}
                  type="button"
                  onClick={() => setDiasSelecionados(dias)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    diasSelecionados === dias
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-secondary bg-secondary hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold">{dias}</p>
                    <p className="text-xs">{dias === 1 ? 'dia' : 'dias'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ⏰ O repasse será processado em até <strong>24 horas</strong>. 
              O valor estará disponível em até <strong>{diasSelecionados} {diasSelecionados === 1 ? 'dia útil' : 'dias úteis'}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação se necessário..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary resize-none"
              rows="3"
            />
          </div>

          <button
            type="submit"
            disabled={solicitando || dados.saldoDisponivel <= 0 || !dados.chavePixCadastrada}
            className="w-full py-3 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {solicitando ? 'Processando...' : `Solicitar Repasse de ${formatCurrency(dados.saldoDisponivel)}`}
          </button>
        </form>
      </div>

      <div className="ninja-card p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Histórico de Repasses</h3>
        
        {historico.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum repasse solicitado ainda</p>
        ) : (
          <div className="space-y-3">
            {historico.map((repasse) => (
              <div
                key={repasse.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-lg">{formatCurrency(repasse.valor)}</p>
                    {getStatusBadge(repasse.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Solicitado:</strong> {formatDate(repasse.criado_em)}</p>
                    {repasse.data_repasso && (
                      <p><strong>Pago:</strong> {formatDate(repasse.data_repasso)}</p>
                    )}
                    {repasse.observacao && (
                      <p><strong>Obs:</strong> {repasse.observacao}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitacaoRepasseSimples;
