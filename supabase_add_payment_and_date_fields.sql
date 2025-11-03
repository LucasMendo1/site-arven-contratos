-- ⚠️ MIGRATION OBRIGATÓRIA ⚠️
-- Migration: Adicionar campos de Data de Início e Frequência de Pagamento
-- Data: 03/11/2025
-- 
-- ATENÇÃO: Esta migração adiciona campos críticos para cálculos precisos de MRR
-- e gestão de contratos existentes.
-- 
-- Como executar:
-- 1. Copie todo o conteúdo deste arquivo
-- 2. Acesse Supabase Dashboard > SQL Editor
-- 3. Cole o código e clique em "Run"
-- 
-- Novos campos:
-- - start_date: Data real de início do contrato (não a data de cadastro)
-- - payment_frequency: Frequência de pagamento (mensal, trimestral, etc)

-- Adicionar coluna start_date (Data de Início do Contrato)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

-- Adicionar coluna payment_frequency (Frequência de Pagamento)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS payment_frequency TEXT;

-- Para contratos existentes, usar submitted_at como start_date inicial
UPDATE contracts 
SET start_date = submitted_at 
WHERE start_date IS NULL;

-- Para contratos existentes, assumir pagamento mensal como padrão
UPDATE contracts 
SET payment_frequency = 'monthly' 
WHERE payment_frequency IS NULL;

-- Agora tornar as colunas NOT NULL
ALTER TABLE contracts 
ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE contracts 
ALTER COLUMN payment_frequency SET NOT NULL;

-- Criar constraint para validar valores de payment_frequency
ALTER TABLE contracts 
ADD CONSTRAINT payment_frequency_check 
CHECK (payment_frequency IN ('monthly', 'quarterly', 'biannual', 'annual', 'one_time'));

-- Comentários para documentação
COMMENT ON COLUMN contracts.start_date IS 'Data real de início do contrato (não a data de cadastro no sistema)';
COMMENT ON COLUMN contracts.payment_frequency IS 'Frequência de pagamento: monthly (mensal), quarterly (trimestral), biannual (semestral), annual (anual), one_time (à vista)';
