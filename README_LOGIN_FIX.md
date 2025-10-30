# 🔧 Como Resolver Problema de Login do Admin

## Problema
O login está retornando **401 Invalid credentials** quando você tenta entrar com `admin@arven.com` / `admin123`.

## Causa
O usuário admin provavelmente não foi criado corretamente no banco de dados Supabase, ou o hash da senha está incorreto.

---

## ✅ Solução: Executar SQL de Correção

### Opção 1: Usar o Script de Fix (RECOMENDADO)

1. **Abra o Supabase** → Seu projeto → **SQL Editor**
2. **Abra o arquivo** `fix_admin_user.sql` no Replit
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. **Clique em Run** (ou Ctrl+Enter)

Este script vai:
- ✅ Deletar o usuário admin antigo (se existir)
- ✅ Criar um novo usuário admin com hash correto
- ✅ Verificar se funcionou

---

### Opção 2: Script Manual (se Option 1 falhar)

Execute estes comandos **UM POR VEZ** no Supabase SQL Editor:

```sql
-- 1. Deletar admin antigo
DELETE FROM users WHERE email = 'admin@arven.com';
```

```sql
-- 2. Criar novo admin
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$WO1EifWUFtsUmChe0cj2DOeVItS/LKXfsOiu9/ate62eMbMmkNd8S');
```

```sql
-- 3. Verificar
SELECT email, created_at FROM users WHERE email = 'admin@arven.com';
```

---

## 🧪 Como Testar se Funcionou

### 1. Verificar no Supabase
No **Table Editor** do Supabase:
- Vá para a tabela `users`
- Deve ter **1 linha** com email `admin@arven.com`
- O campo `password` deve ter 60 caracteres começando com `$2b$10$`

### 2. Testar Login na Aplicação
1. Acesse a aplicação Replit
2. Vá para `/login`
3. Entre com:
   - **Email:** `admin@arven.com`
   - **Senha:** `admin123`
4. Você deve ser redirecionado para `/admin` ✅

---

## 🔍 Como Verificar o que Está Acontecendo

Com os novos logs adicionados, você pode ver no **console do servidor** (Replit) o que acontece quando tenta fazer login:

```
🔐 Login attempt: { email: 'admin@arven.com', passwordLength: 8 }
🔍 Looking for user: admin@arven.com
👤 User found, verifying password...
🔑 Password valid: true
✅ Login successful for: admin@arven.com
```

Se ver `❌ User not found in database`, significa que o usuário não foi criado no Supabase.

---

## 📋 Checklist de Troubleshooting

- [ ] Executei o SQL setup no Supabase (`supabase_setup.sql`)
- [ ] A tabela `users` existe no Supabase
- [ ] Existe 1 linha com email `admin@arven.com`
- [ ] O hash da senha tem 60 caracteres e começa com `$2b$10$`
- [ ] As credenciais do Supabase estão corretas em `.env` ou Secrets

---

## 🆘 Ainda Não Funciona?

Se depois de executar o `fix_admin_user.sql` ainda não funcionar:

1. **Verifique os Secrets/Env do Replit:**
   - Certifique-se que `SUPABASE_URL` está correto
   - Certifique-se que `SUPABASE_SERVICE_ROLE_KEY` está correto

2. **Veja os logs do servidor:**
   - No Replit, abra o Console
   - Tente fazer login
   - Veja se aparece `❌ User not found` ou `🔑 Password valid: false`

3. **Execute esta query no Supabase para debug:**
   ```sql
   SELECT * FROM users;
   ```
   Deve mostrar o admin.

---

**Após executar o fix, tente fazer login novamente!** 🚀
