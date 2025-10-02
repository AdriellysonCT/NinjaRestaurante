import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
const { DollarSignIcon, ClockIcon, TrendingUpIcon, TrendingDownIcon, CalculatorIcon, PrinterIcon, HistoryIcon, AlertCircleIcon, CheckCircleIcon } = Icons;
import { Modal } from '../components/ui/Modal';
import * as cashService from '../services/cashService';
import { printService } from '../services/printService';

export const Cash = () => {
  // Estados principais
  const [caixaAtual, setCaixaAtual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para modais
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [showReforcoModal, setShowReforcoModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  
  // Estados para formulários
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [valorSangria, setValorSangria] = useState('');
  const [valorReforco, setValorReforco] = useState('');
  const [motivoSangria, setMotivoSangria] = useState('');
  const [motivoReforco, setMotivoReforco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para dados
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [vendasCaixa, setVendasCaixa] = useState({ total: 0, vendas: [] });
  const [historicoCaixas, setHistoricoCaixas] = useState([]);
  const [relatorioFechamento, setRelatorioFechamento] = useState(null);
  
  // Estados para processamento
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosCaixa();
  }, []);

  const carregarDadosCaixa = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar se há caixa aberto
      const caixa = await cashService.verificarCaixaAberto();
      setCaixaAtual(caixa);
      
      if (caixa) {
        // Carregar movimentações e vendas
        const [movs, vendas] = await Promise.all([
          cashService.buscarMovimentacoesCaixa(),
          cashService.calcularVendasCaixa()
        ]);
        
        setMovimentacoes(movs);
        setVendasCaixa(vendas);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
      setError('Erro ao carregar dados do caixa: ' + error.message);
      
      // Tentar carregar do localStorage como fallback
      const caixaOffline = cashService.verificarCaixaOffline();
      if (caixaOffline) {
        setCaixaAtual(caixaOffline);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCaixa = async () => {
    if (!valorAbertura || parseFloat(valorAbertura) < 0) {
      alert('Por favor, informe um valor válido para abertura do caixa.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const caixa = await cashService.abrirCaixa(parseFloat(valorAbertura), observacoes);
      setCaixaAtual(caixa);
      setShowAbrirModal(false);
      setValorAbertura('');
      setObservacoes('');
      
      // Recarregar dados
      await carregarDadosCaixa();
      
      alert('Caixa aberto com sucesso!');
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      alert('Erro ao abrir caixa: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFecharCaixa = async () => {
    if (!valorFechamento || parseFloat(valorFechamento) < 0) {
      alert('Por favor, informe um valor válido para fechamento do caixa.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Gerar relatório antes de fechar
      const relatorio = await cashService.gerarRelatorioFechamento(caixaAtual.id);
      setRelatorioFechamento(relatorio);
      
      // Fechar caixa
      const caixaFechado = await cashService.fecharCaixa(parseFloat(valorFechamento), observacoes);
      
      // Imprimir relatório de fechamento
      await printService.printCashReport(relatorio);
      
      setCaixaAtual(null);
      setShowFecharModal(false);
      setValorFechamento('');
      setObservacoes('');
      setMovimentacoes([]);
      setVendasCaixa({ total: 0, vendas: [] });
      
      alert('Caixa fechado com sucesso! Relatório impresso.');
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      alert('Erro ao fechar caixa: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSangria = async () => {
    if (!valorSangria || parseFloat(valorSangria) <= 0 || !motivoSangria.trim()) {
      alert('Por favor, informe um valor válido e o motivo da sangria.');
      return;
    }
    
    try {
      setIsProcessing(true);
      await cashService.registrarSangria(parseFloat(valorSangria), motivoSangria, observacoes);
      
      setShowSangriaModal(false);
      setValorSangria('');
      setMotivoSangria('');
      setObservacoes('');
      
      // Recarregar movimentações
      const movs = await cashService.buscarMovimentacoesCaixa();
      setMovimentacoes(movs);
      
      alert('Sangria registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar sangria:', error);
      alert('Erro ao registrar sangria: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReforco = async () => {
    if (!valorReforco || parseFloat(valorReforco) <= 0 || !motivoReforco.trim()) {
      alert('Por favor, informe um valor válido e o motivo do reforço.');
      return;
    }
    
    try {
      setIsProcessing(true);
      await cashService.registrarReforco(parseFloat(valorReforco), motivoReforco, observacoes);
      
      setShowReforcoModal(false);
      setValorReforco('');
      setMotivoReforco('');
      setObservacoes('');
      
      // Recarregar movimentações
      const movs = await cashService.buscarMovimentacoesCaixa();
      setMovimentacoes(movs);
      
      alert('Reforço registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar reforço:', error);
      alert('Erro ao registrar reforço: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const carregarHistorico = async () => {
    try {
      const historico = await cashService.buscarHistoricoCaixas();
      setHistoricoCaixas(historico);
      setShowHistoricoModal(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico: ' + error.message);
    }
  };

  // Calcular valores para exibição
  const totalSangrias = movimentacoes
    .filter(m => m.tipo === 'sangria')
    .reduce((sum, m) => sum + Math.abs(m.valor), 0);
    
  const totalReforcos = movimentacoes
    .filter(m => m.tipo === 'reforco')
    .reduce((sum, m) => sum + m.valor, 0);

  const valorEsperado = caixaAtual 
    ? caixaAtual.valor_abertura + vendasCaixa.total + totalReforcos - totalSangrias
    : 0;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do caixa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Controle de Caixa</h2>
        <div className="flex gap-2">
          <button 
            onClick={carregarHistorico}
            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-secondary/80"
          >
            <HistoryIcon className="w-4 h-4" />
            Histórico
          </button>
        </div>
      </div>

      {error && (
        <div className="ninja-card p-4 border-destructive bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="w-5 h-5" />
            <p className="font-medium">Erro</p>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Status do Caixa */}
      <div className="ninja-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Status do Caixa</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            caixaAtual 
              ? 'bg-success/20 text-success' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {caixaAtual ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Caixa Aberto
              </>
            ) : (
              <>
                <AlertCircleIcon className="w-4 h-4" />
                Caixa Fechado
              </>
            )}
          </div>
        </div>

        {caixaAtual ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Abertura</p>
              <p className="text-lg font-bold text-primary">R$ {caixaAtual.valor_abertura.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(caixaAtual.data_abertura).toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Vendas</p>
              <p className="text-lg font-bold text-success">R$ {vendasCaixa.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{vendasCaixa.vendas.length} pedidos</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Movimentações</p>
              <div className="flex justify-center gap-4">
                <div>
                  <p className="text-sm font-bold text-success">+R$ {totalReforcos.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Reforços</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-destructive">-R$ {totalSangrias.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Sangrias</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Esperado</p>
              <p className="text-lg font-bold text-primary">R$ {valorEsperado.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Para fechamento</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum caixa aberto no momento</p>
            <button 
              onClick={() => setShowAbrirModal(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90"
            >
              Abrir Caixa
            </button>
          </div>
        )}
      </div>

      {/* Ações do Caixa */}
      {caixaAtual && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowSangriaModal(true)}
            className="ninja-card p-4 text-center hover:border-destructive transition-colors"
          >
            <TrendingDownIcon className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="font-medium">Sangria</p>
            <p className="text-xs text-muted-foreground">Retirar dinheiro</p>
          </button>
          
          <button 
            onClick={() => setShowReforcoModal(true)}
            className="ninja-card p-4 text-center hover:border-success transition-colors"
          >
            <TrendingUpIcon className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="font-medium">Reforço</p>
            <p className="text-xs text-muted-foreground">Adicionar dinheiro</p>
          </button>
          
          <button 
            onClick={() => setShowFecharModal(true)}
            className="ninja-card p-4 text-center hover:border-primary transition-colors"
          >
            <ClockIcon className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Fechar Caixa</p>
            <p className="text-xs text-muted-foreground">Encerrar expediente</p>
          </button>
          
          <button 
            onClick={() => {
              if (relatorioFechamento) {
                printService.printCashReport(relatorioFechamento);
              }
            }}
            className="ninja-card p-4 text-center hover:border-secondary transition-colors"
          >
            <PrinterIcon className="w-8 h-8 text-secondary-foreground mx-auto mb-2" />
            <p className="font-medium">Imprimir</p>
            <p className="text-xs text-muted-foreground">Relatório atual</p>
          </button>
        </div>
      )}

      {/* Movimentações Recentes */}
      {caixaAtual && movimentacoes.length > 0 && (
        <div className="ninja-card p-4">
          <h3 className="font-bold mb-4">Movimentações Recentes</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {movimentacoes.slice(0, 10).map(mov => (
              <div key={mov.id} className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <p className="font-medium">{mov.motivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(mov.data_movimentacao).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    mov.tipo === 'sangria' ? 'text-destructive' : 'text-success'
                  }`}>
                    {mov.tipo === 'sangria' ? '-' : '+'}R$ {Math.abs(mov.valor).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{mov.tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Abrir Caixa */}
      <Modal 
        isOpen={showAbrirModal} 
        onClose={() => setShowAbrirModal(false)} 
        title="Abrir Caixa"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valor Inicial *</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              rows="3"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a abertura do caixa..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setShowAbrirModal(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAbrirCaixa}
              disabled={isProcessing || !valorAbertura}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Fechar Caixa */}
      <Modal 
        isOpen={showFecharModal} 
        onClose={() => setShowFecharModal(false)} 
        title="Fechar Caixa"
      >
        <div className="space-y-4">
          <div className="bg-secondary/20 p-3 rounded-md">
            <p className="text-sm"><strong>Valor Esperado:</strong> R$ {valorEsperado.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Abertura: R$ {caixaAtual?.valor_abertura.toFixed(2)} + 
              Vendas: R$ {vendasCaixa.total.toFixed(2)} + 
              Reforços: R$ {totalReforcos.toFixed(2)} - 
              Sangrias: R$ {totalSangrias.toFixed(2)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Valor de Fechamento *</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              placeholder={valorEsperado.toFixed(2)}
            />
            {valorFechamento && (
              <p className={`text-xs mt-1 ${
                parseFloat(valorFechamento) === valorEsperado 
                  ? 'text-success' 
                  : parseFloat(valorFechamento) > valorEsperado 
                    ? 'text-success' 
                    : 'text-destructive'
              }`}>
                Diferença: R$ {(parseFloat(valorFechamento) - valorEsperado).toFixed(2)}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              rows="3"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o fechamento do caixa..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setShowFecharModal(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button 
              onClick={handleFecharCaixa}
              disabled={isProcessing || !valorFechamento}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isProcessing ? 'Fechando...' : 'Fechar Caixa'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Sangria */}
      <Modal 
        isOpen={showSangriaModal} 
        onClose={() => setShowSangriaModal(false)} 
        title="Registrar Sangria"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valor *</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={valorSangria}
              onChange={(e) => setValorSangria(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Motivo *</label>
            <select 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={motivoSangria}
              onChange={(e) => setMotivoSangria(e.target.value)}
            >
              <option value="">Selecione o motivo</option>
              <option value="Troco">Troco</option>
              <option value="Despesas">Despesas</option>
              <option value="Pagamento Fornecedor">Pagamento Fornecedor</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              rows="3"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes da sangria..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setShowSangriaModal(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSangria}
              disabled={isProcessing || !valorSangria || !motivoSangria}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isProcessing ? 'Registrando...' : 'Registrar Sangria'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Reforço */}
      <Modal 
        isOpen={showReforcoModal} 
        onClose={() => setShowReforcoModal(false)} 
        title="Registrar Reforço"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valor *</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={valorReforco}
              onChange={(e) => setValorReforco(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Motivo *</label>
            <select 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={motivoReforco}
              onChange={(e) => setMotivoReforco(e.target.value)}
            >
              <option value="">Selecione o motivo</option>
              <option value="Troco">Troco</option>
              <option value="Depósito">Depósito</option>
              <option value="Transferência">Transferência</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              rows="3"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes do reforço..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setShowReforcoModal(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button 
              onClick={handleReforco}
              disabled={isProcessing || !valorReforco || !motivoReforco}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50"
            >
              {isProcessing ? 'Registrando...' : 'Registrar Reforço'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Histórico */}
      <Modal 
        isOpen={showHistoricoModal} 
        onClose={() => setShowHistoricoModal(false)} 
        title="Histórico de Caixas"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {historicoCaixas.map(caixa => (
            <div key={caixa.id} className="border border-border rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {new Date(caixa.data_abertura).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(caixa.data_abertura).toLocaleTimeString()} - 
                    {caixa.data_fechamento ? new Date(caixa.data_fechamento).toLocaleTimeString() : 'Em aberto'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  caixa.status === 'aberto' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-secondary/20 text-secondary-foreground'
                }`}>
                  {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Abertura</p>
                  <p className="font-medium">R$ {caixa.valor_abertura.toFixed(2)}</p>
                </div>
                {caixa.valor_fechamento && (
                  <div>
                    <p className="text-muted-foreground">Fechamento</p>
                    <p className="font-medium">R$ {caixa.valor_fechamento.toFixed(2)}</p>
                  </div>
                )}
                {caixa.diferenca !== null && (
                  <div>
                    <p className="text-muted-foreground">Diferença</p>
                    <p className={`font-medium ${
                      caixa.diferenca >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      R$ {caixa.diferenca.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {historicoCaixas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico de caixa encontrado.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Cash;