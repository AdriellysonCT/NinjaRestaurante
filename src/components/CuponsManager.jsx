import React, { useState, useEffect } from 'react';
import * as cuponsService from '../services/cuponsService';

const CupomModal = ({ isOpen, onClose, cupom, onSave, restauranteId }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    tipo_desconto: 'percentual',
    valor_desconto: '',
    valor_minimo_pedido: '',
    valor_maximo_desconto: '',
    limite_uso_total: '',
    limite_uso_por_cliente: '1',
    data_inicio: new Date().toISOString().slice(0, 16),
    data_fim: '',
    ativo: true,
    apenas_primeira_compra: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cupom) {
      setFormData({
        codigo: cupom.codigo || '',
        descricao: cupom.descricao || '',
        tipo_desconto: cupom.tipo_desconto || 'percentual',
        valor_desconto: cupom.valor_desconto || '',
        valor_minimo_pedido: cupom.valor_minimo_pedido || '',
        valor_maximo_desconto: cupom.valor_maximo_desconto || '',
        limite_uso_total: cupom.limite_uso_total || '',
        limite_uso_por_cliente: cupom.limite_uso_por_cliente || '1',
        data_inicio: cupom.data_inicio ? new Date(cupom.data_inicio).toISOString().slice(0, 16) : '',
        data_fim: cupom.data_fim ? new Date(cupom.data_fim).toISOString().slice(0, 16) : '',
        ativo: cupom.ativo !== undefined ? cupom.ativo : true,
        apenas_primeira_compra: cupom.apenas_primeira_compra || false
      });
    }
  }, [cupom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        id_restaurante: restauranteId,
        codigo: formData.codigo.toUpperCase().trim(),
        valor_desconto: parseFloat(formData.valor_desconto) || 0,
        valor_minimo_pedido: formData.valor_minimo_pedido ? parseFloat(formData.valor_minimo_pedido) : 0,
        valor_maximo_desconto: formData.valor_maximo_desconto ? parseFloat(formData.valor_maximo_desconto) : null,
        limite_uso_total: formData.limite_uso_total ? parseInt(formData.limite_uso_total) : null,
        limite_uso_por_cliente: formData.limite_uso_por_cliente ? parseInt(formData.limite_uso_por_cliente) : 1,
        data_fim: formData.data_fim || null
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      alert('Erro ao salvar cupom: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">{cupom ? 'Editar Cupom' : 'Novo Cupom'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código do Cupom *</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-border rounded-md uppercase"
                placeholder="BEMVINDO10"
                required
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">Sem espaços, apenas letras e números</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.ativo ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
              placeholder="Ganhe 10% de desconto na primeira compra"
              required
            />
          </div>

          {/* Tipo e Valor do Desconto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Desconto *</label>
              <select
                value={formData.tipo_desconto}
                onChange={(e) => setFormData({ ...formData, tipo_desconto: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                required
              >
                <option value="percentual">Percentual (%)</option>
                <option value="valor_fixo">Valor Fixo (R$)</option>
                <option value="frete_gratis">Frete Grátis</option>
              </select>
            </div>

            {formData.tipo_desconto !== 'frete_gratis' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor do Desconto * {formData.tipo_desconto === 'percentual' ? '(%)' : '(R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.tipo_desconto === 'percentual' ? '100' : undefined}
                  value={formData.valor_desconto}
                  onChange={(e) => setFormData({ ...formData, valor_desconto: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  required
                />
              </div>
            )}
          </div>

          {/* Valores Mínimo e Máximo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Mínimo do Pedido (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_minimo_pedido}
                onChange={(e) => setFormData({ ...formData, valor_minimo_pedido: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                placeholder="0.00"
              />
            </div>

            {formData.tipo_desconto === 'percentual' && (
              <div>
                <label className="block text-sm font-medium mb-1">Desconto Máximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_maximo_desconto}
                  onChange={(e) => setFormData({ ...formData, valor_maximo_desconto: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="Opcional"
                />
                <p className="text-xs text-muted-foreground mt-1">Limite o desconto máximo em reais</p>
              </div>
            )}
          </div>

          {/* Limites de Uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Limite Total de Usos</label>
              <input
                type="number"
                min="1"
                value={formData.limite_uso_total}
                onChange={(e) => setFormData({ ...formData, limite_uso_total: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                placeholder="Ilimitado"
              />
              <p className="text-xs text-muted-foreground mt-1">Deixe vazio para ilimitado</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Usos por Cliente</label>
              <input
                type="number"
                min="1"
                value={formData.limite_uso_por_cliente}
                onChange={(e) => setFormData({ ...formData, limite_uso_por_cliente: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                placeholder="1"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de Início *</label>
              <input
                type="datetime-local"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de Fim</label>
              <input
                type="datetime-local"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
              <p className="text-xs text-muted-foreground mt-1">Deixe vazio para sem data de expiração</p>
            </div>
          </div>

          {/* Opções Adicionais */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apenas_primeira_compra"
              checked={formData.apenas_primeira_compra}
              onChange={(e) => setFormData({ ...formData, apenas_primeira_compra: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="apenas_primeira_compra" className="text-sm">
              Válido apenas para primeira compra do cliente
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : cupom ? 'Atualizar' : 'Criar Cupom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CupomCard = ({ cupom, onEdit, onDelete, onToggleAtivo, onViewStats }) => {
  const isExpired = cupom.data_fim && new Date(cupom.data_fim) < new Date();
  const isExpiringSoon = cupom.data_fim && new Date(cupom.data_fim) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getDescontoText = () => {
    if (cupom.tipo_desconto === 'percentual') {
      return `${cupom.valor_desconto}% OFF`;
    } else if (cupom.tipo_desconto === 'valor_fixo') {
      return `R$ ${Number(cupom.valor_desconto).toFixed(2)} OFF`;
    } else {
      return 'FRETE GRÁTIS';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${cupom.ativo ? 'border-border' : 'border-muted bg-muted/20'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-lg text-primary">{cupom.codigo}</span>
            {!cupom.ativo && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">Inativo</span>
            )}
            {isExpired && (
              <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded">Expirado</span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs rounded">Expira em breve</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{cupom.descricao}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-success">{getDescontoText()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Usos:</span>
          <span className="ml-1 font-semibold">
            {cupom.uso_atual || 0}
            {cupom.limite_uso_total ? ` / ${cupom.limite_uso_total}` : ' / ∞'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Por cliente:</span>
          <span className="ml-1 font-semibold">{cupom.limite_uso_por_cliente || '∞'}</span>
        </div>
        {cupom.valor_minimo_pedido > 0 && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Pedido mínimo:</span>
            <span className="ml-1 font-semibold">R$ {Number(cupom.valor_minimo_pedido).toFixed(2)}</span>
          </div>
        )}
        {cupom.data_fim && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Válido até:</span>
            <span className="ml-1 font-semibold">{new Date(cupom.data_fim).toLocaleString('pt-BR')}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggleAtivo(cupom.id, !cupom.ativo)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md ${
            cupom.ativo
              ? 'bg-warning/20 text-warning hover:bg-warning/30'
              : 'bg-success/20 text-success hover:bg-success/30'
          }`}
        >
          {cupom.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button
          onClick={() => onViewStats(cupom)}
          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-secondary"
        >
          📊 Stats
        </button>
        <button
          onClick={() => onEdit(cupom)}
          className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-secondary"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(cupom.id)}
          className="px-3 py-1.5 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10"
        >
          Excluir
        </button>
      </div>
    </div>
  );
};

export default function CuponsManager({ restauranteId }) {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState(null);
  const [filters, setFilters] = useState({ ativo: 'all', tipo_desconto: 'all', search: '' });
  const [statsModal, setStatsModal] = useState(null);
  const [stats, setStats] = useState(null);

  const loadCupons = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        ...(filters.ativo !== 'all' ? { ativo: filters.ativo === 'true' } : {}),
        ...(filters.tipo_desconto !== 'all' ? { tipo_desconto: filters.tipo_desconto } : {}),
        ...(filters.search ? { search: filters.search } : {})
      };

      const data = await cuponsService.fetchCupons(restauranteId, filterParams);
      setCupons(data);
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restauranteId) {
      loadCupons();
    }
  }, [restauranteId, filters]);

  const handleSave = async (payload) => {
    if (editingCupom) {
      await cuponsService.updateCupom(editingCupom.id, payload);
    } else {
      await cuponsService.createCupom(payload);
    }
    loadCupons();
  };

  const handleDelete = async (cupomId) => {
    if (!window.confirm('Deseja realmente excluir este cupom?')) return;

    try {
      await cuponsService.deleteCupom(cupomId);
      loadCupons();
    } catch (err) {
      alert('Erro ao excluir cupom: ' + err.message);
    }
  };

  const handleToggleAtivo = async (cupomId, ativo) => {
    try {
      await cuponsService.toggleCupomAtivo(cupomId, ativo);
      loadCupons();
    } catch (err) {
      alert('Erro ao atualizar cupom: ' + err.message);
    }
  };

  const handleViewStats = async (cupom) => {
    setStatsModal(cupom);
    try {
      const estatisticas = await cuponsService.fetchEstatisticasCupom(cupom.id);
      setStats(estatisticas);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  if (loading && cupons.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Carregando cupons...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">❌ {error}</p>
        <button onClick={loadCupons} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
          <p className="text-sm text-muted-foreground">Crie e gerencie cupons para seus clientes</p>
        </div>
        <button
          onClick={() => {
            setEditingCupom(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + Novo Cupom
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Buscar por código ou descrição..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-border rounded-md"
        />
        <select
          value={filters.ativo}
          onChange={(e) => setFilters({ ...filters, ativo: e.target.value })}
          className="px-3 py-2 border border-border rounded-md"
        >
          <option value="all">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
        <select
          value={filters.tipo_desconto}
          onChange={(e) => setFilters({ ...filters, tipo_desconto: e.target.value })}
          className="px-3 py-2 border border-border rounded-md"
        >
          <option value="all">Todos os tipos</option>
          <option value="percentual">Percentual</option>
          <option value="valor_fixo">Valor Fixo</option>
          <option value="frete_gratis">Frete Grátis</option>
        </select>
      </div>

      {/* Lista de Cupons */}
      {cupons.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-lg mb-2">🎟️ Nenhum cupom encontrado</p>
          <p className="text-sm">Crie seu primeiro cupom para atrair mais clientes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupons.map((cupom) => (
            <CupomCard
              key={cupom.id}
              cupom={cupom}
              onEdit={(c) => {
                setEditingCupom(c);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onToggleAtivo={handleToggleAtivo}
              onViewStats={handleViewStats}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <CupomModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCupom(null);
        }}
        cupom={editingCupom}
        onSave={handleSave}
        restauranteId={restauranteId}
      />

      {/* Modal de Estatísticas */}
      {statsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Estatísticas - {statsModal.codigo}</h3>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Usos:</span>
                  <span className="font-semibold">{stats.totalUsos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto Total Aplicado:</span>
                  <span className="font-semibold text-destructive">R$ {stats.totalDescontoAplicado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total em Vendas:</span>
                  <span className="font-semibold text-success">R$ {stats.totalVendas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Médio:</span>
                  <span className="font-semibold">R$ {stats.ticketMedio.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Carregando...</p>
            )}
            <button
              onClick={() => {
                setStatsModal(null);
                setStats(null);
              }}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
