# 🐳 Deploy com Portainer.io - Sistema ARVEN

## 📋 Pré-requisitos

- Portainer instalado no VPS (185.213.26.111)
- Docker rodando no servidor
- Acesso ao Portainer via navegador

---

## 🚀 Deploy Passo a Passo

### 1️⃣ Acessar Portainer

Abra no navegador:
```
http://185.213.26.111:9000
```

Faça login no Portainer.

---

### 2️⃣ Criar Nova Stack

1. No menu lateral, clique em **"Stacks"**
2. Clique no botão **"+ Add stack"**
3. Dê um nome: `arven-app`

---

### 3️⃣ Configurar o Docker Compose

Na aba **"Web editor"**, cole este código:

```yaml
version: '3.8'

services:
  arven:
    image: node:20-alpine
    container_name: arven-app
    restart: unless-stopped
    working_dir: /app
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      SESSION_SECRET: ${SESSION_SECRET}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      DEFAULT_OBJECT_STORAGE_BUCKET_ID: ${DEFAULT_OBJECT_STORAGE_BUCKET_ID}
      PRIVATE_OBJECT_DIR: ${PRIVATE_OBJECT_DIR}
      PUBLIC_OBJECT_SEARCH_PATHS: ${PUBLIC_OBJECT_SEARCH_PATHS}
    volumes:
      - arven-uploads:/tmp/uploads
    command: |
      sh -c "
        echo '🚀 Iniciando ARVEN...' &&
        rm -rf /app/* /app/.git &&
        apk add --no-cache git &&
        echo '📦 Clonando repositório...' &&
        git clone https://github.com/LucasMendo1/site-arven-contratos.git /tmp/repo &&
        cp -r /tmp/repo/* /tmp/repo/.* /app/ 2>/dev/null || cp -r /tmp/repo/* /app/ &&
        rm -rf /tmp/repo &&
        cd /app &&
        echo '📁 Criando diretórios...' &&
        mkdir -p /tmp/uploads/private /tmp/uploads/public &&
        echo '📦 Instalando dependências...' &&
        npm ci --only=production &&
        echo '🔨 Building aplicação...' &&
        npm run build &&
        echo '✅ Iniciando servidor...' &&
        npm start
      "

volumes:
  arven-uploads:
    driver: local

networks:
  default:
    name: arven-network
```

---

### 4️⃣ Adicionar Variáveis de Ambiente (SEGURAS)

⚠️ **IMPORTANTE:** Não coloque suas chaves diretamente no compose acima!

Role a página até a seção **"Environment variables"**

Você verá duas opções:
- ☑️ **"Load variables from .env file"** (Recomendado)
- **"Add an environment variable"** (Manual)

#### **Opção A: Upload de arquivo .env** (Mais Fácil)

1. Ative a opção: **☑️ "Load variables from .env file"**
2. Cole o conteúdo abaixo no campo de texto:

```env
SESSION_SECRET=17260b93cd25323bc07cc5f5fbcd95ee56fe931e4e1fa7d5c8103de99d4c7325
SUPABASE_URL=https://msnzdzggmgkaiphuidrs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbnpkemdnbWdrYWlwaHVpZHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Mjg5NzQsImV4cCI6MjA3NzQwNDk3NH0.ENV-b_0O4iPyDu32UI5JvgKNSrIVEmg91hCLQdGgcDo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbnpkemdnbWdrYWlwaHVpZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgyODk3NCwiZXhwIjoyMDc3NDA0OTc0fQ.NwINEjJXZ7oYZHhCV8btzUNjGtnv1lC_-zR1MjRcOZs
DEFAULT_OBJECT_STORAGE_BUCKET_ID=arven-contracts
PRIVATE_OBJECT_DIR=/tmp/uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=/tmp/uploads/public
```

#### **Opção B: Variáveis Manuais** (Mais Trabalhoso)

Clique em **"Add an environment variable"** para cada uma:

