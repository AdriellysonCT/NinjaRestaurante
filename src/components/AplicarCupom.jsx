import React, { useState } from 'react';
import * as cuponsService from '../services/cuponsService';

/**
 * Componente para o cliente aplicar cupom no checkout
 * Usado no carrinho/checkout do app do cliente
 */
export default function AplicarCupom({ 
  restauranteId, 
  clienteId, 
  valorPedido, 
  itensPedido = null,
  onCupomAplicado,
  onCupomRemovido 
}) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [erro, setErro] = useState(null);
  const [faltaValor, setFaltaValor] = useState(null); // Valor que falta para atingir o mínimo
  const [valorMinimo, setValorMinimo] = useState(null);


  const handleAplicar = async () => {
    if (!codigo.trim()) {
      setErro('Digite um código de cupom');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const resultado = await cuponsService.validarCupom(
        codigo.toUpperCase().trim(),
        clienteId,
        restauranteId,
        valorPedido,
        itensPedido
      );

      if (!resultado || !resultado.valido) {
        // Se o erro for de valor mínimo, extraímos o valor
        if (resultado?.mensagem?.includes('Valor mínimo')) {
            const match = resultado.mensagem.match(/R\$ ([\d,.]+)/);
            if (match) {
                const min = parseFloat(match[1].replace(',', '.'));
                setValorMinimo(min);
                setFaltaValor(min - valorPedido);
                setErro('Valor mínimo não atingido');
            } else {
                setErro(resultado.mensagem);
            }
        } else {
            setErro(resultado?.mensagem || 'Cupom inválido');
        }
        return;
      }


      // Cupom válido!
      const cupomData = {
        id: resultado.cupom_id,
        codigo: codigo.toUpperCase().trim(),
        tipo_desconto: resultado.tipo_desconto,
        valor_desconto: resultado.valor_desconto,
        valor_desconto_calculado: resultado.valor_desconto_calculado
      };

      setCupomAplicado(cupomData);
      setErro(null);

      // Notificar componente pai
      if (onCupomAplicado) {
        onCupomAplicado(cupomData);
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setErro('Erro ao validar cupom. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = () => {
    setCupomAplicado(null);
    setCodigo('');
    setErro(null);

    if (onCupomRemovido) {
      onCupomRemovido();
    }
  };

  const getDescontoText = () => {
    if (!cupomAplicado) return '';

    if (cupomAplicado.tipo_desconto === 'percentual') {
      return `${cupomAplicado.valor_desconto}% OFF`;
    } else if (cupomAplicado.tipo_desconto === 'valor_fixo') {
      return `R$ ${Number(cupomAplicado.valor_desconto).toFixed(2)} OFF`;
    } else if (cupomAplicado.tipo_desconto === 'frete_gratis') {
      return 'FRETE GRÁTIS';
    }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        🎟️ Cupom de Desconto
      </h3>

      {!cupomAplicado ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                setErro(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAplicar();
                }
              }}
              placeholder="Digite o código do cupom"
              className="flex-1 px-3 py-2 border border-border rounded-md uppercase"
              maxLength={20}
              disabled={loading}
            />
            <button
              onClick={handleAplicar}
              disabled={loading || !codigo.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validando...' : 'Aplicar'}
            </button>
          </div>

          {erro && (
            <div className={`px-3 py-2 rounded-md text-sm border ${erro === 'Valor mínimo não atingido' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="flex items-center gap-2">
                <span>{erro === 'Valor mínimo não atingido' ? '🚀' : '❌'}</span>
                <span className="font-medium">
                  {erro === 'Valor mínimo não atingido' 
                    ? `Faltam R$ ${faltaValor.toFixed(2)} para você liberar este desconto!` 
                    : erro}
                </span>
              </div>
              
              {erro === 'Valor mínimo não atingido' && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span>Progresso</span>
                    <span>{Math.round((valorPedido / valorMinimo) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (valorPedido / valorMinimo) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 italic">
                    Adicione mais itens para ganhar o desconto!
                  </p>
                </div>
              )}
            </div>
          )}

          {!erro && (
            <p className="text-xs text-muted-foreground italic">
              Tem um cupom? Digite o código aqui.
            </p>
          )}

        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono font-bold text-green-800">{cupomAplicado.codigo}</p>
                <p className="text-sm text-green-700">{getDescontoText()}</p>
              </div>
              <button
                onClick={handleRemover}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remover
              </button>
            </div>

            {cupomAplicado.tipo_desconto !== 'frete_gratis' && (
              <div className="flex justify-between items-center pt-2 border-t border-green-300">
                <span className="text-sm text-green-700">Desconto:</span>
                <span className="font-bold text-green-800">
                  -R$ {Number(cupomAplicado.valor_desconto_calculado || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-green-700 flex items-center gap-1">
            ✅ Cupom aplicado com sucesso!
          </p>
        </div>
      )}
    </div>
  );
}
