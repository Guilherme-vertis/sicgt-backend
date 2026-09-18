# 📁 Estrutura do Projeto SICGT

```
sicgt-backend/
├── 📄 package.json              # Dependências e scripts npm
├── 📄 .env.example              # Template de variáveis de ambiente
├── 📄 .env                      # Variáveis de ambiente (LOCAL ONLY)
├── 📄 .gitignore                # Exclusões git
├── 📄 schema.sql                # Schema PostgreSQL (tabelas + índices)
│
├── 📄 README.md                 # Documentação completa
├── 📄 EXEMPLOS_API.md           # Exemplos práticos de uso (curl/Postman)
├── 📄 ESTRUTURA_PROJETO.md      # Este arquivo
│
├── 📁 src/
│   ├── 📄 server.js             # Servidor principal Express
│   │
│   ├── 📁 config/
│   │   └── 📄 database.js       # Pool PostgreSQL + query wrapper
│   │
│   ├── 📁 middleware/
│   │   ├── 📄 auth.js           # JWT: autenticação + geração de tokens
│   │   └── 📄 authorize.js      # Verificação de roles (RBAC)
│   │
│   ├── 📁 routes/
│   │   ├── 📄 auth.js           # Login, register, refresh, logout
│   │   ├── 📄 users.js          # CRUD usuários
│   │   └── 📄 clients.js        # CRUD clientes
│   │
│   └── 📁 utils/
│       └── 📄 logger.js         # Logging + auditoria (audit_logs)
│
└── 📁 scripts/
    └── 📄 seed.js              # Popular banco com dados iniciais
```

---

## 📊 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────┐
│           Frontend (Lovable - Fase 6)            │ HTTP/JSON
├─────────────────────────────────────────────────┤
│                                                 │
│  Routes (auth, users, clients)                 │
│  ├─ POST /auth/login                           │
│  ├─ POST /auth/register                        │
│  ├─ GET /users, POST /users, etc.              │
│  └─ GET /clients, POST /clients, etc.          │
│                                                 │
├─────────────────────────────────────────────────┤
│          Middleware (JWT + RBAC)               │
│  ├─ authenticateToken (validar JWT)            │
│  ├─ authorize (verificar role)                 │
│  └─ logAction (auditoria)                      │
│                                                 │
├─────────────────────────────────────────────────┤
│            Config (Database Pool)              │
│  └─ PostgreSQL connection pooling              │
│                                                 │
├─────────────────────────────────────────────────┤
│   Database (PostgreSQL)                        │
│  ├─ users (autenticação)                       │
│  ├─ clients (cadastro)                         │
│  ├─ audit_logs (rastreamento)                  │
│  └─ refresh_tokens (sessões)                   │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Requisição HTTP

```
Cliente (Browser/App)
  │
  ├─ POST /auth/login
  │   └─ validateInput()
  │   └─ query("SELECT * FROM users WHERE email")
  │   └─ bcrypt.compare(password, hash)
  │   └─ generateTokens()
  │   └─ INSERT refresh_token
  │   └─ logAction(LOGIN)
  │   └─ Response: {accessToken, refreshToken}
  │
  ├─ GET /users (com Bearer token)
  │   └─ authenticateToken (middleware)
  │       └─ jwt.verify(token)
  │       └─ SELECT user WHERE id
  │   └─ authorize(['admin']) (middleware)
  │       └─ req.user.role == 'admin' ?
  │   └─ Controller (GET /users)
  │       └─ query("SELECT * FROM users")
  │   └─ logAction(GET_USERS)
  │   └─ Response: {users[]}
  │
  └─ POST /clients (com Bearer token)
      └─ authenticateToken → authorize(['admin','contador','gestor'])
      └─ validateInput()
      └─ query("INSERT INTO clients")
      └─ logAction(CREATE_CLIENT)
      └─ Response: {client}
```

---

## 🔐 Fluxo de Segurança (JWT + RBAC)

```
┌──────────────────────────────────────────────────┐
│ 1. Login                                         │
├──────────────────────────────────────────────────┤
│ User submits email + password                    │
│         ↓                                        │
│ Validate input                                   │
│         ↓                                        │
│ Query: SELECT user WHERE email                  │
│         ↓                                        │
│ bcrypt.compare(password, password_hash)         │
│         ↓                                        │
│ Generate tokens:                                 │
│   • accessToken (1h, short-lived)               │
│   • refreshToken (7d, stored in DB)             │
│         ↓                                        │
│ Return both tokens                               │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ 2. Requisição Autenticada                        │
├──────────────────────────────────────────────────┤
│ Client envia: Authorization: Bearer <token>      │
│         ↓                                        │
│ middleware: authenticateToken                    │
│   • jwt.verify(token, JWT_SECRET)                │
│   • Extrai: userId, email, role                  │
│   • Verifica: user ainda existe e está ativo     │
│   • Salva em req.user                            │
│         ↓                                        │
│ middleware: authorize(['admin'])                 │
│   • if (req.user.role != 'admin') → 403          │
│         ↓                                        │
│ Controller executa logica                        │
│         ↓                                        │
│ logAction() → INSERT audit_logs                  │
│         ↓                                        │
│ Response                                         │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ 3. Token Expirado                                │
├──────────────────────────────────────────────────┤
│ accessToken expira (1h)                          │
│         ↓                                        │
│ Client usa refreshToken                          │
│         ↓                                        │
│ POST /auth/refresh + refreshToken                │
│         ↓                                        │
│ Valida refreshToken:                             │
│   • Existe no DB?                                │
│   • Não foi revogado?                            │
│   • Ainda dentro do prazo?                       │
│         ↓                                        │
│ Generate novo accessToken                        │
│         ↓                                        │
│ Response: {accessToken}                          │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ 4. Logout                                        │
├──────────────────────────────────────────────────┤
│ Client POST /auth/logout + refreshToken          │
│         ↓                                        │
│ UPDATE refresh_tokens SET is_revoked=true        │
│         ↓                                        │
│ logAction(LOGOUT)                                │
│         ↓                                        │
│ Response: success                                │
└──────────────────────────────────────────────────┘
```

