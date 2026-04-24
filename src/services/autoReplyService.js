const AGENT_API_BASE = "http://localhost:5001";
const AGENT_DISABLE_KEY = "fome-ninja-agent-disabled-until";
const AGENT_RETRY_DELAY_MS = 5 * 60 * 1000;

function getAgentDisabledUntil() {
  if (typeof window === "undefined") return 0;

  try {
    return Number(window.sessionStorage.getItem(AGENT_DISABLE_KEY) || 0);
  } catch (_) {
    return 0;
  }
}

function isAgentTemporarilyDisabled() {
  return getAgentDisabledUntil() > Date.now();
}

function markAgentUnavailable() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(AGENT_DISABLE_KEY, String(Date.now() + AGENT_RETRY_DELAY_MS));
  } catch (_) {}
}

function clearAgentUnavailable() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(AGENT_DISABLE_KEY);
  } catch (_) {}
}

function isConnectionError(error) {
  return (
    error instanceof TypeError ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("ERR_CONNECTION_REFUSED")
  );
}

export async function registerRestauranteNoAgent(restaurante) {
  if (!restaurante || !restaurante.id) {
    console.warn("Dados do restaurante invalidos para registro no agent.");
    return false;
  }

  if (isAgentTemporarilyDisabled()) {
    return false;
  }

  const cardapioLink = construirLinkCardapio(restaurante);

  try {
    const response = await fetch(`${AGENT_API_BASE}/register-restaurant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restaurante_id: restaurante.id,
        nome: restaurante.nome_fantasia || restaurante.nome || "Restaurante",
        cardapio_link: cardapioLink,
      }),
    });

    if (response.ok) {
      clearAgentUnavailable();
      const data = await response.json();
      console.log("Restaurante registrado no Agent:", data.message);
      return true;
    }

    markAgentUnavailable();
    console.warn("Agent Python respondeu com erro ao registrar restaurante.");
    return false;
  } catch (error) {
    if (isConnectionError(error)) {
      markAgentUnavailable();
      console.warn("Agent Python indisponivel. Auto-resposta WhatsApp desativada temporariamente.");
    } else {
      console.error("Erro ao conectar com Agent:", error);
    }

    return false;
  }
}

function construirLinkCardapio(restaurante) {
  const slug =
    restaurante.slug ||
    restaurante.identificador ||
    restaurante.nome_fantasia?.toLowerCase().replace(/\s+/g, "-") ||
    restaurante.id;

  const baseUrl = window.location.origin;
  return `${baseUrl}/cardapio/${slug}`;
}

export async function triggerAutoReply({ phone, customer_name, restaurante_id }) {
  if (isAgentTemporarilyDisabled()) {
    return null;
  }

  try {
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        customer_name,
        restaurante_id,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      clearAgentUnavailable();
      console.log("Auto-resposta disparada para", customer_name);
      return data;
    }

    markAgentUnavailable();
    console.error("Erro ao disparar auto-resposta:", data.message);
    return null;
  } catch (error) {
    if (isConnectionError(error)) {
      markAgentUnavailable();
      return null;
    }

    console.error("Erro ao conectar com Agent para auto-resposta:", error);
    return null;
  }
}

export async function getAutoReplyContacts() {
  if (isAgentTemporarilyDisabled()) {
    return null;
  }

  try {
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/contacts`);

    if (response.ok) {
      clearAgentUnavailable();
      return await response.json();
    }

    markAgentUnavailable();
    return null;
  } catch (error) {
    if (isConnectionError(error)) {
      markAgentUnavailable();
      return null;
    }

    console.error("Erro ao obter contatos de auto-resposta:", error);
    return null;
  }
}

export async function resetAutoReply(phone = null) {
  if (isAgentTemporarilyDisabled()) {
    return null;
  }

  try {
    const body = phone ? { phone } : {};
    const response = await fetch(`${AGENT_API_BASE}/auto-reply/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      clearAgentUnavailable();
      const data = await response.json();
      console.log("Cache de auto-resposta resetado:", data.message);
      return data;
    }

    markAgentUnavailable();
    return null;
  } catch (error) {
    if (isConnectionError(error)) {
      markAgentUnavailable();
      return null;
    }

    console.error("Erro ao resetar auto-resposta:", error);
    return null;
  }
}

export async function checkAgentStatus() {
  if (isAgentTemporarilyDisabled()) {
    return { online: false, cached: true };
  }

  try {
    const response = await fetch(`${AGENT_API_BASE}/status`);

    if (response.ok) {
      clearAgentUnavailable();
      const data = await response.json();
      return {
        online: true,
        ...data,
      };
    }

    markAgentUnavailable();
    return { online: false };
  } catch (_) {
    markAgentUnavailable();
    return { online: false };
  }
}
