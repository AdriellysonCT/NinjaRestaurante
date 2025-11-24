-- ============================================
-- ADICIONAR COLUNA restaurante_id NAS TABELAS
-- ============================================
-- Execute este script se as tabelas já existem mas não têm a coluna restaurante_id

-- 1. Adicionar coluna restaurante_id na tabela complementos (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complementos' AND column_name = 'restaurante_id'
    ) THEN
        ALTER TABLE complementos 
        ADD COLUMN restaurante_id UUID;
        
        RAISE NOTICE 'Coluna restaurante_id adicionada na tabela complementos';
    ELSE
        RAISE NOTICE 'Coluna restaurante_id já existe na tabela complementos';
    END IF;
END $$;

-- 2. Adicionar coluna restaurante_id na tabela grupos_complementos (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grupos_complementos' AND column_name = 'restaurante_id'
    ) THEN
        ALTER TABLE grupos_complementos 
        ADD COLUMN restaurante_id UUID;
        
        RAISE NOTICE 'Coluna restaurante_id adicionada na tabela grupos_complementos';
    ELSE
        RAISE NOTICE 'Coluna restaurante_id já existe na tabela grupos_complementos';
    END IF;
END $$;

-- 3. Adicionar foreign key para restaurantes (se a tabela restaurantes existir)
-- Primeiro, vamos verificar qual é o nome correto da tabela de restaurantes

-- Opção A: Se a tabela se chama 'restaurantes'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurantes') THEN
        -- Adicionar FK em complementos
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'complementos_restaurante_id_fkey'
        ) THEN
            ALTER TABLE complementos 
            ADD CONSTRAINT complementos_restaurante_id_fkey 
            FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key adicionada em complementos → restaurantes';
        END IF;
        
        -- Adicionar FK em grupos_complementos
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'grupos_complementos_restaurante_id_fkey'
        ) THEN
            ALTER TABLE grupos_complementos 
            ADD CONSTRAINT grupos_complementos_restaurante_id_fkey 
            FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key adicionada em grupos_complementos → restaurantes';
        END IF;
    END IF;
END $$;

-- Opção B: Se a tabela se chama 'restaurantes_app'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurantes_app') THEN
        -- Adicionar FK em complementos
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'complementos_restaurante_app_id_fkey'
        ) THEN
            ALTER TABLE complementos 
            ADD CONSTRAINT complementos_restaurante_app_id_fkey 
            FOREIGN KEY (restaurante_id) REFERENCES restaurantes_app(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key adicionada em complementos → restaurantes_app';
        END IF;
        
        -- Adicionar FK em grupos_complementos
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'grupos_complementos_restaurante_app_id_fkey'
        ) THEN
            ALTER TABLE grupos_complementos 
            ADD CONSTRAINT grupos_complementos_restaurante_app_id_fkey 
            FOREIGN KEY (restaurante_id) REFERENCES restaurantes_app(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key adicionada em grupos_complementos → restaurantes_app';
        END IF;
    END IF;
END $$;

-- 4. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_complementos_restaurante_id ON complementos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_grupos_complementos_restaurante_id ON grupos_complementos(restaurante_id);

-- 5. Atualizar registros existentes com um restaurante_id padrão (OPCIONAL)
-- ATENÇÃO: Só execute isso se você tiver registros sem restaurante_id e souber qual ID usar

-- Exemplo: Atualizar todos os registros para usar o primeiro restaurante
-- DESCOMENTE E AJUSTE SE NECESSÁRIO:

/*
DO $$ 
DECLARE
    primeiro_restaurante_id UUID;
BEGIN
    -- Buscar o primeiro restaurante (ajuste conforme sua tabela)
    SELECT id INTO primeiro_restaurante_id 
    FROM restaurantes 
    LIMIT 1;
    
    -- OU se sua tabela se chama restaurantes_app:
    -- SELECT id INTO primeiro_restaurante_id 
    -- FROM restaurantes_app 
    -- LIMIT 1;
    
    IF primeiro_restaurante_id IS NOT NULL THEN
        -- Atualizar complementos sem restaurante_id
        UPDATE complementos 
        SET restaurante_id = primeiro_restaurante_id 
        WHERE restaurante_id IS NULL;
        
        -- Atualizar grupos sem restaurante_id
        UPDATE grupos_complementos 
        SET restaurante_id = primeiro_restaurante_id 
        WHERE restaurante_id IS NULL;
        
        RAISE NOTICE 'Registros atualizados com restaurante_id: %', primeiro_restaurante_id;
    END IF;
END $$;
*/

-- 6. Tornar a coluna NOT NULL (OPCIONAL - só depois de preencher todos os registros)
-- DESCOMENTE QUANDO TODOS OS REGISTROS TIVEREM restaurante_id:

/*
ALTER TABLE complementos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE grupos_complementos ALTER COLUMN restaurante_id SET NOT NULL;
*/

-- 7. Verificar resultado
SELECT 
    'complementos' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'complementos' AND column_name = 'restaurante_id'

UNION ALL

SELECT 
    'grupos_complementos' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'grupos_complementos' AND column_name = 'restaurante_id';

-- 8. Verificar foreign keys
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('complementos', 'grupos_complementos')
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'restaurante_id';
