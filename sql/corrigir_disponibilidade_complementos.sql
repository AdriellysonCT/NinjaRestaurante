-- Script para verificar e corrigir a disponibilidade dos complementos

-- 1. Ver o estado atual dos complementos
SELECT 
    id,
    nome,
    preco,
    disponivel,
    created_at
FROM complementos
ORDER BY nome;

-- 2. Ativar TODOS os complementos (marcar como disponível)
UPDATE complementos 
SET disponivel = true
WHERE disponivel = false OR disponivel IS NULL;

-- 3. Verificar se foi atualizado
SELECT 
    id,
    nome,
    preco,
    disponivel,
    'Atualizado!' as status
FROM complementos
ORDER BY nome;

-- 4. Contar quantos foram atualizados
SELECT 
    COUNT(*) FILTER (WHERE disponivel = true) as disponiveis,
    COUNT(*) FILTER (WHERE disponivel = false) as indisponiveis,
    COUNT(*) as total
FROM complementos;
