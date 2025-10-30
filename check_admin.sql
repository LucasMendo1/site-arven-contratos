-- Execute esta query no Supabase SQL Editor para verificar se o admin existe

SELECT 
  email,
  created_at,
  LENGTH(password) as password_length,
  SUBSTRING(password, 1, 7) as password_prefix
FROM users 
WHERE email = 'admin@arven.com';

-- Se esta query retornar 0 linhas, o usuário não foi criado
-- Se retornar 1 linha, o admin existe e você verá:
--   - email: admin@arven.com
--   - created_at: data de criação
--   - password_length: deve ser 60 (tamanho do hash bcrypt)
--   - password_prefix: deve começar com $2b$10$
