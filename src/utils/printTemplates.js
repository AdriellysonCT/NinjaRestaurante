/**
 * Templates de impressão de comandas
 * Cada template retorna HTML formatado para impressão
 */

// Template: Via do Cliente
export const clientTemplate = (order, restaurantData) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };
  
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return `
    <div style="font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 16px;">🥷 ${restaurantData?.nome_fantasia || 'FOME NINJA RESTAURANTE'}</div>
      </div>
      
      <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">
        PEDIDO: #${order.numero_pedido || order.id} | ${order.mesa_numero ? `MESA ${order.mesa_numero}` : 'BALCÃO'}
      </div>
      <div style="text-align: center; font-size: 10px; color: #666; margin-bottom: 8px;">
        DATA: ${formatDate(order.created_at)} - ${formatTime(order.created_at)}
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
          <span>QTD  ITEM</span>
          <span>TOTAL</span>
        </div>
      </div>
      
      ${order.items?.map(item => `
        <div style="display: flex; justify-between; margin-bottom: 4px;">
          <span>${String(item.qty || item.quantidade).padStart(2, '0')}   ${item.name || item.nome}</span>
          <span>R$ ${((item.qty || item.quantidade) * (item.price || item.preco_unitario)).toFixed(2)}</span>
        </div>
      `).join('') || ''}
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px;">
        <div style="display: flex; justify-between; font-weight: bold;">
          <span>TOTAL DO PEDIDO:</span>
          <span>R$ ${(order.total || 0).toFixed(2)}</span>
        </div>
        <div style="font-size: 10px; color: #666; margin-top: 4px;">
          FORMA PGTO: ${order.metodo_pagamento || 'Não informado'}
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; text-align: center;">
        <div style="font-size: 10px;">Obrigado pela preferência!</div>
        <div style="font-size: 10px; color: #666;">
          ${restaurantData?.telefone || '(81) 98456-6469'} | ${restaurantData?.cidade || 'Guarabira'}
        </div>
      </div>
      
      <div style="border-top: 2px dashed #000; margin-top: 8px;"></div>
    </div>
  `;
};

// Template: Via da Cozinha
export const kitchenTemplate = (order, restaurantData) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };
  
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return `
    <div style="font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 14px;">VIA COZINHA - #${order.numero_pedido || order.id}</div>
      </div>
      
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div>DATA: ${formatDate(order.created_at)} | HORA: ${formatTime(order.created_at)}</div>
        <div style="font-weight: bold;">CLIENTE: ${order.mesa_numero ? `MESA ${order.mesa_numero}` : 'BALCÃO'} ${order.customerName ? `(${order.customerName})` : ''}</div>
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 8px 0;">
        <div style="font-weight: bold; font-size: 10px;">QTD   ITEM / DESCRIÇÃO</div>
      </div>
      
      ${order.items?.map(item => `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; align-items: start; gap: 8px;">
            <span>[ ]</span>
            <span style="font-weight: bold;">${String(item.qty || item.quantidade).padStart(2, '0')}  ${item.name || item.nome}</span>
          </div>
          <div style="font-size: 10px; color: #666; margin-left: 20px;">
            OBS: ${item.observacao || '_________________________________'}
          </div>
        </div>
      `).join('') || ''}
      
      <div style="border-top: 2px solid #000; margin-top: 12px; padding-top: 8px;">
        <div style="font-size: 10px; font-weight: bold;">
          OBS. GERAL: ${order.observacoes || '______________________________'}
        </div>
      </div>
      
      <div style="border-top: 2px dashed #000; margin-top: 8px;"></div>
    </div>
  `;
};

