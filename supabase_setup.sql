-- =====================================================
-- ARVEN Contract System - Database Setup
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- 
-- IMPORTANTE: Este script irá RECRIAR as tabelas
-- Se você já tem dados, faça backup antes!
-- =====================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Enable all access for service role" ON contracts;
DROP POLICY IF EXISTS "Enable all access for service role" ON webhook_config;

-- Remover tabelas existentes (use com cuidado!)
-- Descomente as linhas abaixo apenas se quiser começar do zero
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;
-- DROP TABLE IF EXISTS webhook_config CASCADE;

-- =====================================================
-- CRIAR TABELAS
-- =====================================================

-- Tabela de usuários administrativos
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  contract_duration TEXT NOT NULL,
  product TEXT NOT NULL,
  ticket_value TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de configuração de webhook
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_active TEXT NOT NULL DEFAULT 'true',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INSERIR USUÁRIO ADMIN INICIAL
-- =====================================================
-- Email: admin@arven.com
-- Senha: admin123
-- IMPORTANTE: Mude esta senha após o primeiro login!

INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$YQ8JxvVxGV3hZr.qZk5LKOtB7VlqXrJ5PgFqCGdM8nFjDxSH.0Yp.')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CRIAR ÍNDICES (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
-- NOTA: Esta política permite acesso total via service role (backend)
CREATE POLICY "Allow service role full access to users" 
  ON users FOR ALL 
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to contracts" 
  ON contracts FOR ALL 
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to webhook_config" 
  ON webhook_config FOR ALL 
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute estas queries para verificar se tudo está OK:

-- SELECT * FROM users;
-- SELECT * FROM contracts;
-- SELECT * FROM webhook_config;
