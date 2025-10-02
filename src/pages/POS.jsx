import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
const { CashRegisterIcon, DollarSignIcon, CreditCardIcon, QrCodeIcon, CalculatorIcon, PrinterIcon } = Icons;
import { useAppContext } from '../context/AppContext';
import { printService } from '../services/printService';
import { createOrder } from '../services/orderService';

const POS = () => {
  const { menuItems } = useAppContext();
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [popularItems, setPopularItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Novos estados para as funcionalidades
  const [comandas, setComandas] = useState([]); // Sistema de comandas
  const [comandaAtiva, setComandaAtiva] = useState(null);
  const [numeroComanda, setNumeroComanda] = useState('');
  const [itensEmFalta, setItensEmFalta] = useState([]);
  const [showComandas, setShowComandas] = useState(false);
  const [showItensEmFalta, setShowItensEmFalta] = useState(false);

  // Extrair categorias únicas dos itens do menu
  useEffect(() => {
    const uniqueCategories = ['Todos', ...new Set(menuItems.map(item => item.category))];
    setCategories(uniqueCategories);
    
    // Definir itens populares (simulação - em um ambiente real, isso viria de estatísticas)
    const popular = menuItems
      .filter(item => item.available)
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    setPopularItems(popular);
    
    // Simular itens em falta (baseado em disponibilidade)
    const emFalta = menuItems.filter(item => !item.available);
    setItensEmFalta(emFalta);
  }, [menuItems]);

  // Carregar comandas do localStorage
  useEffect(() => {
    const savedComandas = localStorage.getItem('fome-ninja-comandas');
    if (savedComandas) {
      setComandas(JSON.parse(savedComandas));
    }
  }, []);

  // Salvar comandas no localStorage
  useEffect(() => {
    localStorage.setItem('fome-ninja-comandas', JSON.stringify(comandas));
  }, [comandas]);

  // Filtrar itens do menu
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isAvailable = item.available;
    
    return matchesCategory && matchesSearch && isAvailable;
  });

  // Adicionar item ao carrinho
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, qty: cartItem.qty + 1 } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  // Remover item do carrinho
  const removeFromCart = (itemId) => {
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem.qty > 1) {
      setCart(cart.map(item => 
        item.id === itemId 
          ? { ...item, qty: item.qty - 1 } 
          : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== itemId));
    }
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart([]);
    setPaymentMethod('');
    setCashReceived('');
    setCustomerName('');
    setShowCalculator(false);
  };

  // Calcular total do carrinho
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  // Calcular troco
  const calculateChange = () => {
    if (!cashReceived || paymentMethod !== 'cash') return 0;
    const received = parseFloat(cashReceived);
    return received > cartTotal ? received - cartTotal : 0;
  };

  // Funções do sistema de comandas
  const criarComanda = () => {
    if (!numeroComanda.trim()) {
      alert('Digite o número da comanda/mesa');
      return;
    }
    
    const comandaExistente = comandas.find(c => c.numero === numeroComanda);
    if (comandaExistente) {
      alert('Comanda já existe! Use "Abrir Comanda" para continuar.');
      return;
    }
    
    const novaComanda = {
      id: Date.now(),
      numero: numeroComanda,
      items: [],
      total: 0,
      status: 'aberta',
      createdAt: new Date().toISOString(),
      customerName: customerName || `Mesa ${numeroComanda}`
    };
    
    setComandas([...comandas, novaComanda]);
    setComandaAtiva(novaComanda);
    setCart([]);
    setNumeroComanda('');
    alert(`Comanda ${numeroComanda} criada com sucesso!`);
  };

  const abrirComanda = (comanda) => {
    setComandaAtiva(comanda);
    setCart(comanda.items);
    setCustomerName(comanda.customerName);
    setShowComandas(false);
  };

  const salvarComanda = () => {
    if (!comandaAtiva) return;
    
    const comandasAtualizadas = comandas.map(c => 
      c.id === comandaAtiva.id 
        ? { ...c, items: cart, total: cartTotal, updatedAt: new Date().toISOString() }
        : c
    );
    
    setComandas(comandasAtualizadas);
    setComandaAtiva(null);
    setCart([]);
    setCustomerName('');
    alert('Comanda salva com sucesso!');
  };

  const fecharComanda = async () => {
    if (!comandaAtiva) return;
    
    if (cart.length === 0) {
      alert('Adicione itens à comanda antes de fechar');
      return;
    }
    
    if (!paymentMethod) {
      alert('Selecione um método de pagamento');
      return;
    }
    
    if (paymentMethod === 'cash' && parseFloat(cashReceived) < cartTotal) {
      alert('Valor recebido é menor que o total da comanda!');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Criar pedido final ajustado para a nova estrutura
      const orderData = {
        customerName: comandaAtiva.customerName,
        total: cartTotal,
        subtotal: cartTotal, // Assumindo subtotal igual ao total por simplicidade
        taxaEntrega: 0,
        desconto: 0,
        status: 'concluido',
        tipoPedido: 'mesa',
        paymentMethod,
        pagamentoRecebido: paymentMethod === 'cash' ? true : false,
        prepTime: 0,
        deliveryTime: null,
        isVip: false,
        mesaNumero: comandaAtiva.numero,
        observacoes: ''
      };

      // Salvar no Supabase
      const savedOrder = await createOrder(orderData);

      // Preparar order para impressão com itens
      const orderForPrint = {
        ...savedOrder,
        items: cart,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
        change: paymentMethod === 'cash' ? calculateChange() : null,
        timestamp: new Date().toISOString(),
        type: 'comanda',
        comandaNumero: comandaAtiva.numero
      };
      
      // Imprimir comprovante
      await printService.printOrderTicket(orderForPrint);
      
      // Remover comanda da lista
      setComandas(comandas.filter(c => c.id !== comandaAtiva.id));
      
      // Mostrar confirmação
      setOrderDetails(orderForPrint);
      setOrderComplete(true);
      
      // Limpar estados
      setComandaAtiva(null);
      clearCart();
      
      setTimeout(() => {
        setOrderComplete(false);
        setOrderDetails(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      alert('Erro ao fechar comanda. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelarComanda = () => {
    if (!comandaAtiva) return;
    
    if (confirm(`Deseja cancelar a comanda ${comandaAtiva.numero}?`)) {
      setComandas(comandas.filter(c => c.id !== comandaAtiva.id));
      setComandaAtiva(null);
      clearCart();
      alert('Comanda cancelada');
    }
  };

  // Processar pagamento
  const processPayment = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'cash' && parseFloat(cashReceived) < cartTotal) {
      alert('Valor recebido é menor que o total da compra!');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Criar objeto de pedido ajustado para a nova estrutura
      const orderData = {
        customerName: customerName || 'Cliente Balcão',
        total: cartTotal,
        subtotal: cartTotal,
        taxaEntrega: 0,
        desconto: 0,
        status: 'concluido',
        tipoPedido: 'balcao',
        paymentMethod,
        pagamentoRecebido: true,
        prepTime: 0,
        deliveryTime: null,
        isVip: false,
        mesaNumero: null,
        observacoes: ''
      };

      // Salvar no Supabase
      const savedOrder = await createOrder(orderData);

      // Preparar order para impressão com itens
      const orderForPrint = {
        ...savedOrder,
        items: cart,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
        change: paymentMethod === 'cash' ? calculateChange() : null,
        timestamp: new Date().toISOString(),
        type: 'pos'
      };
      
      // Imprimir comprovante
      const printResult = await printService.printOrderTicket(orderForPrint);
      console.log('Comprovante impresso:', printResult);
      
      // Mostrar confirmação
      setOrderDetails(orderForPrint);
      setOrderComplete(true);
      
      // Limpar carrinho após alguns segundos
      setTimeout(() => {
        clearCart();
        setOrderComplete(false);
        setOrderDetails(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderizar calculadora
  const renderCalculator = () => {
    const buttons = [
      '7', '8', '9',
      '4', '5', '6',
      '1', '2', '3',
      '0', '00', '.',
      'C', 'Exato', '⌫'
    ];
    
    const handleCalcButton = (btn) => {
      if (btn === 'C') {
        setCashReceived('');
      } else if (btn === '⌫') {
        setCashReceived(prev => prev.slice(0, -1));
      } else if (btn === 'Exato') {
        setCashReceived(cartTotal.toFixed(2));
      } else {
        setCashReceived(prev => {
          // Evitar múltiplos pontos decimais
          if (btn === '.' && prev.includes('.')) return prev;
          
          // Limitar a 2 casas decimais
          const newValue = prev + btn;
          const parts = newValue.split('.');
          if (parts.length > 1 && parts[1].length > 2) {
            return prev;
          }
          
          return newValue;
        });
      }
    };
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {buttons.map((btn, index) => (
          <button
            key={index}
            onClick={() => handleCalcButton(btn)}
            className={`py-3 text-sm font-medium rounded-md ${
              btn === 'Exato' 
                ? 'bg-primary text-primary-foreground' 
                : btn === 'C' || btn === '⌫' 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">PDV - Ponto de Venda</h2>
        <div className="flex gap-2">
          {/* Botões do sistema de comandas */}
          <button 
            onClick={() => setShowComandas(!showComandas)}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-primary/90"
          >
            Comandas ({comandas.length})
          </button>
          <button 
            onClick={() => setShowItensEmFalta(!showItensEmFalta)}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              itensEmFalta.length > 0 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Em Falta ({itensEmFalta.length})
          </button>
          <button 
            onClick={clearCart}
            disabled={cart.length === 0 || isProcessing}
            className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Sistema de Comandas */}
      {showComandas && (
        <div className="ninja-card p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Sistema de Comandas</h3>
            <button 
              onClick={() => setShowComandas(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          {/* Criar nova comanda */}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Número da mesa/comanda" 
              className="flex-1 bg-input px-3 py-2 rounded-md text-sm"
              value={numeroComanda}
              onChange={(e) => setNumeroComanda(e.target.value)}
            />
            <button 
              onClick={criarComanda}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"
            >
              Nova Comanda
            </button>
          </div>
          
          {/* Lista de comandas */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comandas.length > 0 ? (
              comandas.map(comanda => (
                <div key={comanda.id} className="flex justify-between items-center p-3 border border-border rounded-md">
                  <div>
                    <p className="font-medium">Mesa {comanda.numero}</p>
                    <p className="text-xs text-muted-foreground">
                      {comanda.items.length} itens • R$ {comanda.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comanda.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => abrirComanda(comanda)}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs hover:bg-primary/90"
                    >
                      Abrir
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Cancelar comanda ${comanda.numero}?`)) {
                          setComandas(comandas.filter(c => c.id !== comanda.id));
                        }
                      }}
                      className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs hover:bg-destructive/90"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhuma comanda aberta</p>
            )}
          </div>
        </div>
      )}

      {/* Itens em Falta */}
      {showItensEmFalta && (
        <div className="ninja-card p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-destructive">Itens em Falta ({itensEmFalta.length})</h3>
            <button 
              onClick={() => setShowItensEmFalta(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {itensEmFalta.length > 0 ? (
              itensEmFalta.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-destructive/20 rounded-md bg-destructive/5">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-xs text-destructive font-medium">
                    Indisponível
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Todos os itens estão disponíveis! 🎉</p>
            )}
          </div>
        </div>
      )}

      {/* Status da Comanda Ativa */}
      {comandaAtiva && (
        <div className="ninja-card p-4 bg-primary/10 border-primary/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-primary">Comanda Ativa: Mesa {comandaAtiva.numero}</h3>
              <p className="text-xs text-muted-foreground">
                Cliente: {comandaAtiva.customerName} • Criada: {new Date(comandaAtiva.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={salvarComanda}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-secondary/80"
              >
                Salvar
              </button>
              <button 
                onClick={fecharComanda}
                disabled={cart.length === 0 || !paymentMethod || isProcessing}
                className="bg-success text-success-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-success/90 disabled:opacity-50"
              >
                Fechar Comanda
              </button>
              <button 
                onClick={cancelarComanda}
                className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-destructive/90"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna da esquerda - Itens do menu */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros */}
          <div className="ninja-card p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar item..." 
                  className="w-full bg-input px-3 py-2 rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select 
                  className="bg-input px-3 py-2 rounded-md text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Itens populares */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Itens Populares</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {popularItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="ninja-card p-2 text-center hover:border-primary transition-colors"
                >
                  <div className="w-full h-16 bg-secondary/30 rounded-md mb-1 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full object-cover rounded-md" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.name.substring(0, 1)}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-xs text-primary">R$ {item.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Lista de itens */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Todos os Itens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="ninja-card p-3 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 bg-secondary/30 rounded-md flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full object-cover rounded-md" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.name.substring(0, 1)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                      <p className="text-xs font-medium text-primary">R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Nenhum item encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Coluna da direita - Carrinho e pagamento */}
        <div className="space-y-4">
          {/* Carrinho */}
          <div className="ninja-card p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Carrinho</h3>
              <span className="text-xs text-muted-foreground">{cart.length} itens</span>
            </div>
            
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-border pb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} x {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">R$ {(item.price * item.qty).toFixed(2)}</p>
                      <div className="flex items-center border border-border rounded-md">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                          className="px-2 py-1 text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-xs">{item.qty}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                          className="px-2 py-1 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Carrinho vazio
                </div>
              )}
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-primary">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Informações do cliente */}
          <div className="ninja-card p-4">
            <label className="block text-sm font-medium mb-1">Nome do Cliente (opcional)</label>
            <input 
              type="text" 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cliente balcão"
            />
          </div>
          
          {/* Métodos de pagamento */}
          <div className="ninja-card p-4 space-y-4">
            <h3 className="font-bold">Método de Pagamento</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => {
                  setPaymentMethod('cash');
                  setShowCalculator(true);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-md ${
                  paymentMethod === 'cash' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <DollarSignIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Dinheiro</span>
              </button>
              
              <button 
                onClick={() => {
                  setPaymentMethod('card');
                  setShowCalculator(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-md ${
                  paymentMethod === 'card' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <CreditCardIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Cartão</span>
              </button>
              
              <button 
                onClick={() => {
                  setPaymentMethod('pix');
                  setShowCalculator(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-md ${
                  paymentMethod === 'pix' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <QrCodeIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">PIX</span>
              </button>
            </div>
            
            {/* Calculadora para pagamento em dinheiro */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Valor Recebido</label>
                    <input 
                      type="text" 
                      className="w-full bg-input px-3 py-2 rounded-md text-sm"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Troco</label>
                    <div className="bg-secondary/30 px-3 py-2 rounded-md text-sm">
                      R$ {calculateChange().toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="mt-5 bg-secondary text-secondary-foreground p-2 rounded-md"
                  >
                    <CalculatorIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {showCalculator && renderCalculator()}
              </div>
            )}
            
            {/* Botão de finalizar */}
            <button 
              onClick={processPayment}
              disabled={cart.length === 0 || !paymentMethod || isProcessing || 
                (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < cartTotal))}
              className="w-full py-3 text-sm font-semibold rounded-md bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-success-foreground border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <PrinterIcon className="w-4 h-4" />
                  Finalizar Pedido
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Confirmação de pedido */}
      {orderComplete && orderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ninja-card p-6 max-w-md w-full mx-4"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <span className="text-success-foreground text-lg">✓</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold">Pedido Finalizado!</h3>
                <p className="text-sm text-muted-foreground">
                  {orderDetails.type === 'comanda' 
                    ? `Comanda ${orderDetails.comandaNumero} fechada com sucesso`
                    : 'Pedido do balcão finalizado com sucesso'
                  }
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{orderDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">R$ {orderDetails.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span className="font-medium">
                    {orderDetails.paymentMethod === 'cash' ? 'Dinheiro' : 
                     orderDetails.paymentMethod === 'card' ? 'Cartão' : 'PIX'}
                  </span>
                </div>
                {orderDetails.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Recebido:</span>
                      <span className="font-medium">R$ {orderDetails.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Troco:</span>
                      <span className="font-medium">R$ {orderDetails.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Comprovante impresso • Fechando automaticamente...
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default POS;