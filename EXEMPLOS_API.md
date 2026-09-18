# 📝 Exemplos de Uso da API SICGT - Fase 1

## 🎯 Cenário: Novo Cliente & Gestão de Usuários

Vamos simular um fluxo completo de login, criação de cliente e auditoria.

---

## 1️⃣ Login & Obter Tokens

**Requisição:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@speedneves.com.br",
    "password": "admin123"
  }'
```

**Resposta (200 OK):**
```json
{
  "message": "Login realizado com sucesso.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0Mjk0MjgsImV4cCI6MTcwNTQzMzAyOH0.abc123...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0Mjk0MjgsImV4cCI6MTcwNjAzNDIyOH0.xyz789...",
  "user": {
    "id": 1,
    "email": "admin@speedneves.com.br",
    "name": "Administrador Sistema",
    "role": "admin"
  }
}
```

**Guarde o `accessToken` para próximas requisições:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0Mjk0MjgsImV4cCI6MTcwNTQzMzAyOH0.abc123..."
```

---

## 2️⃣ Registrar Novo Usuário (Contador)

**Requisição:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@speedneves.com.br",
    "password": "senha_segura_123",
    "name": "Carlos Alberto",
    "role": "contador"
  }'
```

**Resposta (201 Created):**
```json
{
  "message": "Usuário registrado com sucesso.",
  "user": {
    "id": 5,
    "email": "carlos@speedneves.com.br",
    "name": "Carlos Alberto",
    "role": "contador"
  }
}
```

---

## 3️⃣ Criar Novo Cliente

**Requisição:**
```bash
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "financeiro@techtop.com.br",
    "company_name": "TechTop Solutions Ltda",
    "legal_name": "TECHTOP SOLUTIONS LTDA",
    "cnpj": "15.987.654/0001-32",
    "phone": "11-3567-8900",
    "contact_person": "Ricardo Mendes",
    "billing_email": "fiscal@techtop.com.br",
    "notes": "Cliente ativo, contrato anual. Responsável: Ricardo Mendes"
  }'
```

**Resposta (201 Created):**
```json
{
  "message": "Cliente criado com sucesso.",
  "client": {
    "id": 3,
    "email": "financeiro@techtop.com.br",
    "company_name": "TechTop Solutions Ltda",
    "legal_name": "TECHTOP SOLUTIONS LTDA",
    "cnpj": "15.987.654/0001-32",
    "phone": "11-3567-8900",
    "contact_person": "Ricardo Mendes",
    "billing_email": "fiscal@techtop.com.br",
    "is_active": true,
    "created_at": "2024-01-15T14:22:33Z",
    "updated_at": "2024-01-15T14:22:33Z"
  }
}
```

---

## 4️⃣ Listar Todos os Clientes

**Requisição:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/clients
```

**Resposta (200 OK):**
```json
{
  "message": "Clientes listados com sucesso.",
  "clients": [
    {
      "id": 1,
      "email": "contato@empresa1.com.br",
      "company_name": "Empresa 1 Ltda",
      "legal_name": "EMPRESA UM LTDA",
      "cnpj": "12.345.678/0001-01",
      "phone": "11-3000-1000",
      "contact_person": "João Silva",
      "billing_email": "financeiro@empresa1.com.br",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "email": "suporte@empresa2.com.br",
      "company_name": "Empresa 2 S/A",
      "legal_name": "EMPRESA DOIS S/A",
      "cnpj": "98.765.432/0001-09",
      "phone": "11-3000-2000",
      "contact_person": "Maria Santos",
      "billing_email": "contabil@empresa2.com.br",
      "is_active": true,
      "created_at": "2024-01-15T10:05:00Z"
    },
    {
      "id": 3,
      "email": "financeiro@techtop.com.br",
      "company_name": "TechTop Solutions Ltda",
      "legal_name": "TECHTOP SOLUTIONS LTDA",
      "cnpj": "15.987.654/0001-32",
      "phone": "11-3567-8900",
      "contact_person": "Ricardo Mendes",
      "billing_email": "fiscal@techtop.com.br",
      "is_active": true,
      "created_at": "2024-01-15T14:22:33Z"
    }
  ],
  "total": 3
}
```

---

## 5️⃣ Obter Detalhes de um Cliente

**Requisição:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/clients/3
```

**Resposta (200 OK):**
```json
{
  "message": "Cliente obtido com sucesso.",
  "client": {
    "id": 3,
    "email": "financeiro@techtop.com.br",
    "company_name": "TechTop Solutions Ltda",
    "legal_name": "TECHTOP SOLUTIONS LTDA",
    "cnpj": "15.987.654/0001-32",
    "phone": "11-3567-8900",
    "contact_person": "Ricardo Mendes",
    "billing_email": "fiscal@techtop.com.br",
    "is_active": true,
    "created_at": "2024-01-15T14:22:33Z",
    "updated_at": "2024-01-15T14:22:33Z",
    "created_by": 1,
    "notes": "Cliente ativo, contrato anual. Responsável: Ricardo Mendes"
  }
}
```

---

## 6️⃣ Atualizar Dados de Cliente

**Requisição:**
```bash
curl -X PUT http://localhost:3000/clients/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "11-3567-8901",
    "contact_person": "Ricardo Mendes - Atualizado",
    "notes": "Cliente ativo. Novo telefone de contato principal."
  }'
