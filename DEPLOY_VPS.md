# 🚀 Guia de Deploy - VPS

## Pré-requisitos

### No seu VPS:
- Ubuntu 20.04+ ou similar
- Node.js 18+
- npm ou yarn
- PM2 (gerenciador de processos)
- Nginx (reverse proxy)

---

## 📦 Passo 1: Preparar o Código

### 1.1 Baixar o Código
```bash
# Opção A: Via Git (se tiver repositório)
git clone https://github.com/seu-usuario/arven-contratos.git
cd arven-contratos

# Opção B: Upload manual via FTP/SCP
# Faça upload de todos os arquivos do projeto
```

### 1.2 Instalar Dependências
```bash
# Instalar dependências
npm install

# Ou se preferir yarn
yarn install
```

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Cole o seguinte conteúdo (ajuste os valores):

```env
# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000

# Sessão
SESSION_SECRET=troque-por-uma-string-super-segura-aleatoria-aqui

# Supabase (copie do Replit ou do Supabase Dashboard)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Object Storage (Replit ou GCS)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=seu-bucket-id
PRIVATE_OBJECT_DIR=gs://seu-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=gs://seu-bucket/public
```

**⚠️ IMPORTANTE:** 
- Troque `SESSION_SECRET` por algo aleatório (ex: `openssl rand -hex 32`)
- Copie as credenciais Supabase do seu projeto
- Configure Object Storage (veja seção abaixo)

Salve com `Ctrl+O`, Enter, `Ctrl+X`

---

## 🗄️ Passo 3: Configurar Object Storage

### Opção A: Usar Supabase Storage (RECOMENDADO)

1. No Supabase Dashboard → Storage
2. Crie um bucket chamado `arven-contracts`
3. Configure políticas públicas para downloads
4. Atualize `.env`:

```env
# Use Supabase Storage
PRIVATE_OBJECT_DIR=supabase://arven-contracts/private
PUBLIC_OBJECT_SEARCH_PATHS=supabase://arven-contracts/public
```

### Opção B: Usar Google Cloud Storage

1. Crie projeto no Google Cloud
2. Ative Cloud Storage API
3. Crie bucket
4. Baixe credenciais JSON
5. Configure conforme documentação GCS

---

## 🏗️ Passo 4: Build da Aplicação

```bash
# Build do frontend React
npm run build

# Isso cria a pasta client/dist com arquivos otimizados
```

---

## 🔐 Passo 5: Configurar Banco de Dados Supabase

No Supabase SQL Editor, execute (se ainda não executou):

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configuração webhook
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_active TEXT DEFAULT 'true',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário admin
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$YourHashedPasswordHere')
ON CONFLICT (email) DO NOTHING;

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Para gerar hash da senha admin:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (e,h) => console.log(h));"
```

Copie o hash gerado e substitua na query acima.

---

## 🚀 Passo 6: Instalar PM2 e Iniciar

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação com PM2
pm2 start npm --name "arven" -- run start

# Ou se tiver script específico:
pm2 start server/index.ts --name "arven" --interpreter tsx

# Ver logs
pm2 logs arven

# Ver status
pm2 status

# Configurar auto-restart no boot
pm2 startup
pm2 save
```

---

## 🌐 Passo 7: Configurar Nginx

### 7.1 Instalar Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 7.2 Criar Configuração
```bash
sudo nano /etc/nginx/sites-available/arven
```

Cole:

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Logs
    access_log /var/log/nginx/arven_access.log;
    error_log /var/log/nginx/arven_error.log;

    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Upload de arquivos grandes (PDFs)
    client_max_body_size 50M;
}
```

### 7.3 Ativar Site
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/arven /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Passo 8: Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada
# Testar renovação:
sudo certbot renew --dry-run
```

---

## 🔥 Passo 9: Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## 📊 Passo 10: Verificar Instalação

### 10.1 Testar Backend
```bash
curl http://localhost:5000/api/auth/me
# Deve retornar erro 401 (sem autenticação)
```

### 10.2 Testar Via Domínio
```
https://seudominio.com
```

Deve carregar a landing page do ARVEN!

### 10.3 Fazer Login
1. Acesse `https://seudominio.com/login`
2. Email: `admin@arven.com`
3. Senha: `admin123` (ou a que você configurou)
4. Deve redirecionar para `/admin`

---

## 🛠️ Comandos Úteis PM2

```bash
# Ver logs em tempo real
pm2 logs arven

# Reiniciar aplicação
pm2 restart arven

# Parar aplicação
pm2 stop arven

# Remover aplicação
pm2 delete arven

# Listar aplicações
pm2 list

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save

# Ver detalhes
pm2 show arven
```

---

## 🔍 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
pm2 restart arven
```

### Erro: Porta 5000 já em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :5000

# Matar processo
sudo kill -9 [PID]

# Ou mudar porta no .env
PORT=3000
```

### Nginx mostra 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Ver logs da aplicação
pm2 logs arven

# Verificar porta no .env
cat .env | grep PORT
```

### Upload de PDF falha
```bash
# Verificar tamanho máximo no Nginx
sudo nano /etc/nginx/sites-available/arven
# Adicionar: client_max_body_size 50M;

sudo nginx -t
sudo systemctl restart nginx
```

### Erro ao conectar Supabase
```bash
# Verificar variáveis de ambiente
cat .env | grep SUPABASE

# Testar conexão
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
console.log('Conexão OK');
"
```

---

## 📝 Checklist Final

- [ ] Node.js instalado (v18+)
- [ ] Código baixado/clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Supabase configurado (tabelas criadas)
- [ ] Build do frontend executado (`npm run build`)
- [ ] PM2 instalado e aplicação iniciada
- [ ] Nginx instalado e configurado
- [ ] Domínio apontando para o VPS
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Login admin testado
- [ ] Upload de contrato testado

---

## 🎯 Estrutura de Arquivos no VPS

```
/var/www/arven/          (ou /home/usuario/arven)
├── .env                 (variáveis de ambiente - NÃO commitar)
├── package.json
├── server/
│   ├── index.ts
│   ├── routes.ts
│   └── ...
├── client/
│   ├── dist/           (build do React - gerado)
│   └── src/
├── shared/
│   └── schema.ts
└── node_modules/
```

---

## 🔄 Atualizar Aplicação

```bash
# Ir para diretório
cd /var/www/arven

# Puxar mudanças (se usar Git)
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Rebuild frontend
npm run build

# Reiniciar aplicação
pm2 restart arven

# Verificar logs
pm2 logs arven --lines 50
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs: `pm2 logs arven`
2. Verifique Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Teste manualmente: `curl http://localhost:5000`

---

**✅ Instalação Completa! Seu sistema ARVEN está no ar!** 🎉
