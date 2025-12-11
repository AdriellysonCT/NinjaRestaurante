import React, { useRef } from 'react';

const ComandaPrint = ({ 
  id, 
  numero_pedido, 
  nome_cliente, 
  mesa_numero, 
  itens_pedido, 
  valor_total,
  data_pedido = new Date().toLocaleString('pt-BR')
}) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="comanda-container">
      {/* Conteúdo visível na tela */}
      <div className="screen-content">
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200"
        >
          🖨️ Imprimir Comanda
        </button>
      </div>

      {/* Conteúdo para impressão - oculto na tela normal */}
      <div ref={printRef} className="print-content">
        <div className="comanda">
          {/* 1. CABEÇALHO DO RESTAURANTE */}
          <div className="text-center mb-4">
            <div className="text-lg font-bold">Fome Ninja Restaurante</div>
            <div className="text-base">Fênix Carnes</div>
            <div className="text-sm">Rua Amaro Guedes, 407 (Colegio)</div>
            <div className="text-sm">Nordeste 2, Guarabira</div>
            <div className="text-sm">Tel: (83) 99408-0791</div>
          </div>

          {/* Linha tracejada */}
          <div className="border-t-2 border-dashed border-gray-400 my-3"></div>

          {/* 2. INFORMAÇÕES DO PEDIDO */}
          <div className="mb-4">
            <div className="text-center mb-2">
              <div className="text-lg font-bold">Pedido N° #{numero_pedido}</div>
              <div className="text-sm text-gray-600">{data_pedido}</div>
            </div>
            <div className="mb-1">
              <span className="font-semibold">Cliente:</span> {nome_cliente}
            </div>
            <div className="mb-1">
              <span className="font-semibold">Mesa:</span> {mesa_numero}
            </div>
          </div>

          {/* Linha tracejada */}
          <div className="border-t-2 border-dashed border-gray-400 my-3"></div>

          {/* 3. ITENS DO PEDIDO */}
          <div className="mb-4">
            <h2 className="text-center text-lg font-bold mb-2">ITENS DO PEDIDO</h2>
            
            {/* Cabeçalho da tabela */}
            <div className="text-sm mb-2">
              <span>Qtd Nome</span>
              <span className="float-right">Valor Unit.</span>
            </div>
            
            {/* Linha tracejada */}
            <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
            
            {itens_pedido?.map((item, index) => (
              <div key={index}>
                <div className="item-row mb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {item.quantidade}x {item.itens_cardapio?.nome || item.nome}
                      </div>
                      {item.observacao && (
                        <div className="text-sm text-gray-600 ml-4">
                          → {item.observacao}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-semibold">
                      R$ {item.preco_total}
                    </div>
                  </div>
                </div>
                {/* Linha tracejada após cada item */}
                <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
              </div>
            ))}
            
            {/* Subtotal */}
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>R$ {valor_total}</span>
            </div>
            
            {/* Linha tracejada */}
            <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
            
            {/* Total */}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>R$ {valor_total}</span>
            </div>
          </div>

          {/* Linha dupla tracejada */}
          <div className="border-t-4 border-double border-gray-400 my-3"></div>

          {/* 4. FORMAS DE PAGAMENTO */}
          <div className="mb-4">
            <h2 className="text-center text-lg font-bold mb-2">FORMAS DE PAGAMENTO</h2>
            <div className="mb-2">dinheiro | R$ {valor_total}</div>
          </div>

          {/* Linha tracejada */}
          <div className="border-t-2 border-dashed border-gray-400 my-3"></div>

          {/* 5. TEMPO ESTIMADO */}
          <div className="mb-4">
            <div className="text-center mb-2">Tempo estimado de preparo: 25 min</div>
          </div>

          {/* Linha tracejada */}
          <div className="border-t-2 border-dashed border-gray-400 my-3"></div>

          {/* 6. RODAPÉ DO RESTAURANTE */}
          <div className="text-center text-sm">
            <div className="font-bold">Fênix Carnes</div>
            <div>Rua Amaro Guedes, 407 (Colegio)</div>
            <div>Nordeste 2, Guarabira</div>
            <div>Tel: (83) 99408-0791</div>
            <div>CNPJ: 12.345.678/0001-90</div>
            <div className="mt-2">Obrigado pela preferência!</div>
          </div>

          {/* Linha dupla tracejada */}
          <div className="border-t-4 border-double border-gray-400 my-3"></div>

          {/* 7. ÚLTIMA LINHA */}
          <div className="text-center text-sm">
            <div className="font-bold mb-2">Obrigado pela preferência!</div>
            <div className="mb-2">{data_pedido}</div>
            <div className="font-bold">Fome Ninja Restaurante</div>
          </div>

          {/* Informações adicionais */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <div>ID do Pedido: {id}</div>
          </div>
        </div>
      </div>

      {/* Estilos para impressão - otimizados para térmicas 80mm */}
      <style jsx>{`
        /* Oculta o conteúdo da tela na impressão */
        @media print {
          /* Configuração para impressoras térmicas 80mm */
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .screen-content {
            display: none !important;
          }
          
          /* Estilos otimizados para impressão térmica */
          body {
            font-family: 'Courier New', 'Lucida Console', Monaco, monospace !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }

          .print-content {
            display: block !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 2mm !important;
          }

          .comanda {
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }

          h1 {
            font-size: 14px !important;
            margin: 0 !important;
          }

          h2 {
            font-size: 12px !important;
            margin: 0 !important;
          }

          .text-2xl { font-size: 14px !important; }
          .text-lg { font-size: 12px !important; }
          .text-base { font-size: 11px !important; }
          .text-sm { font-size: 10px !important; }
          .text-xs { font-size: 9px !important; }

          .font-bold { font-weight: bold !important; }
          .font-semibold { font-weight: 600 !important; }

          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }

          .mb-1 { margin-bottom: 2px !important; }
          .mb-2 { margin-bottom: 4px !important; }
          .mb-3 { margin-bottom: 6px !important; }
          .mb-4 { margin-bottom: 8px !important; }
          .my-3 { margin-top: 6px !important; margin-bottom: 6px !important; }
          .mt-4 { margin-top: 8px !important; }

          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .items-start { align-items: flex-start !important; }
          .flex-1 { flex: 1 !important; }

          .border-t-2 { border-top: 1px dashed #000 !important; }
          .border-t-4 { border-top: 2px solid #000 !important; }
          .border-dashed { border-style: dashed !important; }
          .border-gray-400 { border-color: #000 !important; }
          .border-double { border-style: double !important; }

          /* Forçar preto e branco */
          * {
            background: transparent !important;
            color: #000 !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }

          .text-gray-600, .text-gray-500, .text-gray-400 { 
            color: #000 !important; 
          }
        }

        /* Oculta o conteúdo de impressão na tela normal */
        @media screen {
          .print-content {
            display: none;
          }
        }

        /* Estilos para a tela */
        .screen-content {
          padding: 20px;
          text-align: center;
        }
        
        .comanda-container {
          margin: 0;
          padding: 0;
        }
        
        .comanda {
          font-family: 'Courier New', monospace;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10px;
          background: white;
          font-size: 12px;
          line-height: 1.2;
        }
        
        .item-row {
          border-bottom: 1px dashed #ccc;
          padding-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default ComandaPrint;