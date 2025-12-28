-- ============================================
-- CORREÇÃO URGENTE: FOREIGN KEYS INCORRETAS
-- ============================================
-- Problema: itens_cardapio.id_restaurante aponta para restaurantes_app.id
-- Solução: Deve apontar para auth.users.id (user_id)

-- 1. DIAGNÓSTICO INICIAL
SELECT 
    '1️⃣ ESTRUTURA ATUAL' as etapa,
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('itens_cardapio', 'restaurantes_horarios');

-- 2. VERIFICAR DADOS EXISTENTES
SELECT 
    '2️⃣ DADOS ATUAIS' as etapa,
    ic.id,
    ic.nome,
    ic.id_restaurante,
    r.id as restaurante_app_id,
    r.user_id,
    r.nome_fantasia
FROM itens_cardapio ic
LEFT JOIN restaurantes_app r ON r.id = ic.id_restaurante
LIMIT 10;

-- 3. REMOVER FOREIGN KEY ANTIGA DE ITENS_CARDAPIO
ALTER TABLE itens_cardapio 
DROP CONSTRAINT IF EXISTS itens_cardapio_id_restaurante_fkey;

ALTER TABLE itens_cardapio 
DROP CONSTRAINT IF EXISTS fk_itens_cardapio_restaurante;

SELECT '✅ Foreign keys antigas removidas de itens_cardapio' as status;

-- 4. ATUALIZAR DADOS: Trocar restaurantes_app.id por user_id
UPDATE itens_cardapio ic
SET id_restaurante = r.user_id
FROM restaurantes_app r
WHERE ic.id_restaurante = r.id
  AND ic.id_restaurante != r.user_id;  -- Só atualizar se forem diferentes

SELECT '✅ Dados de itens_cardapio atualizados para usar user_id' as status;

-- 5. VERIFICAR SE HÁ ITENS ÓRFÃOS
SELECT 
    '3️⃣ VERIFICAÇÃO PÓS-UPDATE' as etapa,
    COUNT(*) as total_itens,
    COUNT(CASE WHEN id_restaurante IS NULL THEN 1 END) as itens_sem_restaurante,
    COUNT(CASE WHEN id_restaurante IS NOT NULL THEN 1 END) as itens_com_restaurante
FROM itens_cardapio;

-- 6. CRIAR NOVA FOREIGN KEY CORRETA (OPCIONAL - pode causar problemas com RLS)
-- Comentado por segurança - só descomente se realmente precisar
/*
ALTER TABLE itens_cardapio
ADD CONSTRAINT fk_itens_cardapio_user
FOREIGN KEY (id_restaurante) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
*/

SELECT '⚠️ Foreign key NÃO foi recriada (por segurança com RLS)' as aviso;

-- 7. FAZER O MESMO PARA RESTAURANTES_HORARIOS
SELECT 
    '4️⃣ VERIFICANDO RESTAURANTES_HORARIOS' as etapa,
    rh.id,
    rh.dia_semana,
    rh.restaurante_id,
    r.id as restaurante_app_id,
    r.user_id,
    r.nome_fantasia
FROM restaurantes_horarios rh
LEFT JOIN restaurantes_app r ON r.id = rh.restaurante_id
LIMIT 10;

-- Remover FK antiga
ALTER TABLE restaurantes_horarios 
DROP CONSTRAINT IF EXISTS restaurantes_horarios_restaurante_id_fkey;

ALTER TABLE restaurantes_horarios 
DROP CONSTRAINT IF EXISTS fk_restaurantes_horarios_restaurante;

SELECT '✅ Foreign keys antigas removidas de restaurantes_horarios' as status;

-- Atualizar dados
UPDATE restaurantes_horarios rh
SET restaurante_id = r.user_id
FROM restaurantes_app r
WHERE rh.restaurante_id = r.id
  AND rh.restaurante_id != r.user_id;

SELECT '✅ Dados de restaurantes_horarios atualizados para usar user_id' as status;

-- 8. VERIFICAÇÃO FINAL
SELECT 
    '5️⃣ VERIFICAÇÃO FINAL' as etapa,
    'itens_cardapio' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id_restaurante) as restaurantes_unicos
FROM itens_cardapio
UNION ALL
SELECT 
    '5️⃣ VERIFICAÇÃO FINAL' as etapa,
    'restaurantes_horarios' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT restaurante_id) as restaurantes_unicos
FROM restaurantes_horarios;

-- 9. TESTAR SE OS IDs AGORA SÃO USER_IDS
SELECT 
    '6️⃣ TESTE DE VALIDAÇÃO' as etapa,
    ic.id_restaurante,
    u.email,
    r.nome_fantasia,
    COUNT(ic.id) as total_itens
FROM itens_cardapio ic
LEFT JOIN auth.users u ON u.id = ic.id_restaurante
LEFT JOIN restaurantes_app r ON r.user_id = ic.id_restaurante
GROUP BY ic.id_restaurante, u.email, r.nome_fantasia;

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 
    '7️⃣ POLÍTICAS RLS' as etapa,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ Usa auth.uid()'
        ELSE '⚠️ NÃO usa auth.uid()'
    END as status_filtro
FROM pg_policies
WHERE tablename IN ('itens_cardapio', 'restaurantes_horarios')
ORDER BY tablename, cmd;

SELECT '
╔════════════════════════════════════════════════════════════╗
║  ✅ CORREÇÃO DE FOREIGN KEYS CONCLUÍDA!                   ║
║                                                            ║
║  Agora:                                                    ║
║  - itens_cardapio.id_restaurante = auth.users.id          ║
║  - restaurantes_horarios.restaurante_id = auth.users.id   ║
║                                                            ║
║  Próximo passo:                                           ║
║  1. Execute LIMPAR_RLS_ITENS_CARDAPIO.sql                ║
║  2. Faça logout e login novamente                         ║
║  3. Teste o cardápio e horários                           ║
╚════════════════════════════════════════════════════════════╝
' as resultado;
