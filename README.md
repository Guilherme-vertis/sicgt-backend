# 🚀 SICGT - Sistema Integrado de Gestão de Comunicação e Tarefas Contábil

Backend Node.js/Express para automação de fluxos contábeis, rastreamento de emails e gestão de tarefas.

## 📋 Fase 1: Core Backend & Autenticação ✅ COMPLETA

### O que foi implementado

✅ **Setup inicial** - Node.js + Express com estrutura profissional  
✅ **Autenticação JWT** - Tokens de acesso e refresh com expiração  
✅ **Roles e Autorização** - 4 roles (admin, contador, gestor, cliente)  
✅ **Schema PostgreSQL** - 4 tabelas estruturadas com índices  
✅ **CRUD Usuários** - Criar, listar, atualizar, desativar  
✅ **CRUD Clientes** - Criar, listar, atualizar, desativar  
✅ **Auditoria completa** - Logs de todas as ações do sistema  

---

## 🛠️ Setup Local

### Pré-requisitos

- Node.js v16+
- PostgreSQL 12+
- npm ou yarn

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Criar Banco de Dados

```bash
# Conecte ao PostgreSQL
psql -U postgres

# Crie o banco
CREATE DATABASE sicgt;
\q
```

### 3. Executar Schema SQL

```bash
# Aplique as tabelas
psql -U postgres -d sicgt -f schema.sql
```

### 4. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env com suas credenciais locais
# Mude apenas se precisar (padrões funcionam localmente)
```

**Exemplo de .env para desenvolvimento local:**

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sicgt

JWT_SECRET=minha_chave_super_secreta_desenvolvimento
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

COMPANY_NAME=Speed Neves Contabilidade
COMPANY_EMAIL=contabilidade@speedneves.com.br

LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

### 5. Seed do Banco (Dados Iniciais)

```bash
npm run db:seed
```

**Usuários criados:**
- **Admin:** admin@speedneves.com.br / `admin123`
- **Contador:** contador@speedneves.com.br / `contador123`
- **Gestor:** gestor@speedneves.com.br / `gestor123`

**⚠️ Importante:** Altere as senhas padrão imediatamente em produção.

### 6. Iniciar Servidor

**Desenvolvimento (com hot-reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

Servidor será iniciado em: **http://localhost:3000**

---

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### Autenticação (`/auth`)

**Login**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@speedneves.com.br",
  "password": "admin123"
}

# Response 200
{
  "message": "Login realizado com sucesso.",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@speedneves.com.br",
    "name": "Administrador Sistema",
    "role": "admin"
  }
}
```

**Refresh Token**
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

# Response 200
{
  "message": "Access token renovado.",
  "accessToken": "eyJhbGc..."
}
```

**Logout**
```bash
POST /auth/logout
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

# Response 200
{
  "message": "Logout realizado com sucesso."
}
```

**Registrar Novo Usuário** (admin only)
```bash
POST /auth/register
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "email": "novo@speedneves.com.br",
  "password": "senha_segura",
  "name": "Novo Contador",
  "role": "contador"
}

# Response 201
{
  "message": "Usuário registrado com sucesso.",
  "user": {
    "id": 4,
    "email": "novo@speedneves.com.br",
    "name": "Novo Contador",
    "role": "contador"
  }
}
```

### Usuários (`/users`)

**Listar Todos** (admin only)
```bash
GET /users
Authorization: Bearer eyJhbGc...
```

**Obter Usuário Específico**
```bash
GET /users/1
Authorization: Bearer eyJhbGc...
```

**Atualizar Usuário**
```bash
PUT /users/1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "name": "Novo Nome",
  "email": "newemail@speedneves.com.br",
  "password": "nova_senha"
}
```

**Desativar Usuário** (admin only)
```bash
DELETE /users/1
Authorization: Bearer eyJhbGc...
```

### Clientes (`/clients`)

**Criar Cliente**
```bash
POST /clients
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "email": "contato@cliente.com.br",
  "company_name": "Minha Empresa Ltda",
  "legal_name": "MINHA EMPRESA LIMITADA",
  "cnpj": "12.345.678/0001-90",
  "phone": "11-3000-0000",
  "contact_person": "João Silva",
  "billing_email": "financeiro@cliente.com.br",
  "notes": "Cliente especial com contrato anual"
}

