# 💻 Exemplos de Integração - Sistema de Cupons

## 🛒 Integração no Checkout

### Exemplo Completo

```jsx
import React, { useState, useEffect } from 'react';
import AplicarCupom from '../components/AplicarCupom';
import * as cuponsService from '../services/cuponsService';

function Checkout() {
  const [carrinho, setCarrinho] = useState([
    { id: 1, nome: 'Pizza Margherita', preco: 45.00, quantidade: 1 },
    { id: 2, nome: 'Refrigerante', preco: 8.00, quantidade: 2 }
  ]);
  
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [valorFrete, setValorFrete] = useState(10.00);
  
  const restauranteId = 'uuid-do-restaurante';
  const clienteId = 'uuid-do-cliente';

  // Calcular subtotal
  const subtotal = carrinho.reduce((sum, item) => 
    sum + (item.preco * item.quantidade), 0
  );

  // Calcular desconto
  const desconto = cupomAplicado?.valor_desconto_calculado || 0;

  // Calcular frete (grátis se cupom for de frete grátis)
  const frete = cupomAplicado?.tipo_desconto === 'frete_gratis' ? 0 : valorFrete;

  // Total final
  const total = subtotal - desconto + frete;

  const handleCupomAplicado = (cupom) => {
    console.log('Cupom aplicado:', cupom);
    setCupomAplicado(cupom);
  };

  const handleCupomRemovido = () => {
    console.log('Cupom removido');
    setCupomAplicado(null);
  };

  const handleFinalizarPedido = async () => {
    try {
      // 1. Criar pedido
      const pedido = await criarPedido({
        restaurante_id: restauranteId,
        cliente_id: clienteId,
        itens: carrinho,
        subtotal,
        desconto,
        frete,
        total,
        cupom_codigo: cupomAplicado?.codigo
      });

      // 2. Registrar uso do cupom
      if (cupomAplicado) {
        await cuponsService.registrarUsoCupom(
          cupomAplicado.id,
          clienteId,
          pedido.id,
          subtotal,
          desconto
        );
      }

      alert('Pedido realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Carrinho */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Seu Pedido</h2>
        {carrinho.map(item => (
          <div key={item.id} className="flex justify-between py-2">
            <span>{item.quantidade}x {item.nome}</span>
            <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Aplicar Cupom */}
      <AplicarCupom
        restauranteId={restauranteId}
        clienteId={clienteId}
        valorPedido={subtotal}
        onCupomAplicado={handleCupomAplicado}
        onCupomRemovido={handleCupomRemovido}
      />

      {/* Resumo */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="font-bold mb-3">Resumo do Pedido</h3>
        
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>

        {desconto > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto ({cupomAplicado.codigo}):</span>
            <span>-R$ {desconto.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Frete:</span>
          <span className={frete === 0 ? 'text-green-600' : ''}>
            {frete === 0 ? 'GRÁTIS' : `R$ ${frete.toFixed(2)}`}
          </span>
        </div>

        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Botão Finalizar */}
      <button
        onClick={handleFinalizarPedido}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
      >
        Finalizar Pedido
      </button>
    </div>
  );
}

export default Checkout;
```

---

## 📱 Listar Cupons Disponíveis

```jsx
import React, { useState, useEffect } from 'react';
import * as cuponsService from '../services/cuponsService';

function CuponsDisponiveis({ restauranteId, onSelecionarCupom }) {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCupons();
  }, [restauranteId]);

  const loadCupons = async () => {
    try {
      setLoading(true);
      const data = await cuponsService.fetchCuponsAtivos(restauranteId);
      setCupons(data);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Carregando cupons...</p>;

  if (cupons.length === 0) {
    return <p>Nenhum cupom disponível no momento.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Cupons Disponíveis</h3>
      {cupons.map(cupom => (
        <div
          key={cupom.id}
          className="border border-dashed border-primary rounded-lg p-4 cursor-pointer hover:bg-primary/5"
          onClick={() => onSelecionarCupom(cupom.codigo)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono font-bold text-primary">{cupom.codigo}</p>
              <p className="text-sm text-muted-foreground">{cupom.descricao}</p>
              {cupom.valor_minimo_pedido > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Pedido mínimo: R$ {cupom.valor_minimo_pedido.toFixed(2)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">
                {cupom.tipo_desconto === 'percentual' && `${cupom.valor_desconto}% OFF`}
                {cupom.tipo_desconto === 'valor_fixo' && `R$ ${cupom.valor_desconto} OFF`}
                {cupom.tipo_desconto === 'frete_gratis' && 'FRETE GRÁTIS'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CuponsDisponiveis;
```

