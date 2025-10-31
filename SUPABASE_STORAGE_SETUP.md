# 📦 Configuração do Supabase Storage para PDFs

Este guia mostra como configurar o Supabase Storage para armazenar os PDFs dos contratos de forma **persistente** e **segura**.

## ✅ Vantagens do Supabase Storage

- ✅ **Persistente**: PDFs nunca são perdidos (mesmo reiniciando o servidor)
- ✅ **CDN Global**: Downloads rápidos em qualquer lugar do mundo
- ✅ **Seguro**: URLs assinadas temporárias (não expõe arquivos)
- ✅ **Escalável**: Sem limite de armazenamento
- ✅ **Gratuito**: 1GB grátis no plano Free

---

## 🔧 Passo 1: Criar Bucket no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **"Storage"**
4. Clique em **"Create a new bucket"**
5. Configure:
   - **Name**: `contracts`
   - **Public bucket**: ❌ **DESMARQUE** (bucket privado)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `application/pdf`
6. Clique em **"Create bucket"**

---

## 🔐 Passo 2: Configurar Políticas de Segurança (RLS)

### Política 1: Permitir Upload (Autenticado)

No Supabase Dashboard:

1. Clique no bucket **"contracts"**
2. Vá em **"Policies"**
3. Clique em **"New Policy"**
4. Selecione **"Custom policy"**
5. Configure:
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   true
   ```
6. Clique em **"Review"** → **"Save policy"**

### Política 2: Permitir Download (Autenticado)

1. Clique em **"New Policy"** novamente
2. Selecione **"Custom policy"**
3. Configure:
   - **Policy name**: `Allow authenticated downloads`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   true
   ```
4. Clique em **"Review"** → **"Save policy"**

### Política 3: Permitir Delete (Autenticado)

1. Clique em **"New Policy"** novamente
2. Selecione **"Custom policy"**
3. Configure:
   - **Policy name**: `Allow authenticated deletes`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   true
   ```
4. Clique em **"Review"** → **"Save policy"**

---

## 📝 Passo 3: Verificar Credenciais no Docker

No seu arquivo `docker-compose.yml`, confirme que estas variáveis estão configuradas:

```yaml
environment:
  SUPABASE_URL: https://SEU_PROJETO.supabase.co
  SUPABASE_ANON_KEY: eyJ...
  SUPABASE_SERVICE_ROLE_KEY: eyJ...
```

**⚠️ Importante:** Use o **SERVICE_ROLE_KEY** (não o ANON_KEY) para bypass de RLS no backend.

---

## 🧪 Passo 4: Testar Upload

1. Acesse seu sistema: `http://SEU_IP:5000`
2. Faça login (`admin@arven.com` / `admin123`)
3. Clique em **"Novo Contrato"**
4. Preencha os dados
5. Faça upload de um PDF
6. Clique em **"Cadastrar Contrato"**

### ✅ Se Funcionar:

Você verá a mensagem: **"PDF enviado com sucesso - O arquivo foi salvo no Supabase Storage"**

### ❌ Se Der Erro:

Verifique os logs do container:

```bash
# No Portainer
Containers → arven-app → Logs
```

Procure por:
- `[Supabase Upload]` - logs de upload
- Erros de permissão (RLS)
- Erros de autenticação

---

## 📂 Estrutura de Armazenamento

Os PDFs são salvos no Supabase Storage assim:

```
contracts/
└── uploads/
    ├── 123e4567-e89b-12d3-a456-426614174000.pdf
    ├── 234e5678-f90c-23e4-b567-537725285111.pdf
    └── ...
```

Cada arquivo tem um UUID único como nome.

---

## 🔒 Como Funciona a Segurança

1. **Upload**: Apenas admins logados podem fazer upload
2. **Storage**: Arquivos ficam em bucket **privado**
3. **Download**: Sistema gera **URLs assinadas temporárias** (válidas por 1 hora)
4. **Acesso Direto**: ❌ Impossível acessar PDF sem estar logado

---

## 🗑️ Excluindo Contratos

Quando você exclui um contrato no sistema:
- ✅ Registro é removido do banco de dados
- ⚠️ **PDF fica no Supabase Storage** (para auditoria)

Para limpar PDFs antigos manualmente:
1. Acesse Supabase Dashboard → Storage → contracts
2. Selecione os arquivos
3. Clique em **"Delete"**

---

## 💰 Limites do Plano Free

- **Storage**: 1 GB grátis
- **Bandwidth**: 2 GB/mês grátis
- **Requests**: Ilimitados

**Estimativa:**
- 1 PDF médio = 200 KB
- 1 GB = ~5.000 PDFs
- Mais que suficiente para começar!

---

## 🚀 Upgrade para Produção (Opcional)

Se precisar de mais espaço:

1. Acesse Supabase Dashboard → **Settings** → **Billing**
2. Escolha o plano **Pro** ($25/mês):
   - 100 GB storage
   - 200 GB bandwidth
   - Suporte prioritário

---

## 🔧 Troubleshooting

### Erro: "Bucket not found"

**Solução:**
- Verifique se criou o bucket com nome exato: `contracts`
- O sistema cria automaticamente na primeira vez

### Erro: "Permission denied"

**Solução:**
- Verifique as políticas RLS (Passo 2)
- Confirme que está usando `SERVICE_ROLE_KEY` no Docker

### Erro: "File too large"

**Solução:**
- Limite padrão: 10 MB
- Aumente no Supabase: Storage → contracts → Settings

### PDFs não carregam

**Solução:**
- Verifique logs do container
- Confirme credenciais Supabase no Docker
- Teste conexão manualmente

---

## ✅ Checklist Final

- [ ] Bucket "contracts" criado no Supabase
- [ ] Bucket configurado como **privado**
- [ ] Políticas RLS configuradas (INSERT, SELECT, DELETE)
- [ ] Credenciais Supabase no `docker-compose.yml`
- [ ] Teste de upload funcionando
- [ ] Teste de download funcionando

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do container
2. Confirme as credenciais no Docker
3. Teste as políticas RLS no Supabase
4. Entre em contato com suporte

**Sistema pronto para produção! 🎉**