# Response 201
{
  "message": "Cliente criado com sucesso.",
  "client": {
    "id": 1,
    "email": "contato@cliente.com.br",
    "company_name": "Minha Empresa Ltda",
    "cnpj": "12.345.678/0001-90",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Listar Clientes**
```bash
GET /clients
Authorization: Bearer eyJhbGc...

# Query parameters
GET /clients?active_only=true  # apenas ativos (default)
GET /clients?active_only=false # todos
```

**Obter Cliente Específico**
```bash
GET /clients/1
Authorization: Bearer eyJhbGc...
```

**Atualizar Cliente**
```bash
PUT /clients/1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "company_name": "Novo Nome da Empresa",
  "phone": "11-3000-1111",
  "notes": "Atualizado em janeiro"
}
```

**Desativar Cliente** (admin only)
```bash
DELETE /clients/1
Authorization: Bearer eyJhbGc...
```

---

## 🔐 Segurança & Autenticação

### Fluxo JWT

1. **Login** → Recebe `accessToken` (1h) + `refreshToken` (7d)
2. **Requisições** → Inclua `Authorization: Bearer <accessToken>`
3. **Token Expirado** → Use `refreshToken` para gerar novo `accessToken`
4. **Logout** → Revoga `refreshToken` no banco

### Roles e Permissões

| Role | Permissões |
|------|-----------|
| **admin** | Registra usuários, cria/atualiza/desativa clientes e usuários, acesso total |
| **contador** | Cria/atualiza clientes, visualiza dados, prepara documentos |
| **gestor** | Gerencia tarefas, visualiza status, atribui trabalhos |
| **cliente** | Acessa seus próprios documentos e tarefas (implementado na Fase 4) |

### Password Hashing

- Senhas são hashadas com **bcryptjs** (salt rounds: 10)
- Comparação em runtime, nunca armazenadas em plain text

---

## 📊 Schema de Banco de Dados

### Tabela: `users`
```sql
id (serial, pk)
email (varchar, unique)
password_hash (varchar)
name (varchar)
role (varchar) - admin | contador | gestor | cliente
is_active (boolean)
last_login (timestamp)
created_at, updated_at (timestamp)
created_by (fk → users.id)
```

### Tabela: `clients`
```sql
id (serial, pk)
email (varchar, unique)
company_name (varchar)
legal_name (varchar)
cnpj (varchar, unique)
phone, contact_person, billing_email (varchar)
is_active (boolean)
created_at, updated_at (timestamp)
created_by (fk → users.id)
notes (text)
```

### Tabela: `audit_logs`
```sql
id (serial, pk)
user_id (fk → users.id)
action (varchar) - CREATE, UPDATE, DELETE, LOGIN, LOGOUT, REGISTER
resource_type (varchar) - user, client, document, task, email
resource_id (int)
details (jsonb)
ip_address (varchar)
status (varchar) - success | error
created_at (timestamp)
```

### Tabela: `refresh_tokens`
```sql
id (serial, pk)
user_id (fk → users.id)
token (varchar, unique)
expires_at (timestamp)
is_revoked (boolean)
created_at (timestamp)
```

---

## 🧪 Testes com curl/Postman

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login e Obter Tokens
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@speedneves.com.br",
    "password": "admin123"
  }'

# Salve o accessToken retornado
TOKEN="eyJhbGc..."
```

### 3. Usar Token em Requisição
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/users
```

### 4. Criar Cliente
```bash
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo.cliente@example.com",
    "company_name": "Nova Empresa",
    "cnpj": "11.222.333/0001-44",
    "phone": "11-9999-8888",
    "contact_person": "Ana Silva"
  }'
```

---

## 📝 Logs e Auditoria

Toda ação é registrada em `audit_logs`:

```sql
-- Ver logs de um usuário
SELECT * FROM audit_logs WHERE user_id = 1 ORDER BY created_at DESC LIMIT 10;

-- Ver logs de criação de clientes
SELECT * FROM audit_logs WHERE action = 'CREATE' AND resource_type = 'client';

-- Ver tentativas de login falhadas
SELECT * FROM audit_logs WHERE action = 'LOGIN' AND status = 'error';
```

---

## 🚀 Próximos Passos (Fase 2)

A Fase 2 implementará:

1. **Upload & Armazenamento de Documentos** - API para receber PDFs
2. **Classificação Automática** - PDF parsing + heurísticas
3. **Google Drive Integration** - Armazenar documentos na nuvem
4. **Metadados** - Extração de datas, valores, clientes

**Banco de dados será expandido com:**
- Tabela `documents` (PDF uploads, metadados, status)
- Tabela `document_classifications` (tipo, confiança, histórico)
- Índices para busca eficiente

---

## 📖 Documentação Adicional

- **Architecture:** Veja `schema.sql` para modelo relacional
- **Security:** JWT roles-based, validação de input, rate limit (Fase 3)
- **Error Handling:** Todos os endpoints retornam status HTTP apropriados

---

## ⚙️ Variáveis de Ambiente (Referência Completa)

```env
# Node
NODE_ENV=development|production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sicgt

# JWT
JWT_SECRET=chave_super_secreta
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Empresa
COMPANY_NAME=Speed Neves Contabilidade
COMPANY_EMAIL=contabilidade@speedneves.com.br

# Logging
LOG_LEVEL=debug|info|warn|error

# CORS (comma-separated)
CORS_ORIGIN=http://localhost:3001,http://localhost:5173

# Gmail (Fase 3)
# GMAIL_CLIENT_ID=
# GMAIL_CLIENT_SECRET=
# GMAIL_REFRESH_TOKEN=

# Google Drive (Fase 2)
# GOOGLE_DRIVE_API_KEY=

# AWS S3 (opcional)
# AWS_S3_BUCKET=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

---

## 📞 Suporte

Para dúvidas ou problemas, verifique:

1. Banco PostgreSQL está rodando: `psql -U postgres -l`
2. Variáveis .env estão corretas
3. Logs do servidor: `npm run dev` com `LOG_LEVEL=debug`
4. Tabelas criadas: `psql -U postgres -d sicgt -c "\dt"`

---

**Speed Neves Contabilidade © 2024**  
*Automatizando fluxos contábeis com tecnologia.*
