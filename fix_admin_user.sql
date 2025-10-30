-- =====================================================
-- FIX: Recriar usuário admin com senha correta
-- =====================================================
-- Execute este SQL no Supabase para corrigir o login
-- =====================================================

-- PASSO 1: Deletar usuário admin antigo (se existir)
DELETE FROM users WHERE email = 'admin@arven.com';

-- PASSO 2: Inserir novo usuário admin com hash bcrypt correto
-- Email: admin@arven.com
-- Senha: admin123
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$WO1EifWUFtsUmChe0cj2DOeVItS/LKXfsOiu9/ate62eMbMmkNd8S');

-- PASSO 3: Verificar se funcionou
SELECT 
  id,
  email,
  created_at,
  LENGTH(password) as password_hash_length,
  SUBSTRING(password, 1, 10) as password_prefix
FROM users 
WHERE email = 'admin@arven.com';

-- RESULTADO ESPERADO:
-- Deve mostrar 1 linha com:
--   - email: admin@arven.com
--   - password_hash_length: 60
--   - password_prefix: $2b$10$WO1
