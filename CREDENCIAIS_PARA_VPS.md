# 🔑 Credenciais para Copiar para o VPS

## ⚠️ IMPORTANTE: Copie estas informações antes de fazer deploy!

---

## 1️⃣ Variáveis de Ambiente Supabase

Acesse: https://app.supabase.com → Seu Projeto → Settings → API

```env
SUPABASE_URL=sua-url-aqui
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

**Onde encontrar:**
- SUPABASE_URL: Settings → API → Project URL
- SUPABASE_ANON_KEY: Settings → API → Project API keys → anon/public
- SUPABASE_SERVICE_ROLE_KEY: Settings → API → Project API keys → service_role (⚠️ SECRETA!)

---

## 2️⃣ Object Storage (Replit)

Se estiver usando Replit Object Storage, você tem 3 opções:

### Opção A: Migrar para Supabase Storage (RECOMENDADO)
1. No Supabase Dashboard → Storage
2. Crie bucket `arven-contracts`
3. Configure políticas públicas
4. No VPS, use biblioteca `@supabase/storage-js`

### Opção B: Usar Google Cloud Storage
1. Crie projeto no Google Cloud
2. Ative Cloud Storage API
3. Crie bucket
4. Configure service account e baixe JSON
5. Use `@google-cloud/storage` no VPS

### Opção C: Armazenamento Local (Desenvolvimento)
```env
# Armazenar PDFs localmente no VPS
PRIVATE_OBJECT_DIR=/var/www/arven/uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=/var/www/arven/uploads/public
```

⚠️ Não recomendado para produção!

---

## 3️⃣ Session Secret

Gere uma string aleatória segura:

```bash
# No seu computador ou VPS, execute:
openssl rand -hex 32
```

Copie o resultado para:
```env
SESSION_SECRET=resultado-aqui
```

---

## 4️⃣ Hash da Senha Admin

Para criar o usuário admin no Supabase, você precisa do hash da senha.

**No Replit (ou localmente):**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (e,h) => console.log(h));"
```

Copie o hash gerado (algo como `$2b$10$...`)

**Use no SQL do Supabase:**
```sql
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', 'COLE-O-HASH-AQUI')
ON CONFLICT (email) DO NOTHING;
```

---

## 5️⃣ Arquivo .env Completo para o VPS

Crie este arquivo no VPS em `/var/www/arven/.env`:

```env
# Environment
NODE_ENV=production

# Server
PORT=5000

# Session
SESSION_SECRET=gere-uma-string-aleatoria-com-openssl-rand-hex-32

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Object Storage - Escolha UMA opção:

# OPÇÃO 1: Supabase Storage (recomendado)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=arven-contracts
PRIVATE_OBJECT_DIR=supabase://arven-contracts/private
PUBLIC_OBJECT_SEARCH_PATHS=supabase://arven-contracts/public

# OPÇÃO 2: Google Cloud Storage
# DEFAULT_OBJECT_STORAGE_BUCKET_ID=seu-bucket-gcs
# PRIVATE_OBJECT_DIR=gs://seu-bucket/private
# PUBLIC_OBJECT_SEARCH_PATHS=gs://seu-bucket/public
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# OPÇÃO 3: Local (apenas dev/testes)
# PRIVATE_OBJECT_DIR=/var/www/arven/uploads/private
# PUBLIC_OBJECT_SEARCH_PATHS=/var/www/arven/uploads/public
```

---

## 6️⃣ Comandos SQL para Executar no Supabase

Execute no Supabase SQL Editor (Database → SQL Editor):

```sql
-- 1. Criar tabelas
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  contract_duration TEXT NOT NULL,
  product TEXT NOT NULL,
  ticket_value TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_active TEXT DEFAULT 'true',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir admin (TROQUE o hash pela senha gerada)
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$COLE_SEU_HASH_AQUI')
ON CONFLICT (email) DO NOTHING;

-- 3. Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas (permitir tudo via service_role)
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON webhook_config FOR ALL USING (true);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 7️⃣ Preparar Código para Upload

### Arquivos que DEVEM ser enviados ao VPS:
```
✅ package.json
✅ package-lock.json (ou yarn.lock)
✅ tsconfig.json
✅ vite.config.ts
✅ tailwind.config.ts
✅ postcss.config.js
✅ server/ (toda a pasta)
✅ client/ (toda a pasta)
✅ shared/ (toda a pasta)
```

### Arquivos que NÃO devem ser enviados:
```
❌ node_modules/ (instalar no VPS)
❌ .env (criar novo no VPS)
❌ client/dist/ (buildar no VPS)
❌ .git/ (opcional)
```

---

## 8️⃣ Checklist Antes de Instalar no VPS

- [ ] Copiei SUPABASE_URL
- [ ] Copiei SUPABASE_ANON_KEY
- [ ] Copiei SUPABASE_SERVICE_ROLE_KEY
- [ ] Gerei SESSION_SECRET aleatório
- [ ] Executei SQL no Supabase (tabelas criadas)
- [ ] Gerei hash da senha admin
- [ ] Inseri usuário admin no Supabase
- [ ] Escolhi solução de Object Storage
- [ ] Preparei código para upload (sem node_modules)
- [ ] Tenho acesso SSH ao VPS
- [ ] Domínio está apontado para o VPS

---

## 9️⃣ Testar Conexão Supabase

Antes de fazer deploy, teste se as credenciais estão corretas:

```javascript
// test-supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'SUA_SUPABASE_URL',
  'SUA_SUPABASE_ANON_KEY'
);

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Conexão OK!', data);
  }
}

test();
```

Execute: `node test-supabase.js`

---

## 🔟 Configurar DNS (Apontar Domínio)

No painel do seu domínio (Hostinger ou outro):

1. Acesse **Gerenciador de DNS**
2. Adicione/Edite registro **A**:
   - Host: `@` (ou deixe vazio)
   - Aponta para: `IP_DO_SEU_VPS`
   - TTL: 3600

3. Adicione registro **A** para www:
   - Host: `www`
   - Aponta para: `IP_DO_SEU_VPS`
   - TTL: 3600

4. Aguarde propagação (5min - 24h)

---

## 📞 Informações de Suporte

- **Supabase Dashboard**: https://app.supabase.com
- **Documentação Supabase Storage**: https://supabase.com/docs/guides/storage
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Docs**: https://nginx.org/en/docs/

---

**✅ Com estas informações, você está pronto para instalar no VPS!**

Siga o guia `DEPLOY_VPS.md` passo a passo.
