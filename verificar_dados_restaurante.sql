-- =====================================================
-- VERIFICAR DADOS DO RESTAURANTE
-- =====================================================

-- 1. Ver dados em restaurantes_app
SELECT 
    id,
    nome_fantasia,
    tipo_restaurante,
    cnpj,
    telefone,
    email,
    nome_responsavel,
    rua,
    numero,
    bairro,
    cidade,
    complemento,
    latitude,
    longitude
FROM restaurantes_app
WHERE email = 'americangba@yopmail.com'; -- Substitua pelo seu email

-- 2. Ver dados em profiles
SELECT 
    id,
    email,
    tipo_usuario,
    created_at
FROM profiles
WHERE email = 'americangba@yopmail.com'; -- Substitua pelo seu email

-- 3. Verificar se os IDs são iguais
SELECT 
    'profiles' as tabela,
    id,
    email
FROM profiles
WHERE email = 'americangba@yopmail.com'
UNION ALL
SELECT 
    'restaurantes_app' as tabela,
    id,
    email
FROM restaurantes_app
WHERE email = 'americangba@yopmail.com';
