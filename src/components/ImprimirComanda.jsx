import React, { useEffect, useMemo } from 'react';

const LINHA = 32;

const repeat = (ch, n) => new Array(Math.max(0, n)).fill(ch).join('');
const center = (text, width = LINHA) => {
  const t = String(text ?? '');
  const pad = Math.max(0, Math.floor((width - t.length) / 2));
  return repeat(' ', pad) + t;
};
const lr = (left, right, width = LINHA) => {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const spaces = Math.max(1, width - (l.length + r.length));
  return l + repeat(' ', spaces) + r;
};

const formatarData = (dateStr) => {
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  } catch {
    return String(dateStr ?? '');
  }
};

const calcularSubtotal = (itens) => {
  return (itens || []).reduce((sum, it) => {
    const qty = Number(it.quantidade ?? it.qty ?? 1);
    const price = Number(it.preco_unitario ?? it.price ?? 0);
    return sum + qty * price;
  }, 0);
};

export default function ImprimirComanda({ pedido, restaurante, auto = true, reimpressao = false, onAfterPrint }) {
  const linhas = useMemo(() => {
    const nomeSite = 'Fome Ninja Restaurante';
    const nomeRest = restaurante?.nome_fantasia || 'Restaurante';
    const end1 = `${restaurante?.rua || ''}, ${restaurante?.numero || ''} (${restaurante?.complemento || 'Colegio'})`.trim();
    const end2 = `${restaurante?.bairro || ''}, ${restaurante?.cidade || ''}`.trim();
    const tel = `Tel: ${restaurante?.telefone || ''}`;
    const cnpj = `CNPJ: ${restaurante?.cnpj || ''}`;

    const numeroPedido = `#${pedido?.numero_pedido ?? ''}`;
    const dataPedido = formatarData(pedido?.criado_em || pedido?.created_at);
    const cliente = pedido?.nome_cliente || pedido?.customerName || '';
    const telefone = pedido?.telefone_cliente || '';
    const tipo = pedido?.tipo_pedido || 'Balcão';

    const itens = (pedido?.itens_pedido?.length ? pedido.itens_pedido : (pedido?.items || []))
      .map((it) => ({
        quantidade: it.quantidade ?? it.qty ?? 1,
        nome: it?.itens_cardapio?.nome ?? it.name ?? '-',
        preco_unitario: Number(it.preco_unitario ?? it.price ?? 0)
      }));

    const subtotalCalc = calcularSubtotal(itens);
    const subtotal = Number(pedido?.subtotal ?? subtotalCalc);
    const total = Number(pedido?.valor_total ?? pedido?.total ?? subtotal);
    const pagamento = pedido?.metodo_pagamento || pedido?.paymentMethod || '-';
    const prepTime = Number(pedido?.prep_time ?? pedido?.prepTime ?? 0);

    const lines = [];

    // Cabeçalho
    lines.push(center(nomeSite));
    lines.push(center(nomeRest));
    if (end1.trim()) lines.push(center(end1));
    if (end2.trim()) lines.push(center(end2));
    if (tel.trim()) lines.push(center(tel));
    lines.push(repeat('-', LINHA));

    // Pedido
    lines.push(lr(`Pedido N° ${numeroPedido}`, ''));
    lines.push(lr('Data/Hora:', dataPedido));
    if (cliente) lines.push(lr('Cliente:', cliente));
    if (telefone) lines.push(lr('Telefone:', telefone));
    lines.push(lr('Tipo:', tipo));
    lines.push(repeat('-', LINHA));

    // Itens
    lines.push(center('ITENS DO PEDIDO'));
    lines.push(repeat('-', LINHA));
    lines.push(lr('Qtd Nome', 'Valor Unit.'));
    lines.push(repeat('-', LINHA));
    itens.forEach((it) => {
      const left = `${it.quantidade} ${it.nome}`;
      const right = `R$ ${(it.preco_unitario || 0).toFixed(2)}`;
      lines.push(lr(left, right));
      lines.push(repeat('-', LINHA));
    });
    lines.push(lr('Subtotal', `R$ ${subtotal.toFixed(2)}`));
    lines.push(repeat('-', LINHA));
    lines.push(lr('Total', `R$ ${total.toFixed(2)}`));
    lines.push(repeat('=', LINHA));

    // Pagamento
    lines.push(center('FORMAS DE PAGAMENTO'));
    lines.push(lr(pagamento, `R$ ${total.toFixed(2)}`));
    lines.push(repeat('-', LINHA));

    // Tempo estimado
    lines.push(lr('Tempo estimado de preparo:', `${prepTime || 0} min`));
    lines.push(repeat('-', LINHA));

    // Reimpressão
    if (reimpressao) {
      lines.push(center('*** REIMPRESSÃO ***'));
      lines.push(repeat('-', LINHA));
    }

    // Rodapé
    lines.push(center(nomeRest));
    if (end1.trim()) lines.push(center(end1));
    if (end2.trim()) lines.push(center(end2));
    if (tel.trim()) lines.push(center(tel));
    if (cnpj.trim()) lines.push(center(cnpj));
    lines.push(center('Obrigado pela preferência!'));
    lines.push(repeat('=', LINHA));

    // Última linha
    lines.push(center('Obrigado pela preferência!'));
    lines.push(center(dataPedido));
    lines.push(center(nomeSite));

    return lines.join('\n');
  }, [pedido, restaurante]);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => {
      window.print();
      if (onAfterPrint) setTimeout(() => onAfterPrint(), 100);
    }, 150);
    return () => clearTimeout(t);
  }, [auto, onAfterPrint]);

  return (
    <div>
      <style>{`
        @media screen { .print-only { display: none; } }
        @media print {
          body * { visibility: hidden !important; }
          .imprimir-comanda-container, .imprimir-comanda-container * { visibility: visible !important; }
          .imprimir-comanda-container { position: fixed; inset: 0; padding: 0; margin: 0; }
          .print-only { display: block; }
          body { font-family: 'Courier New', monospace; color: #000; }
          pre { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; margin: 10px; }
        }
      `}</style>
      <div className="imprimir-comanda-container print-only">
        <pre>{linhas}</pre>
      </div>
    </div>
  );
}

export { formatarData, calcularSubtotal };



