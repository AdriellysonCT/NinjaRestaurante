import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TableIcon, UsersIcon, ClockIcon } from '../components/icons/definitions.jsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchTables, updateTableStatus, createTable, releaseTable } from '../services/tableService';
import { fetchMenuItems } from '../services/menuService';
import { addItemToMesa, fetchMesaItems, removeItemFromMesa, finalizarMesa } from '../services/mesaItemsService';
import { printService } from '../services/printService';
import { supabase } from '../lib/supabase';

// Helpers need to be defined BEFORE using them in TableCard
const getTableColors = (status) => {
  switch (status) {
    case 'disponivel':
      return {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        text: 'text-white',
        border: 'border-green-600'
      };
    case 'reservada':
      return {
        bg: 'bg-yellow-500',
        hover: 'hover:bg-yellow-600',
        text: 'text-white',
        border: 'border-yellow-600'
      };
    case 'ocupada':
      return {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        text: 'text-white',
        border: 'border-red-600'
      };
    default:
      return {
        bg: 'bg-gray-500',
        hover: 'hover:bg-gray-600',
        text: 'text-white',
        border: 'border-gray-600'
      };
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'disponivel': return 'Disponível';
    case 'reservada': return 'Reservada';
    case 'ocupada': return 'Ocupada';
    default: return 'Indefinido';
  }
};

const TableCard = ({ table, onClick, occupationTime }) => {
  const colors = getTableColors(table.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg shadow-lg cursor-pointer transition-colors ${colors.bg} ${colors.hover} ${colors.border} border-2`}
      onClick={() => onClick(table)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TableIcon className="w-6 h-6" />
          <h3 className="text-xl font-bold">Mesa {table.numero}</h3>
        </div>
        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${colors.text} ${colors.bg}`}>
          {getStatusText(table.status)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <UsersIcon className="w-4 h-4" />
        <span>Capacidade: {table.capacidade}</span>
      </div>
      {table.status === 'ocupada' && occupationTime !== null && (
        <div className="flex items-center gap-2 text-sm mt-2">
          <ClockIcon className="w-4 h-4" />
          <span>Ocupada há: {occupationTime} min</span>
        </div>
      )}
    </motion.div>
  );
};