// Template: Via do Entregador
export const deliveryTemplate = (order, restaurantData) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };
  
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return `
    <div style="font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 14px;">VIA ENTREGA - #${order.numero_pedido || order.id}</div>
      </div>
      
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div style="font-weight: bold;">CLIENTE: ${order.customerName || 'Não informado'}</div>
        <div>TEL: ${order.telefone || order.phone || 'Não informado'}</div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">
          ENDEREÇO: ${order.endereco || order.address || 'Não informado'}
        </div>
        <div style="font-size: 10px;">
          BAIRRO: ${order.bairro || 'Não informado'}, ${order.cidade || restaurantData?.cidade || ''}
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px;">PAGAMENTO: ${order.metodo_pagamento || 'Não informado'}</div>
        <div style="font-size: 10px; font-weight: bold;">VALOR A RECEBER: R$ ${(order.total || 0).toFixed(2)}</div>
        <div style="font-size: 10px;">TROCO PARA: R$ ${order.troco_para || '___________'}</div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px;">SAÍDA: ____:____  ENTREGA: ____:____</div>
      </div>
      
      <div style="border-top: 2px dashed #000; margin-top: 8px;"></div>
    </div>
  `;
};

// Template: Comanda Completa
export const completeTemplate = (order, restaurantData) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };
  
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return `
    <div style="font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 16px;">🥷 ${restaurantData?.nome_fantasia || 'FOME NINJA RESTAURANTE'}</div>
      </div>
      
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div style="font-weight: bold;">${restaurantData?.nome_fantasia || 'FENIX CARNES'}</div>
        <div>${restaurantData?.rua || 'Rua Amaro Guedes'}, ${restaurantData?.numero || '407'} - ${restaurantData?.bairro || 'Nordeste 2'}</div>
        <div>${restaurantData?.cidade || 'Guarabira'} - ${restaurantData?.estado || 'PB'}</div>
        <div>WhatsApp: ${restaurantData?.telefone || '(81) 98456-6469'}</div>
        <div>CNPJ: ${restaurantData?.cnpj || '14.466.272/0001-96'}</div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="display: flex; justify-between; font-size: 10px;">
          <div>
            <div style="font-weight: bold;">PEDIDO: #${order.numero_pedido || order.id}</div>
            <div>DATA: ${formatDate(order.created_at)}</div>
            <div>CLIENTE: ${order.customerName || order.mesa_numero ? `MESA ${order.mesa_numero}` : 'BALCÃO'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">TIPO: ${order.tipo_pedido?.toUpperCase() || 'BALCÃO'}</div>
            <div>HORA: ${formatTime(order.created_at)}</div>
          </div>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 8px 0;">
        <div style="font-weight: bold; font-size: 10px;">ITENS DO PEDIDO</div>
      </div>
      
      <div style="display: flex; justify-between; font-weight: bold; font-size: 10px; margin-bottom: 4px;">
        <span>QTD  ITEM</span>
        <span>TOTAL</span>
      </div>
      
      ${order.items?.map(item => `
        <div style="font-size: 10px; margin-bottom: 4px;">
          <div style="display: flex; justify-between;">
            <div>
              <div>${String(item.qty || item.quantidade).padStart(2, '0')}   ${item.name || item.nome}</div>
              <div style="color: #666;">(un: R$ ${(item.price || item.preco_unitario).toFixed(2)})</div>
            </div>
            <span>R$ ${((item.qty || item.quantidade) * (item.price || item.preco_unitario)).toFixed(2)}</span>
          </div>
        </div>
      `).join('') || ''}
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-size: 10px;">
        <div style="display: flex; justify-between;">
          <span>SUBTOTAL:</span>
          <span>R$ ${(order.subtotal || order.total || 0).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-between;">
          <span>TAXA DE SERVIÇO:</span>
          <span>R$ ${(order.taxa_servico || 0).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-between; font-weight: bold; font-size: 14px;">
          <span>TOTAL:</span>
          <span>R$ ${(order.total || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">PAGAMENTO</div>
        <div style="display: flex; justify-between; font-size: 10px;">
          <span>FORMA: ${order.metodo_pagamento || 'Não informado'}</span>
          <span>R$ ${(order.total || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding-top: 8px; text-align: center; font-size: 10px;">
        <div>Obrigado pela preferência!</div>
        <div style="font-weight: bold;">Volte sempre ao Fome Ninja!</div>
      </div>
      
      <div style="border-top: 2px dashed #000; margin-top: 8px;"></div>
    </div>
  `;
};

// Função para obter o template correto
export const getTemplate = (templateId) => {
  const templates = {
    client: clientTemplate,
    kitchen: kitchenTemplate,
    delivery: deliveryTemplate,
    complete: completeTemplate
  };
  
  return templates[templateId] || clientTemplate;
};
