import React, { useState } from 'react';
import * as fechamentoCaixaService from '../services/fechamentoCaixaService';

const FecharCaixaModal = ({ isOpen, onClose, resumo, onConfirm, loading }) => {
  if (!isOpen || !resumo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Confirmar Fechamento de Caixa</h2>
        
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <p className="text-sm text-muted-foreground mb-1">Período</p>
            <p className="text-sm font-medium">
              {new Date(resumo.dataInicio).toLocaleString('pt-BR')} - {resumo.dataFim.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground mb-2">📊 Resumo do Fechamento</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Vendas:</span>
              <span className="font-semibold text-success">R$ {resumo.totalBruto.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa Plataforma ({resumo.taxaPlataformaPercent}%):</span>
              <span className="font-semibold text-destructive">-R$ {resumo.taxaPlataforma.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa Entrega:</span>
              <span className="font-semibold text-destructive">-R$ {resumo.taxaEntrega.toFixed(2)}</span>
            </div>

            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-foreground">Você vai receber:</span>
                <span className="text-xl font-bold text-primary">R$ {resumo.totalLiquido.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-2">
              {resumo.qtdTransacoes} {resumo.qtdTransacoes === 1 ? 'transação' : 'transações'}
            </div>
          </div>

          {resumo.observacao && (
            <div className="bg-secondary/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">{resumo.observacao}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Confirmando...' : 'Confirmar Fechamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FecharCaixaButton({ restauranteId, onFechamentoCreated }) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumo, setResumo] = useState(null);

  const calcularFechamento = async () => {
    setLoading(true);
    try {
      // 1. Verificar se há pedidos em andamento
      const pedidosEmAndamento = await fechamentoCaixaService.verificarPedidosEmAndamento(restauranteId);
      
      if (pedidosEmAndamento) {
        alert('⚠️ Não é possível fechar o caixa. Há pedidos em andamento que precisam ser finalizados primeiro.');
        return;
      }

      // 2. Buscar carteira do restaurante
      const carteira = await fechamentoCaixaService.fetchCarteiraRestaurante(restauranteId);
      
      if (!carteira?.id) {
        alert('❌ Carteira não encontrada. Entre em contato com o suporte.');
        return;
      }

      // 3. Buscar último fechamento
      const ultimoFechamento = await fechamentoCaixaService.fetchUltimoFechamento(restauranteId);
      
      // Data de início: último fechamento ou início do dia
      const dataInicio = ultimoFechamento?.data_fechamento || new Date().setHours(0, 0, 0, 0);

      // 4. Buscar movimentações do período
      const movimentacoes = await fechamentoCaixaService.fetchMovimentacoesPeriodo(
        carteira.id,
        new Date(dataInicio).toISOString()
      );

      if (!movimentacoes || movimentacoes.length === 0) {
        alert('ℹ️ Não há vendas para fechar no período atual.');
        return;
      }

      // 5. Calcular valores
      const taxaPlataformaPercent = 10; // Pode ser configurável
      const valores = fechamentoCaixaService.calcularValoresFechamento(movimentacoes, taxaPlataformaPercent);

      // 6. Mostrar resumo no modal
      setResumo({
        dataInicio,
        dataFim: new Date(),
        ...valores,
        taxaPlataformaPercent,
        carteiraId: carteira.id
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Erro ao calcular fechamento:', error);
      alert('❌ Erro ao calcular fechamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const confirmarFechamento = async () => {
    setLoading(true);
    try {
      const payload = {
        id_usuario: restauranteId,
        tipo_usuario: 'restaurante',
        data_abertura: new Date(resumo.dataInicio).toISOString(),
        data_fechamento: resumo.dataFim.toISOString(),
        total_bruto: resumo.totalBruto,
        total_descontos: resumo.totalDescontos,
        total_liquido: resumo.totalLiquido,
        qtd_transacoes: resumo.qtdTransacoes,
        status: 'pendente'
      };

      await fechamentoCaixaService.criarFechamento(payload);
      
      alert('✅ Fechamento criado com sucesso! Aguardando aprovação do administrador.');
      setModalOpen(false);
      setResumo(null);
      
      // Notificar componente pai
      if (onFechamentoCreated) {
        onFechamentoCreated();
      }
    } catch (error) {
      console.error('Erro ao criar fechamento:', error);
      alert('❌ Erro ao criar fechamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={calcularFechamento}
        disabled={loading || !restauranteId}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {loading ? 'Calculando...' : 'Fechar Caixa'}
      </button>

      <FecharCaixaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resumo={resumo}
        onConfirm={confirmarFechamento}
        loading={loading}
      />
    </>
  );
}