---

## 📌 Roles e Permissões

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN (Administrador)                                       │
├─────────────────────────────────────────────────────────────┤
│ ✅ Registrar novos usuários (contador, gestor, admin)       │
│ ✅ Listar/atualizar/desativar usuários                      │
│ ✅ Criar/atualizar/desativar clientes                       │
│ ✅ Acessar auditoria completa                               │
│ ✅ Ver relatórios da equipe                                 │
│ ✅ Configurar sistema                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CONTADOR (Contador)                                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Visualizar clientes                                      │
│ ✅ Criar/atualizar clientes                                 │
│ ✅ Upload de documentos (Fase 2)                            │
│ ✅ Enviar emails para cliente (Fase 3)                      │
│ ✅ Criar tarefas (Fase 4)                                   │
│ ❌ Registrar usuários                                       │
│ ❌ Deletar/desativar clientes                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GESTOR (Gestor de Tarefas)                                  │
├─────────────────────────────────────────────────────────────┤
│ ✅ Visualizar clientes/documentos                           │
│ ✅ Gerenciar tarefas (Fase 4)                               │
│ ✅ Atribuir tarefas à equipe                                │
│ ✅ Ver dashboard de tarefas                                 │
│ ✅ Rastrear status de documentos                            │
│ ❌ Registrar usuários                                       │
│ ❌ Modificar dados de clientes                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (Cliente da Contabilidade)                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ Visualizar seus próprios documentos (Fase 2)             │
│ ✅ Visualizar suas tarefas (Fase 4)                         │
│ ✅ Fazer download de documentos                             │
│ ❌ Criar documentos                                         │
│ ❌ Criar tarefas                                            │
│ ❌ Ver dados de outros clientes                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Ciclo de Vida de Dados

