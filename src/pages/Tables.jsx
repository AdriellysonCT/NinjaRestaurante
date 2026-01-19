import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TableIcon, UsersIcon, ClockIcon } from '../components/icons/definitions.jsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchTables, updateTableStatus, associateOrderToTable, createTable } from '../services/tableService';
import { createOrder, addItemToOrder, removeItemFromOrder } from '../services/orderService';
import { fetchMenuItems } from '../services/menuService';
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

  const ensureOrderForTable = async (table) => {
    if (table.id_pedido) return table.id_pedido;
    const novo = await createOrder({
      id_restaurante: restaurante.id,
      mesa_numero: table.numero,
      tipo_pedido: 'local',
      status: 'disponivel',
    });
    await associateOrderToTable(table.id, novo.id);
    await loadTables();
    return novo.id;
  };

  const handleQuickAddItem = async (menuItemId) => {
    try {
      if (!activeOrderForAdd?.id) return;
      const qty = Number(qtyByItem[menuItemId] || 1);
      const note = noteByItem[menuItemId] || '';
      await addItemToOrder({ orderId: activeOrderForAdd.id, restaurantId: restaurante.id, menuItemId, quantity: qty, note });
      setQtyByItem((p)=> ({...p, [menuItemId]: 1}));
      setNoteByItem((p)=> ({...p, [menuItemId]: ''}));
    } catch (e) {
      alert('Erro ao adicionar item.');
    }
  };

  const openContaDaMesa = async (table) => {
    const orderId = await ensureOrderForTable(table);
    const { data } = await supabase
      .from('itens_pedido')
      .select('id, quantidade, preco_unitario, preco_total, observacao_item, itens_cardapio(nome)')
      .eq('id_pedido', orderId);
    setContaItens(data||[]);
    setContaPedido({ id: orderId, mesa: table.numero });
    setShowContaModal(true);
  };

  // Calcular tempo de ocupação
  const calcularTempoDecorrido = (startedAt) => {
    if (!startedAt) return null;
    
    const start = new Date(startedAt);
    const diff = Math.floor((new Date() - start) / (1000 * 60)); // Diferença em minutos
    return diff;
  };

  // helpers agora definidos acima (antes do TableCard)

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

      {/* Modal para Adicionar Mesa */}
      {showNewTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Adicionar Nova Mesa</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Número da Mesa
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Capacidade
                </label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="2">2 pessoas</option>
                  <option value="4">4 pessoas</option>
                  <option value="6">6 pessoas</option>
                  <option value="8">8 pessoas</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTableModal(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTable}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conta da Mesa (resumo simplificado) */}
      {showContaModal && contaPedido && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Conta da Mesa {contaPedido.mesa}</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {contaItens.length === 0 ? (
                <div className="text-gray-600">Nenhum item.</div>
              ) : (
                contaItens.map((it)=> (
                  <div key={it.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{it.itens_cardapio?.nome}</div>
                      <div className="text-sm text-gray-600">{it.quantidade} x R$ {Number(it.preco_unitario||0).toFixed(2)}</div>
                      {it.observacao_item && (
                        <div className="text-xs text-gray-500">Obs: {it.observacao_item}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">R$ {Number(it.preco_total ?? (Number(it.quantidade||0)*Number(it.preco_unitario||0))).toFixed(2)}</div>
                      <button onClick={async()=>{ await removeItemFromOrder({ orderItemId: it.id, orderId: contaPedido.id }); await openContaDaMesa({ id_pedido: contaPedido.id, numero: contaPedido.mesa }); }} className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Remover</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t mt-4 pt-3 flex justify-between">
              <div className="font-semibold">Total</div>
              <div className="font-bold">R$ {Number(contaItens.reduce((acc, it)=> acc + Number(it.preco_total ?? (Number(it.quantidade||0)*Number(it.preco_unitario||0))), 0)).toFixed(2)}</div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowContaModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ações da Mesa */}
      {showActionsModal && actionMesa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mesa {actionMesa.numero} - Ações</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={async ()=>{ await updateTableStatus(actionMesa.id,'disponivel'); await loadTables(); setShowActionsModal(false); }} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Disponível</button>
              <button onClick={async ()=>{ await updateTableStatus(actionMesa.id,'reservada'); await loadTables(); setShowActionsModal(false); }} className="px-3 py-2 bg-yellow-200 rounded hover:bg-yellow-300">Reservar</button>
              <button onClick={async ()=>{ await updateTableStatus(actionMesa.id,'ocupada',{ started_at: new Date().toISOString() }); const id = await ensureOrderForTable(actionMesa); setActiveOrderForAdd({ id, mesa: actionMesa.numero }); setShowAddItemModal(true); setShowActionsModal(false); }} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Adicionar Itens</button>
              <button onClick={async ()=>{ await openContaDaMesa(actionMesa); setShowActionsModal(false); }} className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">Conta da Mesa</button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=> setShowActionsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Itens */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-4xl mx-4 rounded-lg overflow-hidden bg-background border border-primary">
            <div className="p-4 flex items-center justify-between bg-card border-b border-primary">
              <h2 className="text-lg font-bold text-primary">Adicionar Itens — Mesa {activeOrderForAdd?.mesa}</h2>
              <button onClick={() => setShowAddItemModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar item..." className="flex-1 min-w-[200px] px-3 py-2 rounded-md bg-input text-foreground border border-border focus:border-primary focus:outline-none" />
                <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-md bg-input text-foreground border border-border focus:border-primary focus:outline-none">
                  <option value="">Todas categorias</option>
                  {[...new Set(menuItems.map(i=>i.categoria).filter(Boolean))].map(cat=> (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {menuItems.filter(i => (categoryFilter ? i.categoria === categoryFilter : true)).filter(i => i.nome?.toLowerCase().includes(searchTerm.toLowerCase())).map((it)=> (
                  <div key={it.id} className="rounded-lg p-3 flex flex-col relative bg-card border border-border">
                    <div className="text-foreground font-semibold mb-1 truncate">{it.nome}</div>
                    <div className="text-sm text-muted-foreground mb-2 truncate">{it.categoria || '—'}</div>
                    <div className="text-primary font-bold mb-3">R$ {Number(it.preco||0).toFixed(2)}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="number" min={1} value={qtyByItem[it.id] || 1} onChange={(e)=> setQtyByItem(prev=> ({ ...prev, [it.id]: parseInt(e.target.value||'1',10) }))} className="w-20 px-2 py-1 rounded bg-input text-foreground border border-border focus:border-primary focus:outline-none" />
                      <input type="text" placeholder="Obs." value={noteByItem[it.id] || ''} onChange={(e)=> setNoteByItem(prev=> ({ ...prev, [it.id]: e.target.value }))} className="flex-1 px-2 py-1 rounded bg-input text-foreground border border-border focus:border-primary focus:outline-none" />
                    </div>
                    <button onClick={()=> handleQuickAddItem(it.id)} className="w-full px-3 py-2 rounded text-primary-foreground mt-auto bg-primary hover:bg-primary/90 transition-colors">Adicionar</button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={()=> setShowAddItemModal(false)} className="px-4 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">Fechar</button>
                <button onClick={async ()=>{ setShowAddItemModal(false); if (activeOrderForAdd?.id) { await openContaDaMesa({ id_pedido: activeOrderForAdd.id, numero: activeOrderForAdd.mesa }); } }} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Finalizar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tables;