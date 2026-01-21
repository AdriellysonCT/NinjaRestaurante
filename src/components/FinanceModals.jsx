import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon } from './icons/index.jsx';
import { Modal } from './ui/Modal';

// O BaseModal agora é apenas um wrapper para o componente Modal centralizado
const BaseModal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="mt-2">
        {children}
      </div>
    </Modal>
  );
};

// Modal de Transação
export const TransactionModal = ({ isOpen, onClose, transaction, categories, onSave }) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'entrada',
    categoria_id: '',
    data_transacao: new Date().toISOString().split('T')[0],
    forma_pagamento: 'dinheiro',
    observacoes: '',
    status: 'confirmada'
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao || '',
        valor: transaction.valor || '',
        tipo: transaction.tipo || 'entrada',
        categoria_id: transaction.categoria_id || '',
        data_transacao: transaction.data_transacao ? new Date(transaction.data_transacao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        forma_pagamento: transaction.forma_pagamento || 'dinheiro',
        observacoes: transaction.observacoes || '',
        status: transaction.status || 'confirmada'
      });
    } else {
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'entrada',
        categoria_id: '',
        data_transacao: new Date().toISOString().split('T')[0],
        forma_pagamento: 'dinheiro',
        observacoes: '',
        status: 'confirmada'
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Editar Transação' : 'Nova Transação'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição</label>
          <input
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
              <input
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-bold text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="entrada">📈 Entrada</option>
              <option value="saida">📉 Saída</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <select
            name="categoria_id"
            value={formData.categoria_id}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.filter(cat => cat.tipo === formData.tipo).map(category => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data</label>
            <input
              type="date"
              name="data_transacao"
              value={formData.data_transacao}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Forma de Pagamento</label>
            <select
              name="forma_pagamento"
              value={formData.forma_pagamento}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="confirmada">Confirmada</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-all font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-bold text-sm"
          >
            {transaction ? 'Atualizar Transação' : 'Criar Transação'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// Modal de Conta
export const AccountModal = ({ isOpen, onClose, account, categories, suppliers, onSave }) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'pagar',
    data_vencimento: '',
    categoria_id: '',
    fornecedor_id: '',
    status: 'pendente',
    observacoes: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        descricao: account.descricao || '',
        valor: account.valor || '',
        tipo: account.tipo || 'pagar',
        data_vencimento: account.data_vencimento ? new Date(account.data_vencimento).toISOString().split('T')[0] : '',
        categoria_id: account.categoria_id || '',
        fornecedor_id: account.fornecedor_id || '',
        status: account.status || 'pendente',
        observacoes: account.observacoes || ''
      });
    } else {
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'pagar',
        data_vencimento: '',
        categoria_id: '',
        fornecedor_id: '',
        status: 'pendente',
        observacoes: ''
      });
    }
  }, [account, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Editar Conta' : 'Nova Conta'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição</label>
          <input
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor</label>
            <input
              type="number"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="pagar">A Pagar</option>
              <option value="receber">A Receber</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data de Vencimento</label>
          <input
            type="date"
            name="data_vencimento"
            value={formData.data_vencimento}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <select
            name="categoria_id"
            value={formData.categoria_id}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fornecedor</label>
          <select
            name="fornecedor_id"
            value={formData.fornecedor_id}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Selecione um fornecedor</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {account ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// Modal de Fornecedor
export const SupplierModal = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj_cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    categoria: '',
    observacoes: '',
    ativo: true
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        nome: supplier.nome || '',
        cnpj_cpf: supplier.cnpj_cpf || '',
        telefone: supplier.telefone || '',
        email: supplier.email || '',
        endereco: supplier.endereco || '',
        categoria: supplier.categoria || '',
        observacoes: supplier.observacoes || '',
        ativo: supplier.ativo !== undefined ? supplier.ativo : true
      });
    } else {
      setFormData({
        nome: '',
        cnpj_cpf: '',
        telefone: '',
        email: '',
        endereco: '',
        categoria: '',
        observacoes: '',
        ativo: true
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CNPJ/CPF</label>
            <input
              type="text"
              name="cnpj_cpf"
              value={formData.cnpj_cpf}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Endereço</label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Selecione uma categoria</option>
            <option value="alimenticios">Alimentícios</option>
            <option value="bebidas">Bebidas</option>
            <option value="limpeza">Limpeza</option>
            <option value="equipamentos">Equipamentos</option>
            <option value="servicos">Serviços</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="ativo"
            checked={formData.ativo}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium">Fornecedor ativo</label>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {supplier ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// Modal de Meta
export const GoalModal = ({ isOpen, onClose, goal, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'receita',
    valor_meta: '',
    periodo: 'mensal',
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    ativa: true
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        nome: goal.nome || '',
        tipo: goal.tipo || 'receita',
        valor_meta: goal.valor_meta || '',
        periodo: goal.periodo || 'mensal',
        mes_referencia: goal.mes_referencia || new Date().getMonth() + 1,
        ano_referencia: goal.ano_referencia || new Date().getFullYear(),
        ativa: goal.ativa !== undefined ? goal.ativa : true
      });
    } else {
      setFormData({
        nome: '',
        tipo: 'receita',
        valor_meta: '',
        periodo: 'mensal',
        mes_referencia: new Date().getMonth() + 1,
        ano_referencia: new Date().getFullYear(),
        ativa: true
      });
    }
  }, [goal, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Editar Meta' : 'Nova Meta'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome da Meta</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="lucro">Lucro</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Período</label>
            <select
              name="periodo"
              value={formData.periodo}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor da Meta</label>
          <input
            type="number"
            name="valor_meta"
            value={formData.valor_meta}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {formData.periodo === 'mensal' && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mês</label>
              <select
                name="mes_referencia"
                value={formData.mes_referencia}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                {meses.map(mes => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ano</label>
            <input
              type="number"
              name="ano_referencia"
              value={formData.ano_referencia}
              onChange={handleChange}
              min="2020"
              max="2030"
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="ativa"
            checked={formData.ativa}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium">Meta ativa</label>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {goal ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};