const Tables = () => {
  const { restaurante } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('2');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionMesa, setActionMesa] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [activeOrderForAdd, setActiveOrderForAdd] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [qtyByItem, setQtyByItem] = useState({});
  const [noteByItem, setNoteByItem] = useState({});
  const [showContaModal, setShowContaModal] = useState(false);
  const [contaItens, setContaItens] = useState([]);
  const [contaPedido, setContaPedido] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Atualizar o tempo a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Buscar mesas do restaurante (evitar loop)
  useEffect(() => {
    if (restaurante?.id) {
      loadTables();
      fetchMenuItems().then((items)=> setMenuItems(items||[])).catch(()=>{});
    } else {
      setLoading(false);
    }
  }, [restaurante?.id]);

  // Subscription Realtime para mesas
  useEffect(() => {
    if (!restaurante?.id) return;

    const channel = supabase
      .channel('mesas_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mesas',
          filter: `id_restaurante=eq.${restaurante.id}`
        },
        (payload) => {
          console.log('Mudança detectada em mesas:', payload);
          loadTables(); // Recarrega as mesas quando houver mudança
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurante?.id]);

  // Função para carregar mesas
  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTables();
      setTables(data);
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      setError('Não foi possível carregar as mesas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar nova mesa
  const handleCreateTable = async () => {
    try {
      if (!newTableNumber.trim()) {
        alert('Por favor, insira o número da mesa');
        return;
      }

      await createTable({
        numero: parseInt(newTableNumber),
        capacidade: parseInt(newTableCapacity)
      });

      setShowNewTableModal(false);
      setNewTableNumber('');
      setNewTableCapacity('2');
      await loadTables();
      
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      alert('Erro ao criar mesa: ' + error.message);
    }
  };

  const handleMesaClick = (table) => {
    setActionMesa(table);
    setShowActionsModal(true);
  };

  const handleQuickAddItem = async (menuItemId) => {
    try {
      if (!actionMesa?.id) return;
      setAddingItem(menuItemId);
      const qty = Number(qtyByItem[menuItemId] || 1);
      const note = noteByItem[menuItemId] || '';
      
      await addItemToMesa(actionMesa.id, menuItemId, qty, note);
      
      setQtyByItem((p)=> ({...p, [menuItemId]: 1}));
      setNoteByItem((p)=> ({...p, [menuItemId]: ''}));
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      alert('Erro ao adicionar item: ' + e.message);
    } finally {
      setAddingItem(null);
    }
  };

  const openContaDaMesa = async (table) => {
    try {
      const itens = await fetchMesaItems(table.id);
      setContaItens(itens);
      setContaPedido({ id: table.id, mesa: table.numero });
      setShowContaModal(true);
    } catch (error) {
      alert('Erro ao carregar conta: ' + error.message);
    }
  };

  const handleFinalizarMesa = async (metodoPagamento) => {
    try {
      if (!contaPedido) return;
      
      const nomeCliente = customerName || `Mesa ${contaPedido.mesa}`;
      await finalizarMesa(contaPedido.id, metodoPagamento, nomeCliente);
      
      setShowContaModal(false);
      setShowPaymentModal(false);
      setCustomerName('');
      await loadTables();
      
      alert('Mesa finalizada com sucesso!');
    } catch (error) {
      alert('Erro ao finalizar mesa: ' + error.message);
    }
  };

  // Calcular tempo de ocupação
  const calcularTempoDecorrido = (startedAt) => {
    if (!startedAt) return null;
    
    const start = new Date(startedAt);
    const diff = Math.floor((new Date() - start) / (1000 * 60)); // Diferença em minutos
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gerenciamento de Mesas</h1>
        <p className="text-muted-foreground">Clique em uma mesa disponível para criar um pedido ou em uma mesa ocupada para abrir o pedido.</p>
      </div>

      {/* Legenda */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Ocupada</span>
        </div>
      </div>

      {/* Botão Adicionar Mesa */}
      <div className="mb-6">
        <button
          onClick={() => setShowNewTableModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span className="text-lg">+</span>
          Adicionar Mesa
        </button>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onClick={handleMesaClick}
            occupationTime={calcularTempoDecorrido(table.started_at)}
          />
        ))}
      </div>

      {/* Modal para Adicionar Mesa - COM PORTAL */}
      {showNewTableModal && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <div className="bg-gradient-to-br from-card via-card to-card/95 border-2 border-primary/40 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 px-6 py-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🪑</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Adicionar Nova Mesa</h2>
                    <p className="text-xs text-muted-foreground">Configure os detalhes da mesa</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNewTableModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Número da Mesa <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-input border-2 border-border hover:border-primary/50 focus:border-primary rounded-xl text-foreground font-bold text-lg transition-colors focus:outline-none"
                  placeholder="Ex: 1"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Capacidade <span className="text-destructive">*</span>
                </label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-4 py-3 bg-input border-2 border-border hover:border-primary/50 focus:border-primary rounded-xl text-foreground transition-colors focus:outline-none"
                >
                  <option value="2">👥 2 pessoas</option>
                  <option value="4">👥👥 4 pessoas</option>
                  <option value="6">👥👥👥 6 pessoas</option>
                  <option value="8">👥👥👥👥 8 pessoas</option>
                </select>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowNewTableModal(false)}
                className="flex-1 px-4 py-3 border-2 border-border text-foreground rounded-xl hover:bg-secondary transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTable}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:shadow-lg transition-all font-bold"
              >
                + Criar Mesa
              </button>
            </div>
          </div>
          
          {/* Estilos de animação */}
          <style jsx>{`
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            
            .animate-scaleIn {
              animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* Modal Conta da Mesa - COM PORTAL */}
      {showContaModal && contaPedido && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50000 }}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Conta da Mesa {contaPedido.mesa}</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {contaItens.length === 0 ? (
                <div className="text-muted-foreground">Nenhum item adicionado.</div>
              ) : (
                contaItens.map((it)=> (
                  <div key={it.id} className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <div className="font-medium text-foreground">{it.itens_cardapio?.nome}</div>
                      <div className="text-sm text-muted-foreground">{it.quantidade} x R$ {Number(it.preco_unitario||0).toFixed(2)}</div>
                      {it.observacao && (
                        <div className="text-xs text-muted-foreground">Obs: {it.observacao}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground">R$ {(Number(it.quantidade||0)*Number(it.preco_unitario||0)).toFixed(2)}</div>
                      <button 
                        onClick={async()=>{ 
                          await removeItemFromMesa(it.id); 
                          const itens = await fetchMesaItems(contaPedido.id);
                          setContaItens(itens);
                        }} 
                        className="px-2 py-1 text-sm bg-destructive text-white rounded hover:bg-destructive/80"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border mt-4 pt-3 flex justify-between">
              <div className="font-semibold text-foreground">Total</div>
              <div className="font-bold text-primary text-xl">
                R$ {contaItens.reduce((acc, it)=> acc + (Number(it.quantidade||0)*Number(it.preco_unitario||0)), 0).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={()=>setShowContaModal(false)} 
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary"
              >
                Fechar
              </button>
              <button 
                onClick={async () => {
                  try {
                    await printService.printOrderTicket({
                      id: contaPedido.id,
                      numero_pedido: contaPedido.mesa,
                      customerName: `Mesa ${contaPedido.mesa}`,
                      items: contaItens.map(it => ({
                        name: it.itens_cardapio?.nome,
                        qty: it.quantidade,
                        price: it.preco_unitario,
                        observacao: it.observacao
                      })),
                      total: contaItens.reduce((acc, it)=> acc + (Number(it.quantidade||0)*Number(it.preco_unitario||0)), 0),
                      tipo_pedido: 'local'
                    });
                  } catch (error) {
                    alert('Erro ao imprimir: ' + error.message);
                  }
                }} 
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                Imprimir
              </button>
              <button 
                onClick={() => {
                  setShowPaymentModal(true);
                }} 
                className="flex-1 px-4 py-3 bg-success text-white rounded-lg hover:brightness-110 font-bold"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Pagamento - COM PORTAL PARA FICAR NA FRENTE */}
      {showPaymentModal && contaPedido && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-foreground mb-2">Finalizar Mesa {contaPedido.mesa}</h2>
            <p className="text-sm text-muted-foreground mb-6">Escolha o método de pagamento</p>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                { id: 'pix', label: 'PIX', icon: '📱' },
                { id: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
                { id: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border-2 ${
                    paymentMethod === method.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-secondary/50 border-transparent text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-bold">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total a Pagar</span>
                <span className="text-2xl font-black text-primary">
                  R$ {contaItens.reduce((acc, it)=> acc + (Number(it.quantidade||0)*Number(it.preco_unitario||0)), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground rounded-xl hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleFinalizarMesa(paymentMethod)}
                disabled={!paymentMethod}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  paymentMethod
                    ? 'bg-success text-white hover:brightness-110'
                    : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Ações da Mesa - REDESIGN MODERNO COM PORTAL */}
      {showActionsModal && actionMesa && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowActionsModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <TableIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">Mesa {actionMesa.numero}</h2>
                    <p className="text-xs text-muted-foreground font-medium">Escolha uma ação</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowActionsModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="p-6 space-y-3">
              <button 
                onClick={async () => { 
                  await updateTableStatus(actionMesa.id, 'disponivel'); 
                  await loadTables(); 
                  setShowActionsModal(false); 
                }} 
                className="w-full flex items-center gap-4 px-5 py-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group border border-border hover:border-primary/30"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">✓</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground">Marcar Disponível</div>
                  <div className="text-xs text-muted-foreground">Mesa livre para novos clientes</div>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  await updateTableStatus(actionMesa.id, 'reservada'); 
                  await loadTables(); 
                  setShowActionsModal(false); 
                }} 
                className="w-full flex items-center gap-4 px-5 py-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group border border-border hover:border-primary/30"
              >
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">🔒</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground">Reservar Mesa</div>
                  <div className="text-xs text-muted-foreground">Bloquear para reserva</div>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  // Marcar mesa como ocupada se não estiver
                  if (actionMesa.status !== 'ocupada') {
                    await updateTableStatus(actionMesa.id, 'ocupada', { started_at: new Date().toISOString() });
                    await loadTables();
                  }
                  
                  setShowAddItemModal(true); 
                  setShowActionsModal(false); 
                }} 
                className="w-full flex items-center gap-4 px-5 py-4 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all group border border-primary/30"
              >
                <div className="w-10 h-10 bg-primary/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">➕</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-primary">Adicionar Itens</div>
                  <div className="text-xs text-muted-foreground">Fazer pedido para a mesa</div>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  await openContaDaMesa(actionMesa); 
                  setShowActionsModal(false); 
                }} 
                className="w-full flex items-center gap-4 px-5 py-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group border border-border hover:border-success/30"
              >
                <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">💰</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground">Conta da Mesa</div>
                  <div className="text-xs text-muted-foreground">Ver itens e total</div>
                </div>
              </button>
            </div>

            {/* Finalizar Mesa - Sempre disponível */}
            <div className="px-6 pb-6">
              <button 
                onClick={async () => { 
                  await openContaDaMesa(actionMesa);
                  setShowActionsModal(false);
                  setShowPaymentModal(true);
                }} 
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white rounded-2xl transition-all font-bold shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">🏁</span>
                Finalizar e Liberar Mesa
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Modal Adicionar Itens - COM PORTAL */}
      {showAddItemModal && actionMesa && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="w-full max-w-4xl rounded-lg overflow-hidden bg-background border border-primary flex flex-col max-h-[90vh] relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-card border-b border-primary flex-shrink-0">
              <h2 className="text-lg font-bold text-primary">Adicionar Itens — Mesa {actionMesa.numero}</h2>
              <button onClick={() => setShowAddItemModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            {/* Barra de Pesquisa FIXA */}
            <div className="px-4 py-3 bg-background border-b border-border flex-shrink-0">
              <div className="flex flex-wrap gap-3">
                <input 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Buscar item..." 
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-md bg-input text-foreground border border-border focus:border-primary focus:outline-none" 
                />
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)} 
                  className="px-3 py-2 rounded-md bg-input text-foreground border border-border focus:border-primary focus:outline-none"
                >
                  <option value="">Todas categorias</option>
                  {[...new Set(menuItems.map(i => i.categoria).filter(Boolean))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Área de Scroll com os Itens */}
            <div className="p-4 overflow-y-auto flex-1 scrollbar-hide">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {menuItems
                  .filter(i => (categoryFilter ? i.categoria === categoryFilter : true))
                  .filter(i => i.nome?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((it) => (
                    <div key={it.id} className="rounded-lg p-3 flex flex-col bg-card border border-border">
                      <div className="text-foreground font-semibold mb-1 truncate" title={it.nome}>{it.nome}</div>
                      <div className="text-sm text-muted-foreground mb-2 truncate">{it.categoria || '—'}</div>
                      <div className="text-primary font-bold mb-3">R$ {Number(it.preco || 0).toFixed(2)}</div>
                      
                      <div className="space-y-2 mt-auto">
                        <input 
                          type="number" 
                          min={1} 
                          value={qtyByItem[it.id] || 1} 
                          onChange={(e) => setQtyByItem(prev => ({ ...prev, [it.id]: parseInt(e.target.value || '1', 10) }))} 
                          className="w-full px-3 py-2 rounded bg-input text-foreground border border-border focus:border-primary focus:outline-none text-center font-bold" 
                          placeholder="Qtd"
                        />
                        <input 
                          type="text" 
                          placeholder="Observações (opcional)" 
                          value={noteByItem[it.id] || ''} 
                          onChange={(e) => setNoteByItem(prev => ({ ...prev, [it.id]: e.target.value }))} 
                          className="w-full px-3 py-2 rounded bg-input text-foreground border border-border focus:border-primary focus:outline-none text-sm" 
                        />
                      </div>
                      
                      <button 
                        onClick={() => handleQuickAddItem(it.id)} 
                        disabled={addingItem === it.id}
                        className={`w-full px-3 py-2 rounded text-primary-foreground mt-2 transition-colors font-bold ${
                          addingItem === it.id 
                            ? 'bg-success cursor-default' 
                            : 'bg-primary hover:bg-primary/90'
                        }`}
                      >
                        {addingItem === it.id ? '✓ Adicionado!' : 'Adicionar'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3 flex-shrink-0 bg-background">
              <button 
                onClick={() => setShowAddItemModal(false)} 
                className="px-4 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={async () => { 
                  setShowAddItemModal(false); 
                  await openContaDaMesa(actionMesa); 
                }} 
                className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ver Conta
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default Tables;