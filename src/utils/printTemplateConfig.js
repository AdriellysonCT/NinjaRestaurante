/**
 * Utilitário para gerenciar configurações de modelos de impressão
 */

// Obter modelos configurados para uma seção específica (retorna array)
export const getTemplatesForSection = (section) => {
  const saved = localStorage.getItem('fome-ninja-section-templates');
  const config = saved ? JSON.parse(saved) : {
    dashboard: ['complete'],
    mesas: ['client'],
    pdv: ['client']
  };
  
  const templates = config[section];
  
  // Garantir que sempre retorna um array
  if (Array.isArray(templates)) {
    return templates;
  }
  
  // Compatibilidade com versão antiga (string única)
  if (typeof templates === 'string') {
    return [templates];
  }
  
  return ['client']; // Fallback padrão
};

// Salvar configuração de modelos para uma seção (aceita array ou string)
export const setTemplatesForSection = (section, templateIds) => {
  const saved = localStorage.getItem('fome-ninja-section-templates');
  const config = saved ? JSON.parse(saved) : {
    dashboard: ['complete'],
    mesas: ['client'],
    pdv: ['client']
  };
  
  // Garantir que sempre salva como array
  config[section] = Array.isArray(templateIds) ? templateIds : [templateIds];
  localStorage.setItem('fome-ninja-section-templates', JSON.stringify(config));
};

// Obter todas as configurações
export const getAllTemplateConfigs = () => {
  const saved = localStorage.getItem('fome-ninja-section-templates');
  return saved ? JSON.parse(saved) : {
    dashboard: ['complete'],
    mesas: ['client'],
    pdv: ['client']
  };
};

// Modelos disponíveis
export const AVAILABLE_TEMPLATES = {
  client: {
    id: 'client',
    name: 'Via do Cliente',
    description: 'Comanda simplificada para o cliente'
  },
  kitchen: {
    id: 'kitchen',
    name: 'Via da Cozinha',
    description: 'Detalhada com observações para preparo'
  },
  delivery: {
    id: 'delivery',
    name: 'Via do Entregador',
    description: 'Com endereço e dados da entrega'
  },
  complete: {
    id: 'complete',
    name: 'Comanda Completa',
    description: 'Todos os detalhes do pedido'
  }
};
