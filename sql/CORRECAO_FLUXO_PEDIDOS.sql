-- CORREÇÃO CRÍTICA DO FLUXO DE PEDIDOS
-- Remove triggers duplicados e que criam entregas prematuramente

-- 1. Remover trigger que cria entrega imediatamente no INSERT do pedido (CAUSA RAIZ DO PROBLEMA)
DROP TRIGGER IF EXISTS trigger_copiar_pedido_padronizado ON pedidos_padronizados;
DROP FUNCTION IF EXISTS copiar_pedido_padronizado_para_entrega();

-- 2. Remover outros triggers potencialmente conflitantes ou redundantes
-- Mantenha apenas 'criar_entrega_automatica' se for o correto (baseado na análise, ele usa 'copiar_pedido_para_entregas' e verifica 'pronto_para_entrega')
-- Se 'trg_sincronizar_pedido_para_entrega' também existir e fizer o mesmo, remova-o.
DROP TRIGGER IF EXISTS trg_sincronizar_pedido_para_entrega ON pedidos_padronizados;
-- (Opcional) DROP FUNCTION IF EXISTS sincronizar_pedido_para_entrega(); -- Se não for usado por outras coisas

-- 3. Adicionar coluna faltante 'nome_entregador' em pedidos_padronizados para evitar erros na sincronização de volta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos_padronizados' AND column_name = 'nome_entregador') THEN
        ALTER TABLE pedidos_padronizados ADD COLUMN nome_entregador TEXT;
        RAISE NOTICE 'Coluna nome_entregador adicionada com sucesso.';
    END IF;
END $$;

-- 4. Garantir que o trigger de criação correta (no 'pronto_para_entrega') esteja ativo
-- A função 'copiar_pedido_para_entregas' (usada por 'criar_entrega_automatica') parece correta.
-- Vamos recriar o trigger para garantir.

DROP TRIGGER IF EXISTS criar_entrega_automatica ON pedidos_padronizados;
CREATE TRIGGER criar_entrega_automatica
  AFTER UPDATE OF status ON pedidos_padronizados
  FOR EACH ROW
  EXECUTE FUNCTION copiar_pedido_para_entregas();

-- 5. Atualizar função de sincronização de volta (Entrega -> Pedido) para ser robusta
-- Certifica-se que ela existe e lida corretamente com as colunas
CREATE OR REPLACE FUNCTION sync_entrega_para_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_status TEXT;
  v_pedido_entregador UUID;
BEGIN
  IF NEW.id_pedido IS NULL THEN RETURN NEW; END IF;

  SELECT status, id_entregador 
  INTO v_pedido_status, v_pedido_entregador
  FROM pedidos_padronizados 
  WHERE id = NEW.id_pedido;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Sincronizar status relevantes: aceito, coletado, concluido
  -- E sincronizar id_entregador/nome_entregador
  IF (NEW.status IN ('aceito', 'coletado', 'concluido', 'cancelado')) THEN
      UPDATE pedidos_padronizados 
      SET 
        status = CASE 
            WHEN NEW.status = 'aceito' AND status != 'aceito' THEN 'aceito'
            WHEN NEW.status = 'coletado' AND status != 'coletado' THEN 'coletado'
            WHEN NEW.status = 'concluido' AND status != 'concluido' THEN 'concluido'
            WHEN NEW.status = 'cancelado' AND status != 'cancelado' THEN 'cancelado'
            ELSE status
        END,
        id_entregador = COALESCE(NEW.id_entregador, id_entregador),
        nome_entregador = COALESCE(NEW.nome_entregador, nome_entregador), -- Agora a coluna existe
        atualizado_em = NOW()
      WHERE id = NEW.id_pedido;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger de sync volta
DROP TRIGGER IF EXISTS trg_sync_entrega_para_pedido ON entregas_padronizadas;
CREATE TRIGGER trg_sync_entrega_para_pedido
  AFTER INSERT OR UPDATE OF status, id_entregador, nome_entregador
  ON entregas_padronizadas
  FOR EACH ROW
  EXECUTE FUNCTION sync_entrega_para_pedido();
