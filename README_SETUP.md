# ARVEN - Sistema de Contratos

## 🚀 Setup do Projeto

### 1. Configuração do Supabase

#### Setup Inicial (Novo Projeto)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o **SQL Editor**
3. Execute o arquivo `supabase_setup.sql` completo
4. Isso criará:
   - Tabela `users` (autenticação admin)
   - Tabela `contracts` (contratos enviados)
   - Tabela `webhook_config` (configuração de webhook)
   - Um usuário admin inicial
5. **DEPOIS**, execute o arquivo `supabase_add_company_fields.sql` para adicionar os campos adicionais:
   - Campo `company_name` (Razão Social)
   - Campo `document` (CPF/CNPJ)

#### ⚠️ Migração Obrigatória (Se já tinha o sistema rodando)

Se você já tinha o sistema funcionando antes de 03/11/2025, **você DEVE executar a migração do banco de dados**:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o **SQL Editor**
3. Abra o arquivo `supabase_add_company_fields.sql` neste projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

**Sem esta migração, o sistema irá falhar ao criar novos contratos!**

### 2. Credenciais Padrão

**Login Administrativo:**
- Email: `admin@arven.com`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere esta senha após o primeiro login!

**Segurança**: As senhas são armazenadas com hash bcrypt (10 rounds) no banco de dados.

### 3. Variáveis de Ambiente

As seguintes variáveis já estão configuradas no Replit:
- `SUPABASE_URL` - URL do seu projeto Supabase
- `SUPABASE_ANON_KEY` - Chave pública
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço
- `SESSION_SECRET` - Segredo da sessão
- Object Storage configurado automaticamente

### 4. Estrutura do Projeto

```
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Formulário de captura
│   │   │   ├── LoginPage.tsx        # Login administrativo
│   │   │   └── AdminDashboard.tsx   # Painel admin
│   │   └── components/
│   │       └── Logo.tsx             # Logo ARVEN
├── server/                    # Backend Express
│   ├── routes.ts             # Rotas da API
│   ├── storage.ts            # Interface Supabase
│   ├── objectStorage.ts      # Upload de PDFs
│   └── supabase.ts           # Cliente Supabase
└── shared/
    └── schema.ts             # Schemas compartilhados
```

### 5. Funcionalidades

#### Landing Page (`/`)
- Formulário de captura de contratos
- Upload de PDF
- Validação de dados
- Envio para Supabase
- Webhook automático

#### Login Admin (`/login`)
- Autenticação via Supabase
- Sessão persistente

#### Dashboard Admin (`/admin`)
- Lista todos os contratos
- Estatísticas (total, mês atual)
- Busca por nome/telefone/produto
- Download de PDFs
- Exclusão de contratos
- Modal de detalhes

### 6. Webhook

O sistema suporta webhook configurável que dispara ao criar um novo contrato.

**Payload do Webhook:**
```json
{
  "event": "contract.created",
  "data": {
    "id": "uuid",
    "clientName": "Nome do Cliente",
    "clientPhone": "(00) 00000-0000",
    "contractDuration": "1_year",
    "product": "Produto",
    "pdfUrl": "/objects/...",
    "submittedAt": "2025-10-30T..."
  },
  "timestamp": "2025-10-30T..."
}
```

### 7. Como Usar

1. **Capturar Contratos**: Acesse `/` e preencha o formulário
2. **Login Admin**: Acesse `/login` com as credenciais
3. **Gerenciar**: Acesse `/admin` para visualizar todos os contratos
4. **Configurar Webhook**: Adicione endpoint no painel admin (futura feature)

### 8. Design ARVEN

O sistema segue a identidade visual ARVEN:
- **Cores Primárias**: Azul Navy (#1a2332)
- **Tipografia**: Inter
- **Estilo**: Profissional, moderno, clean
- **Responsivo**: Mobile-first design

### 9. Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express, Node.js
- **Database**: Supabase (PostgreSQL)
- **Storage**: Replit Object Storage (Google Cloud Storage)
- **Auth**: Session-based authentication

---

**Desenvolvido com ❤️ para ARVEN Assessoria de Aquisição**
