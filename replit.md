# ARVEN - Sistema de Captura de Contratos

## Visão Geral

Sistema profissional de captura e gestão de contratos desenvolvido para ARVEN Assessoria de Aquisição. Permite que clientes enviem contratos assinados via formulário web e que administradores gerenciem todos os contratos através de um painel administrativo.

## Funcionalidades Implementadas

### Login Administrativo (/ e /login)
- Autenticação via Supabase
- Sistema de sessões persistente
- Toggle de visualização de senha
- Interface clean e profissional

### Dashboard Administrativo (/admin) - ACESSO PRIVADO
- **Cinco Abas de Funcionalidades**:
  - **Analytics**: Dashboard com gráficos profissionais e métricas financeiras
    - **Filtros Avançados**:
      - Período: Último mês, 3 meses, 6 meses, 1 ano, 2 anos, ou todo o período
      - Produto: Filtra por produto específico ou todos os produtos
      - Duração: Filtra por duração do contrato (3 meses, 6 meses, 1 ano, 2 anos)
      - Indicador visual mostrando "Exibindo X de Y contratos" quando filtros ativos
    - Faturamento total e mensal (calculado sobre contratos filtrados)
    - MRR (Monthly Recurring Revenue) com filtros aplicados
    - Ticket médio
    - Evolução de faturamento ao longo do tempo (período dinâmico)
    - Distribuição por produto
    - Distribuição por duração
    - Top produtos por receita
  - **Todos os Contratos**: Lista completa de todos os contratos cadastrados
  - **Contratos Ativos**: Mostra apenas contratos ativos ou expirando em breve
  - **Novo Contrato**: Formulário para admins criarem novos contratos
  - **Webhook**: Configuração de notificações automáticas
- **Criação de Contratos (PRIVADO)**:
  - Apenas admins logados podem criar contratos
  - Formulário completo com validação:
    - Nome do Cliente
    - Telefone
    - Razão Social (empresa)
    - CPF/CNPJ
    - Duração do Contrato (3 meses, 6 meses, 1 ano, 2 anos)
    - Produto
    - Valor do Ticket
    - **Data de Início do Contrato** (permite importar contratos já em execução)
    - **Frequência de Pagamento** (Mensal, Trimestral, Semestral, Anual, À Vista)
  - Upload seguro de PDF do contrato assinado
  - Validação de todos os campos obrigatórios
- **Estatísticas**: Cards com métricas (total, contratos do mês, PDFs recebidos)
- **Busca**: Filtro por nome, telefone ou produto
- **Status de Expiração**: 
  - Cálculo automático baseado em data de início + duração do contrato
  - Badge visual com status (Ativo = verde, Expirando ≤30 dias = laranja, Expirado = vermelho)
  - Dias restantes até expiração
  - Data de expiração calculada
- **Download de PDFs**: Acesso direto aos contratos assinados
- **Gestão**: Visualizar detalhes completos e excluir contratos
- **Sidebar**: Navegação lateral fixa com logo ARVEN e botões de navegação
- **Logout**: Sistema de logout seguro

## Arquitetura Técnica

### Frontend
- **Framework**: React 18 com TypeScript
- **Roteamento**: Wouter (lightweight router)
- **Estilização**: Tailwind CSS + Shadcn UI
- **Formulários**: React Hook Form + Zod
- **Estado**: TanStack Query (React Query v5)
- **UI Components**: Shadcn (Button, Card, Input, Select, Table, Dialog, etc.)

### Backend
- **Framework**: Express.js
- **Autenticação**: Session-based com express-session
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (persistente, CDN global)
- **Upload**: Multer para processamento de arquivos
- **Validação**: Zod schemas compartilhados

### Database Schema (Supabase)

