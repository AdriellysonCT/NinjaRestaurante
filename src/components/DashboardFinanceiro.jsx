import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as Icons from './icons/index.jsx';
import * as dashboardService from '../services/dashboardFinanceiroService.js';

const { 
  DollarSignIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon,
  CreditCardIcon, BanknoteIcon, SmartphoneIcon, RefreshCwIcon,
  ArrowUpIcon, ArrowDownIcon, ShoppingBagIcon, TruckIcon
} = Icons;

export default function DashboardFinanceiro({ restauranteId }) {
  const [dados, setDados] = useState({
    totalPedidos: 0,
    totalFaturado: 0,
    porMetodoPagamento: {},
    porTipoPedido: {},
    ticketMedio: 0,
    pedidosPorDia: {}
  });
  
  const [dadosComparacao, setDadosComparacao] = useState(null);
  const [topItens, setTopItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('hoje'); // hoje, semana, mes

  useEffect(() => {
    carregarDados();

    // Atualização em tempo real
    const canal = dashboardService.configurarRealtimePedidos(restauranteId, () => {
      carregarDados();
    });

    return () => {
      dashboardService.removerRealtimePedidos(canal);
    };
  }, [restauranteId, periodo]);

  async function carregarDados() {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados do período atual
      const { pedidos } = await dashboardService.fetchPedidosFinanceiros(restauranteId, periodo);
      const dadosProcessados = dashboardService.processarDadosFinanceiros(pedidos);
      
      // Buscar dados de comparação (período anterior)
      const dadosComparacaoResult = await dashboardService.fetchDadosComparacao(restauranteId, periodo);
      
      // Buscar top itens mais vendidos
      const topItensResult = await dashboardService.fetchTopItens(restauranteId, periodo, 5);

      setDados(dadosProcessados);
      setDadosComparacao(dadosComparacaoResult);
      setTopItens(topItensResult);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getPaymentIcon = (metodo) => {
    const metodoLower = metodo.toLowerCase();
    if (metodoLower.includes('dinheiro')) return BanknoteIcon;
    if (metodoLower.includes('cartao') || metodoLower.includes('cartão')) return CreditCardIcon;
    if (metodoLower.includes('pix')) return SmartphoneIcon;
    return DollarSignIcon;
  };

  const getPaymentColor = (metodo) => {
    const metodoLower = metodo.toLowerCase();
    if (metodoLower.includes('dinheiro')) return 'text-green-600';
    if (metodoLower.includes('cartao') || metodoLower.includes('cartão')) return 'text-blue-600';
    if (metodoLower.includes('pix')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="ninja-card p-6">
        <div className="flex items-center justify-center">
          <RefreshCwIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2">Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ninja-card p-6 border-destructive">
        <div className="text-center text-destructive">
          <p className="font-semibold">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={carregarDados}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros de período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📊 Dashboard Financeiro</h2>
        <div className="flex gap-2">
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Semana' },
            { key: 'mes', label: 'Mês' }
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                periodo === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards principais com comparação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ninja-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Concluídos</p>
              <p className="text-2xl font-bold text-primary">
                {dados.totalPedidos}
              </p>
              {dadosComparacao && (
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const crescimento = dashboardService.calcularCrescimento(dados.totalPedidos, dadosComparacao.totalPedidos);
                    const isPositive = crescimento >= 0;
                    return (
                      <>
                        {isPositive ? (
                          <ArrowUpIcon className="w-3 h-3 text-success" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 text-destructive" />
                        )}
                        <span className={isPositive ? 'text-success' : 'text-destructive'}>
                          {Math.abs(crescimento).toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">vs período anterior</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ninja-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(dados.totalFaturado)}
              </p>
              {dadosComparacao && (
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const crescimento = dashboardService.calcularCrescimento(dados.totalFaturado, dadosComparacao.totalFaturado);
                    const isPositive = crescimento >= 0;
                    return (
                      <>
                        {isPositive ? (
                          <ArrowUpIcon className="w-3 h-3 text-success" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 text-destructive" />
                        )}
                        <span className={isPositive ? 'text-success' : 'text-destructive'}>
                          {Math.abs(crescimento).toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">vs período anterior</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ninja-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(dados.ticketMedio)}
              </p>
              {dadosComparacao && (
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const crescimento = dashboardService.calcularCrescimento(dados.ticketMedio, dadosComparacao.ticketMedio);
                    const isPositive = crescimento >= 0;
                    return (
                      <>
                        {isPositive ? (
                          <ArrowUpIcon className="w-3 h-3 text-success" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 text-destructive" />
                        )}
                        <span className={isPositive ? 'text-success' : 'text-destructive'}>
                          {Math.abs(crescimento).toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">vs período anterior</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSignIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ninja-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Métodos de Pagamento</p>
              <p className="text-2xl font-bold">
                {Object.keys(dados.porMetodoPagamento).length}
              </p>
              <p className="text-xs text-muted-foreground">
                Diferentes formas
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráficos e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pizza - Métodos de pagamento */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="ninja-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">💳 Faturamento por Método de Pagamento</h3>
          
          {Object.keys(dados.porMetodoPagamento).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum pedido concluído no período selecionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gráfico de pizza */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(dados.porMetodoPagamento).map(([metodo, valor], index) => ({
                        name: metodo,
                        value: valor,
                        color: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(dados.porMetodoPagamento).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Lista detalhada */}
              <div className="space-y-2">
                {Object.entries(dados.porMetodoPagamento)
                  .sort(([,a], [,b]) => b - a)
                  .map(([metodo, valor]) => {
                    const IconComponent = getPaymentIcon(metodo);
                    const colorClass = getPaymentColor(metodo);
                    const percentual = dados.totalFaturado > 0 ? (valor / dados.totalFaturado * 100) : 0;
                    
                    return (
                      <div key={metodo} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <IconComponent className={`w-4 h-4 ${colorClass}`} />
                          </div>
                          <div>
                            <p className="font-medium capitalize text-sm">{metodo}</p>
                            <p className="text-xs text-muted-foreground">
                              {percentual.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${colorClass}`}>
                            {formatCurrency(valor)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Gráfico de barras - Tipos de pedido */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="ninja-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">🍽️ Faturamento por Tipo de Pedido</h3>
          
          {Object.keys(dados.porTipoPedido).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum dado de tipo de pedido disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gráfico de barras */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(dados.porTipoPedido).map(([tipo, valor]) => ({
                    tipo,
                    valor
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="valor" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Lista detalhada */}
              <div className="space-y-2">
                {Object.entries(dados.porTipoPedido)
                  .sort(([,a], [,b]) => b - a)
                  .map(([tipo, valor]) => {
                    const percentual = dados.totalFaturado > 0 ? (valor / dados.totalFaturado * 100) : 0;
                    const IconComponent = tipo.toLowerCase().includes('delivery') ? TruckIcon : ShoppingBagIcon;
                    
                    return (
                      <div key={tipo} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium capitalize text-sm">{tipo}</p>
                            <p className="text-xs text-muted-foreground">
                              {percentual.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(valor)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top itens mais vendidos */}
      {topItens.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="ninja-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">🏆 Itens Mais Vendidos</h3>
          
          <div className="space-y-3">
            {topItens.map((item, index) => (
              <div key={item.nome} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">
                    {formatCurrency(item.faturamento)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.faturamento / item.quantidade)} por unidade
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Gráfico de evolução diária */}
      {Object.keys(dados.pedidosPorDia).length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="ninja-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">📈 Evolução do Faturamento</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Object.entries(dados.pedidosPorDia)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([dia, dados]) => ({
                  dia: new Date(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  faturamento: dados.valor,
                  pedidos: dados.quantidade
                }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'faturamento' ? formatCurrency(value) : value,
                    name === 'faturamento' ? 'Faturamento' : 'Pedidos'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="faturamento" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Faturamento"
                />
                <Line 
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Botão de atualização manual */}
      <div className="flex justify-center">
        <button
          onClick={carregarDados}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
        >
          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>
    </div>
  );
}