# 🔒 Deploy Seguro - Sistema ARVEN

## ⚠️ NUNCA faça isso:

```yaml
# ❌ ERRADO - Chaves expostas no docker-compose.yml
environment:
  SUPABASE_URL: https://msnzdzggmgkaiphuidrs.supabase.co
  SUPABASE_ANON_KEY: eyJhbGci...
  SUPABASE_SERVICE_ROLE_KEY: eyJhbGci...
```

**Por que é perigoso?**
- Se você commitar isso no GitHub, qualquer pessoa terá acesso ao seu banco de dados
- A `SERVICE_ROLE_KEY` dá acesso TOTAL ao Supabase (pode deletar tudo!)
- Hackers podem roubar dados dos seus clientes

---

## ✅ Modo CORRETO - Deploy Seguro

### Passo 1: Preparar o Servidor VPS

```bash
# Conectar no VPS
ssh root@185.213.26.111

# Criar diretório
mkdir -p /opt/arven
cd /opt/arven

# Clonar repositório
git clone https://github.com/LucasMendo1/site-arven-contratos.git .
```

### Passo 2: Criar arquivo .env (SECRETO)

```bash
# Copiar exemplo
cp .env.production.example .env

# Editar com suas credenciais
nano .env
```

Preencha com suas credenciais REAIS:

```env
SESSION_SECRET=$(openssl rand -hex 32)
SUPABASE_URL=https://msnzdzggmgkaiphuidrs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEFAULT_OBJECT_STORAGE_BUCKET_ID=arven-contracts
PRIVATE_OBJECT_DIR=/tmp/uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=/tmp/uploads/public
```

**Salvar:** `CTRL + O`, `ENTER`, `CTRL + X`

### Passo 3: Verificar .gitignore

```bash
# Garantir que .env está no .gitignore
cat .gitignore | grep .env

# Se não estiver, adicione:
echo ".env" >> .gitignore
```

### Passo 4: Deploy com Docker

```bash
# Build da imagem
docker compose build

# Iniciar container
docker compose up -d

# Ver logs
docker compose logs -f
```

### Passo 5: Verificar

```bash
# Status do container
docker compose ps

# Testar aplicação
curl http://localhost:5000

# Ver logs em tempo real
docker compose logs -f arven
```

---

## 🔄 Atualizar Aplicação

```bash
cd /opt/arven

# Parar container
docker compose down

# Atualizar código
git pull origin main

# Rebuild (sem cache)
docker compose build --no-cache

# Reiniciar
docker compose up -d

# Verificar logs
docker compose logs -f
```

---

## 📋 Como Funciona

O `docker-compose.yml` usa variáveis de ambiente:

```yaml
environment:
  SESSION_SECRET: ${SESSION_SECRET}          # ← Lê do .env
  SUPABASE_URL: ${SUPABASE_URL}             # ← Lê do .env
  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}   # ← Lê do .env
```

Essas variáveis são substituídas pelos valores do arquivo `.env` que você criou.

**O arquivo `.env` NUNCA é commitado no GitHub** (está no .gitignore)!

---

## 🚨 Segurança - Checklist

- [ ] Arquivo `.env` criado no servidor
- [ ] `.env` está no `.gitignore`
- [ ] Chaves NÃO estão no `docker-compose.yml`
- [ ] Chaves NÃO estão commitadas no GitHub
- [ ] `SESSION_SECRET` gerado aleatoriamente
- [ ] Firewall configurado (apenas portas 80, 443, SSH)
- [ ] SSL configurado (HTTPS)
- [ ] Backup do `.env` em local seguro

---

## 🔑 Gerar SESSION_SECRET

```bash
# No servidor
openssl rand -hex 32
```

Copie o resultado e cole no `.env`

---

## 🌐 Configurar Domínio e SSL

Já está documentado no arquivo `DEPLOY_TRAEFIK.md` do seu projeto.

Com Traefik, o SSL é automático! 🎉

---

## 💡 Dicas Importantes

1. **NUNCA** exponha suas chaves no código
2. **SEMPRE** use arquivos `.env` para secrets
3. **BACKUP** do arquivo `.env` em local seguro (senha manager, etc.)
4. **Rotacione** as chaves periodicamente (a cada 6 meses)
5. Use **diferentes chaves** para dev/staging/production

---

## 🆘 Vazou as Chaves? Faça AGORA:

```bash
# 1. No Supabase Dashboard
# Settings > API > Reset service_role secret
# Settings > API > Generate new anon key

# 2. Atualizar .env no servidor
nano /opt/arven/.env
# Cole as NOVAS chaves

# 3. Reiniciar aplicação
docker compose restart

# 4. Verificar
docker compose logs -f
```

---

## ✅ Deploy Correto = Segurança Garantida

Agora suas credenciais estão **SEGURAS** e apenas você tem acesso! 🔒

**Teste agora:**
```bash
cd /opt/arven
docker compose up -d
docker compose logs -f
```
