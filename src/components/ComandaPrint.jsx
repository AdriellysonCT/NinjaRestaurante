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

      {/* Estilos para impressão */}
      <style jsx>{`
        /* Oculta o conteúdo da tela na impressão */
        @media print {
          .screen-content {
            display: none !important;
          }
          
          /* Estilos otimizados para impressão */
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.3;
          }

          .print-content {
            display: block !important;
            width: 100%;
            max-width: 80mm; /* Largura padrão para impressoras térmicas */
          }

          .comanda {
            padding: 10px;
            border: 1px solid #000;
            border-radius: 5px;
          }

          h1 {
            font-size: 18px;
            margin: 0;
          }

          h2 {
            font-size: 16px;
            margin: 0;
          }

          .text-2xl { font-size: 20px; }
          .text-lg { font-size: 16px; }
          .text-sm { font-size: 12px; }
          .text-xs { font-size: 10px; }

          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .my-3 { margin-top: 12px; margin-bottom: 12px; }
          .mt-4 { margin-top: 16px; }

          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .flex-1 { flex: 1; }

          .border-t-2 { border-top: 2px solid; }
          .border-dashed { border-style: dashed; }
          .border-gray-400 { border-color: #9ca3af; }

          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }

          /* Remove cores de fundo e mantém apenas texto */
          * {
            background: transparent !important;
            color: black !important;
          }

          /* Adiciona margens para melhor visualização */
          @page {
            margin: 10mm;
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