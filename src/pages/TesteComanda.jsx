import React from 'react';
import ComandaPrint from '../components/ComandaPrint';

const TesteComanda = () => {
  // Dados de exemplo para teste
  const orderData = {
    numero_pedido: "14",
    data_pedido: "29/09/2025 17:04:03",
    nome_cliente: "Natsu Costa",
    mesa_numero: "5",
    valor_total: "39.90",
    itens_pedido: [
      {
        quantidade: 1,
        itens_cardapio: {
          nome: "Pizza Margherita"
        },
        preco_total: "39.90",
        observacao: "Sem cebola"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Teste de Comanda</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Visualização da Comanda</h2>
          <p className="text-gray-600 mb-4">
            Esta é uma demonstração do novo formato da comanda. Clique no botão "Imprimir Comanda" 
            para ver como ficará a impressão.
          </p>
          
          <ComandaPrint
            numero_pedido={orderData.numero_pedido}
            data_pedido={orderData.data_pedido}
            nome_cliente={orderData.nome_cliente}
            mesa_numero={orderData.mesa_numero}
            valor_total={orderData.valor_total}
            itens_pedido={orderData.itens_pedido}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Novo Formato Aplicado:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>✅ Cabeçalho do restaurante com informações completas</li>
            <li>✅ Formatação dos itens com linhas tracejadas</li>
            <li>✅ Seção de formas de pagamento</li>
            <li>✅ Tempo estimado de preparo</li>
            <li>✅ Rodapé com informações do restaurante</li>
            <li>✅ Última linha com agradecimento</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TesteComanda;