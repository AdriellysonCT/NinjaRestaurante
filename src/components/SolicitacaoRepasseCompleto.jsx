import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import * as Icons from './icons/index.jsx';
import * as repasseService from '../services/repasseService.js';

const { 
  DollarSignIcon, CalendarIcon, AlertCircleIcon, CheckCircleIcon,
  ClockIcon, TrendingUpIcon, CopyIcon, InfoIcon, BanknoteIcon
} = Icons;

function SolicitacaoRepasseCompleto({ restauranteId }) {
  const [dados, setDados] = useState({
    saldoDisponivel: 0,
    saldoPendente: 0,
    totalVendas: 0,
    totalRepassado: 0,
    taxaPlataforma: 0,
    chavePixCadastrada: null
  });
  
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [diasSelecionados, setDiasSelecionados] = useState(1);
  const [valorSolicitado, setValorSolicitado] = useState(0);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    carregarDados();
    
    const canal = repasseService.configurarRealtimeRepasses(restauranteId, () => {
      carregarDados();
    });

    return () => {
      repasseService.removerRealtimeRepasses(canal);
    };
  }, [restauranteId]);

  async function carregarDados() {
    try {
      setLoading(true);
      setError(null);

      const dadosRepasse = await repasseService.fetchDadosRepasse(restauranteId);
      const historicoRepasses = await repasseService.fetchHistoricoRepasses(restauranteId);

      setDados(dadosRepasse);
      setHistorico(historicoRepasses);
      setValorSolicitado(dadosRepasse.saldoDisponivel);

    } catch (error) {
      console.error('Erro ao carregar dados de repasse:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSolicitarRepasse(e) {
    e.preventDefault();
    
    if (!dados.chavePixCadastrada) {
      setError('Você precisa cadastrar uma chave PIX antes de solicitar repasse.');
      return;
    }

    if (valorSolicitado <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }

    if (valorSolicitado > dados.saldoDisponivel) {
      setError('Valor solicitado maior que o saldo disponível.');
      return;
    }

    try {
      setSolicitando(true);
      setError(null);
      setSuccess(null);

      await repasseService.solicitarRepasse({
        restauranteId,
        valor: valorSolicitado,
        diasPrazo: diasSelecionados,
        observacao: observacao.trim() || null,
        chavePix: dados.chavePixCadastrada
      });

      setSuccess(`Solicitação de repasse de ${formatCurrency(valorSolicitado)} enviada com sucesso!`);
      setObservacao('');
      await carregarDados();

    } catch (error) {
      console.error('Erro ao solicitar repasse:', error);
      setError(error.message);
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
      pago: { color: 'bg-green-600 text-white', label: 'Pago' },
      cancelado: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };

    const badge = badges[status] || badges.pendente;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const copiarChavePix = () => {
    if (dados.chavePixCadastrada) {
      navigator.clipboard.writeText(dados.chavePixCadastrada);
      setSuccess('Chave PIX copiada!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="ninja-card p-6">
        <div className="flex items-center justify-center">
          <ClockIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2">Carregando dados de repasse...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">💰 Solicitação de Repasse</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Solicite o repasse dos seus ganhos de forma rápida e segura
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2"
        >
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg flex items-start gap-2"
        >
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{success}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ninja-card p-6 border-2 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(dados.saldoDisponivel)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Pronto para saque</p>
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <DollarSignIcon className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="ninja-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(dados.saldoPendente)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Em processamento</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="ninja-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(dados.totalVendas)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Confirmadas</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="ninja-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Repassado</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(dados.totalRepassado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Já recebido</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {dados.chavePixCadastrada && (
        <div className="ninja-card p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <BanknoteIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Chave PIX Cadastrada</p>
                <p className="text-xs text-blue-700 font-mono">{dados.chavePixCadastrada}</p>
              </div>
            </div>
            <button
              onClick={copiarChavePix}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <CopyIcon className="w-4 h-4" />
              Copiar
            </button>
          </div>
        </div>
      )}

      <div className="ninja-card p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Nova Solicitação de Repasse</h3>
        
        <form onSubmit={handleSolicitarRepasse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Valor a Solicitar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={dados.saldoDisponivel}
                value={valorSolicitado}
                onChange={(e) => setValorSolicitado(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Máximo disponível: {formatCurrency(dados.saldoDisponivel)}
            </p>
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
            <div className="flex gap-3">
              <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">⏰ Prazo de Processamento</p>
                <p>
                  O repasse será processado em até <strong>24 horas</strong> após a solicitação.
                  O valor estará disponível na sua conta em até <strong>{diasSelecionados} {diasSelecionados === 1 ? 'dia útil' : 'dias úteis'}</strong>.
                </p>
              </div>
            </div>
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
            className="w-full py-3 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {solicitando ? (
              <>
                <ClockIcon className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <DollarSignIcon className="w-5 h-5" />
                Solicitar Repasse de {formatCurrency(valorSolicitado)}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="ninja-card p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Histórico de Repasses</h3>
        
        {historico.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum repasse solicitado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((repasse) => (
              <div
                key={repasse.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
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
                
                {repasse.comprovante_url && (
                  <a
                    href={repasse.comprovante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    Ver Comprovante
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitacaoRepasseCompleto;
