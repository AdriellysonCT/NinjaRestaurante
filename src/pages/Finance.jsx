import React, { useState } from 'react';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Sistema Financeiro</h1>
      
      {/* Navegação simples */}
      <div className="ninja-card p-0 overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {['dashboard', 'transactions', 'accounts', 'suppliers', 'goals', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="ninja-card p-6">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Dashboard Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="ninja-card p-4 bg-success/10 border-success/20">
                <h3 className="font-semibold text-success">Entradas</h3>
                <p className="text-2xl font-bold text-success">R$ 15.000,00</p>
              </div>
              <div className="ninja-card p-4 bg-destructive/10 border-destructive/20">
                <h3 className="font-semibold text-destructive">Saídas</h3>
                <p className="text-2xl font-bold text-destructive">R$ 8.500,00</p>
              </div>
              <div className="ninja-card p-4 bg-primary/10 border-primary/20">
                <h3 className="font-semibold text-primary">Saldo</h3>
                <p className="text-2xl font-bold text-primary">R$ 6.500,00</p>
              </div>
              <div className="ninja-card p-4 bg-secondary/10 border-secondary/20">
                <h3 className="font-semibold text-foreground">Transações</h3>
                <p className="text-2xl font-bold text-foreground">25</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Transações</h2>
              <button 
                onClick={() => alert('Modal de transação abriria aqui!')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                + Nova Transação
              </button>
            </div>
            <div className="space-y-3">
              <div className="border border-border p-4 rounded-md">
                <h3 className="font-semibold text-foreground">Venda Balcão - Cliente João</h3>
                <p className="text-sm text-muted-foreground">Vendas Balcão • 05/01/2024</p>
                <p className="text-success font-bold">+R$ 150,00</p>
              </div>
              <div className="border border-border p-4 rounded-md">
                <h3 className="font-semibold text-foreground">Compra de Ingredientes</h3>
                <p className="text-sm text-muted-foreground">Ingredientes • 04/01/2024</p>
                <p className="text-destructive font-bold">-R$ 280,00</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Contas a Pagar/Receber</h2>
              <button 
                onClick={() => alert('Modal de conta abriria aqui!')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                + Nova Conta
              </button>
            </div>
            <div className="border border-border p-4 rounded-md">
              <h3 className="font-semibold text-foreground">Fornecedor - Distribuidora Central</h3>
              <p className="text-sm text-muted-foreground">Vencimento: 15/01/2024</p>
              <p className="text-destructive font-bold">R$ 1.200,00</p>
              <span className="bg-warning/20 text-warning px-2 py-1 rounded text-xs">Pendente</span>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Fornecedores</h2>
              <button 
                onClick={() => alert('Modal de fornecedor abriria aqui!')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                + Novo Fornecedor
              </button>
            </div>
            <div className="border border-border p-4 rounded-md">
              <h3 className="font-semibold text-foreground">Distribuidora Central</h3>
              <p className="text-sm text-muted-foreground">Alimentícios</p>
              <p className="text-sm text-muted-foreground">(11) 99999-9999</p>
              <span className="bg-success/20 text-success px-2 py-1 rounded text-xs">Ativo</span>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Metas Financeiras</h2>
              <button 
                onClick={() => alert('Modal de meta abriria aqui!')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                + Nova Meta
              </button>
            </div>
            <div className="border border-border p-4 rounded-md">
              <h3 className="font-semibold text-foreground">Receita Mensal Janeiro</h3>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                  <span>Progresso: 75.0%</span>
                  <span>R$ 15.000,00 / R$ 20.000,00</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Relatórios Financeiros</h2>
            <p className="text-muted-foreground text-center">Relatórios em desenvolvimento...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;