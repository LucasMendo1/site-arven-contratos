# 🚀 Deploy com Traefik + HTTPS Automático - Sistema ARVEN

## 📋 O que é Traefik?

Traefik é um reverse proxy moderno que:
- ✅ Configura **SSL/HTTPS automaticamente** com Let's Encrypt
- ✅ **Renova certificados** automaticamente (sem preocupação!)
- ✅ Integra perfeitamente com Docker
- ✅ Redireciona HTTP → HTTPS automaticamente
- ✅ Dashboard de monitoramento (opcional)

---

## 🎯 Pré-requisitos

1. ✅ Servidor/VPS com Docker e Docker Compose instalados
2. ✅ Domínio apontando para o IP do servidor
   - Exemplo: `contratos.arvenoficial.com` → `185.213.26.111`
3. ✅ Portas 80 e 443 abertas no firewall
4. ✅ Código do ARVEN no servidor

---

## 🚀 Instalação Passo a Passo

### 1. Preparar o Servidor

```bash
# Conectar ao servidor
ssh root@185.213.26.111

# Criar diretório
mkdir -p /opt/arven
cd /opt/arven

# Fazer upload de todos os arquivos do projeto
# ou clonar do repositório
```

---

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**Configure estas variáveis importantes:**

```env
# SEU DOMÍNIO (sem http:// ou https://)
DOMAIN=contratos.arvenoficial.com

# SEU EMAIL (para Let's Encrypt)
ACME_EMAIL=seu@email.com

# Gerar SESSION_SECRET
SESSION_SECRET=cole-aqui-o-resultado-de-openssl-rand-hex-32

# Credenciais do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Object Storage (Supabase)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=arven-contracts
PRIVATE_OBJECT_DIR=supabase://arven-contracts/private
PUBLIC_OBJECT_SEARCH_PATHS=supabase://arven-contracts/public
```

**Gerar SESSION_SECRET:**
```bash
openssl rand -hex 32
```

---

### 3. Verificar DNS

Antes de continuar, certifique-se que seu domínio está apontando corretamente:

```bash
# Testar DNS
ping contratos.arvenoficial.com

# Deve retornar o IP do seu servidor
# PING contratos.arvenoficial.com (185.213.26.111)
```

---

### 4. Criar Diretório para Certificados

```bash
# Criar diretório para Let's Encrypt
mkdir -p /opt/arven/letsencrypt

# Dar permissões
chmod 600 /opt/arven/letsencrypt
```

---

### 5. Iniciar com Traefik

```bash
# Usar o docker-compose com Traefik
# IMPORTANTE: Use docker-compose.traefik.yml ao invés do padrão

# Build da aplicação
docker compose -f docker-compose.traefik.yml build

# Iniciar tudo (Traefik + ARVEN)
docker compose -f docker-compose.traefik.yml up -d

# Ver logs em tempo real
docker compose -f docker-compose.traefik.yml logs -f
```

---

### 6. Monitorar o Processo

```bash
# Ver status dos containers
docker compose -f docker-compose.traefik.yml ps

# Deve mostrar:
# arven-traefik   Up
# arven-app       Up (healthy)

# Ver logs do Traefik
docker compose -f docker-compose.traefik.yml logs traefik

# Ver logs da aplicação
docker compose -f docker-compose.traefik.yml logs arven
```

---

### 7. Aguardar Certificado SSL

O Traefik irá:
1. Detectar seu domínio
2. Solicitar certificado SSL do Let's Encrypt
3. Validar o domínio (desafio HTTP)
4. Instalar o certificado
5. Configurar HTTPS automaticamente

**Isso leva de 30 segundos a 2 minutos na primeira vez!**

Acompanhe nos logs:
```bash
docker compose -f docker-compose.traefik.yml logs -f traefik | grep acme
```

---

### 8. Testar HTTPS

Acesse seu domínio:

```
✅ https://contratos.arvenoficial.com
```

Você deve ver:
- ✅ Cadeado verde no navegador
- ✅ Certificado válido
- ✅ Redirecionamento automático de HTTP para HTTPS

