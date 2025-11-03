-- ⚠️ MIGRATION OBRIGATÓRIA ⚠️
-- Migration: Adicionar campos de Razão Social e CPF/CNPJ
-- Data: 03/11/2025
-- 
-- ATENÇÃO: Se você já tinha o sistema rodando, VOCÊ DEVE executar esta migração
-- para adicionar os novos campos obrigatórios à tabela de contratos.
-- 
-- Como executar:
-- 1. Copie todo o conteúdo deste arquivo
-- 2. Acesse Supabase Dashboard > SQL Editor
-- 3. Cole o código e clique em "Run"
-- 
-- Sem esta migração, o sistema irá falhar ao criar novos contratos!

-- Adicionar coluna company_name (Razão Social)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Adicionar coluna document (CPF/CNPJ)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS document TEXT;

-- Tornar as colunas obrigatórias após adicionar valores padrão
-- Para contratos existentes, usar o nome do cliente como razão social temporária
UPDATE contracts 
SET company_name = client_name 
WHERE company_name IS NULL;

UPDATE contracts 
SET document = '000.000.000-00' 
WHERE document IS NULL;

-- Agora tornar as colunas NOT NULL
ALTER TABLE contracts 
ALTER COLUMN company_name SET NOT NULL;

ALTER TABLE contracts 
ALTER COLUMN document SET NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN contracts.company_name IS 'Razão Social da empresa do cliente';
COMMENT ON COLUMN contracts.document IS 'CPF ou CNPJ do cliente';
