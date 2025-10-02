import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TableIcon, UsersIcon, ClockIcon } from '../components/icons/definitions.jsx';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { fetchTables, updateTableStatus, associateOrderToTable, createTable } from '../services/tableService';
import { createOrder } from '../services/orderService';

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
  const { restaurante } = useAppContext();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('2');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar o tempo a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Buscar mesas do restaurante
  useEffect(() => {
    if (restaurante?.id) {
      loadTables();
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

  const handleMesaClick = async (table) => {
    if (table.status === 'disponivel') {
      try {
        // Mudar status para 'ocupada'
        await updateTableStatus(table.id, 'ocupada');

        // Criar um novo pedido
        const novoPedido = await createOrder({
          id_restaurante: restaurante.id,
          mesa_numero: table.numero,
          tipo_pedido: 'mesa',
          status: 'em_atendimento', // ou o status inicial desejado
        });

        // Associar o pedido à mesa
        await associateOrderToTable(table.id, novoPedido.id);

        // Recarregar as mesas e navegar para a tela do pedido
        await loadTables();
        navigate(`/pedidos/${novoPedido.id}`);
      } catch (error) {
        console.error('Erro ao ocupar mesa e criar pedido:', error);
        alert('Erro ao processar a mesa. Tente novamente.');
        // Reverter o status da mesa se algo der errado
        await updateTableStatus(table.id, 'disponivel');
        loadTables();
      }
    } else if (table.status === 'ocupada' && table.id_pedido) {
      // Se a mesa estiver ocupada, navegar para o pedido existente
      navigate(`/pedidos/${table.id_pedido}`);
    }
  };

  // Calcular tempo de ocupação
  const calcularTempoDecorrido = (startedAt) => {
    if (!startedAt) return null;
    
    const start = new Date(startedAt);
    const diff = Math.floor((new Date() - start) / (1000 * 60)); // Diferença em minutos
    return diff;
  };

  // Obter cores baseadas no status
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

  // Obter texto do status
  const getStatusText = (status) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'reservada': return 'Reservada';
      case 'ocupada': return 'Ocupada';
      default: return 'Indefinido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciamento de Mesas</h1>
        <p className="text-gray-600">Clique em uma mesa disponível para criar um pedido ou em uma mesa ocupada para abrir o pedido.</p>
      </div>

      {/* Legenda */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Ocupada</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Nova Mesa</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade
                </label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTable}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tables;