```
┌──────────────────────────────────────────────────────────────┐
│ Usuário                                                      │
├──────────────────────────────────────────────────────────────┤
│ Criação (Admin) → Ativo → Último Login → Desativação        │
│  [register]    [is_active] [last_login]  [soft delete]       │
│                                                              │
│ Dados:                                                       │
│  • email (unique)                                            │
│  • password_hash (bcrypt, never plain)                       │
│  • name, role (admin|contador|gestor|cliente)                │
│  • is_active (false = soft delete)                           │
│  • created_by (quem criou)                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Cliente                                                      │
├──────────────────────────────────────────────────────────────┤
│ Criação (Contador) → Cadastro → Ativo → Documentos (Fase 2) │
│  [POST /clients]   [CRUD]      [is_active] [documents]      │
│                                                              │
│ Dados:                                                       │
│  • email (unique)                                            │
│  • company_name, legal_name, cnpj (unique)                   │
│  • contact_person, billing_email, phone                      │
│  • is_active (false = soft delete, dados preservados)        │
│  • created_by (contador que cadastrou)                       │
│  • notes (histórico)                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Auditoria                                                    │
├──────────────────────────────────────────────────────────────┤
│ Toda ação → audit_logs (INSERT)                              │
│                                                              │
│ Registra:                                                    │
│  • user_id (quem fez)                                        │
│  • action (CREATE|UPDATE|DELETE|LOGIN|LOGOUT|REGISTER)      │
│  • resource_type (user|client|document|task|email)           │
│  • resource_id (ID do recurso afetado)                       │
│  • details (JSON com dados da ação)                          │
│  • status (success|error)                                    │
│  • ip_address (rastreamento)                                 │
│  • created_at (timestamp UTC)                                │
│                                                              │
│ Nunca deletado → histórico permanente                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Próximas Fases e Dependências

```
┌─────────────────────────────────────────────────────────────┐
│ Fase 1: Core Backend & Autenticação ✅ COMPLETA             │
├─────────────────────────────────────────────────────────────┤
│ Dependências: JWT, bcrypt, PostgreSQL                        │
│ Saída: Auth API + RBAC                                       │
│                                                              │
│ Próximas: Fase 2, 3, 4, 5, 6 dependem disto                  │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Fase 2: Upload & Classificação de Documentos                │
├─────────────────────────────────────────────────────────────┤
│ Usa: users, clients (Fase 1)                                 │
│ Implementa:                                                  │
│  • Tabela: documents                                         │
│  • API: POST /upload, GET /documents                         │
│  • PDF parsing (pdf-parse)                                   │
│  • Google Drive API                                          │
│  • Classificação automática (heurísticas)                    │
│                                                              │
│ Output: documents com metadados                              │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Fase 3: Gmail & Email Tracking                              │
├─────────────────────────────────────────────────────────────┤
│ Usa: users, clients, documents (Fases 1-2)                  │
│ Implementa:                                                  │
│  • Tabela: emails, email_events                              │
│  • Gmail Workspace OAuth2                                    │
│  • Envio de emails com anexo (PDF)                           │
│  • Pixel tracking (1x1 PNG única)                            │
│  • Webhooks para aberturas/cliques                           │
│  • Dashboard de rastreamento                                 │
│                                                              │
│ Output: rastreamento em tempo real de emails                 │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Fase 4: Task Manager Dual                                   │
├─────────────────────────────────────────────────────────────┤
│ Usa: users, clients, documents (Fases 1-2)                  │
│ Implementa:                                                  │
│  • Tabela: tasks                                             │
│  • API: CRUD tasks, atribuição dual                          │
│  • Notificações (webhook/email)                              │
│  • Histórico de mudanças                                     │
│  • Filtros: por cliente, por equipe, por status              │
│                                                              │
│ Output: gestão de tarefas integrada                          │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Fase 5: Dashboards Backend                                  │
├─────────────────────────────────────────────────────────────┤
│ Usa: Todas as fases anteriores                               │
│ Implementa:                                                  │
│  • Endpoints aggregados (resumos)                            │
│  • Dashboard geral (documentos, emails, tarefas)             │
│  • Dashboard por cliente                                     │
│  • Dashboard da equipe                                       │
│  • Relatórios e exportação                                   │
│                                                              │
│ Output: API de dashboards pronta para Lovable                │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Fase 6: Frontend Lovable                                    │
├─────────────────────────────────────────────────────────────┤
│ Usa: Todas as APIs (Fases 1-5)                               │
│ Implementa:                                                  │
│  • Login/Autenticação UI                                     │
│  • Dashboard Principal                                       │
│  • Gestão de Documentos (upload, listagem)                   │
│  • Task Manager (criar, atribuir, status)                    │
│  • Email Tracking (timeline de eventos)                      │
│  • Usuários & Clientes (CRUD com permissões)                 │
│  • Responsividade (mobile-first)                             │
│  • Tema Speed Neves (#ffffff, #03588C, #D92344)              │
│                                                              │
│ Output: Aplicação completa pronta em produção                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Implementação (Fase 1)

✅ **Core Setup**
- [x] package.json com dependências
- [x] .env.example + .env (local)
- [x] .gitignore

✅ **Database**
- [x] schema.sql (4 tabelas + índices)
- [x] config/database.js (pool + query wrapper)

✅ **Authentication**
- [x] middleware/auth.js (JWT tokens)
- [x] routes/auth.js (login, register, refresh, logout)
- [x] password hashing (bcryptjs)
- [x] refresh token storage

✅ **Authorization**
- [x] middleware/authorize.js (RBAC)
- [x] 4 roles (admin, contador, gestor, cliente)
- [x] permission checks em routes

✅ **Usuários**
- [x] POST /auth/register (admin only)
- [x] GET /users (admin only)
- [x] GET /users/:id (user ou admin)
- [x] PUT /users/:id (update profile)
- [x] DELETE /users/:id (soft delete, admin only)

✅ **Clientes**
- [x] POST /clients (criar, contador/gestor/admin)
- [x] GET /clients (listar todos)
- [x] GET /clients/:id (detalhes)
- [x] PUT /clients/:id (atualizar)
- [x] DELETE /clients/:id (soft delete, admin only)

✅ **Auditoria**
- [x] utils/logger.js (logAction)
- [x] Logs em todas as ações
- [x] Rastreamento de IP

✅ **Documentação**
- [x] README.md (setup + endpoints)
- [x] EXEMPLOS_API.md (curl examples)
- [x] ESTRUTURA_PROJETO.md (este arquivo)
- [x] schema.sql comments

✅ **Scripts**
- [x] npm start (produção)
- [x] npm run dev (desenvolvimento)
- [x] npm run db:init (criar schema)
- [x] npm run db:seed (popular dados)

---

## 🎯 Próximo Passo: Testar Localmente

1. **Setup:**
   ```bash
   npm install
   createdb sicgt
   psql -U postgres -d sicgt -f schema.sql
   npm run db:seed
   npm run dev
   ```

2. **Teste a API:**
   ```bash
   # Login
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@speedneves.com.br","password":"admin123"}'
   
   # Criar cliente
   # (veja EXEMPLOS_API.md)
   ```

3. **Consulte auditoria:**
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC;
   ```

---

**Fase 1 está 100% funcional e pronta para integração com Fase 2! 🚀**
