// ============================================
// Supabase Edge Function: Webhook InfinitePay
// Descrição: Processa webhooks de pagamento da InfinitePay
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-infinitepay-signature',
};

interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: 'approved' | 'pending' | 'rejected' | 'cancelled';
    amount: number;
    payment_method: string;
    transaction_id: string;
    metadata?: {
      order_data?: any;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validar método
    if (req.method !== 'POST') {
      throw new Error('Método não permitido. Use POST.');
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validar assinatura do webhook (segurança)
    const signature = req.headers.get('x-infinitepay-signature');
    const webhookSecret = Deno.env.get('INFINITEPAY_WEBHOOK_SECRET');
    
    // TODO: Implementar validação de assinatura quando disponível na documentação InfinitePay
    // if (webhookSecret && signature) {
    //   const isValid = await validarAssinatura(req.body, signature, webhookSecret);
    //   if (!isValid) {
    //     throw new Error('Assinatura inválida');
    //   }
    // }

    // Ler payload do webhook
    const payload: WebhookPayload = await req.json();

    console.log('🔔 Webhook recebido:', {
      event: payload.event,
      transaction_id: payload.data.transaction_id,
      status: payload.data.status
    });

    // Extrair dados
    const { 
      transaction_id, 
      status, 
      amount, 
      payment_method 
    } = payload.data;

    const orderData = payload.data.metadata?.order_data;

    // Verificar se já existe pedido para esta transação
    const { data: pedidoExistente } = await supabase
      .from('pedidos_padronizados')
      .select('id, status_pagamento')
      .eq('transacao_id', transaction_id)
      .single();

    if (pedidoExistente) {
      console.log('⚠️ Pedido já processado:', pedidoExistente.id);
      
      // Se o status mudou, atualizar
      if (pedidoExistente.status_pagamento !== status) {
        await supabase
          .from('pedidos_padronizados')
          .update({ 
            status_pagamento: mapearStatusPagamento(status),
            pago_em: status === 'approved' ? new Date().toISOString() : null
          })
          .eq('id', pedidoExistente.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pedido já processado',
          pedido_id: pedidoExistente.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Processar baseado no status
    switch (status) {
      case 'approved':
        // ✅ Pagamento aprovado - criar pedido
        const pedidoCriado = await criarPedidoPago(
          supabase,
          transaction_id,
          amount,
          payment_method,
          orderData
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Pedido criado com sucesso',
            pedido: pedidoCriado
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201 
          }
        );

      case 'pending':
        // ⏳ Pagamento pendente - aguardar
        console.log('⏳ Pagamento pendente, aguardando confirmação');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Pagamento pendente, aguardando confirmação'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      case 'rejected':
      case 'cancelled':
        // ❌ Pagamento recusado - registrar tentativa
        await registrarPagamentoRecusado(
          supabase,
          transaction_id,
          amount,
          payment_method,
          orderData
        );

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Pagamento recusado, pedido não criado'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      default:
        console.warn('⚠️ Status desconhecido:', status);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Status de pagamento desconhecido'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

/**
 * Mapeia status da InfinitePay para status_pagamento interno
 */
function mapearStatusPagamento(status: string): string {
  switch (status) {
    case 'approved':
      return 'pago';
    case 'pending':
      return 'pendente';
    case 'rejected':
    case 'cancelled':
      return 'cancelado';
    default:
      return 'pendente';
  }
}

/**
 * Cria pedido com pagamento aprovado
 */
async function criarPedidoPago(
  supabase: any,
  transactionId: string,
  amount: number,
  paymentMethod: string,
  orderData: any
) {
  console.log('✅ Criando pedido com pagamento aprovado');

  if (!orderData || !orderData.id_restaurante) {
    throw new Error('Dados do pedido incompletos');
  }

  // Gerar número sequencial
  const { data: ultimoPedido } = await supabase
    .from('pedidos_padronizados')
    .select('numero_pedido, numero_pedido_sequencial')
    .eq('id_restaurante', orderData.id_restaurante)
    .order('numero_pedido_sequencial', { ascending: false })
    .limit(1)
    .single();

  const numeroSequencial = (ultimoPedido?.numero_pedido_sequencial || 0) + 1;
  const numeroPedido = (ultimoPedido?.numero_pedido || 0) + 1;

  // Criar pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos_padronizados')
    .insert([{
      id_cliente: orderData.id_cliente,
      id_restaurante: orderData.id_restaurante,
      numero_pedido: numeroPedido,
      numero_pedido_sequencial: numeroSequencial,
      tipo_pedido: orderData.tipo_pedido || 'delivery',
      status: 'disponivel',
      valor_total: amount,
      subtotal: orderData.subtotal || amount,
      taxa_entrega: orderData.taxa_entrega || 0,
      desconto: orderData.desconto || 0,
      metodo_pagamento: paymentMethod,
      status_pagamento: 'pago',
      pagamento_recebido_pelo_sistema: true,
      transacao_id: transactionId,
      pago_em: new Date().toISOString(),
      nome_cliente: orderData.nome_cliente,
      telefone_cliente: orderData.telefone_cliente,
      endereco_entrega: orderData.endereco_entrega,
      observacoes: orderData.observacoes,
      is_vip: orderData.is_vip || false,
      criado_em: new Date().toISOString()
    }])
    .select()
    .single();

  if (pedidoError) throw pedidoError;

  // Criar itens do pedido
  if (orderData.itens && orderData.itens.length > 0) {
    const itensParaInserir = orderData.itens.map((item: any) => ({
      id_pedido: pedido.id,
      id_item_cardapio: item.id_item_cardapio,
      id_restaurante: orderData.id_restaurante,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      preco_total: item.preco_total || (item.preco_unitario * item.quantidade),
      observacao_item: item.observacao || null
    }));

    await supabase
      .from('itens_pedido')
      .insert(itensParaInserir);
  }

  console.log('✅ Pedido criado:', pedido.id);
  return pedido;
}

/**
 * Registra pagamento recusado para auditoria
 */
async function registrarPagamentoRecusado(
  supabase: any,
  transactionId: string,
  amount: number,
  paymentMethod: string,
  orderData: any
) {
  console.log('❌ Registrando pagamento recusado');

  try {
    await supabase
      .from('pagamentos_recusados')
      .insert([{
        transacao_id: transactionId,
        id_restaurante: orderData?.id_restaurante,
        id_cliente: orderData?.id_cliente,
        valor: amount,
        metodo_pagamento: paymentMethod,
        dados_pedido: orderData,
        criado_em: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('Erro ao registrar pagamento recusado:', error);
    // Não interrompe o fluxo
  }
}

