import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardFinanceiro from '../components/DashboardFinanceiro';
import * as financeService from '../services/financeService';
import { TransactionModal, AccountModal, SupplierModal, GoalModal } from '../components/FinanceModals';
import FecharCaixaButton from '../components/FecharCaixaButton';
import HistoricoFechamentos from '../components/HistoricoFechamentos';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
import * as fechamentoCaixaService from '../services/fechamentoCaixaService';

const SuccessToast = ({ message, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000000] bg-success text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold"
      >
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <Icons.CheckIcon className="w-4 h-4" />
        </div>
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// Listas simples (somente leitura) para sincronizar com dados reais
const TransactionsList = ({ onEdit, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tipo: 'all', status: 'all', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { tipo, status, startDate, endDate } = filters;
      const data = await financeService.fetchTransactions({
        ...(tipo !== 'all' ? { tipo } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      });
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir esta transação?')) return;
    try {
      await financeService.deleteTransaction(id);
      await load();
      onChanged && onChanged();
    } catch (e) {
      alert(e?.message || 'Erro ao excluir');
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs mb-1">Tipo</label>
          <select
            value={filters.tipo}
            onChange={(e)=> setFilters((f)=> ({...f, tipo: e.target.value}))}
            className="px-2 py-1 border border-border rounded-md text-sm"
          >
            <option value="all">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e)=> setFilters((f)=> ({...f, status: e.target.value}))}
            className="px-2 py-1 border border-border rounded-md text-sm"
          >
            <option value="all">Todos</option>
            <option value="confirmada">Confirmada</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">De</label>
          <input type="date" value={filters.startDate} onChange={(e)=> setFilters((f)=> ({...f, startDate: e.target.value}))} className="px-2 py-1 border border-border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs mb-1">Até</label>
          <input type="date" value={filters.endDate} onChange={(e)=> setFilters((f)=> ({...f, endDate: e.target.value}))} className="px-2 py-1 border border-border rounded-md text-sm" />
        </div>
        <button onClick={load} className="px-3 py-2 border border-border rounded-md">Filtrar</button>
      </div>

      {paged.map((t) => (
        <div key={t.id} className="border border-border p-3 rounded-md flex justify-between items-center">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{t.descricao || 'Sem descrição'}</p>
            <p className="text-xs text-muted-foreground">{t.data_transacao} • {t.tipo}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={t.tipo === 'entrada' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
              R$ {Number(t.valor || 0).toFixed(2)}
            </div>
            <button onClick={()=> onEdit && onEdit(t)} className="px-2 py-1 border border-border rounded-md text-sm">Editar</button>
            <button onClick={()=> handleDelete(t.id)} className="px-2 py-1 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=> setPage((p)=> Math.max(1, p-1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Anterior</button>
          <button disabled={page>=totalPages} onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
    </div>
  );
};

const AccountsList = ({ onEdit, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tipo: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await financeService.fetchAccounts(
          filters.tipo !== 'all' ? filters.tipo : null,
          filters.status !== 'all' ? filters.status : null
        );
        setItems(Array.isArray(data) ? data : []);
        setPage(1);
      } catch (e) {
        setError(e?.message || 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir esta conta?')) return;
    try {
      await financeService.deleteAccount(id);
      setFilters({...filters});
      onChanged && onChanged();
    } catch (e) {
      alert(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs mb-1">Tipo</label>
          <select value={filters.tipo} onChange={(e)=> setFilters((f)=> ({...f, tipo: e.target.value}))} className="px-2 py-1 border border-border rounded-md text-sm">
            <option value="all">Todos</option>
            <option value="pagar">A Pagar</option>
            <option value="receber">A Receber</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select value={filters.status} onChange={(e)=> setFilters((f)=> ({...f, status: e.target.value}))} className="px-2 py-1 border border-border rounded-md text-sm">
            <option value="all">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {paged.map((c) => (
        <div key={c.id} className="border border-border p-3 rounded-md flex justify-between items-center">
          <div>
            <p className="font-medium text-foreground">{c.descricao || 'Sem descrição'}</p>
            <p className="text-xs text-muted-foreground">Venc: {c.data_vencimento || '-'} • {c.tipo}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={c.tipo === 'receber' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                R$ {Number(c.valor || 0).toFixed(2)}
              </p>
              <span className="text-xs text-muted-foreground">{c.status}</span>
            </div>
            <button onClick={()=> onEdit && onEdit(c)} className="px-2 py-1 border border-border rounded-md text-sm">Editar</button>
            <button onClick={()=> handleDelete(c.id)} className="px-2 py-1 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=> setPage((p)=> Math.max(1, p-1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Anterior</button>
          <button disabled={page>=totalPages} onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
    </div>
  );
};

const SuppliersList = ({ onEdit, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await financeService.fetchSuppliers();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  const filtered = items.filter(s => !search || (s.nome || '').toLowerCase().includes(search.toLowerCase()));
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir este fornecedor?')) return;
    try {
      await financeService.deleteSupplier(id);
      const data = await financeService.fetchSuppliers();
      setItems(Array.isArray(data) ? data : []);
      onChanged && onChanged();
    } catch (e) {
      alert(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs mb-1">Buscar</label>
          <input value={search} onChange={(e)=> setSearch(e.target.value)} className="px-2 py-1 border border-border rounded-md text-sm" placeholder="Nome do fornecedor" />
        </div>
      </div>

      {paged.map((s) => (
        <div key={s.id} className="border border-border p-3 rounded-md flex justify-between items-center">
          <div>
            <p className="font-medium text-foreground">{s.nome || 'Sem nome'}</p>
            <p className="text-xs text-muted-foreground">{s.categoria || s.segmento || 'Fornecedor'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={s.ativo ? 'text-success' : 'text-muted-foreground'}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
            <button onClick={()=> onEdit && onEdit(s)} className="px-2 py-1 border border-border rounded-md text-sm">Editar</button>
            <button onClick={()=> handleDelete(s.id)} className="px-2 py-1 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=> setPage((p)=> Math.max(1, p-1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Anterior</button>
          <button disabled={page>=totalPages} onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
    </div>
  );
};

const GoalsList = ({ onEdit, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await financeService.fetchFinancialGoals();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  const filtered = items.filter(g => !year || Number(g.ano_referencia) === Number(year));
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir esta meta?')) return;
    try {
      await financeService.deleteFinancialGoal(id);
      const data = await financeService.fetchFinancialGoals();
      setItems(Array.isArray(data) ? data : []);
      onChanged && onChanged();
    } catch (e) {
      alert(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs mb-1">Ano</label>
        <input type="number" value={year} onChange={(e)=> setYear(e.target.value)} className="px-2 py-1 border border-border rounded-md text-sm" />
      </div>

      {paged.map((g) => (
        <div key={g.id} className="border border-border p-3 rounded-md flex justify-between items-center">
          <div>
            <p className="font-medium text-foreground">Meta {g.mes_referencia?.toString().padStart(2, '0')}/{g.ano_referencia}</p>
            <p className="text-xs text-muted-foreground">{g.nome || g.descricao || 'Sem descrição'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-primary font-semibold">R$ {Number(g.valor_meta || 0).toFixed(2)}</p>
              <span className="text-xs text-muted-foreground">{g.ativa ? 'Ativa' : 'Inativa'}</span>
            </div>
            <button onClick={()=> onEdit && onEdit(g)} className="px-2 py-1 border border-border rounded-md text-sm">Editar</button>
            <button onClick={()=> handleDelete(g.id)} className="px-2 py-1 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=> setPage((p)=> Math.max(1, p-1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Anterior</button>
          <button disabled={page>=totalPages} onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} className="px-2 py-1 border border-border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
    </div>
  );
};

const Finance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [restaurantId, setRestaurantId] = useState(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const triggerSuccess = (msg) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Estados de dados reais por aba (sem mock)
  const [transactionsCount, setTransactionsCount] = useState(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);

  const [accountsCount, setAccountsCount] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  const [suppliersCount, setSuppliersCount] = useState(null);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState(null);

  const [goalsCount, setGoalsCount] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState(null);

  const [fechamentosCount, setFechamentosCount] = useState(null);
  const [fechamentosLoading, setFechamentosLoading] = useState(false);
  const [fechamentosError, setFechamentosError] = useState(null);

  // Carregamento de contagem inicial para dashboard
  useEffect(() => {
    if (restaurantId) {
      const loadInitialCounts = async () => {
        try {
          const [t, a, g, f] = await Promise.all([
             financeService.fetchTransactions({}),
             financeService.fetchAccounts(),
             financeService.fetchFinancialGoals(),
             fechamentoCaixaService.fetchFechamentos(restaurantId)
          ]);
          setTransactionsCount(Array.isArray(t) ? t.length : 0);
          setAccountsCount(Array.isArray(a) ? a.length : 0);
          setGoalsCount(Array.isArray(g) ? g.length : 0);
          setFechamentosCount(Array.isArray(f) ? f.length : 0);
        } catch (err) {
          console.warn('Erro ao carregar contagens iniciais:', err);
        }
      };
      loadInitialCounts();
    }
  }, [restaurantId]);

  // Modais
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [categoriesEntrada, setCategoriesEntrada] = useState([]);
  const [categoriesSaida, setCategoriesSaida] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        setIsLoadingRestaurant(true);
        setRestaurantError(null);
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('restaurantes_app')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setRestaurantError(error);
          return;
        }

        if (data?.id) setRestaurantId(data.id);
      } catch (err) {
        setRestaurantError(err);
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    fetchRestaurantId();
  }, [user]);

  // Carregadores por aba (apenas contagens, sem dados mock)
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setTransactionsLoading(true);
        setTransactionsError(null);
        const data = await financeService.fetchTransactions({});
        setTransactionsCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        setTransactionsError(err?.message || 'Dados indisponíveis');
        setTransactionsCount(null);
      } finally {
        setTransactionsLoading(false);
      }
    };

    const loadAccounts = async () => {
      try {
        setAccountsLoading(true);
        setAccountsError(null);
        const data = await financeService.fetchAccounts();
        setAccountsCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        setAccountsError(err?.message || 'Dados indisponíveis');
        setAccountsCount(null);
      } finally {
        setAccountsLoading(false);
      }
    };

    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        setSuppliersError(null);
        const data = await financeService.fetchSuppliers();
        setSuppliersCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        setSuppliersError(err?.message || 'Dados indisponíveis');
        setSuppliersCount(null);
      } finally {
        setSuppliersLoading(false);
      }
    };

    const loadGoals = async () => {
      try {
        setGoalsLoading(true);
        setGoalsError(null);
        const data = await financeService.fetchFinancialGoals();
        setGoalsCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        setGoalsError(err?.message || 'Dados indisponíveis');
        setGoalsCount(null);
      } finally {
        setGoalsLoading(false);
      }
    };

    if (!restaurantId) return;

    if (activeTab === 'transactions') loadTransactions();
    if (activeTab === 'accounts') loadAccounts();
    if (activeTab === 'suppliers') loadSuppliers();
    if (activeTab === 'goals') loadGoals();
  }, [activeTab, restaurantId]);

  // Pré-carregar categorias e fornecedores para modais
  useEffect(() => {
    const preload = async () => {
      try {
        const [catsEntrada, catsSaida, sups] = await Promise.all([
          financeService.fetchFinancialCategories('entrada'),
          financeService.fetchFinancialCategories('saida'),
          financeService.fetchSuppliers()
        ]);
        setCategoriesEntrada(catsEntrada || []);
        setCategoriesSaida(catsSaida || []);
        setSuppliersList(sups || []);
      } catch (_e) {}
    };
    preload();
  }, [restaurantId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Sistema Financeiro</h1>
      
      {/* Navegação simples */}
      <div className="ninja-card p-0 overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'transactions', label: 'Transações' },
            { key: 'accounts', label: 'Contas' },
            { key: 'suppliers', label: 'Fornecedores' },
            { key: 'goals', label: 'Metas' },
            { key: 'fechamentos', label: 'Fechamentos' },
            { key: 'reports', label: 'Relatórios' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="ninja-card p-6">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Dashboard Financeiro</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="ninja-card bg-primary/5 p-4 border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Transações</p>
                  <p className="text-2xl font-bold text-primary">{transactionsLoading ? '...' : transactionsCount || 0}</p>
                </div>
                <div className="ninja-card bg-primary/5 p-4 border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Contas Pendentes</p>
                  <p className="text-2xl font-bold text-primary">{accountsLoading ? '...' : accountsCount || 0}</p>
                </div>
                <div className="ninja-card bg-primary/5 p-4 border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Metas Ativas</p>
                  <p className="text-2xl font-bold text-primary">{goalsLoading ? '...' : goalsCount || 0}</p>
                </div>
                <div className="ninja-card bg-primary/5 p-4 border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Fechamentos</p>
                  <p className="text-2xl font-bold text-primary">{fechamentosLoading ? '...' : fechamentosCount || 0}</p>
                </div>
              </div>
              {restaurantId ? (
                <DashboardFinanceiro restauranteId={restaurantId} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Configurando ambiente financeiro...</p>
                </div>
              )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Transações</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingTransaction({ tipo: 'saida', descricao: 'Sangria', status: 'confirmada' }); setTransactionModalOpen(true); }}
                  className="px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10"
                >
                  Registrar Sangria
                </button>
                <button
                  onClick={() => { setEditingTransaction({ tipo: 'entrada', descricao: 'Reforço', status: 'confirmada' }); setTransactionModalOpen(true); }}
                  className="px-3 py-2 border border-success text-success rounded-md hover:bg-success/10"
                >
                  Registrar Reforço
                </button>
              <button 
                  onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                  Nova Transação
              </button>
              </div>
            </div>
            {transactionsLoading ? (
              <p className="text-muted-foreground">Carregando transações...</p>
            ) : transactionsError ? (
              <p className="text-destructive">{transactionsError}</p>
            ) : transactionsCount === 0 ? (
              <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
            ) : (
              <TransactionsList onEdit={(t)=> { setEditingTransaction(t); setTransactionModalOpen(true); }} onChanged={async ()=> { const data = await financeService.fetchTransactions({}); setTransactionsCount(Array.isArray(data) ? data.length : 0); }} />
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Contas a Pagar/Receber</h2>
              <button 
                onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Nova Conta
              </button>
            </div>
            {accountsLoading ? (
              <p className="text-muted-foreground">Carregando contas...</p>
            ) : accountsError ? (
              <p className="text-destructive">{accountsError}</p>
            ) : accountsCount === 0 ? (
              <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
            ) : (
              <AccountsList onEdit={(c)=> { setEditingAccount(c); setAccountModalOpen(true); }} onChanged={async ()=> { const data = await financeService.fetchAccounts(); setAccountsCount(Array.isArray(data) ? data.length : 0); }} />
            )}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Fornecedores</h2>
              <button 
                onClick={() => { setEditingSupplier(null); setSupplierModalOpen(true); }}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Novo Fornecedor
              </button>
            </div>
            {suppliersLoading ? (
              <p className="text-muted-foreground">Carregando fornecedores...</p>
            ) : suppliersError ? (
              <p className="text-destructive">{suppliersError}</p>
            ) : suppliersCount === 0 ? (
              <p className="text-muted-foreground">Nenhum fornecedor encontrado.</p>
            ) : (
              <SuppliersList onEdit={(s)=> { setEditingSupplier(s); setSupplierModalOpen(true); }} onChanged={async ()=> { const data = await financeService.fetchSuppliers(); setSuppliersCount(Array.isArray(data) ? data.length : 0); }} />
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Metas Financeiras</h2>
              <button 
                onClick={() => { setEditingGoal(null); setGoalModalOpen(true); }}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Nova Meta
              </button>
            </div>
            {goalsLoading ? (
              <p className="text-muted-foreground">Carregando metas...</p>
            ) : goalsError ? (
              <p className="text-destructive">{goalsError}</p>
            ) : goalsCount === 0 ? (
              <p className="text-muted-foreground">Nenhuma meta cadastrada.</p>
            ) : (
              <GoalsList onEdit={(g)=> { setEditingGoal(g); setGoalModalOpen(true); }} onChanged={async ()=> { const data = await financeService.fetchFinancialGoals(); setGoalsCount(Array.isArray(data) ? data.length : 0); }} />
            )}
          </div>
        )}

        {activeTab === 'fechamentos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Fechamentos de Caixa</h2>
              <FecharCaixaButton 
                restauranteId={restaurantId}
                onFechamentoCreated={() => {
                  // Recarregar lista de fechamentos
                  setFechamentosCount((prev) => (prev || 0) + 1);
                }}
              />
            </div>
            {!restaurantId ? (
              <p className="text-muted-foreground text-center py-10">Carregando dados do restaurante...</p>
            ) : (
              <HistoricoFechamentos restauranteId={restaurantId} />
            )}
          </div>
        )}


        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h2>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all font-semibold"
              >
                <Icons.FileTextIcon className="w-4 h-4" />
                Imprimir Relatório
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="ninja-card p-6 border-l-4 border-l-primary hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icons.TrendingUpIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold">Fluxo de Caixa</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Análise detalhada de todas as entradas e saídas por período.</p>
                <span className="text-xs font-semibold py-1 px-2 bg-success/10 text-success rounded-full">Ativo</span>
              </div>

              <div className="ninja-card p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Icons.ShoppingBagIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold">Vendas por Produto</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Ranking de produtos mais vendidos e faturamento individual.</p>
                <span className="text-xs font-semibold py-1 px-2 bg-success/10 text-success rounded-full">Ativo</span>
              </div>

              <div className="ninja-card p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Icons.PieChartIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-bold">DRE Simplificado</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Demonstrativo de resultados para visão clara do lucro real.</p>
                <span className="text-xs font-semibold py-1 px-2 bg-yellow-500/10 text-yellow-500 rounded-full">Beta</span>
              </div>
            </div>

            <div className="mt-8 p-10 bg-secondary/20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center">
               <Icons.BarChart3Icon className="w-16 h-16 text-muted-foreground/30 mb-4" />
               <p className="text-muted-foreground font-medium">Selecione um dos relatórios acima para visualizar os dados detalhados.</p>
            </div>
          </div>
        )}
      </div>
      {/* Modais */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        transaction={editingTransaction}
        categories={[...categoriesEntrada, ...categoriesSaida]}
        onSave={async (payload) => {
          try {
            if (editingTransaction) await financeService.updateTransaction(editingTransaction.id, payload);
            else await financeService.createTransaction(payload);
            setTransactionModalOpen(false);
            triggerSuccess('Transação salva com sucesso!');
            if (activeTab === 'transactions') {
              const data = await financeService.fetchTransactions({});
              setTransactionsCount(Array.isArray(data) ? data.length : 0);
            }
          } catch (e) {
            alert(e?.message || 'Erro ao salvar transação');
          }
        }}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        account={editingAccount}
        categories={[...categoriesEntrada, ...categoriesSaida]}
        suppliers={suppliersList}
        onSave={async (payload) => {
          try {
            if (editingAccount) await financeService.updateAccount(editingAccount.id, payload);
            else await financeService.createAccount(payload);
            setAccountModalOpen(false);
            triggerSuccess('Conta salva com sucesso!');
            if (activeTab === 'accounts') {
              const data = await financeService.fetchAccounts();
              setAccountsCount(Array.isArray(data) ? data.length : 0);
            }
          } catch (e) {
            alert(e?.message || 'Erro ao salvar conta');
          }
        }}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        supplier={editingSupplier}
        onSave={async (payload) => {
          try {
            if (editingSupplier) await financeService.updateSupplier(editingSupplier.id, payload);
            else await financeService.createSupplier(payload);
            setSupplierModalOpen(false);
            triggerSuccess('Fornecedor salvo com sucesso!');
            if (activeTab === 'suppliers') {
              const data = await financeService.fetchSuppliers();
              setSuppliersCount(Array.isArray(data) ? data.length : 0);
            }
          } catch (e) {
            alert(e?.message || 'Erro ao salvar fornecedor');
          }
        }}
      />

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        goal={editingGoal}
        onSave={async (payload) => {
          try {
            if (editingGoal) await financeService.updateFinancialGoal(editingGoal.id, payload);
            else await financeService.createFinancialGoal(payload);
            setGoalModalOpen(false);
            triggerSuccess('Meta salva com sucesso!');
            if (activeTab === 'goals') {
              const data = await financeService.fetchFinancialGoals();
              setGoalsCount(Array.isArray(data) ? data.length : 0);
            }
          } catch (e) {
            alert(e?.message || 'Erro ao salvar meta');
          }
        }}
      />

      <SuccessToast show={showSuccess} message={successMessage} />
    </div>
  );

};

export default Finance;