---

## 🔔 Notificar Cliente sobre Cupons

```jsx
import React, { useEffect, useState } from 'react';
import * as cuponsService from '../services/cuponsService';

function NotificacaoCupom({ restauranteId, valorCarrinho }) {
  const [cupomSugerido, setCupomSugerido] = useState(null);

  useEffect(() => {
    sugerirCupom();
  }, [valorCarrinho]);

  const sugerirCupom = async () => {
    try {
      const cupons = await cuponsService.fetchCuponsAtivos(restauranteId);
      
      // Encontrar cupom que o cliente pode usar
      const cupomDisponivel = cupons.find(cupom => {
        // Se tem valor mínimo, verificar se carrinho atinge
        if (cupom.valor_minimo_pedido > 0) {
          const faltam = cupom.valor_minimo_pedido - valorCarrinho;
          if (faltam > 0 && faltam <= 20) {
            // Faltam menos de R$ 20 para usar o cupom
            return true;
          }
        }
        return false;
      });

      setCupomSugerido(cupomDisponivel);
    } catch (error) {
      console.error('Erro ao sugerir cupom:', error);
    }
  };

  if (!cupomSugerido) return null;

  const faltam = cupomSugerido.valor_minimo_pedido - valorCarrinho;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <p className="font-semibold text-yellow-800 mb-1">
        💡 Adicione mais R$ {faltam.toFixed(2)} e ganhe:
      </p>
      <p className="text-sm text-yellow-700">
        <strong>{cupomSugerido.codigo}</strong> - {cupomSugerido.descricao}
      </p>
    </div>
  );
}

export default NotificacaoCupom;
```

---

## 📊 Dashboard de Cupons (Admin)

```jsx
import React, { useState, useEffect } from 'react';
import * as cuponsService from '../services/cuponsService';

function DashboardCupons({ restauranteId }) {
  const [cupons, setCupons] = useState([]);
  const [stats, setStats] = useState({
    totalCupons: 0,
    cuponsAtivos: 0,
    totalUsos: 0,
    descontoTotal: 0
  });

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    try {
      const cuponsData = await cuponsService.fetchCupons(restauranteId);
      setCupons(cuponsData);

      // Calcular estatísticas
      const totalCupons = cuponsData.length;
      const cuponsAtivos = cuponsData.filter(c => c.ativo).length;
      const totalUsos = cuponsData.reduce((sum, c) => sum + (c.uso_atual || 0), 0);

      // Buscar desconto total
      let descontoTotal = 0;
      for (const cupom of cuponsData) {
        const estatisticas = await cuponsService.fetchEstatisticasCupom(cupom.id);
        descontoTotal += estatisticas.totalDescontoAplicado;
      }

      setStats({
        totalCupons,
        cuponsAtivos,
        totalUsos,
        descontoTotal
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-1">Total de Cupons</p>
          <p className="text-3xl font-bold text-blue-800">{stats.totalCupons}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Cupons Ativos</p>
          <p className="text-3xl font-bold text-green-800">{stats.cuponsAtivos}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-1">Total de Usos</p>
          <p className="text-3xl font-bold text-purple-800">{stats.totalUsos}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">Desconto Total</p>
          <p className="text-3xl font-bold text-red-800">
            R$ {stats.descontoTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Top 5 Cupons Mais Usados */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4">Top 5 Cupons Mais Usados</h3>
        <div className="space-y-2">
          {cupons
            .sort((a, b) => (b.uso_atual || 0) - (a.uso_atual || 0))
            .slice(0, 5)
            .map((cupom, index) => (
              <div key={cupom.id} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{cupom.codigo}</p>
                  <p className="text-sm text-muted-foreground">{cupom.descricao}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{cupom.uso_atual || 0} usos</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardCupons;
```