```

**Resposta (200 OK):**
```json
{
  "message": "Cliente atualizado com sucesso.",
  "client": {
    "id": 3,
    "email": "financeiro@techtop.com.br",
    "company_name": "TechTop Solutions Ltda",
    "legal_name": "TECHTOP SOLUTIONS LTDA",
    "cnpj": "15.987.654/0001-32",
    "phone": "11-3567-8901",
    "contact_person": "Ricardo Mendes - Atualizado",
    "billing_email": "fiscal@techtop.com.br",
    "is_active": true,
    "created_at": "2024-01-15T14:22:33Z",
    "updated_at": "2024-01-15T14:35:12Z"
  }
}
```

---

## 7️⃣ Listar Todos os Usuários (Admin)

**Requisição:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/users
```

**Resposta (200 OK):**
```json
{
  "message": "Usuários listados com sucesso.",
  "users": [
    {
      "id": 1,
      "email": "admin@speedneves.com.br",
      "name": "Administrador Sistema",
      "role": "admin",
      "is_active": true,
      "last_login": "2024-01-15T14:20:00Z",
      "created_at": "2024-01-15T09:00:00Z"
    },
    {
      "id": 2,
      "email": "contador@speedneves.com.br",
      "name": "Contador Principal",
      "role": "contador",
      "is_active": true,
      "last_login": "2024-01-15T13:45:00Z",
      "created_at": "2024-01-15T09:00:00Z"
    },
    {
      "id": 3,
      "email": "gestor@speedneves.com.br",
      "name": "Gestor de Tarefas",
      "role": "gestor",
      "is_active": true,
      "last_login": "2024-01-15T12:30:00Z",
      "created_at": "2024-01-15T09:00:00Z"
    },
    {
      "id": 5,
      "email": "carlos@speedneves.com.br",
      "name": "Carlos Alberto",
      "role": "contador",
      "is_active": true,
      "last_login": null,
      "created_at": "2024-01-15T14:25:00Z"
    }
  ],
  "total": 4
}
```

---

## 8️⃣ Renovar Access Token (com Refresh Token)

Após 1 hora, o access token expira. Use o refresh token:

**Requisição:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0Mjk0MjgsImV4cCI6MTcwNjAzNDIyOH0.xyz789..."
  }'
```

**Resposta (200 OK):**
```json
{
  "message": "Access token renovado.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0MzI2NjQsImV4cCI6MTcwNTQzNjI2NH0.new_token..."
}
```

---

## 9️⃣ Logout (Revogar Refresh Token)

**Requisição:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac3BlZWRuZXZlcy5jb20uYnIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDU0Mjk0MjgsImV4cCI6MTcwNjAzNDIyOH0.xyz789..."
  }'
```

**Resposta (200 OK):**
```json
{
  "message": "Logout realizado com sucesso."
}
```

---

## 🔟 Consultar Logs de Auditoria

**Requisição (no banco via psql):**
```sql
-- Ver últimos 10 logs de um usuário
SELECT action, resource_type, resource_id, status, created_at
FROM audit_logs
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- Ver tentativas de login
SELECT user_id, action, status, created_at
FROM audit_logs
WHERE action = 'LOGIN'
ORDER BY created_at DESC
LIMIT 20;

-- Ver modificações de clientes
SELECT user_id, action, resource_id, details, created_at
FROM audit_logs
WHERE resource_type = 'client' AND action IN ('CREATE', 'UPDATE', 'DELETE')
ORDER BY created_at DESC;
```

---

## ⚠️ Exemplos de Erro

### Erro 401: Token Inválido
```bash
curl -H "Authorization: Bearer token_invalido" \
  http://localhost:3000/users

# Resposta 403
{
  "error": "Token inválido ou expirado."
}
```

### Erro 403: Acesso Negado
```bash
# Como 'contador' tentando registrar novo usuário (apenas admin)
curl -X POST http://localhost:3000/auth/register \
  -H "Authorization: Bearer $CONTADOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Resposta 403
{
  "error": "Acesso negado. Permissão necessária: admin"
}
```

### Erro 409: Email Duplicado
```bash
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contato@empresa1.com.br",
    "company_name": "Duplicada"
  }'

# Resposta 409
{
  "error": "Cliente com este email já existe."
}
```

### Erro 400: Validação
```bash
# Falta campo obrigatório
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Resposta 400
{
  "error": "Email e nome da empresa são obrigatórios."
}
```

---

## 🔧 Dicas Úteis

### Extrair token do curl para variável
```bash
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@speedneves.com.br",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')
echo "Token: $TOKEN"
```

### Usar em Postman
1. Crie uma variável de ambiente: `{{token}}`
2. Na aba Authorization, selecione "Bearer Token"
3. Digite: `{{token}}`
4. Após login, copie o token da resposta e copie para a variável

### Verificar Bearer Token (decodificar JWT)
```bash
# Instale jq primeiro: sudo apt-get install jq
TOKEN="seu_token_aqui"
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq .
```

---

## 📚 Resumo do Fluxo

```
1. Login → Obter tokens (access + refresh)
   ↓
2. Registrar novo usuário (admin only) OU criar cliente
   ↓
3. Listar/atualizar dados
   ↓
4. Token expira? → Renovar com refresh token
   ↓
5. Logout → Revogar refresh token
   ↓
6. Consultar audit_logs para rastreamento
```

---

**🎯 Pronto para testar!** Execute os exemplos acima para validar a Fase 1.