```sql
-- Tabela de usuários administrativos
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP
)

-- Tabela de contratos
contracts (
  id UUID PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  document TEXT NOT NULL,
  contract_duration TEXT NOT NULL,
  product TEXT NOT NULL,
  ticket_value TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  payment_frequency TEXT NOT NULL,
  submitted_at TIMESTAMP
)

-- Configuração de webhook
webhook_config (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  is_active TEXT DEFAULT 'true',
  updated_at TIMESTAMP
)
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login administrativo
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual (autenticado)

### Contratos
- `GET /api/contracts` - Listar todos os contratos (autenticado)
- `POST /api/contracts` - Criar novo contrato (público)
- `DELETE /api/contracts/:id` - Excluir contrato (autenticado)

### Upload de PDFs (Supabase Storage)
- `POST /api/upload/supabase` - Upload direto para Supabase Storage
- `GET /api/storage/:filePath` - Download com URL assinada temporária

### Webhook
- `GET /api/webhook` - Obter configuração (autenticado)
- `POST /api/webhook` - Atualizar configuração (autenticado)

## Webhook

Quando um novo contrato é criado, o sistema envia automaticamente um webhook (se configurado):

```json
{
  "event": "contract.created",
  "data": {
    "id": "uuid",
    "clientName": "Nome do Cliente",
    "clientPhone": "(00) 00000-0000",
    "contractDuration": "1_year",
    "product": "Produto Selecionado",
    "ticketValue": "R$ 1.500,00",
    "pdfUrl": "/objects/uploads/...",
    "submittedAt": "2025-10-30T..."
  },
  "timestamp": "2025-10-30T..."
}
```

## Setup Inicial

### Credenciais de Acesso
- **Email**: admin@arven.com
- **Senha**: admin123

⚠️ Execute o SQL em `supabase_setup.sql` no Supabase SQL Editor para criar as tabelas.

### Migração de Banco de Dados

⚠️ **IMPORTANTE**: Execute as seguintes migrações SQL no Supabase SQL Editor (na ordem):

1. **supabase_setup.sql** - Criação inicial das tabelas (apenas primeira instalação)
2. **supabase_add_company_fields.sql** - Adiciona campos de Razão Social e CPF/CNPJ (se já tinha o sistema antes)
3. **supabase_add_payment_and_date_fields.sql** - Adiciona campos de Data de Início e Frequência de Pagamento (NOVA MIGRATION - OBRIGATÓRIA)

⚠️ **CRÍTICO**: Execute `supabase_add_payment_and_date_fields.sql` ANTES de fazer deploy do código atualizado, caso contrário o sistema falhará ao criar novos contratos!

## Identidade Visual ARVEN

### Cores
- **Primary (Navy Blue)**: #1a2332 (217, 91%, 35%)
- **Background**: Branco / Navy escuro (dark mode)
- **Text**: Tons de cinza / branco para contraste
- **Success**: Verde #10b981
- **Error**: Vermelho #ef4444

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Headers**: Bold, tracking-tight
- **Body**: Regular, leading-relaxed
- **Labels**: Uppercase, tracking-wide

### Componentes
- **Botões**: Rounded-lg, height 12-14, primary color
- **Cards**: Shadow-xl, rounded-xl, padding generoso
- **Inputs**: Height 12, border-2, focus states claros
- **Upload**: Drag-and-drop com feedback visual

## Fluxo de Usuário

### Admin (Dashboard)
1. Acessa / ou /login
2. Faz login com credenciais (admin@arven.com / admin123)
3. É redirecionado para /admin
4. **Pode criar novos contratos**:
   - Clica em "Novo Contrato" na sidebar
   - Preenche dados do cliente
   - Seleciona duração e produto
   - Faz upload do PDF assinado
   - Salva o contrato
5. Visualiza estatísticas e lista de contratos
6. Navega entre abas (Todos / Ativos / Novo / Webhook)
7. Pode buscar, visualizar detalhes e baixar PDFs
8. Pode excluir contratos se necessário
9. Configura webhook para notificações automáticas
10. Logout quando terminar

## Segurança

- **Senhas com Hash Bcrypt**: Todas as senhas são hashadas com bcrypt (10 rounds) antes de serem armazenadas
- **Sessões Seguras**: HttpOnly cookies com expiração de 7 dias
- **Row Level Security**: Habilitado no Supabase para todas as tabelas
- **Supabase Storage Privado**: Bucket privado com políticas RLS
- **URLs Assinadas**: PDFs acessíveis apenas via URLs temporárias (1 hora)
- **Validação de Arquivos**: Apenas PDFs são aceitos no upload (10MB máx)
- **CSRF Protection**: via express-session
- **Autenticação Protegida**: Middleware isAuthenticated em rotas sensíveis

## Performance

- Supabase Storage com CDN global
- URLs assinadas com cache de 1 hora
- Queries otimizadas com índices
- React Query para cache de dados
- Loading states para melhor UX
- Upload direto sem intermediários

## Responsividade

- Mobile-first design
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Grid adaptável para cards de duração
- Sidebar responsiva (converte em nav inferior em mobile)
- Tabelas com scroll horizontal em mobile

## Status de Contratos

O sistema calcula automaticamente o status de cada contrato:

- **Ativo** (Verde): Mais de 30 dias restantes
- **Expirando** (Laranja): 30 dias ou menos até expirar
- **Expirado** (Vermelho): Data de expiração já passou

Cálculo de expiração:
- Data de início: `start_date` (data real de início do contrato)
- Duração: 3 meses, 6 meses, 1 ano ou 2 anos
- Data de expiração: Data de início + duração do contrato

## Filtros do Analytics

Os filtros do Analytics trabalham em conjunto (lógica AND):

### Filtro de Período
- Filtra contratos com base na `startDate`
- Opções: Último mês, 3 meses, 6 meses, 1 ano, 2 anos, todo o período
- Default: Últimos 6 meses
- Os gráficos adaptam dinamicamente ao período selecionado

### Filtro de Produto
- Filtra contratos por produto exato
- Opções: "Todos os produtos" + lista dinâmica de produtos únicos
- Default: Todos os produtos

### Filtro de Duração
- Filtra contratos por duração do contrato
- Opções: Todas as durações, 3 Meses, 6 Meses, 1 Ano, 2 Anos
- Default: Todas as durações

### Comportamento dos Filtros
- Todos os três filtros trabalham em conjunto (AND logic)
- Métricas (Faturamento, MRR, Ticket Médio) recalculam com base nos contratos filtrados
- Gráficos de evolução temporal adaptam ao período selecionado
- Quando filtros reduzem o número de contratos, aparece indicador "Exibindo X de Y contratos"

## Cálculo de MRR (Monthly Recurring Revenue)

O MRR é calculado normalizando o valor total do contrato pela duração em meses:
- **MRR = Valor Total do Contrato / Duração em Meses**
- A frequência de pagamento não afeta o MRR normalizado
- **IMPORTANTE**: `ticketValue` deve SEMPRE ser o **valor TOTAL do contrato** (não o valor de cada parcela)
- O formulário de criação de contratos deixa isso explícito no label e no helper text

Exemplos corretos:
- Contrato de R$ 12.000 por 1 ano (12 meses): MRR = R$ 1.000
- Contrato de R$ 6.000 por 6 meses: MRR = R$ 1.000
- Independente se pago mensal, trimestral, semestral ou à vista

❌ Exemplo ERRADO:
- Inserir R$ 1.000 (valor mensal) para contrato de 12 meses → MRR calculado incorretamente como R$ 83,33
- SEMPRE insira o valor total: R$ 12.000

## Frequências de Pagamento

- **Mensal**: 12 pagamentos por ano
- **Trimestral**: 4 pagamentos por ano
- **Semestral**: 2 pagamentos por ano
- **Anual**: 1 pagamento por ano
- **À Vista**: Pagamento único no início

## Próximos Passos (Futuras Melhorias)

- [ ] Interface para configurar webhook no admin
- [ ] Filtros avançados (por data, status de expiração, produto)
- [ ] Exportação de dados (CSV/Excel)
- [ ] Notificações por email quando contratos estiverem próximos de expirar
- [ ] Renovação automática de contratos
- [ ] Assinatura digital integrada
- [ ] Validação de telefone brasileiro
- [ ] Multi-tenant support
- [ ] Auditoria de ações admin
- [ ] Dashboard com gráficos de métricas

## Estrutura de Arquivos

```
.
├── client/                     # Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── components/
│   │   │   ├── Logo.tsx
│   │   │   └── ui/             # Shadcn components
│   │   ├── lib/
│   │   │   └── queryClient.ts
│   │   └── App.tsx
│   └── index.html
├── server/                     # Backend
│   ├── routes.ts               # API routes
│   ├── storage.ts              # Supabase integration
│   ├── supabase.ts             # Supabase client
│   ├── objectStorage.ts        # Object storage service
│   ├── objectAcl.ts            # Access control
│   └── index.ts                # Server entry
├── shared/
│   └── schema.ts               # Shared types & validation
├── supabase_setup.sql          # Database setup
├── design_guidelines.md        # Design system
└── README_SETUP.md             # Setup instructions
```

## Tecnologias Utilizadas

- TypeScript
- React 18
- Express.js
- Supabase (PostgreSQL)
- Replit Object Storage (GCS)
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod
- TanStack Query
- Wouter
- date-fns

---

**Status**: MVP Completo e Funcional  
**Desenvolvido**: Outubro 2025  
**Cliente**: ARVEN Assessoria de Aquisição
