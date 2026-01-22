import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BatchPrint } from '../components/BatchPrint';
import { PrintHistory } from '../components/PrintHistory';
import { PrintSettingsSection as PrintSettings } from '../components/settings/PrintSettingsSection';
import PrintConfig from '../components/PrintConfig';
import PrintConfigModal from '../components/PrintConfigModal';
import * as authService from '../services/authService';
import * as horariosService from '../services/horariosService';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import logger from '../utils/logger';

const Settings = () => {
  // Hook de toast para notificações
  const { toasts, removeToast, success, error, info } = useToast();
  
  // Estados para as configurações
  const [restaurantName, setRestaurantName] = useState(() => {
    return localStorage.getItem('fome-ninja-restaurant-name') || 'Fome Ninja';
  });
  
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('fome-ninja-address') || 'Rua Konoha, 123 - Vila da Folha';
  });
  
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('fome-ninja-phone') || '(11) 99999-9999';
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const savedSoundState = localStorage.getItem('fome-ninja-sound');
    return savedSoundState ? JSON.parse(savedSoundState) : true;
  });
  
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isPrintHistoryOpen, setIsPrintHistoryOpen] = useState(false);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [isPrintConfigModalOpen, setIsPrintConfigModalOpen] = useState(false);
  
  const [openingHours, setOpeningHours] = useState({
    monday: { open: '11:00', close: '22:00', isOpen: true, id: null },
    tuesday: { open: '11:00', close: '22:00', isOpen: true, id: null },
    wednesday: { open: '11:00', close: '22:00', isOpen: true, id: null },
    thursday: { open: '11:00', close: '22:00', isOpen: true, id: null },
    friday: { open: '11:00', close: '23:00', isOpen: true, id: null },
    saturday: { open: '11:00', close: '23:00', isOpen: true, id: null },
    sunday: { open: '11:00', close: '22:00', isOpen: true, id: null },
  });
  
  const [statusAberto, setStatusAberto] = useState(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState(null);
  
  const [deliverySettings, setDeliverySettings] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-delivery-settings');
    return saved ? JSON.parse(saved) : {
      minOrderValue: 20,
      maxDeliveryDistance: 5,
      freeDeliveryOver: 50,
      baseDeliveryFee: 5,
      estimatedDeliveryTime: 30,
    };
  });
  
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-notification-settings');
    return saved ? JSON.parse(saved) : {
      newOrderSound: true,
      emailNotifications: true,
      pushNotifications: true,
      orderStatusUpdates: true,
      marketingEmails: false,
    };
  });
  
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('fome-ninja-payment-methods');
    return saved ? JSON.parse(saved) : {
      creditCard: true,
      debitCard: true,
      pix: true,
      cash: true,
      mealVoucher: false,
    };
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const { theme } = React.useContext(ThemeContext);
  const { restaurante, restauranteId, atualizarDadosRestaurante, loading: authLoading } = useAuth();
  const { orders } = useAppContext();
  
  // Estado para os dados do restaurante
  const [dadosRestaurante, setDadosRestaurante] = useState({
    nomeFantasia: '',
    tipoRestaurante: '',
    cnpj: '',
    telefone: '',
    email: '',
    nomeResponsavel: '',
    chavePix: ''
  });

  // Estados para endereço
  const [endereco, setEndereco] = useState(null);
  const [isEditingEndereco, setIsEditingEndereco] = useState(false);
  const [formEndereco, setFormEndereco] = useState({
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    complemento: ''
  });

  // Validação do formulário de endereço
  const isEnderecoValido = formEndereco.rua && formEndereco.numero && formEndereco.bairro && formEndereco.cidade;

  // Recarregar dados do restaurante ao montar o componente
  useEffect(() => {
    const recarregarDados = async () => {
      try {
        const dados = await authService.buscarDadosRestaurante();
        if (dados) {
          setDadosRestaurante({
            nomeFantasia: dados.nome_fantasia || '',
            tipoRestaurante: dados.tipo_restaurante || '',
            cnpj: dados.cnpj || '',
            telefone: dados.telefone || '',
            email: dados.email || '',
            nomeResponsavel: dados.nome_responsavel || '',
            imagemUrl: dados.imagem_url || '',
            chavePix: dados.chave_pix || ''
          });
          
          if (dados.nome_fantasia) {
            setRestaurantName(dados.nome_fantasia);
          }
          
          // Carregar endereço
          const enderecoData = {
            rua: dados.rua || '',
            numero: dados.numero || '',
            bairro: dados.bairro || '',
            cidade: dados.cidade || '',
            complemento: dados.complemento || ''
          };
          
          if (enderecoData.rua) {
            setEndereco(enderecoData);
          }
          
          setFormEndereco(enderecoData);
        }
      } catch (error) {
        logger.error('Erro ao recarregar dados:', error);
      }
    };
    
    recarregarDados();
  }, []); // Executa apenas uma vez ao montar
  
  // Carregar dados do restaurante quando disponíveis do contexto
  useEffect(() => {
    if (restaurante) {
      setDadosRestaurante({
        nomeFantasia: restaurante.nome_fantasia || '',
        tipoRestaurante: restaurante.tipo_restaurante || '',
        cnpj: restaurante.cnpj || '',
        telefone: restaurante.telefone || '',
        email: restaurante.email || '',
        nomeResponsavel: restaurante.nome_responsavel || '',
        imagemUrl: restaurante.imagem_url || '',
        chavePix: restaurante.chave_pix || ''
      });
      
      if (restaurante.nome_fantasia) {
        setRestaurantName(restaurante.nome_fantasia);
      }
    }
  }, [restaurante]);

  // Carregar endereço quando os dados do restaurante estiverem disponíveis
  useEffect(() => {
    if (restaurante) {
      const enderecoData = {
        rua: restaurante.rua || '',
        numero: restaurante.numero || '',
        bairro: restaurante.bairro || '',
        cidade: restaurante.cidade || '',
        complemento: restaurante.complemento || ''
      };
      
      if (enderecoData.rua) {
        setEndereco(enderecoData);
      }
      
      setFormEndereco(enderecoData);
    }
  }, [restaurante]);

  // ✅ Carregar horários do banco de dados
  useEffect(() => {
    const carregarHorarios = async () => {
      if (!restauranteId) return;
      
      try {
        setLoadingHorarios(true);
        logger.log('📅 Carregando horários do banco...');
        
        const horarios = await horariosService.buscarHorarios(restauranteId);
        setOpeningHours(horarios);
        
        logger.log('✅ Horários carregados:', horarios);
      } catch (error) {
        logger.error('❌ Erro ao carregar horários:', error);
        error('Erro ao carregar horários. Usando valores padrão.', 3000);
      } finally {
        setLoadingHorarios(false);
      }
    };
    
    carregarHorarios();
  }, [restauranteId]);

  // ✅ Verificar se o restaurante está aberto agora
  useEffect(() => {
    const verificarStatus = async () => {
      if (!restauranteId) return;
      
      try {
        logger.log('🔍 Verificando status do restaurante...');
        const status = await horariosService.verificarRestauranteAberto(restauranteId);
        setStatusAberto(status);
        logger.log('✅ Status verificado:', status);
      } catch (error) {
        logger.error('❌ Erro ao verificar status:', error);
        
        // Se for erro de permissão RLS, avisar
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          error('Erro de permissão ao verificar status. Verifique as políticas RLS.', 5000);
        }
      }
    };
    
    // Verificar ao carregar
    verificarStatus();
    
    // ✅ Verificar a cada 2 minutos (120000ms) para atualização automática
    const interval = setInterval(verificarStatus, 120000);
    
    return () => clearInterval(interval);
  }, [restauranteId, openingHours]);

  const exportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Cliente,Total,Status\n' +
      orders
        .map(
          (o) => `${o.id},"${o.customerName}",${o.total.toFixed(2)},${o.status}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'pedidos_fome_ninja.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler para salvar endereço
  const handleSalvarEndereco = async () => {
    try {
      info('Salvando endereço e buscando coordenadas...', 2000);
      
      const updated = await authService.atualizarEndereco(formEndereco);
      setEndereco(updated);
      setIsEditingEndereco(false);
      
      if (updated.latitude && updated.longitude) {
        success(`Endereço salvo com sucesso! Coordenadas: ${updated.latitude.toFixed(4)}, ${updated.longitude.toFixed(4)}`, 4000);
      } else {
        success('Endereço salvo com sucesso!', 3000);
      }
      
      // Recarregar após um delay para o usuário ver o toast
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      logger.error('Erro ao salvar endereço:', err);
      error('Erro ao salvar endereço. Tente novamente.', 4000);
    }
  };
  
  // Salvar configurações no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('fome-ninja-restaurant-name', restaurantName);
  }, [restaurantName]);
  
  useEffect(() => {
    localStorage.setItem('fome-ninja-sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('fome-ninja-address', address);
  }, [address]);
  
  useEffect(() => {
    localStorage.setItem('fome-ninja-phone', phone);
  }, [phone]);
  
  // ✅ Horários agora são salvos diretamente no banco de dados via handleOpeningHoursChange
  
  useEffect(() => {
    localStorage.setItem('fome-ninja-delivery-settings', JSON.stringify(deliverySettings));
  }, [deliverySettings]);
  
  useEffect(() => {
    localStorage.setItem('fome-ninja-notification-settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);
  
  useEffect(() => {
    localStorage.setItem('fome-ninja-payment-methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);
  
  // ✅ Manipulador de mudança de horários com salvamento automático
  const handleOpeningHoursChange = async (day, field, value) => {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔄 INICIANDO SALVAMENTO DE HORÁRIO');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('📋 Dia:', day);
    logger.log('📋 Campo:', field);
    logger.log('📋 Valor:', value);
    logger.log('📋 Restaurante ID:', restauranteId);
    
    // Atualizar estado local imediatamente
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    
    // Salvar no banco de dados
    if (!restauranteId) {
      logger.error('❌ ERRO: restauranteId não disponível!');
      error('Erro: ID do restaurante não encontrado', 3000);
      return;
    }
    
    try {
      setSalvandoHorario(day);
      
      const horarioAtualizado = {
        ...openingHours[day],
        [field]: value
      };
      
      logger.log('📦 Horário a ser salvo:', horarioAtualizado);
      logger.log('🚀 Chamando horariosService.salvarHorario...');
      
      const resultado = await horariosService.salvarHorario(restauranteId, day, horarioAtualizado);
      
      logger.log('✅ Resultado do salvamento:', resultado);
      logger.log(`✅ Horário de ${day} salvo com sucesso`);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Reverificar status do restaurante após salvar
      const novoStatus = await horariosService.verificarRestauranteAberto(restauranteId);
      setStatusAberto(novoStatus);
      
      success(`Horário de ${horariosService.obterNomeDia(day)} atualizado!`, 2000);
    } catch (error) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ ERRO AO SALVAR HORÁRIO');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ Tipo:', error.constructor.name);
      logger.error('❌ Mensagem:', error.message);
      logger.error('❌ Código:', error.code);
      logger.error('❌ Detalhes:', error.details);
      logger.error('❌ Hint:', error.hint);
      logger.error('❌ Stack:', error.stack);
      logger.error('❌ Objeto completo:', error);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      error('Erro ao salvar horário. Verifique o console (F12).', 5000);
    } finally {
      setSalvandoHorario(null);
    }
  };
  
  const handleDeliverySettingChange = (field, value) => {
    setDeliverySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNotificationSettingChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePaymentMethodChange = (method, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: value
    }));
  };
  
  const handleExportSettings = () => {
    const settings = {
      restaurantName,
      address,
      phone,
      openingHours,
      deliverySettings,
      notificationSettings,
      paymentMethods,
      theme,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "fome-ninja-settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
        if (settings.restaurantName) setRestaurantName(settings.restaurantName);
        if (settings.address) setAddress(settings.address);
        if (settings.phone) setPhone(settings.phone);
        if (settings.openingHours) setOpeningHours(settings.openingHours);
        if (settings.deliverySettings) setDeliverySettings(settings.deliverySettings);
        if (settings.notificationSettings) setNotificationSettings(settings.notificationSettings);
        if (settings.paymentMethods) setPaymentMethods(settings.paymentMethods);
        
        alert('Configurações importadas com sucesso!');
      } catch (error) {
        logger.error('Erro ao importar configurações:', error);
        alert('Arquivo de configuração inválido.');
      }
    };
    reader.readAsText(file);
  };

  const formatarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/\D/g, '').slice(0, 14);
    if (cnpj.length > 12) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (cnpj.length > 8) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    } else if (cnpj.length > 5) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (cnpj.length > 2) {
      cnpj = cnpj.replace(/(\d{2})(\d+)/, '$1.$2');
    }
    return cnpj;
  };
  
  const formatarTelefone = (telefone) => {
    telefone = telefone.replace(/\D/g, '').slice(0, 11);
    if (telefone.length > 10) {
      telefone = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telefone.length > 6) {
      telefone = telefone.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (telefone.length > 2) {
      telefone = telefone.replace(/(\d{2})(\d+)/, '($1) $2');
    }
    return telefone;
  };
  
  const handleRestauranteChange = (field, value) => {
    if (field === 'cnpj') value = formatarCNPJ(value);
    else if (field === 'telefone') value = formatarTelefone(value);
    
    setDadosRestaurante(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSalvarDadosRestaurante = async () => {
    try {
      if (!dadosRestaurante.nomeFantasia || !dadosRestaurante.tipoRestaurante || !dadosRestaurante.cnpj || !dadosRestaurante.telefone || !dadosRestaurante.nomeResponsavel) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      await atualizarDadosRestaurante(dadosRestaurante);
      setRestaurantName(dadosRestaurante.nomeFantasia);
      alert('Dados do restaurante atualizados com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar dados do restaurante:', error);
      alert('Erro ao atualizar dados do restaurante. Por favor, tente novamente.');
    }
  };
  
  const daysOfWeek = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ];
  


  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          <button onClick={handleExportSettings} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors">Exportar Configurações</button>
          <label className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors cursor-pointer">
            Importar Configurações
            <input type="file" accept=".json" className="hidden" onChange={handleImportSettings} />
          </label>
        </div>
      </div>
      
      <div className="ninja-card p-0 overflow-hidden">
        <nav className="flex border-b border-border overflow-x-auto">
          {['general', 'restaurant', 'hours', 'delivery', 'notificação', 'pagamentos', 'ferramentas'].map(tab => (
            <button 
              key={tab}
              className={`px-4 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'general' ? 'Geral' :
               tab === 'restaurant' ? 'Dados do Restaurante' :
               tab === 'hours' ? 'Horários' :
               tab === 'delivery' ? 'Entrega' :
               tab === 'notificação' ? 'Notificação' :
               tab === 'pagamentos' ? 'Pagamentos' :
               tab === 'ferramentas' ? 'Ferramentas' : tab}
            </button>
          ))}
        </nav>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="pt-4"
      >
        {activeTab === 'general' && (
          <div className="ninja-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Configurações Gerais</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Restaurante</label>
                <input
                  type="text"
                  className="w-full bg-input px-3 py-2 rounded-md"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'restaurant' && (
          <div className="ninja-card p-6 space-y-6">
            <p className="text-sm text-muted-foreground">Estes dados são sincronizados com o Supabase e são utilizados para identificar seu restaurante na plataforma.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Restaurante*</label>
              <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.nomeFantasia} onChange={(e) => handleRestauranteChange('nomeFantasia', e.target.value)} placeholder="Nome do seu estabelecimento" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Restaurante*</label>
              <select className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.tipoRestaurante || ''} onChange={(e) => handleRestauranteChange('tipoRestaurante', e.target.value)}>
                <option value="" disabled>Selecione o tipo de restaurante</option>
                <option value="Pizzaria">Pizzaria</option>
                <option value="Hamburgueria">Hamburgueria</option>
                <option value="Japonês">Japonês</option>
                <option value="Italiano">Italiano</option>
                <option value="Brasileiro">Brasileiro</option>
                <option value="Mexicano">Mexicano</option>
                <option value="Árabe">Árabe</option>
                <option value="Vegetariano">Vegetariano</option>
                <option value="Vegano">Vegano</option>
                <option value="Cafeteria">Cafeteria</option>
                <option value="Doceria">Doceria</option>
                <option value="Sorveteria">Sorveteria</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ*</label>
              <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.cnpj} onChange={(e) => handleRestauranteChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone*</label>
              <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.telefone} onChange={(e) => handleRestauranteChange('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.email} disabled placeholder="Email usado no login" />
              <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado pois está vinculado à sua conta.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Responsável*</label>
              <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={dadosRestaurante.nomeResponsavel} onChange={(e) => handleRestauranteChange('nomeResponsavel', e.target.value)} placeholder="Nome da pessoa responsável pelo restaurante" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                Chave PIX
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Transferência</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                value={dadosRestaurante.chavePix} 
                onChange={(e) => handleRestauranteChange('chavePix', e.target.value)} 
                placeholder="E-mail, CPF, CNPJ, Celular ou Chave Aleatória" 
              />
              <p className="text-xs text-muted-foreground mt-1">Sua chave PIX será enviada ao administrador para realização de pagamentos e transferências.</p>
            </div>
            
            {/* Seção de Logo */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-medium mb-4">Logo do Restaurante</h3>
              {dadosRestaurante.imagemUrl || restaurante?.imagem_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={dadosRestaurante.imagemUrl || restaurante.imagem_url} 
                      alt="Logo do restaurante" 
                      className="w-32 h-32 object-contain rounded-lg border-2 border-border bg-muted"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/128?text=Logo';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Logo atual do restaurante</p>
                      <button 
                        onClick={async () => {
                          const novaUrl = prompt('Cole o link da nova logo:', restaurante.imagem_url);
                          if (novaUrl && novaUrl.trim()) {
                            try {
                              info('Salvando nova logo...', 2000);
                              
                              // Atualizar no banco
                              await authService.atualizarDadosRestaurante({
                                ...dadosRestaurante,
                                imagemUrl: novaUrl.trim()
                              });
                              
                              // Atualizar estado local
                              handleRestauranteChange('imagemUrl', novaUrl.trim());
                              
                              success('Logo atualizada com sucesso!', 3000);
                              
                              // Recarregar página após delay
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            } catch (err) {
                              logger.error('Erro ao atualizar logo:', err);
                              error('Erro ao atualizar logo. Tente novamente.', 4000);
                            }
                          }
                        }}
                        className="bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors"
                      >
                        Editar Logo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Adicione uma logo para seu restaurante. Cole o link direto da imagem.</p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Link da Logo (URL)</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        className="flex-1 bg-input px-3 py-2 rounded-md" 
                        placeholder="https://exemplo.com/logo.png"
                        id="logoUrlInput"
                      />
                      <button 
                        onClick={async () => {
                          const input = document.getElementById('logoUrlInput');
                          const url = input.value.trim();
                          if (url) {
                            try {
                              info('Salvando logo...', 2000);
                              
                              // Atualizar no banco
                              await authService.atualizarDadosRestaurante({
                                ...dadosRestaurante,
                                imagemUrl: url
                              });
                              
                              // Atualizar estado local
                              handleRestauranteChange('imagemUrl', url);
                              input.value = '';
                              
                              success('Logo adicionada com sucesso!', 3000);
                              
                              // Recarregar página após delay
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            } catch (err) {
                              logger.error('Erro ao adicionar logo:', err);
                              error('Erro ao adicionar logo. Tente novamente.', 4000);
                            }
                          } else {
                            error('Por favor, cole um link válido', 3000);
                          }
                        }}
                        className="bg-primary text-primary-foreground py-2 px-6 rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dica: Use serviços como Imgur, ImgBB ou hospede sua imagem e cole o link direto aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-medium mb-4">Endereço do Restaurante</h3>
              {endereco ? (
                <div className="space-y-2 mb-4">
                  <p>{endereco.rua}, {endereco.numero} {endereco.complemento ? `(${endereco.complemento})` : ''}</p>
                  <p>{endereco.bairro}, {endereco.cidade}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground mb-4">Nenhum endereço cadastrado.</p>}
              {!isEditingEndereco ? (
                <button onClick={() => setIsEditingEndereco(true)} className="bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90">{endereco ? 'Editar Endereço' : 'Adicionar Endereço'}</button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rua*</label>
                    <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={formEndereco.rua} onChange={(e) => setFormEndereco(prev => ({ ...prev, rua: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número*</label>
                    <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={formEndereco.numero} onChange={(e) => setFormEndereco(prev => ({ ...prev, numero: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bairro*</label>
                    <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={formEndereco.bairro} onChange={(e) => setFormEndereco(prev => ({ ...prev, bairro: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade*</label>
                    <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={formEndereco.cidade} onChange={(e) => setFormEndereco(prev => ({ ...prev, cidade: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Complemento</label>
                    <input type="text" className="w-full bg-input px-3 py-2 rounded-md" value={formEndereco.complemento} onChange={(e) => setFormEndereco(prev => ({ ...prev, complemento: e.target.value }))} />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleSalvarEndereco} disabled={!isEnderecoValido} className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50">Salvar Endereço</button>
                    <button onClick={() => setIsEditingEndereco(false)} className="bg-muted text-muted-foreground py-2 px-4 rounded-md hover:bg-muted/90">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4">
              <button onClick={handleSalvarDadosRestaurante} disabled={authLoading} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{authLoading ? 'Salvando...' : 'Salvar Dados do Restaurante'}</button>
            </div>
          </div>
        )}
        
        {activeTab === 'hours' && (
          <div className="space-y-6">
            {/* Status do Restaurante - SIMPLIFICADO */}
            {statusAberto && (
              <div className={`ninja-card p-6 ${
                statusAberto.aberto 
                  ? 'bg-green-50 dark:bg-green-950/30' 
                  : 'bg-red-50 dark:bg-red-950/30'
              }`}>
                <div className="flex items-center gap-4">
                  {/* Indicador Visual Grande */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    statusAberto.aberto 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}>
                    <span className="text-3xl">
                      {statusAberto.aberto ? '✓' : '✕'}
                    </span>
                  </div>
                  
                  {/* Informação Principal */}
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-1 ${
                      statusAberto.aberto 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {statusAberto.aberto ? 'Aberto Agora' : 'Fechado'}
                    </h3>
                    
                    {/* Mensagem Simples */}
                    {statusAberto.metodo === 'sem_horario_configurado' && (
                      <p className="text-sm text-muted-foreground">
                        Configure os horários abaixo para começar
                      </p>
                    )}
                    
                    {statusAberto.metodo === 'fechado_hoje' && (
                      <p className="text-sm text-muted-foreground">
                        Você marcou que não abre hoje
                      </p>
                    )}
                    
                    {statusAberto.metodo === 'fora_do_horario' && statusAberto.abre && (
                      <p className="text-sm text-muted-foreground">
                        Abre às {statusAberto.abre?.substring(0, 5)}
                      </p>
                    )}
                    
                    {statusAberto.aberto && statusAberto.fecha && (
                      <p className="text-sm text-muted-foreground">
                        Fecha às {statusAberto.fecha?.substring(0, 5)}
                      </p>
                    )}
                  </div>
                  
                  {/* Hora Atual */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Agora</p>
                    <p className="text-2xl font-bold">
                      {statusAberto.horaAtual?.substring(0, 5) || '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Horários de Funcionamento */}
            <div className="ninja-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Horários de Funcionamento</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure os dias e horários que seu restaurante funciona
                  </p>
                </div>
                {loadingHorarios && (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                )}
              </div>
              
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{day.label}</label>
                      {salvandoHorario === day.id && (
                        <span className="text-xs text-blue-500">Salvando...</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                      <input 
                        type="time" 
                        className="w-full bg-input px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" 
                        value={openingHours[day.id].open} 
                        onChange={(e) => handleOpeningHoursChange(day.id, 'open', e.target.value)} 
                        disabled={!openingHours[day.id].isOpen || salvandoHorario === day.id} 
                      />
                      <span className="text-sm text-muted-foreground">às</span>
                      <input 
                        type="time" 
                        className="w-full bg-input px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" 
                        value={openingHours[day.id].close} 
                        onChange={(e) => handleOpeningHoursChange(day.id, 'close', e.target.value)} 
                        disabled={!openingHours[day.id].isOpen || salvandoHorario === day.id} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {openingHours[day.id].isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={openingHours[day.id].isOpen} 
                          onChange={(e) => handleOpeningHoursChange(day.id, 'isOpen', e.target.checked)} 
                          className="sr-only peer"
                          disabled={salvandoHorario === day.id}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Dica:</strong> Suas alterações são salvas automaticamente quando você muda os horários.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'delivery' && (
          <div className="ninja-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Configurações de Entrega</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor Mínimo do Pedido (R$)</label>
                <input type="number" className="w-full bg-input px-3 py-2 rounded-md" value={deliverySettings.minOrderValue} onChange={(e) => handleDeliverySettingChange('minOrderValue', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distância Máxima de Entrega (km)</label>
                <input type="number" className="w-full bg-input px-3 py-2 rounded-md" value={deliverySettings.maxDeliveryDistance} onChange={(e) => handleDeliverySettingChange('maxDeliveryDistance', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entrega Grátis Acima de (R$)</label>
                <input type="number" className="w-full bg-input px-3 py-2 rounded-md" value={deliverySettings.freeDeliveryOver} onChange={(e) => handleDeliverySettingChange('freeDeliveryOver', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taxa de Entrega Base (R$)</label>
                <input type="number" className="w-full bg-input px-3 py-2 rounded-md" value={deliverySettings.baseDeliveryFee} onChange={(e) => handleDeliverySettingChange('baseDeliveryFee', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tempo Estimado de Entrega (minutos)</label>
                <input type="number" className="w-full bg-input px-3 py-2 rounded-md" value={deliverySettings.estimatedDeliveryTime} onChange={(e) => handleDeliverySettingChange('estimatedDeliveryTime', e.target.value)} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'notificação' && (
          <div className="ninja-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Notificações</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="font-medium">Som de Novo Pedido</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notificationSettings.newOrderSound} onChange={(e) => handleNotificationSettingChange('newOrderSound', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
                {/* Outras configurações de notificação */}
            </div>
          </div>
        )}
        
        {activeTab === 'pagamentos' && (
          <div className="ninja-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Métodos de Pagamento</h3>
            <div className="space-y-2">
              {Object.keys(paymentMethods).map(method => (
                <div key={method} className="flex items-center justify-between py-2 border-b border-border">
                  <span className="font-medium text-sm capitalize">{method.replace(/([A-Z])/g, ' $1')}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={paymentMethods[method]} onChange={(e) => handlePaymentMethodChange(method, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'ferramentas' && (
          <div className="space-y-6">
            <div className="ninja-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ferramentas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="text-foreground">Sons de Notificação</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                <button onClick={() => setIsBatchPrintOpen(true)} className="p-4 border rounded-lg flex items-center justify-center text-foreground hover:bg-muted">Imprimir Lote</button>
                <button onClick={() => setIsPrintHistoryOpen(true)} className="p-4 border rounded-lg flex items-center justify-center text-foreground hover:bg-muted">Histórico de Impressão</button>
                <button onClick={() => setIsPrintConfigModalOpen(true)} className="p-4 border rounded-lg flex items-center justify-center text-foreground hover:bg-muted">Configurar Impressão</button>
                <button onClick={exportData} className="p-4 border rounded-lg flex items-center justify-center text-foreground hover:bg-muted">Exportar CSV</button>
              </div>
            </div>
            
            {/* Configurações de Impressão */}
            <PrintConfig 
              onPrinterSelect={(printer) => logger.log('Impressora selecionada:', printer)}
              onTemplateChange={(template) => logger.log('Modelo selecionado:', template)}
            />
          </div>
        )}
      </motion.div>
 
        <BatchPrint isOpen={isBatchPrintOpen} onClose={() => setIsBatchPrintOpen(false)} />
      <PrintHistory isOpen={isPrintHistoryOpen} onClose={() => setIsPrintHistoryOpen(false)} />
      <PrintSettings isOpen={isPrintSettingsOpen} onClose={() => setIsPrintSettingsOpen(false)} />
      <PrintConfigModal 
        isOpen={isPrintConfigModalOpen} 
        onClose={() => setIsPrintConfigModalOpen(false)}
        title="Configurações de Impressão"
      />
      {/* Toast Container para notifica��es */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Settings;
