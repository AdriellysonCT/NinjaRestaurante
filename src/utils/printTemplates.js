/**
 * Templates de impressão de comandas
 * Cada template retorna HTML formatado para impressão
 * O CSS é inline para garantir compatibilidade
 */

// Normalizar dados do pedido para evitar erros de campos nulos/indefinidos
const normalizeOrder = (order, restaurantData) => {
  if (!order) return {};

  const safeDate = (dateStr) => {
    try {
      if (!dateStr) return new Date();
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR');
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const dateObj = safeDate(order.criado_em || order.created_at || order.dh_criacao);

  // Normalizar itens
  const rawItems = order.itens_pedido || order.items || [];
  const items = rawItems.map(item => {
    const name = item.itens_cardapio?.nome || item.name || item.nome || 'Item sem nome';
    const qty = Number(item.quantidade || item.qty || 1);
    const price = Number(item.preco_unitario || item.price || item.itens_cardapio?.preco || 0);
    const total = qty * price;
    
    // Obervações e Complementos
    const note = item.observacao_item || item.observacao || item.notes || '';
    let addons = [];
    if (typeof item.complementos === 'string') {
        addons = [item.complementos];
    } else if (Array.isArray(item.complementos)) {
        addons = item.complementos.map(c => c.nome || c);
    }

    return { name, qty, price, total, note, addons };
  });

  // Totais
  const calcSubtotal = items.reduce((acc, i) => acc + i.total, 0);
  const subtotal = Number(order.subtotal || order.valor_subtotal || calcSubtotal);
  const deliveryFee = Number(order.taxa_entrega || order.deliveryFee || 0);
  const serviceFee = Number(order.taxa_servico || order.serviceFee || 0);
  const discount = Number(order.desconto || order.discount || 0);
  const total = Number(order.valor_total || order.total || (subtotal + deliveryFee + serviceFee - discount));

  // Restaurante - Melhorar exibição para evitar placeholders vazios
  const getAddress = () => {
    const parts = [];
    if (restaurantData?.rua) parts.push(restaurantData.rua);
    if (restaurantData?.numero) parts.push(restaurantData.numero);
    const street = parts.join(', ');
    return street + (restaurantData?.bairro ? ` - ${restaurantData.bairro}` : '');
  };

  const restaurant = {
    name: restaurantData?.nome_fantasia || order.restaurant?.name || 'Fome Ninja Restaurante',
    address: getAddress(),
    cityState: [restaurantData?.cidade, restaurantData?.estado].filter(Boolean).join(' - '),
    phone: restaurantData?.telefone || '',
    cnpj: restaurantData?.cnpj || ''
  };

  return {
    id: order.numero_pedido || order.id || '---',
    date: formatDate(dateObj),
    time: formatTime(dateObj),
    type: (order.tipo_pedido || order.tipo_entrega || 'balcao').toUpperCase(),
    customer: {
        name: order.nome_cliente || order.cliente?.nome || order.customerName || 'Cliente não identificado',
        phone: order.telefone_cliente || order.telefone || order.phone || '',
        address: order.endereco_entrega || order.endereco || '' 
    },
    table: order.mesa_numero || order.mesa || null,
    items,
    financial: {
        subtotal,
        deliveryFee,
        serviceFee,
        discount,
        total,
        paymentMethod: order.metodo_pagamento || order.forma_pagamento || 'Não informado'
    },
    restaurant
  };
};

/* ESTILOS BASE ADAPTADOS DO TAILWIND */
const S_CONTAINER = `font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.3; color: #000; max-width: 100%; margin: 0 auto;`;
const S_CENTER = `text-align: center;`;
const S_BOLD = `font-weight: bold;`;
const S_FLEX_BETWEEN = `display: flex; justify-content: space-between;`;
const S_FLEX_START = `display: flex; align-items: flex-start;`;
const S_BORDER_B = `border-bottom: 2px solid #000; margin-bottom: 8px; padding-bottom: 8px;`;
const S_BORDER_B_LIGHT = `border-bottom: 1px solid #000; margin: 4px 0; padding-bottom: 4px;`;
const S_BORDER_DASHED = `border-bottom: 1px dashed #000; margin: 8px 0;`;
const S_TEXT_SM = `font-size: 11px;`;
const S_TEXT_XS = `font-size: 10px; color: #666;`;
const S_MB = `margin-bottom: 4px;`;

// Template: Via do Cliente (Fidelidade ao Preview)
export const clientTemplate = (rawOrder, restaurantData) => {
  const data = normalizeOrder(rawOrder, restaurantData);
  return `
    <div style="${S_CONTAINER}">
      <div style="${S_CENTER} ${S_BORDER_DASHED} padding-bottom: 8px;">
        <div style="font-size: 14px; ${S_BOLD}">🥷 FOME NINJA RESTAURANTE</div>
      </div>
      
      <div style="${S_CENTER} ${S_BOLD} margin-bottom: 4px;">
        PEDIDO: #${data.id} | ${data.table ? `MESA ${data.table}` : data.type}
      </div>
      <div style="${S_CENTER} ${S_TEXT_XS} margin-bottom: 8px;">
        DATA: ${data.date} - ${data.time}
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin-bottom: 8px;">
        <div style="${S_FLEX_BETWEEN} ${S_BOLD} font-size: 10px;">
          <span>QTD  ITEM</span>
          <span>TOTAL</span>
        </div>
      </div>
      
      ${data.items.map(item => `
        <div style="${S_FLEX_BETWEEN} margin-bottom: 4px;">
          <span>${String(item.qty).padStart(2, '0')}   ${item.name}</span>
          <span>R$ ${item.total.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px;">
        <div style="${S_FLEX_BETWEEN} ${S_BOLD}">
          <span>TOTAL DO PEDIDO:</span>
          <span>R$ ${data.financial.total.toFixed(2)}</span>
        </div>
        <div style="${S_TEXT_XS} margin-top: 4px;">
          FORMA PGTO: ${data.financial.paymentMethod}
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; ${S_CENTER}">
        <div style="font-size: 10px;">Obrigado pela preferência!</div>
        <div style="${S_TEXT_XS}">
          ${[data.restaurant.phone, data.restaurant.cityState].filter(Boolean).join(' | ')}
        </div>
      </div>
      
      <div style="${S_BORDER_DASHED}"></div>
    </div>
  `;
};

// Template: Via da Cozinha
export const kitchenTemplate = (rawOrder, restaurantData) => {
  const data = normalizeOrder(rawOrder, restaurantData);
  return `
    <div style="${S_CONTAINER}">
      <div style="${S_CENTER} border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
        <div style="${S_BOLD} font-size: 14px;">VIA COZINHA - #${data.id}</div>
      </div>
      
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div>DATA: ${data.date} | HORA: ${data.time}</div>
        <div style="${S_BOLD}">CLIENTE: ${data.table ? `MESA ${data.table}` : data.type} (${data.customer.name})</div>
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 8px 0;">
        <div style="${S_BOLD} font-size: 10px;">QTD   ITEM / DESCRIÇÃO</div>
      </div>
      
      ${data.items.map(item => `
        <div style="margin-bottom: 8px;">
          <div style="${S_FLEX_START} gap: 8px;">
            <span>[ ]</span>
            <span style="${S_BOLD}">${String(item.qty).padStart(2, '0')}  ${item.name}</span>
          </div>
          ${item.addons.map(ad => `<div style="font-size: 10px; margin-left: 24px;">+ ${ad}</div>`).join('')}
          ${item.note ? `<div style="font-size: 10px; color: #444; margin-left: 24px;">OBS: ${item.note}</div>` : ''}
        </div>
      `).join('')}
      
      <div style="border-top: 2px solid #000; margin-top: 12px; padding-top: 8px;">
         <div style="font-size: 10px; ${S_BOLD}">
           OBS. GERAL: ______________________________
         </div>
      </div>
      
      <div style="${S_BORDER_DASHED}"></div>
    </div>
  `;
};

// Template: Via do Entregador
export const deliveryTemplate = (rawOrder, restaurantData) => {
  const data = normalizeOrder(rawOrder, restaurantData);
  return `
    <div style="${S_CONTAINER}">
      <div style="${S_CENTER} border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
        <div style="${S_BOLD} font-size: 14px;">VIA ENTREGA - #${data.id}</div>
      </div>
      
      <div style="font-size: 10px; margin-bottom: 8px;">
        <div style="${S_BOLD}">CLIENTE: ${data.customer.name}</div>
        <div>TEL: ${data.customer.phone}</div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px; ${S_BOLD} margin-bottom: 4px;">
          ENDEREÇO: ${data.customer.address || 'Não informado'}
        </div>
        <div style="font-size: 10px;">
          CIDADE: ${data.restaurant.cityState}
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px;">PAGAMENTO: ${data.financial.paymentMethod}</div>
        <div style="font-size: 10px; ${S_BOLD}">VALOR A RECEBER: R$ ${data.financial.total.toFixed(2)}</div>
        <div style="font-size: 10px;">TROCO PARA: R$ ___________</div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="font-size: 10px;">SAÍDA: ____:____  ENTREGA: ____:____</div>
      </div>
      
      <div style="${S_BORDER_DASHED}"></div>
    </div>
  `;
};

// Template: Comanda Completa
export const completeTemplate = (rawOrder, restaurantData) => {
  const data = normalizeOrder(rawOrder, restaurantData);
  return `
    <div style="${S_CONTAINER}">
      <div style="${S_CENTER} border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="${S_BOLD} font-size: 16px;">🥷 FOME NINJA RESTAURANTE</div>
      </div>
      
      <div style="font-size: 11px; margin-bottom: 8px;">
        <div style="${S_BOLD} font-size: 12px;">${data.restaurant.name}</div>
        ${data.restaurant.address ? `<div>${data.restaurant.address}</div>` : ''}
        ${data.restaurant.cityState ? `<div>${data.restaurant.cityState}</div>` : ''}
        ${data.restaurant.phone ? `<div>WhatsApp: ${data.restaurant.phone}</div>` : ''}
        ${data.restaurant.cnpj ? `<div>CNPJ: ${data.restaurant.cnpj}</div>` : ''}
      </div>
      
      <div style="border-top: 2px solid #000; padding: 6px 0; margin: 6px 0;">
        <div style="${S_FLEX_BETWEEN} font-size: 11px;">
          <div>
            <div style="${S_BOLD}">PEDIDO: #${data.id}</div>
            <div>DATA: ${data.date}</div>
            <div>CLIENTE: ${data.table ? `MESA ${data.table}` : data.customer.name}</div>
          </div>
          <div style="text-align: right;">
            <div style="${S_BOLD}">TIPO: ${data.type}</div>
            <div>HORA: ${data.time}</div>
          </div>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 8px 0;">
        <div style="${S_BOLD} font-size: 11px;">ITENS DO PEDIDO</div>
      </div>
      
      <div style="${S_FLEX_BETWEEN} ${S_BOLD} font-size: 10px; margin-bottom: 4px;">
        <span>QTD  ITEM</span>
        <span>TOTAL</span>
      </div>
      
      ${data.items.map(item => `
        <div style="font-size: 11px; margin-bottom: 6px;">
          <div style="${S_FLEX_BETWEEN}">
            <div>
              <div>${String(item.qty).padStart(2, '0')}   ${item.name}</div>
              <div style="color: #666; font-size: 10px;">(un: R$ ${item.price.toFixed(2)})</div>
            </div>
            <span>R$ ${item.total.toFixed(2)}</span>
          </div>
          ${item.addons.map(ad => `<div style="font-size: 10px; margin-left: 10px;">+ ${ad}</div>`).join('')}
          ${item.note ? `<div style="font-size: 10px; margin-left: 10px; font-style: italic;">Obs: ${item.note}</div>` : ''}
        </div>
      `).join('')}
      
      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-size: 11px;">
        <div style="${S_FLEX_BETWEEN}">
          <span>SUBTOTAL:</span>
          <span>R$ ${data.financial.subtotal.toFixed(2)}</span>
        </div>
        ${data.financial.deliveryFee > 0 ? `
        <div style="${S_FLEX_BETWEEN}">
          <span>TAXA DE ENTREGA:</span>
          <span>R$ ${data.financial.deliveryFee.toFixed(2)}</span>
        </div>` : ''}
        ${data.financial.discount > 0 ? `
        <div style="${S_FLEX_BETWEEN}">
          <span>DESCONTO:</span>
          <span>- R$ ${data.financial.discount.toFixed(2)}</span>
        </div>` : ''}
        <div style="${S_FLEX_BETWEEN} ${S_BOLD} font-size: 14px; margin-top: 4px;">
          <span>TOTAL:</span>
          <span>R$ ${data.financial.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding: 8px 0; margin: 8px 0;">
        <div style="${S_BOLD} font-size: 11px; margin-bottom: 4px;">PAGAMENTO</div>
        <div style="${S_FLEX_BETWEEN} font-size: 11px;">
          <span>FORMA: ${data.financial.paymentMethod}</span>
          <span>R$ ${data.financial.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding-top: 8px; ${S_CENTER} font-size: 11px;">
        <div>Obrigado pela preferência!</div>
        <div style="${S_BOLD}">Volte sempre ao Fome Ninja!</div>
      </div>
      
      <div style="${S_BORDER_DASHED}"></div>
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
