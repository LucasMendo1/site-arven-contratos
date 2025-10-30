# ARVEN - Sistema de Captura de Contratos

## Visão Geral

Sistema profissional de captura e gestão de contratos desenvolvido para ARVEN Assessoria de Aquisição. Permite que clientes enviem contratos assinados via formulário web e que administradores gerenciem todos os contratos através de um painel administrativo.

## Funcionalidades Implementadas

### Landing Page (/)
- **Formulário Multi-Etapa**: Coleta de dados do cliente em etapas visuais claras
  - Nome do cliente
  - Número de telefone
  - Tempo de contrato (3 meses, 6 meses, 1 ano, 2 anos)
  - Produto comprado
  - Valor do ticket (valor cobrado)
  - Upload de PDF do contrato assinado
- **Upload de PDF**: Sistema seguro de upload usando Object Storage
- **Validação**: Validação completa de dados usando Zod
- **Design ARVEN**: Interface profissional seguindo cores da marca (azul navy #1a2332)
- **Feedback Visual**: Estados de loading, sucesso e erro bem projetados

### Login Administrativo (/login)
- Autenticação via Supabase
- Sistema de sessões persistente
- Toggle de visualização de senha
- Interface clean e profissional

### Dashboard Administrativo (/admin)
- **Duas Abas de Visualização**:
  - **Todos os Contratos**: Lista completa de todos os contratos enviados
  - **Contratos Ativos**: Mostra apenas contratos ativos ou expirando em breve
- **Estatísticas**: Cards com métricas (total, contratos do mês, PDFs recebidos)
- **Busca**: Filtro por nome, telefone ou produto em ambas as abas
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
- **Storage**: Replit Object Storage (Google Cloud Storage)
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
  contract_duration TEXT NOT NULL,
  product TEXT NOT NULL,
  ticket_value TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
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

### Upload de PDFs
- `POST /api/objects/upload` - Obter URL de upload
- `POST /api/contracts/pdf` - Processar PDF após upload
- `GET /objects/:objectPath` - Acessar PDF

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

### Cliente (Landing Page)
1. Acessa a landing page
2. Vê informações sobre ARVEN e formulário
3. Preenche dados pessoais
4. Seleciona tempo de contrato (radio buttons estilizados)
5. Escolhe produto do dropdown
6. Faz upload do PDF do contrato
7. Submete o formulário
8. Recebe confirmação de sucesso

### Admin (Dashboard)
1. Acessa /login
2. Faz login com credenciais
3. É redirecionado para /admin
4. Visualiza estatísticas e lista de contratos
5. Pode buscar, visualizar detalhes e baixar PDFs
6. Pode excluir contratos se necessário
7. Logout quando terminar

## Segurança

- **Senhas com Hash Bcrypt**: Todas as senhas são hashadas com bcrypt (10 rounds) antes de serem armazenadas
- **Sessões Seguras**: HttpOnly cookies com expiração de 7 dias
- **Row Level Security**: Habilitado no Supabase para todas as tabelas
- **ACL Policy**: Controle de acesso aos PDFs via Object Storage
- **Validação de Arquivos**: Apenas PDFs são aceitos no upload
- **CSRF Protection**: via express-session
- **Autenticação Protegida**: Middleware isAuthenticated em rotas sensíveis

## Performance

- Object Storage para PDFs (CDN-backed)
- Cache de 1 hora para PDFs públicos
- Queries otimizadas com índices
- React Query para cache de dados
- Loading states para melhor UX

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
- Data de início: `submitted_at` (data de envio do contrato)
- Duração: 3 meses, 6 meses, 1 ano ou 2 anos
- Data de expiração: Data de início + duração do contrato

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