---

## 🔒 Configurar Firewall

```bash
# Permitir portas necessárias
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (para validação Let's Encrypt)
sudo ufw allow 443/tcp     # HTTPS

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## 📊 Dashboard do Traefik (Opcional)

O Traefik tem um dashboard de monitoramento:

**Acesse:** `http://seu-servidor-ip:8080`

⚠️ **IMPORTANTE**: Em produção, proteja ou desabilite o dashboard!

Para desabilitar:
```bash
# Editar docker-compose.traefik.yml
# Remover a porta 8080 da seção 'ports' do Traefik
# Remover as labels do dashboard
```

---

## 🔄 Comandos Úteis

### Gerenciamento

```bash
# Ver logs
docker compose -f docker-compose.traefik.yml logs -f

# Reiniciar tudo
docker compose -f docker-compose.traefik.yml restart

# Parar tudo
docker compose -f docker-compose.traefik.yml down

# Iniciar novamente
docker compose -f docker-compose.traefik.yml up -d
```

### Atualizar Aplicação

```bash
# Parar containers
docker compose -f docker-compose.traefik.yml down

# Atualizar código (git pull ou upload)
git pull origin main

# Rebuild
docker compose -f docker-compose.traefik.yml build --no-cache

# Reiniciar
docker compose -f docker-compose.traefik.yml up -d
```

### Ver Certificados

```bash
# Ver certificados Let's Encrypt
cat /opt/arven/letsencrypt/acme.json | jq
```

---

## 🐛 Troubleshooting

### Certificado SSL não é gerado

**Problema:** Traefik não consegue gerar certificado.

**Soluções:**
```bash
# 1. Verificar se domínio aponta para o servidor
ping contratos.arvenoficial.com

# 2. Verificar se porta 80 está acessível
curl http://contratos.arvenoficial.com

# 3. Ver erros do Let's Encrypt nos logs
docker compose -f docker-compose.traefik.yml logs traefik | grep -i error

# 4. Verificar se DOMAIN e ACME_EMAIL estão corretos no .env
cat .env | grep DOMAIN
cat .env | grep ACME_EMAIL

# 5. Reiniciar Traefik
docker compose -f docker-compose.traefik.yml restart traefik
```

### Erro "Too Many Registrations"

**Problema:** Let's Encrypt tem limite de requisições.

**Solução:**
```bash
# Aguardar 1 hora e tentar novamente
# Ou usar ambiente de staging para testes

# Adicionar no docker-compose.traefik.yml (linha do certificatesresolvers):
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"

# Depois de testar, remover esta linha para usar produção
```

### HTTP não redireciona para HTTPS

**Problema:** Acesso via HTTP não redireciona.

**Solução:**
```bash
# Verificar logs do Traefik
docker compose -f docker-compose.traefik.yml logs traefik

# Reiniciar Traefik
docker compose -f docker-compose.traefik.yml restart traefik
```

### Erro "Cannot connect to Docker"

**Problema:** Traefik não consegue acessar Docker.

**Solução:**
```bash
# Verificar se Docker está rodando
docker ps

# Verificar permissões do socket
ls -la /var/run/docker.sock

# Reiniciar Docker
sudo systemctl restart docker

# Reiniciar Traefik
docker compose -f docker-compose.traefik.yml restart traefik
```

---

## 📝 Renovação Automática

✅ **O Traefik renova certificados automaticamente!**

- Certificados Let's Encrypt duram 90 dias
- Traefik renova automaticamente 30 dias antes de expirar
- **Você não precisa fazer NADA!**

Verificar renovações nos logs:
```bash
docker compose -f docker-compose.traefik.yml logs -f traefik | grep renew
```

---

## 🔐 Segurança Adicional

### Headers de Segurança

O Traefik já está configurado com:
- ✅ SSL Redirect (HTTP → HTTPS)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ HSTS incluindo subdomínios
- ✅ HSTS Preload

### Proteger Dashboard do Traefik

