# 🚀 Guia Completo - Sistema ARVEN

## 📋 Índice
1. [Upload de Contratos (Público vs Admin)](#upload-de-contratos)
2. [Configurar Webhook](#configurar-webhook)
3. [Domínio Personalizado](#domínio-personalizado)
4. [Publicação do Sistema](#publicação)

---

## 1️⃣ Upload de Contratos

### Como Funciona Atualmente

✅ **Landing Page (Público)** → Clientes podem enviar contratos **SEM** login
- URL: `/` (página inicial)
- Qualquer pessoa pode preencher o formulário
- Upload de PDF incluído
- Dados salvos no Supabase automaticamente

❌ **Apenas Admins Podem:**
- Ver todos os contratos enviados (precisa login)
- Baixar PDFs dos contratos (precisa login)
- Excluir contratos (precisa login)

### ⚙️ Opção: Proteger Upload com Login

Se você quiser que **APENAS admins possam enviar contratos**, precisa fazer:

#### **Solução Simples:**

1. **Remova a Landing Page** da rota pública
2. **Crie formulário no dashboard** administrativo

Quer que eu implemente isso? Basta pedir: *"Quero que apenas admins possam enviar contratos"*

---

## 2️⃣ Configurar Webhook

### O Que é Webhook?

Webhook permite que seu sistema ARVEN **notifique automaticamente outro sistema** quando um novo contrato for enviado.

**Exemplo prático:**
- Cliente envia contrato → ARVEN salva no banco
- ARVEN automaticamente envia dados para sua URL
- Seu outro sistema recebe e processa (ex: envia email, cria tarefa, etc)

### 📱 Como Configurar

#### **Passo 1: Acessar Configurações**

1. Faça login no sistema (`/login`)
2. No dashboard, clique em **"Webhook"** na sidebar
3. Você verá a tela de configurações

#### **Passo 2: Configurar URL**

1. Digite a URL que receberá as notificações:
   ```
   https://seu-servidor.com/webhook
   ```

2. Ative o switch "Webhook Ativo"

3. Clique em "Salvar Configurações"

### 📦 Formato dos Dados Enviados

Quando um contrato for enviado, seu endpoint receberá um POST assim:

```json
{
  "event": "contract.created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clientName": "João Silva",
    "clientPhone": "(11) 98765-4321",
    "contractDuration": "1_year",
    "product": "Core",
    "ticketValue": "R$ 2.500,00",
    "pdfUrl": "/objects/uploads/contract-123.pdf",
    "submittedAt": "2025-10-30T20:15:30.000Z"
  },
  "timestamp": "2025-10-30T20:15:30.000Z"
}
```

### 💻 Exemplo de Servidor Webhook (Node.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  if (event === 'contract.created') {
    console.log('Novo contrato recebido!');
    console.log('Cliente:', data.clientName);
    console.log('Produto:', data.product);
    console.log('Valor:', data.ticketValue);
    
    // Aqui você pode:
    // - Enviar email
    // - Criar tarefa no seu CRM
    // - Salvar em outro banco
    // - Notificar equipe no Slack
    // - etc...
  }
  
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook rodando na porta 3000'));
```

### 🔒 Requisitos do Seu Endpoint

- ✅ Deve aceitar requisições **POST**
- ✅ Deve aceitar `Content-Type: application/json`
- ✅ Deve estar **acessível publicamente** na internet
- ✅ Deve responder com status 200 para confirmar recebimento

### 🧪 Como Testar o Webhook

1. **Use um serviço de teste:**
   - https://webhook.site (cria uma URL temporária)
   - https://requestbin.com

2. **Configure no ARVEN:**
   - Cole a URL do webhook.site nas configurações
   - Ative o webhook

3. **Envie um contrato de teste:**
   - Vá para a landing page
   - Preencha o formulário
   - Envie

4. **Verifique webhook.site:**
   - Você verá a requisição chegando
   - Confira se os dados estão corretos

---

## 3️⃣ Domínio Personalizado

### Por Que Usar Domínio Personalizado?

**Sem domínio personalizado:**
- URL: `https://seu-projeto.replit.app`

**Com domínio personalizado:**
- URL: `https://contratos.arven.com.br` ✨

### 📝 Passo a Passo

#### **Opção A: Comprar Domínio pelo Replit** (MAIS FÁCIL)

1. **Publique seu app** (veja seção "Publicação" abaixo)
2. Vá para **Deployments** → **Settings**
3. Clique em **"Purchase domain"**
4. Escolha e compre o domínio desejado
5. **Pronto!** O Replit configura tudo automaticamente

#### **Opção B: Usar Domínio que Você Já Tem** (ex: Registro.br, GoDaddy)

1. **Publique seu app primeiro**

2. **No Replit:**
   - Vá para **Deployments** → **Settings**
   - Clique em **"Manually connect from another registrar"**
   - Digite seu domínio (ex: `contratos.arven.com.br`)
   - O Replit mostrará **2 registros DNS** que você precisa adicionar

3. **No seu Registro de Domínio** (ex: Registro.br):
   
   Adicione estes registros DNS:
   
   **Registro A:**
   ```
   Nome/Host: @ (ou deixe vazio para domínio raiz)
           ou: contratos (para subdomínio)
   Tipo: A
   Valor/IP: [IP fornecido pelo Replit]
   ```
   
   **Registro TXT:**
   ```
   Nome/Host: @ (ou deixe vazio)
   Tipo: TXT
   Valor: [código fornecido pelo Replit]
   ```

4. **Aguarde Propagação:**
   - Pode levar de 5 minutos até 48 horas
   - No Replit, aparecerá "Verified" quando funcionar

5. **Pronto!** Seu domínio personalizado está ativo

### ✅ Certificado SSL/HTTPS

O Replit fornece **SSL/HTTPS GRÁTIS** automaticamente!
- Não precisa configurar nada
- Certificado renovado automaticamente
- Seu site já ficará com 🔒 no navegador

### 💰 Custos

- **Domínio pelo Replit:** Você paga o preço do domínio
- **Domínio próprio:** Apenas o que você já paga ao registrador
- **Hospedagem no Replit:** Grátis (plano gratuito) ou pago (planos melhores)
- **SSL/HTTPS:** **GRÁTIS** sempre

---

## 4️⃣ Publicação do Sistema

### 🚀 Como Publicar no Replit

#### **Passo 1: Preparar para Publicar**

1. ✅ Certifique-se que o sistema está funcionando
2. ✅ Banco de dados Supabase configurado
3. ✅ Teste login e envio de contrato

#### **Passo 2: Publicar (Deploy)**

1. **No Replit**, clique no botão **"Deploy"** (canto superior direito)

2. **Escolha o tipo de deployment:**
   - **Autoscale** (Recomendado para produção)
   - **Reserved VM** (Para maior controle)
   - **Static** (Apenas para sites estáticos)

3. **Configure:**
   - Nome do deployment
   - Região (escolha mais próxima do Brasil)

4. **Clique em "Deploy"**

5. **Aguarde:** O Replit vai:
   - ✅ Instalar dependências
   - ✅ Fazer build da aplicação
   - ✅ Configurar servidor
   - ✅ Ativar HTTPS
   - ✅ Gerar URL pública

#### **Passo 3: Testar**

1. Acesse a URL gerada (ex: `https://seu-app.replit.app`)
2. Teste o login
3. Teste envio de contrato
4. Verifique se tudo funciona

### 🔒 Variáveis de Ambiente (Secrets)

⚠️ **IMPORTANTE:** Suas credenciais do Supabase já estão configuradas!

O Replit mantém os secrets automaticamente:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SESSION_SECRET`
- ✅ Credenciais de Object Storage

### 📊 Monitoramento

Após publicar, você pode:
- Ver logs em tempo real
- Monitorar uso de recursos
- Ver estatísticas de acesso
- Configurar alertas

---

## 🆘 Troubleshooting

### Webhook não está funcionando

- ✅ Verifique se a URL está correta
- ✅ Teste a URL manualmente (curl ou Postman)
- ✅ Verifique se o webhook está marcado como "Ativo"
- ✅ Veja os logs do seu servidor webhook

### Domínio não funciona

- ⏰ Aguarde propagação DNS (até 48h)
- ✅ Verifique se adicionou os registros DNS corretos
- ✅ Use https://dnschecker.org para verificar DNS
- ✅ Limpe cache do DNS: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

### Erro 500 ao enviar contrato

- ✅ Verifique logs do servidor
- ✅ Confirme que Supabase está acessível
- ✅ Teste conexão com banco de dados

---

## 📞 Suporte

Se precisar de ajuda, você pode:
- Ver logs no Replit Console
- Consultar documentação do Supabase
- Testar endpoints com Postman

---

## ✨ Resumo Rápido

| Ação | Como Fazer |
|------|------------|
| **Configurar Webhook** | Dashboard → Webhook → Digite URL → Ativar → Salvar |
| **Domínio Personalizado** | Deploy → Settings → Link domain → Adicionar DNS |
| **Publicar Sistema** | Botão "Deploy" → Autoscale → Deploy |
| **Testar Webhook** | Use webhook.site para testar |
| **Ver Logs** | Replit Console ou Deployments → Logs |

---

**🎉 Tudo pronto! Seu sistema ARVEN está completo e profissional!**

Qualquer dúvida, é só perguntar! 🚀
