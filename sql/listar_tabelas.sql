-- listar_tabelas.sql
-- Script para listar todas as tabelas no schema public
-- Execute no painel SQL do Supabase

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;