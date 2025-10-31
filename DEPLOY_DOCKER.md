# 🐋 Deploy com Docker - Sistema ARVEN

## 📦 Pré-requisitos

No seu servidor/VPS:
- Docker instalado (20.10+)
- Docker Compose instalado (2.0+)
- Porta 5000 disponível (ou configure outra)

---

## 🚀 Instalação Rápida

### 1. Instalar Docker (Ubuntu/Debian)

```bash
# Atualizar sistema
sudo apt update

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

---

### 2. Preparar Aplicação

```bash
# Criar diretório
sudo mkdir -p /opt/arven
cd /opt/arven

# Fazer upload dos arquivos ou clonar repositório
# - Dockerfile
# - docker-compose.yml
# - .dockerignore
# - Todo o código fonte
```

---

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**Configure:**
```env
SESSION_SECRET=resultado-do-openssl-rand-hex-32
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Gerar SESSION_SECRET:**
```bash
openssl rand -hex 32
```

---

### 4. Build e Start

```bash
# Build da imagem
docker compose build

# Iniciar container
docker compose up -d

# Ver logs
docker compose logs -f

# Verificar status
docker compose ps
```

---

## 🔧 Comandos Úteis

### Gerenciamento Básico
```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Reiniciar
docker compose restart

# Ver logs em tempo real
docker compose logs -f arven

# Ver últimas 100 linhas de log
docker compose logs --tail=100 arven

# Verificar status
docker compose ps

# Acessar shell do container
docker compose exec arven sh
```

### Atualização
```bash
# Parar container
docker compose down

# Atualizar código (git pull ou upload)
git pull origin main

# Rebuild
docker compose build --no-cache

# Reiniciar
docker compose up -d

# Verificar logs
docker compose logs -f
```

### Limpeza
```bash
# Remover containers parados
docker compose down

# Remover imagens antigas
docker image prune -a

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes
```

---

## 🌐 Configurar Nginx Reverse Proxy

Se quiser usar domínio e SSL:

### 1. Instalar Nginx
```bash
sudo apt install nginx -y
```

### 2. Criar Configuração
```bash
sudo nano /etc/nginx/sites-available/arven
```

Cole:
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

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
    }

    client_max_body_size 50M;
}
```

### 3. Ativar e Testar
```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/arven /etc/nginx/sites-enabled/

# Testar
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx
```

### 4. Configurar SSL
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada
```

---

## 🔒 Firewall

```bash
# Permitir portas necessárias
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Se não usar Nginx, permitir porta diretamente
# sudo ufw allow 5000/tcp

sudo ufw enable
sudo ufw status
```

---

## 📊 Monitoramento

### Ver recursos do container
```bash
# Uso de CPU/RAM
docker stats arven

# Informações detalhadas
docker inspect arven
```

### Health Check
```bash
# Status de saúde
docker compose ps

# Deve mostrar: healthy
```

### Logs
```bash
# Últimos logs
docker compose logs --tail=50 arven

# Seguir logs
docker compose logs -f arven

# Logs com timestamp
docker compose logs -t arven
```

---

## 🐛 Troubleshooting

### Container não inicia
```bash
# Ver logs completos
docker compose logs arven

# Ver erros de build
docker compose build

# Verificar .env
cat .env
```

### Erro de permissão
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Logout e login novamente
```

### Porta já em uso
```bash
# Ver o que está usando a porta 5000
sudo lsof -i :5000

# Matar processo
sudo kill -9 [PID]

# Ou mudar porta no docker-compose.yml
ports:
  - "3000:5000"  # host:container
```

### Container reiniciando constantemente
```bash
# Ver logs
docker compose logs --tail=100 arven

# Verificar health check
docker compose ps

# Acessar container
docker compose exec arven sh
node --version
npm --version
```

### Rebuild completo
```bash
# Parar tudo
docker compose down

# Remover imagens
docker rmi arven-app

# Rebuild sem cache
docker compose build --no-cache

# Iniciar
docker compose up -d
```

---

## 📁 Estrutura de Arquivos

```
/opt/arven/
├── Dockerfile              ← Receita do container
├── docker-compose.yml      ← Orquestração
├── .dockerignore          ← Arquivos ignorados
├── .env                   ← Variáveis (NÃO commitar!)
├── .env.example           ← Exemplo de .env
├── package.json
├── server/
├── client/
└── shared/
```

---

## 🔄 Deploy com Docker Hub (Opcional)

Se quiser publicar a imagem:

```bash
# Login
docker login

# Tag
docker tag arven-app seuusuario/arven:latest

# Push
docker push seuusuario/arven:latest

# Em outro servidor, pull
docker pull seuusuario/arven:latest
docker run -d -p 5000:5000 --env-file .env seuusuario/arven:latest
```

---

## 🎯 Checklist de Deploy

- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Código copiado para `/opt/arven`
- [ ] Arquivo `.env` configurado
- [ ] Supabase configurado (tabelas criadas)
- [ ] Build executado: `docker compose build`
- [ ] Container iniciado: `docker compose up -d`
- [ ] Logs verificados: `docker compose logs`
- [ ] Nginx configurado (se usar domínio)
- [ ] SSL configurado (se usar domínio)
- [ ] Firewall configurado
- [ ] Teste: `curl http://localhost:5000`
- [ ] Login admin testado

---

## 💡 Dicas

1. **Sempre use .env** - Nunca coloque credenciais no docker-compose.yml
2. **Monitore logs** - `docker compose logs -f` é seu amigo
3. **Backup** - Faça backup do .env antes de atualizar
4. **Health Check** - Configure para restart automático
5. **Atualizações** - Use `--no-cache` ao rebuildar após mudanças

---

## 🆘 Comandos de Emergência

```bash
# Parar tudo
docker compose down

# Forçar parada
docker compose kill

# Remover volumes (CUIDADO!)
docker compose down -v

# Restart completo
docker compose down && docker compose build --no-cache && docker compose up -d

# Logs de erro
docker compose logs --tail=200 arven | grep -i error
```

---

## 🌟 Vantagens do Docker

✅ Ambiente isolado  
✅ Fácil atualização  
✅ Portabilidade total  
✅ Rollback simples  
✅ Escalável  

---

**✅ Com Docker, seu deploy é muito mais simples e confiável!** 🚀

Teste agora:
```bash
docker compose up -d && docker compose logs -f
```
