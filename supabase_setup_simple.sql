-- =====================================================
-- ARVEN - Versão SIMPLIFICADA (Use se a versão completa der erro)
-- =====================================================
-- Execute este SQL passo a passo no Supabase SQL Editor
-- Copie e execute CADA BLOCO SEPARADAMENTE
-- =====================================================

-- BLOCO 1: Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- BLOCO 2: Criar tabela de contratos
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

-- BLOCO 3: Criar tabela de webhook
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_active TEXT NOT NULL DEFAULT 'true',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- BLOCO 4: Inserir admin (senha: admin123)
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$YQ8JxvVxGV3hZr.qZk5LKOtB7VlqXrJ5PgFqCGdM8nFjDxSH.0Yp.')
ON CONFLICT (email) DO NOTHING;

-- BLOCO 5: Criar índices
CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
