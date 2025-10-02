import React, { useState } from 'react';
import { OrderDetailModal } from './OrderDetailModal';
import { PrintSettingsSection } from './settings/PrintSettingsSection';
import { PrintHistory } from './PrintHistory';
import { BatchPrint } from './BatchPrint';
import * as Icons from './icons/index.jsx';
import { printService } from '../services/printService';

export const TestMocker = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [isPrintHistoryOpen, setIsPrintHistoryOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);

  // Dados de teste para pedidos
  const mockOrders = [
    {
      id: 1001,
      customerName: 'João Silva',
      phone: '11987654321',
      items: [
        { id: 1, name: 'Ramen do Ichiraku', qty: 2, price: 25.00 },
        { id: 2, name: 'Onigiri', qty: 1, price: 8.50 }
      ],
      total: 58.50,
      status: 'new',
      prepTime: 900, // 15 minutos em segundos
      timestamp: new Date().toISOString(),
      paymentMethod: 'card',
      comments: 'Sem cebola, por favor.',
      isVip: true
    },
    {
      id: 1002,
      customerName: 'Maria Oliveira',
      phone: '11912345678',
      items: [
        { id: 3, name: 'Salada Ninja', qty: 1, price: 15.00 },
        { id: 4, name: 'Peixe Grelhado', qty: 1, price: 42.00 }
      ],
      total: 57.00,
      status: 'preparing',
      prepTime: 1200, // 20 minutos em segundos
      timestamp: new Date().toISOString(),
      paymentMethod: 'pix',
      comments: 'Entregar o mais rápido possível.'
    },
    {
      id: 1003,
      customerName: 'Carlos Mendes',
      // Sem telefone propositalmente para testar a funcionalidade de solicitar número
      items: [
        { id: 5, name: 'Chá Verde', qty: 2, price: 6.00 },
        { id: 6, name: 'Gyoza', qty: 2, price: 18.00 }
      ],
      total: 48.00,
      status: 'ready',
      prepTime: 720, // 12 minutos em segundos
      timestamp: new Date().toISOString(),
      paymentMethod: 'cash',
      comments: ''
    },
    {
      id: 1004,
      customerName: 'Ana Souza',
      phone: '11998765432',
      items: [
        { id: 7, name: 'Sushi Combo', qty: 1, price: 45.00 }
      ],
      total: 45.00,
      status: 'dispatched',
      prepTime: 1500, // 25 minutos em segundos
      timestamp: new Date().toISOString(),
      paymentMethod: 'card',
      comments: 'Cliente mora em apartamento, ligar na chegada.'
    }
  ];

  // Dados de teste para mesas
  const mockTables = [
    {
      id: 1,
      status: 'occupied',
      capacity: 4,
      occupiedSince: new Date(Date.now() - 3600000), // 1 hora atrás
      customers: 3,
      items: [
        { id: 1, name: 'Ramen do Ichiraku', qty: 2, price: 25.00 },
        { id: 2, name: 'Onigiri', qty: 1, price: 8.50 }
      ],
      total: 58.50,
      waiter: 'Carlos'
    },
    {
      id: 2,
      status: 'available',
      capacity: 2,
      occupiedSince: null,
      customers: 0,
      items: [],
      total: 0,
      waiter: null
    },
    {
      id: 3,
      status: 'reserved',
      capacity: 6,
      occupiedSince: null,
      customers: 0,
      items: [],
      total: 0,
      waiter: null
    }
  ];

  // Dados de teste para reservas
  const mockReservations = [
    {
      id: 101,
      name: 'João Silva',
      phone: '11987654321',
      email: 'joao@email.com',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      people: 4,
      table: '5',
      notes: 'Aniversário de casamento',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
    },
    {
      id: 102,
      name: 'Maria Oliveira',
      phone: '11912345678',
      email: 'maria@email.com',
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      people: 2,
      table: '3',
      notes: 'Prefere mesa perto da janela',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 172800000).toISOString() // 2 dias atrás
    }
  ];

  // Função para lidar com a aceitação de pedidos
  const handleAcceptOrder = (orderId) => {
    console.log(`Pedido #${orderId} aceito`);
    // Aqui você poderia atualizar o status do pedido
  };

  // Função para lidar com a rejeição de pedidos
  const handleRejectOrder = (orderId) => {
    console.log(`Pedido #${orderId} rejeitado`);
    // Aqui você poderia atualizar o status do pedido
  };

  // Função para imprimir comanda de teste
  const handlePrintTest = async () => {
    try {
      const result = await printService.printOrderTicket(mockOrders[0]);
      console.log('Resultado da impressão de teste:', result);
      alert('Comanda de teste enviada para impressão. Verifique o console para detalhes.');
    } catch (error) {
      console.error('Erro ao imprimir comanda de teste:', error);
      alert('Erro ao imprimir comanda de teste: ' + error.message);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Painel de Teste - Novas Funcionalidades</h1>
      
      {/* Abas de navegação */}
      <div className="flex border-b border-border overflow-x-auto">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('orders')}
        >
          Pedidos
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'pos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('pos')}
        >
          PDV Balcão
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'tables' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('tables')}
        >
          Mesas
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'scheduled' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Agendados
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'print' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('print')}
        >
          Impressão
        </button>
      </div>
      
      {/* Conteúdo da aba selecionada */}
      <div className="space-y-4">
        {/* Aba de Pedidos */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique em um pedido para ver detalhes e testar a funcionalidade de WhatsApp.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsOrderModalOpen(true);
                  }}
                  className={`ninja-card p-4 cursor-pointer hover:border-primary transition-colors ${
                    order.status === 'new' ? 'ninja-glow-order' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">Pedido #{order.id}</h3>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      {order.phone && (
                        <p className="text-xs text-muted-foreground">{order.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">R$ {order.total.toFixed(2)}</p>
                      {order.isVip && (
                        <div className="flex items-center justify-end gap-1 text-xs text-yellow-400 mt-1">
                          <Icons.NinjaStarIcon className="w-3 h-3 fill-current" />
                          <span>Cliente VIP</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Status: {
                      order.status === 'new' ? 'Novo' :
                      order.status === 'preparing' ? 'Em Preparo' :
                      order.status === 'ready' ? 'Pronto' :
                      'A Caminho'
                    }</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Icons.ClockIcon className="w-3 h-3" />
                      Tempo de preparo: {Math.round(order.prepTime / 60)} min
                    </p>
                  </div>
                  

                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    {order.items.length} itens · {new Date(order.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Aba de PDV Balcão */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para testar o PDV Balcão, acesse a página completa clicando no botão abaixo.
            </p>
            
            <div className="flex gap-4">
              <a 
                href="#/pos" 
                target="_blank"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"
              >
                <Icons.CashRegisterIcon className="w-5 h-5" />
                Abrir PDV Balcão
              </a>
              
              <button 
                onClick={() => {
                  // Simular navegação para a página de PDV
                  window.location.hash = '/pos';
                }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
              >
                Navegar para PDV
              </button>
            </div>
            
            <div className="ninja-card p-4">
              <h3 className="font-bold mb-2">Recursos do PDV Balcão</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Interface otimizada para vendas rápidas</li>
                <li>Calculadora de troco integrada</li>
                <li>Múltiplas opções de pagamento (dinheiro, cartão, PIX)</li>
                <li>Impressão automática de comprovante</li>
                <li>Atalhos de teclado (F2, F4, F8, F9, F10)</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Aba de Mesas */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para testar o gerenciamento de mesas, acesse a página completa clicando no botão abaixo.
            </p>
            
            <div className="flex gap-4">
              <a 
                href="#/tables" 
                target="_blank"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"
              >
                <Icons.TableIcon className="w-5 h-5" />
                Abrir Gerenciamento de Mesas
              </a>
              
              <button 
                onClick={() => {
                  // Simular navegação para a página de mesas
                  window.location.hash = '/tables';
                }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
              >
                Navegar para Mesas
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockTables.map(table => (
                <div 
                  key={table.id}
                  className={`ninja-card p-4 ${
                    table.status === 'occupied' ? 'ninja-glow-order' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold">Mesa {table.id}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      table.status === 'available' ? 'bg-success/20 text-success' :
                      table.status === 'occupied' ? 'bg-destructive/20 text-destructive' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {table.status === 'available' ? 'Disponível' :
                       table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                    </span>
                  </div>
                  
                  {table.status === 'occupied' && (
                    <>
                      <div className="mt-2 text-sm">
                        <p>Capacidade: {table.capacity} lugares</p>
                        <p>Ocupação: {table.customers} pessoas</p>
                        <p>Garçom: {table.waiter}</p>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Consumo: R$ {table.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{table.items.length} itens</p>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Icons.ClockIcon className="w-3 h-3" />
                        Ocupada há: {Math.floor((Date.now() - new Date(table.occupiedSince).getTime()) / 60000)} min
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Aba de Agendados */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para testar o sistema de reservas, acesse a página completa clicando no botão abaixo.
            </p>
            
            <div className="flex gap-4">
              <a 
                href="#/scheduled" 
                target="_blank"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"
              >
                <Icons.CalendarIcon className="w-5 h-5" />
                Abrir Sistema de Reservas
              </a>
              
              <button 
                onClick={() => {
                  // Simular navegação para a página de reservas
                  window.location.hash = '/scheduled';
                }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
              >
                Navegar para Reservas
              </button>
            </div>
            
            <div className="ninja-card p-4">
              <h3 className="font-bold mb-2">Reservas de Hoje</h3>
              
              <div className="space-y-2">
                {mockReservations.map(reservation => (
                  <div 
                    key={reservation.id}
                    className="border-b border-border last:border-0 pb-2 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{reservation.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icons.ClockIcon className="w-3 h-3" />
                          <span>{reservation.time}</span>
                          <span>·</span>
                          <span>{reservation.people} pessoas</span>
                          {reservation.table && <span>· Mesa {reservation.table}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        reservation.status === 'confirmed' ? 'bg-success/20 text-success' :
                        reservation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Confirmada' :
                         reservation.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </span>
                    </div>
                    
                    {reservation.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Obs: {reservation.notes}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Contato: {reservation.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Aba de Impressão */}
        {activeTab === 'print' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Teste as funcionalidades de impressão usando os botões abaixo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handlePrintTest}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-md hover:bg-secondary/80"
              >
                <Icons.PrinterIcon className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-medium">Imprimir Comanda de Teste</p>
                  <p className="text-xs text-muted-foreground">Imprime uma comanda de exemplo</p>
                </div>
              </button>
              
              <button 
                onClick={() => setIsPrintSettingsOpen(true)}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-md hover:bg-secondary/80"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium">Configurações de Impressão</p>
                  <p className="text-xs text-muted-foreground">Personalizar layout e opções</p>
                </div>
              </button>
              
              <button 
                onClick={() => setIsPrintHistoryOpen(true)}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-md hover:bg-secondary/80"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium">Histórico de Impressões</p>
                  <p className="text-xs text-muted-foreground">Ver impressões anteriores</p>
                </div>
              </button>
              
              <button 
                onClick={() => setIsBatchPrintOpen(true)}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-md hover:bg-secondary/80"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="text-left">
                  <p className="font-medium">Impressão em Lote</p>
                  <p className="text-xs text-muted-foreground">Imprimir múltiplas comandas</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modais */}
      <OrderDetailModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        order={selectedOrder}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
      />
      
      <PrintSettingsSection 
            isOpen={isPrintSettingsOpen}
            onClose={() => setIsPrintSettingsOpen(false)}
          />
      
      <PrintHistory 
        isOpen={isPrintHistoryOpen} 
        onClose={() => setIsPrintHistoryOpen(false)} 
      />
      
      <BatchPrint 
        isOpen={isBatchPrintOpen} 
        onClose={() => setIsBatchPrintOpen(false)} 
        orders={mockOrders}
      />
    </div>
  );
};