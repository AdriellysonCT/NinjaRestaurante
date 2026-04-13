/**
 * 🤖 Serviço de Auto-Resposta WhatsApp
 * 
 * Este serviço registra o restaurante no Agent Python
 * e gerencia as auto-respostas quando clientes iniciam conversas.
 */

const AGENT_API_BASE = 'http://localhost:5001';

/**
 * Registra o restaurante no Agent Python local
 * Deve ser chamado após o login do restaurante
 */
export async function registerRestauranteNoAgent(restaurante) {
  if (!restaurante || !restaurante.id) {
    console.warn('⚠️ Dados do restaurante inválidos para registro no agent');
    return false;
  }

  // Constrói o link do cardápio específico deste restaurante
  // Exemplo: https://ninja-restaurante.vercel.app/cardapio/fenix-carne
  const cardapioLink = construirLinkCardapio(restaurante);

  try {
    const response = await fetch(`${AGENT_API_BASE}/register-restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurante_id: restaurante.id,
        nome: restaurante.nome_fantasia || restaurante.nome || 'Restaurante',
        cardapio_link: cardapioLink
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Restaurante registrado no Agent:', data.message);
      return true;
    } else {
      console.error('❌ Erro ao registrar restaurante no Agent');
      return false;
    }
  } catch (error) {
    // Se o agent não estiver rodando, não é crítico
    if (error.message?.includes('fetch')) {
      console.warn('⚠️ Agent Python não está rodando. Auto-resposta WhatsApp indisponível.');
    } else {
      console.error('❌ Erro ao conectar com Agent:', error);
    }
    return false;
  }
}

/**
 * Constrói o link do cardápio específico do restaurante
 * Exemplo: https://ninja-restaurante.vercel.app/cardapio/fenix-carne
 */
function construirLinkCardapio(restaurante) {
  // Tenta obter o slug/identificador único do restaurante
  const slug = restaurante.slug || 
               restaurante.identificador || 
               restaurante.nome_fantasia?.toLowerCase().replace(/\s+/g, '-') ||
               restaurante.id;
  
  // URL base do cardápio (ajuste conforme sua rota)
  const baseUrl = window.location.origin;
  
  return `${baseUrl}/cardapio/${slug}`;
}

/**
 * Dispara auto-resposta manual para um contato
 * Útil quando o cliente manda mensagem mas o agent não detectou automaticamente
 */
export async function triggerAutoReply({ phone, customer_name, restaurante_id }) {
  try {
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        customer_name,
        restaurante_id
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Auto-resposta disparada para', customer_name);
      return data;
    } else {
      console.error('❌ Erro ao disparar auto-resposta:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Agent para auto-resposta:', error);
    return null;
  }
}

/**
 * Lista contatos que já receberam auto-resposta
 */
export async function getAutoReplyContacts() {
  try {
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/contacts`);
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao obter contatos de auto-resposta:', error);
    return null;
  }
}

/**
 * Reseta o cache de auto-resposta
 */
export async function resetAutoReply(phone = null) {
  try {
    const body = phone ? { phone } : {};
    
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cache de auto-resposta resetado:', data.message);
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao resetar auto-resposta:', error);
    return null;
  }
}

/**
 * Verifica se o Agent está online
 */
export async function checkAgentStatus() {
  try {
    const response = await fetch(`${AGENT_API_BASE}/status`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        online: true,
        ...data
      };
    }
    return { online: false };
  } catch (error) {
    return { online: false };
  }
}
