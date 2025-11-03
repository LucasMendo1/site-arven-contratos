# ⚡ Portainer - Deploy Rápido (5 minutos)

## 🎯 Passo a Passo Simples

### 1️⃣ Acesse o Portainer
```
http://185.213.26.111:9000
```
Faça login.

---

### 2️⃣ Criar Stack
1. Menu lateral → **"Stacks"**
2. Botão **"+ Add stack"**
3. Nome: `arven-app`

---

### 3️⃣ Cole o Docker Compose

**Aba "Web editor"** → Cole:

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
```

---

### 4️⃣ Adicionar Variáveis de Ambiente

Role a página, na seção **"Environment variables"**:

☑️ Ative: **"Load variables from .env file"**

Cole no campo de texto:

```env
SESSION_SECRET=17260b93cd25323bc07cc5f5fbcd95ee56fe931e4e1fa7d5c8103de99d4c7325
SUPABASE_URL=https://msnzdzggmgkaiphuidrs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbnpkemdnbWdrYWlwaHVpZHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Mjg5NzQsImV4cCI6MjA3NzQwNDk3NH0.ENV-b_0O4iPyDu32UI5JvgKNSrIVEmg91hCLQdGgcDo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbnpkemdnbWdrYWlwaHVpZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgyODk3NCwiZXhwIjoyMDc3NDA0OTc0fQ.NwINEjJXZ7oYZHhCV8btzUNjGtnv1lC_-zR1MjRcOZs
DEFAULT_OBJECT_STORAGE_BUCKET_ID=arven-contracts
PRIVATE_OBJECT_DIR=/tmp/uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=/tmp/uploads/public
```

---

### 5️⃣ Deploy!

Botão azul: **"Deploy the stack"**

---

### 6️⃣ Acompanhar Logs

1. Menu lateral → **"Containers"**
2. Container **"arven-app"**
3. Ícone de logs 📄

Aguarde até aparecer:
```
✅ Iniciando servidor...
[express] serving on port 5000
```

---

### 7️⃣ Testar

Abra no navegador:
```
http://185.213.26.111:5000
```

✅ **Pronto! Aplicação rodando!** 🎉

---

## 🔄 Atualizar (após push no GitHub)

1. **Containers** → **arven-app**
2. Marcar checkbox
3. Botão **"Restart"**

---

## 📸 Como Deve Ficar

### Stack
- ✅ Nome: `arven-app`
- ✅ Status: 🟢 **running**
- ✅ Containers: 1/1

### Container
- ✅ Nome: `arven-app`
- ✅ Status: 🟢 **running**
- ✅ Porta: `0.0.0.0:5000 → 5000/tcp`

### Logs
```bash
🚀 Iniciando ARVEN...
📦 Clonando repositório...
📦 Instalando dependências...
🔨 Building aplicação...
✅ Iniciando servidor...
[express] serving on port 5000
```

---

## ✅ Checklist

- [ ] Portainer acessado (http://IP:9000)
- [ ] Stack criada (nome: arven-app)
- [ ] Docker Compose colado
- [ ] Variáveis .env adicionadas
- [ ] Deploy realizado
- [ ] Logs verificados (sem erros)
- [ ] App acessível (http://IP:5000)
- [ ] Login testado (admin@arven.com / admin123)

---

## 🆘 Problemas?

### Container não inicia
→ Ver logs do container no Portainer

### Porta ocupada
→ Mudar porta no compose: `"3000:5000"`

### Erro de build
→ Ver logs completos do container

---

**Deploy completo em 5 minutos! 🚀**

Arquivo completo: `DEPLOY_PORTAINER.md`