```bash
# Gerar senha para o dashboard
htpasswd -nb admin senha-forte

# Copiar o resultado para .env
# TRAEFIK_AUTH=admin:$apr1$...
```

---

## 📊 Monitoramento

### Status dos Containers

```bash
# Ver status
docker compose -f docker-compose.traefik.yml ps

# Ver recursos (CPU/RAM)
docker stats arven-traefik arven-app
```

### Logs

```bash
# Todos os logs
docker compose -f docker-compose.traefik.yml logs

# Apenas Traefik
docker compose -f docker-compose.traefik.yml logs traefik

# Apenas aplicação
docker compose -f docker-compose.traefik.yml logs arven

# Seguir logs em tempo real
docker compose -f docker-compose.traefik.yml logs -f
```

---

## 🎯 Checklist de Deploy

- [ ] Docker e Docker Compose instalados
- [ ] Domínio apontando para o servidor (DNS configurado)
- [ ] Firewall configurado (portas 80, 443 abertas)
- [ ] Código copiado para `/opt/arven`
- [ ] Arquivo `.env` configurado corretamente
  - [ ] DOMAIN definido
  - [ ] ACME_EMAIL definido
  - [ ] SESSION_SECRET gerado
  - [ ] Credenciais Supabase configuradas
- [ ] Supabase configurado (tabelas criadas)
- [ ] Diretório `letsencrypt` criado
- [ ] Build executado: `docker compose -f docker-compose.traefik.yml build`
- [ ] Containers iniciados: `docker compose -f docker-compose.traefik.yml up -d`
- [ ] Logs verificados (sem erros)
- [ ] Certificado SSL gerado (aguardar 1-2 minutos)
- [ ] HTTPS funcionando: `https://seudominio.com`
- [ ] Cadeado verde no navegador
- [ ] Redirect HTTP → HTTPS funcionando

---

## 🌟 Vantagens do Traefik

✅ **HTTPS totalmente automático** (Let's Encrypt)  
✅ **Renovação automática** de certificados  
✅ **Zero configuração manual** de Nginx  
✅ **Dashboard de monitoramento** (opcional)  
✅ **Integração nativa** com Docker  
✅ **Redirecionamento automático** HTTP → HTTPS  
✅ **Headers de segurança** pré-configurados  
✅ **Escalável** e moderno  

---

## 💡 Diferença: Traefik vs Nginx

| Feature | Traefik | Nginx + Certbot |
|---------|---------|-----------------|
| SSL Automático | ✅ Sim | ⚠️ Manual |
| Renovação SSL | ✅ Automática | ⚠️ Via cron |
| Configuração | ✅ Via labels | ⚠️ Arquivos .conf |
| Dashboard | ✅ Incluído | ❌ Não |
| Docker Native | ✅ Sim | ⚠️ Proxy externo |
| Atualização | ✅ Automática | ⚠️ Manual |

---

## 🆘 Comandos de Emergência

```bash
# Parar tudo
docker compose -f docker-compose.traefik.yml down

# Forçar parada
docker compose -f docker-compose.traefik.yml kill

# Restart completo
docker compose -f docker-compose.traefik.yml down && \
docker compose -f docker-compose.traefik.yml build --no-cache && \
docker compose -f docker-compose.traefik.yml up -d

# Ver erros
docker compose -f docker-compose.traefik.yml logs --tail=200 | grep -i error

# Remover certificados e tentar novamente
rm -rf /opt/arven/letsencrypt/*
docker compose -f docker-compose.traefik.yml restart traefik
```

---

## ✅ Resultado Final

Após seguir todos os passos:

✅ **Aplicação rodando em HTTPS**  
✅ **Certificado SSL válido** (Let's Encrypt)  
✅ **Cadeado verde** no navegador  
✅ **Renovação automática** de certificados  
✅ **Redirecionamento HTTP → HTTPS**  
✅ **Sem avisos de segurança** do Google  
✅ **Conformidade com boas práticas** de segurança  

---

**🎉 Pronto! Seu sistema ARVEN está seguro com HTTPS automático via Traefik!**

Acesse: `https://contratos.arvenoficial.com`