---

## 🔄 Validação em Tempo Real

```jsx
import React, { useState, useEffect } from 'react';
import * as cuponsService from '../services/cuponsService';

function ValidacaoCupomRealTime({ 
  codigo, 
  restauranteId, 
  clienteId, 
  valorPedido,
  onChange 
}) {
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (codigo.length >= 3) {
      validarCupom();
    } else {
      setResultado(null);
    }
  }, [codigo, valorPedido]);

  const validarCupom = async () => {
    setValidando(true);
    try {
      const result = await cuponsService.validarCupom(
        codigo,
        clienteId,
        restauranteId,
        valorPedido
      );
      setResultado(result);
      
      if (onChange) {
        onChange(result);
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setResultado({ valido: false, mensagem: 'Erro ao validar' });
    } finally {
      setValidando(false);
    }
  };

  if (!codigo) return null;

  return (
    <div className="mt-2">
      {validando && (
        <p className="text-sm text-muted-foreground">Validando...</p>
      )}
      
      {!validando && resultado && (
        <div className={`text-sm ${resultado.valido ? 'text-green-600' : 'text-red-600'}`}>
          {resultado.valido ? '✅' : '❌'} {resultado.mensagem}
          {resultado.valido && resultado.valor_desconto_calculado > 0 && (
            <span className="ml-2 font-bold">
              (-R$ {resultado.valor_desconto_calculado.toFixed(2)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidacaoCupomRealTime;
```

---

## 📧 Enviar Cupom por Email/WhatsApp

```javascript
// Função para compartilhar cupom
export function compartilharCupom(cupom, metodo = 'whatsapp') {
  const mensagem = `
🎟️ *Cupom de Desconto!*

Código: *${cupom.codigo}*
${cupom.descricao}

${cupom.tipo_desconto === 'percentual' ? `${cupom.valor_desconto}% OFF` : ''}
${cupom.tipo_desconto === 'valor_fixo' ? `R$ ${cupom.valor_desconto} OFF` : ''}
${cupom.tipo_desconto === 'frete_gratis' ? 'FRETE GRÁTIS' : ''}

${cupom.valor_minimo_pedido > 0 ? `Pedido mínimo: R$ ${cupom.valor_minimo_pedido}` : ''}
${cupom.data_fim ? `Válido até: ${new Date(cupom.data_fim).toLocaleDateString()}` : ''}

Peça agora e aproveite! 🍕
  `.trim();

  if (metodo === 'whatsapp') {
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  } else if (metodo === 'email') {
    const subject = `Cupom de Desconto: ${cupom.codigo}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
  } else if (metodo === 'copiar') {
    navigator.clipboard.writeText(mensagem);
    alert('Cupom copiado para a área de transferência!');
  }
}

// Uso:
<button onClick={() => compartilharCupom(cupom, 'whatsapp')}>
  Compartilhar no WhatsApp
</button>
```

---

## 🎯 Cupom Automático para Carrinho Abandonado

```javascript
// Função para criar cupom de recuperação
export async function criarCupomRecuperacao(restauranteId, clienteEmail) {
  const codigo = `VOLTE${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const cupom = await cuponsService.createCupom({
    restaurante_id: restauranteId,
    codigo,
    descricao: 'Cupom especial para você voltar!',
    tipo_desconto: 'percentual',
    valor_desconto: 15,
    valor_minimo_pedido: 30,
    limite_uso_total: 1,
    limite_uso_por_cliente: 1,
    data_inicio: new Date().toISOString(),
    data_fim: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    ativo: true
  });

  // Enviar email com o cupom
  await enviarEmailCupom(clienteEmail, cupom);

  return cupom;
}
```

---

**Exemplos prontos para usar! 🚀**