| Name | Value |
|------|-------|
| SESSION_SECRET | `17260b93cd25323bc07cc5f5fbcd95ee56fe931e4e1fa7d5c8103de99d4c7325` |
| SUPABASE_URL | `https://msnzdzggmgkaiphuidrs.supabase.co` |
| SUPABASE_ANON_KEY | `eyJhbGci...` (sua chave completa) |
| SUPABASE_SERVICE_ROLE_KEY | `eyJhbGci...` (sua chave completa) |
| DEFAULT_OBJECT_STORAGE_BUCKET_ID | `arven-contracts` |
| PRIVATE_OBJECT_DIR | `/tmp/uploads/private` |
| PUBLIC_OBJECT_SEARCH_PATHS | `/tmp/uploads/public` |

---

### 5️⃣ Deploy da Stack

1. Role até o final da página
2. Clique no botão azul **"Deploy the stack"**
3. Aguarde o Portainer fazer o deploy

---

### 6️⃣ Acompanhar Logs

1. No menu lateral, clique em **"Containers"**
2. Procure o container **"arven-app"**
3. Clique no ícone de **"logs"** (📄)
4. Acompanhe a instalação em tempo real:
   - 📦 Clonando repositório...
   - 📦 Instalando dependências...
   - 🔨 Building aplicação...
   - ✅ Iniciando servidor...

---

### 7️⃣ Verificar Aplicação

Quando aparecer a mensagem:
```
✅ Iniciando servidor...
[express] serving on port 5000
```

Acesse no navegador:
```
http://185.213.26.111:5000
```

✅ Pronto! Aplicação rodando!

---

## 🔄 Atualizar Aplicação

Quando fizer alterações no GitHub:

### Método 1: Restart do Container (Rápido)

1. Em **"Containers"**, encontre **"arven-app"**
2. Marque a checkbox
3. Clique em **"Restart"**
4. O container vai clonar o repositório novamente com as últimas alterações

### Método 2: Redeploy da Stack (Completo)

1. Em **"Stacks"**, clique em **"arven-app"**
2. Role até o final
3. Clique em **"Update the stack"**
4. Marque: ☑️ **"Re-pull image and redeploy"**
5. Clique em **"Update"**

---

## 🎯 Configurar com Traefik (SSL Automático)

Se você já tem Traefik configurado no Portainer, use este compose:

```yaml
version: '3.8'

services:
  arven:
    image: node:20-alpine
    container_name: arven-app
    restart: unless-stopped
    working_dir: /app
    environment:
      NODE_ENV: production
      PORT: 5000
      SESSION_SECRET: ${SESSION_SECRET}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      DEFAULT_OBJECT_STORAGE_BUCKET_ID: ${DEFAULT_OBJECT_STORAGE_BUCKET_ID}
      PRIVATE_OBJECT_DIR: ${PRIVATE_OBJECT_DIR}
      PUBLIC_OBJECT_SEARCH_PATHS: ${PUBLIC_OBJECT_SEARCH_PATHS}
    volumes:
      - arven-uploads:/tmp/uploads
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.arven.rule=Host(`contratos.arvenoficial.com`)"
      - "traefik.http.routers.arven.entrypoints=websecure"
      - "traefik.http.routers.arven.tls.certresolver=letsencrypt"
      - "traefik.http.services.arven.loadbalancer.server.port=5000"
    networks:
      - traefik-network
    command: |
      sh -c "
        echo '🚀 Iniciando ARVEN...' &&
        rm -rf /app/* /app/.git &&
        apk add --no-cache git &&
        git clone https://github.com/LucasMendo1/site-arven-contratos.git /tmp/repo &&
        cp -r /tmp/repo/* /tmp/repo/.* /app/ 2>/dev/null || cp -r /tmp/repo/* /app/ &&
        rm -rf /tmp/repo &&
        cd /app &&
        mkdir -p /tmp/uploads/private /tmp/uploads/public &&
        npm ci --only=production &&
        npm run build &&
        npm start
      "

volumes:
  arven-uploads:
    driver: local

networks:
  traefik-network:
    external: true
```

