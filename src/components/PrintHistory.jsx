import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import * as Icons from './icons/index.jsx';
import { printService } from '../services/printService';

export const PrintHistory = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = () => {
    const printHistory = printService.getPrintHistory();
    setHistory(printHistory);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de impressões?')) {
      try {
        const result = await printService.clearPrintHistory();
        
        if (result.success) {
          setHistory([]);
          setMessage({
            type: 'success',
            text: 'Histórico de impressões limpo com sucesso!'
          });
          
          // Limpar mensagem após 3 segundos
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        } else {
          setMessage({
            type: 'error',
            text: result.message
          });
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Erro ao limpar histórico: ' + error.message
        });
      }
    }
  };

  const handleExportHistory = () => {
    try {
      // Criar CSV
      const headers = ['ID', 'Data', 'Tipo', 'Detalhes', 'Status', 'Mensagem'];
      const rows = history.map(entry => [
        entry.id,
        new Date(entry.timestamp).toLocaleString(),
        getTypeLabel(entry.type),
        JSON.stringify(entry.data),
        entry.success ? 'Sucesso' : 'Falha',
        entry.message
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `historico_impressoes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({
        type: 'success',
        text: 'Histórico exportado com sucesso!'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao exportar histórico: ' + error.message
      });
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ticket': return 'Comanda';
      case 'reprint': return 'Reimpressão';
      case 'report': return 'Relatório';
      case 'batch': return 'Lote';
      default: return type;
    }
  };

  const getTypeIcon = (type) => {
    return <Icons.PrinterIcon className="w-4 h-4" />;
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(entry => entry.type === filter);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Impressões">
      <div className="space-y-4">
        {/* Filtros e ações */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div>
            <select 
              className="bg-input px-3 py-2 rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="ticket">Comandas</option>
              <option value="reprint">Reimpressões</option>
              <option value="report">Relatórios</option>
              <option value="batch">Lotes</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportHistory}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80"
            >
              <Icons.DownloadIcon className="w-4 h-4" />
              Exportar
            </button>
            <button 
              onClick={handleClearHistory}
              className="flex items-center gap-1 bg-destructive text-destructive-foreground px-3 py-2 rounded-md text-sm font-semibold hover:bg-destructive/90"
            >
              <Icons.XIcon className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        {/* Lista de histórico */}
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-2 text-left text-xs font-semibold">Data</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Detalhes</th>
                <th className="px-4 py-2 text-center text-xs font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map(entry => (
                  <tr key={entry.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-4 py-2 text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-xs">
                        {getTypeIcon(entry.type)}
                        <span>{getTypeLabel(entry.type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {entry.type === 'ticket' || entry.type === 'reprint' ? (
                        <>Pedido #{entry.data.orderId} - {entry.data.customerName}</>
                      ) : entry.type === 'report' ? (
                        <>Relatório {entry.data.reportType} - {entry.data.orderCount} pedidos</>
                      ) : entry.type === 'batch' ? (
                        <>{entry.data.orderCount} comandas</>
                      ) : (
                        JSON.stringify(entry.data)
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        entry.success 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {entry.success ? 'Sucesso' : 'Falha'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">
                    {history.length === 0 
                      ? 'Nenhum registro de impressão encontrado.' 
                      : 'Nenhum registro encontrado com o filtro atual.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`text-sm p-2 rounded-md ${
            message.type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {message.text}
          </div>
        )}

        {/* Botão de fechar */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};