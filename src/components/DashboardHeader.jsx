import React from 'react';
import * as Icons from './icons/index.jsx';

const DashboardHeader = ({ searchTerm, setSearchTerm, paymentType, setPaymentType }) => {
  return (
    <div className="p-4 bg-card rounded-lg mb-4 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-card-foreground">Dashboard</h1>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar por nome ou ID do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-secondary text-foreground rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          />
        </div>
        <select 
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="bg-secondary text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary border border-border"
        >
          <option value="all">Todos os Pagamentos</option>
          <option value="credit_card">Cartão de Crédito</option>
          <option value="debit_card">Cartão de Débito</option>
          <option value="pix">PIX</option>
          <option value="cash">Dinheiro</option>
        </select>
        <button className="bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2 px-4 rounded flex items-center gap-2 border border-border transition-colors">
          <Icons.PrinterIcon className="w-5 h-5" />
          Imprimir Lote
        </button>
        <button className="bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2 px-4 rounded flex items-center gap-2 border border-border transition-colors">
          <Icons.DownloadIcon className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;