---

## 📊 Monitoramento no Portainer

### Ver Status

1. **Containers** → **arven-app**
   - 🟢 Verde = rodando
   - 🔴 Vermelho = parado/erro

### Ver Logs

1. **Containers** → **arven-app** → **Logs** (📄)
2. Veja em tempo real o que está acontecendo

### Ver Estatísticas

1. **Containers** → **arven-app** → **Stats** (📊)
2. CPU, memória, rede em tempo real

### Acessar Terminal

1. **Containers** → **arven-app** → **Console** (>_)
2. Clique em **"Connect"**
3. Você terá acesso ao shell do container

---

## 🔒 Segurança no Portainer

### ✅ Boas Práticas:

1. **Não exponha o Portainer na internet** (apenas VPN/localhost)
2. **Use variáveis de ambiente** (nunca hardcode chaves)
3. **Ative autenticação de 2 fatores** no Portainer
4. **Limite acesso** aos usuários necessários
5. **Faça backup** das configurações das Stacks

### 🔐 Proteger Portainer:

Se o Portainer está exposto (porta 9000):

```bash
# Permitir apenas IP específico
sudo ufw allow from SEU_IP to any port 9000

# Ou use Traefik com autenticação
```

---

## 🆘 Troubleshooting

### Container não inicia

1. **Containers** → **arven-app** → **Logs**
2. Procure por erros em vermelho
3. Verifique se as variáveis de ambiente estão corretas

### Porta já em uso

1. **Stacks** → **arven-app** → **Editor**
2. Mude a porta:
   ```yaml
   ports:
     - "3000:5000"  # Usar porta 3000 no host
   ```
3. **Update the stack**

### Aplicação não acessa banco

1. Verifique se as chaves do Supabase estão corretas
2. **Containers** → **arven-app** → **Inspect**
3. Na aba **"Env"**, veja se as variáveis estão definidas

### Atualização não funcionou

1. **Containers** → **arven-app**
2. Marque a checkbox
3. Clique em **"Remove"**
4. **Stacks** → **arven-app** → **"Update the stack"**

---

## 💡 Dicas Portainer

1. **Favoritos**: Marque containers importantes com estrela ⭐
2. **Notificações**: Configure webhooks para alertas
3. **Templates**: Salve sua stack como template para reusar
4. **Backup**: Exporte a configuração da stack regularmente
5. **Resource Limits**: Configure limites de CPU/RAM se necessário

---

## ✅ Checklist de Deploy

- [ ] Portainer aberto no navegador
- [ ] Nova Stack criada (nome: `arven-app`)
- [ ] Docker Compose colado no editor
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Stack deployada com sucesso
- [ ] Container com status **healthy** (verde)
- [ ] Logs verificados (sem erros)
- [ ] Aplicação acessível em `http://IP:5000`
- [ ] Login admin testado (admin@arven.com)
- [ ] SSL configurado (se usar Traefik)

---

## 🎉 Pronto!

Sua aplicação está rodando no Portainer! 

**Acesse agora:**
```
http://185.213.26.111:5000
```

**Com Traefik:**
```
https://contratos.arvenoficial.com
```

---

## 📸 Screenshots Esperados

### 1. Stack Criada
✅ Status: **running** (verde)  
✅ Nome: **arven-app**  
✅ Containers: **1/1**

### 2. Container Rodando
✅ Nome: **arven-app**  
✅ Status: **🟢 running**  
✅ Porta: **0.0.0.0:5000 → 5000/tcp**

### 3. Logs
```
🚀 Iniciando ARVEN...
📦 Clonando repositório...
📦 Instalando dependências...
🔨 Building aplicação...
✅ Iniciando servidor...
[express] serving on port 5000
```

---

**Deploy completo pelo Portainer! 🎯🐳**

Qualquer dúvida, é só avisar!
