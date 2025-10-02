import React from 'react';
import ComandaPrint from '../components/ComandaPrint';

const ComandaDemo = () => {
  // Dados de exemplo do pedido
  const pedidoExemplo = {
    id: 123,
    numero_pedido: 1,
    nome_cliente: "João Silva",
    mesa_numero: "4",
    itens_pedido: [
      {
        quantidade: 2,
        preco_total: "20.00",
        itens_cardapio: {
          nome: "Hambúrguer"
        }
      },
      {
        quantidade: 1,
        preco_total: "8.50",
        itens_cardapio: {
          nome: "Coca-Cola"
        }
      },
      {
        quantidade: 1,
        preco_total: "11.50",
        itens_cardapio: {
          nome: "Batata Frita"
        },
        observacao: "Sem sal"
      }
    ],
    valor_total: "40.00"
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Demonstração de Comanda
          </h1>
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para imprimir a comanda do pedido
          </p>
          
          {/* Componente de Comanda */}
          <ComandaPrint {...pedidoExemplo} />
        </div>

        {/* Informações sobre o componente */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Sobre o Componente ComandaPrint
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Props aceitos:</h3>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">id</code> - ID único do pedido</li>
                <li><code className="bg-gray-100 px-1 rounded">numero_pedido</code> - Número do pedido</li>
                <li><code className="bg-gray-100 px-1 rounded">nome_cliente</code> - Nome do cliente</li>
                <li><code className="bg-gray-100 px-1 rounded">mesa_numero</code> - Número da mesa</li>
                <li><code className="bg-gray-100 px-1 rounded">itens_pedido</code> - Array de itens do pedido</li>
                <li><code className="bg-gray-100 px-1 rounded">valor_total</code> - Valor total do pedido</li>
                <li><code className="bg-gray-100 px-1 rounded">data_pedido</code> - Data do pedido (opcional)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Características:</h3>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Layout otimizado para impressoras térmicas (80mm)</li>
                <li>Design limpo e profissional</li>
                <li>Botão de impressão que chama window.print()</li>
                <li>Estilos separados para tela e impressão</li>
                <li>Observações dos itens incluídas</li>
                <li>Data e hora automática</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">Exemplo de uso:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<ComandaPrint
  id={pedido.id}
  numero_pedido={pedido.numero_pedido}
  nome_cliente={pedido.nome_cliente}
  mesa_numero={pedido.mesa_numero}
  itens_pedido={pedido.itens_pedido}
  valor_total={pedido.valor_total}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComandaDemo;