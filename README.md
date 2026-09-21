# SICGT Backend

API REST em Node.js, Express e TypeScript para o Sistema de Comunicação e Gestão de Tarefas.

## Requisitos

- Node.js 20+
- PostgreSQL compatível com Supabase Connection Pooler

## Instalação

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com suas credenciais Supabase, execute `migrations/001_initial.sql` no banco de dados e inicie:

```bash
npm run dev
```

Produção:

```bash
npm run build
npm start
```

Teste de saúde: `GET http://localhost:3000/`.

## Variáveis de Ambiente

Consulte `.env.example`. Gere um segredo JWT real com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Nunca versionar `.env` ou credenciais reais no repositório.

## Autenticação

Envie o access token nas rotas protegidas:

```
Authorization: Bearer SEU_ACCESS_TOKEN
```

Exemplo de login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@empresa.com","password":"Senha@Forte123"}'
```

O access token dura 15 minutos. O refresh token dura 30 dias, é armazenado somente como hash e é rotacionado em `/auth/refresh`.

## Endpoints

### Autenticação
- `POST /auth/register` — cadastro público com papel `cliente`
- `POST /auth/login` — login
- `POST /auth/refresh` — renovar e rotacionar tokens
- `POST /auth/logout` — revogar refresh token

### Usuários
- `GET /users?role=&status=` — listar (admin, gestor)
- `POST /users` — criar (admin)
- `GET /users/:id` — perfil próprio ou gestão por admin/gestor
- `PUT /users/:id` — atualizar; papel/status somente por admin
- `DELETE /users/:id` — exclusão lógica (admin)
- `POST /users/:id/password` — trocar senha própria ou redefinir como admin

### Clientes
- `GET /clients?page=1&limit=20`
- `POST /clients`
- `GET /clients/:id`
- `PUT /clients/:id`
- `DELETE /clients/:id`

### Documentos
- `GET /documents?type=&client_id=&uploaded_by=`
- `POST /documents`
- `GET /documents/:id`
- `PUT /documents/:id`
- `DELETE /documents/:id`

### Tarefas
- `GET /tasks?status=&priority=&assignee=`
- `POST /tasks`
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

Leitura de clientes, documentos e tarefas aceita os quatro papéis. Mutações aceitam admin, contador e gestor. Todas as mutações autenticadas bem-sucedidas geram registros em `audit_logs`. Exclusões de usuários, clientes, documentos e tarefas são lógicas.

## Primeiro Administrador

Crie inicialmente um usuário por `/auth/register`; depois, no console SQL seguro do banco, altere seu papel:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'seu@email.com');
```

## Vercel

O `vercel.json` está incluído. Configure as mesmas variáveis do `.env` no projeto Vercel. Não defina segredos reais no repositório.
