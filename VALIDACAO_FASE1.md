# ✅ Checklist de Validação - Fase 1 SICGT

Use este documento para validar que tudo está funcionando corretamente após o setup.

---

## 📋 Pré-Setup

- [ ] Node.js v16+ instalado
  ```bash
  node --version
  # Esperado: v16.x.x ou maior
  ```

- [ ] PostgreSQL 12+ instalado e rodando
  ```bash
  psql --version
  # Esperado: psql (PostgreSQL) 12.x ou maior
  
  # Verificar se está rodando
  pg_isready
  # Esperado: accepting connections
  ```

- [ ] npm/yarn instalado
  ```bash
  npm --version
  # Esperado: npm 8.x ou maior
  ```

---

## 🛠️ Setup Local

### Passo 1: Instalar Dependências

- [ ] Navegar para pasta do projeto
  ```bash
  cd sicgt-backend
  ```

- [ ] Instalar dependências
  ```bash
  npm install
  # Esperado: npm WARN (pode haver avisos, é normal)
  # Esperado: added XXX packages
  ```

- [ ] Verificar package.json
  ```bash
  cat package.json | grep -A 5 '"dependencies"'
  # Esperado: express, pg, jsonwebtoken, bcryptjs, dotenv, cors presentes
  ```

### Passo 2: Criar Banco de Dados

- [ ] Criar banco `sicgt`
  ```bash
  createdb sicgt
  # Esperado: sem erros
  ```

- [ ] Verificar banco foi criado
  ```bash
  psql -U postgres -l | grep sicgt
  # Esperado: sicgt | postgres | UTF8 | ...
  ```

### Passo 3: Aplicar Schema

- [ ] Executar schema.sql
  ```bash
  psql -U postgres -d sicgt -f schema.sql
  # Esperado: CREATE TABLE, CREATE INDEX (sem erros)
  ```

- [ ] Verificar tabelas criadas
  ```bash
  psql -U postgres -d sicgt -c "\dt"
  # Esperado:
  #  audit_logs
  #  clients
  #  refresh_tokens
  #  users
  ```

- [ ] Verificar índices criados
  ```bash
  psql -U postgres -d sicgt -c "\di"
  # Esperado: idx_users_email, idx_clients_cnpj, etc.
  ```

### Passo 4: Configurar .env

- [ ] Copiar .env.example para .env
  ```bash
  cp .env.example .env
  ```

- [ ] Verificar .env foi criado
  ```bash
  ls -la | grep .env
  # Esperado: .env (local, não commitar)
  ```

- [ ] Revisar .env (deve estar tudo comentado ou com defaults)
  ```bash
  grep "DB_HOST" .env
  # Esperado: DB_HOST=localhost (ou sua config local)
  ```

### Passo 5: Popular Banco com Dados de Teste

- [ ] Executar seed
  ```bash
  npm run db:seed
  # Esperado:
  # 🌱 Iniciando seed do banco de dados...
  # 📝 Criando usuários padrão...
  # 🏢 Criando clientes de exemplo...
  # ✅ Seed completado com sucesso!
  ```

- [ ] Verificar usuários criados
  ```bash
  psql -U postgres -d sicgt -c "SELECT email, role FROM users;"
  # Esperado:
  #           email            |  role
  # ────────────────────────────────────
  #  admin@speedneves.com.br    | admin
  #  contador@speedneves.com.br | contador
  #  gestor@speedneves.com.br   | gestor
  ```

- [ ] Verificar clientes criados
  ```bash
  psql -U postgres -d sicgt -c "SELECT company_name, cnpj FROM clients;"
  # Esperado:
  #       company_name    |        cnpj
  # ──────────────────────────────────────
  #  Empresa 1 Ltda      | 12.345.678/0001-01
  #  Empresa 2 S/A       | 98.765.432/0001-09
  ```

---

## 🚀 Iniciar Servidor

### Passo 6: Desenvolvimento (Hot-Reload)

- [ ] Iniciar com nodemon
  ```bash
  npm run dev
  # Esperado:
  # ╔════════════════════════════════════════════════════════════╗
  # ║                      SICGT Backend                         ║
  # ║          Sistema de Gestão de Comunicação e Tarefas         ║
  # ║                                                             ║
  # ║  🚀 Servidor rodando em http://localhost:3000              ║
  # ║  📊 Banco de dados conectado                              ║
  # ║  🔐 Autenticação JWT ativa                                ║
  # ║  📝 Fase 1: Core Backend & Autenticação (Completa)       ║
  # ╚════════════════════════════════════════════════════════════╝
  ```

- [ ] Manter servidor rodando em outro terminal

---

## 🧪 Testes de API

### Passo 7: Health Check

Em um **novo terminal** (servidor continua rodando):

- [ ] Testar health endpoint
  ```bash
  curl http://localhost:3000/health
  # Esperado: {"status":"ok","message":"SICGT Backend rodando"}
  ```

### Passo 8: Autenticação (Login)

- [ ] Login com admin
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@speedneves.com.br",
      "password": "admin123"
    }' | jq .
  
  # Esperado: 
  # {
  #   "message": "Login realizado com sucesso.",
  #   "accessToken": "eyJ...",
  #   "refreshToken": "eyJ...",
  #   "user": {
  #     "id": 1,
  #     "email": "admin@speedneves.com.br",
  #     "name": "Administrador Sistema",
  #     "role": "admin"
  #   }
  # }
  ```

- [ ] Salvar token em variável
  ```bash
  # Capturar token (ou copiar manualmente do response acima)
  TOKEN="eyJ..." # Cole o accessToken aqui
  
  # Verificar se está salvo
  echo $TOKEN | head -c 20
  # Esperado: eyJhbGciOiJIUzI1Ni... (primeiros 20 chars)
  ```

### Passo 9: Listar Usuários (Autenticado)

- [ ] Requisição com token válido
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/users | jq .
  
  # Esperado:
  # {
  #   "message": "Usuários listados com sucesso.",
  #   "users": [
  #     {
  #       "id": 1,
  #       "email": "admin@speedneves.com.br",
  #       "name": "Administrador Sistema",
  #       "role": "admin",
  #       "is_active": true,
  #       "last_login": "2024-01-15T14:20:00Z",
  #       "created_at": "2024-01-15T09:00:00Z"
  #     },
  #     ...
  #   ],
  #   "total": 3
  # }
  ```

- [ ] Testar sem token (deve ser 401)
  ```bash
  curl http://localhost:3000/users
  
  # Esperado:
  # {"error":"Acesso negado. Token não fornecido."}
  ```

- [ ] Testar com token inválido (deve ser 403)
  ```bash
  curl -H "Authorization: Bearer token_invalido" \
    http://localhost:3000/users
  
  # Esperado:
  # {"error":"Token inválido ou expirado."}
  ```

### Passo 10: Listar Clientes

- [ ] Requisição com token
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/clients | jq .
  
  # Esperado:
  # {
  #   "message": "Clientes listados com sucesso.",
  #   "clients": [
  #     {
  #       "id": 1,
  #       "email": "contato@empresa1.com.br",
  #       "company_name": "Empresa 1 Ltda",
  #       "legal_name": "EMPRESA UM LTDA",
  #       "cnpj": "12.345.678/0001-01",
  #       ...
  #     },
  #     ...
  #   ],
  #   "total": 2
  # }
  ```

### Passo 11: Criar Novo Cliente

- [ ] POST para criar cliente
  ```bash
  curl -X POST http://localhost:3000/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "novo@cliente.com.br",
      "company_name": "Nova Empresa Teste",
      "legal_name": "NOVA EMPRESA TESTE LTDA",
      "cnpj": "99.888.777/0001-66",
      "phone": "11-9999-9999",
      "contact_person": "João Tester",
      "billing_email": "fiscal@cliente.com.br"
    }' | jq .
  
  # Esperado:
  # {
  #   "message": "Cliente criado com sucesso.",
  #   "client": {
  #     "id": 3,
  #     "email": "novo@cliente.com.br",
  #     "company_name": "Nova Empresa Teste",
  #     "cnpj": "99.888.777/0001-66",
  #     "is_active": true,
  #     "created_at": "2024-01-15T14:50:00Z"
  #   }
  # }
  ```

- [ ] Verificar cliente foi criado no BD
  ```bash
  psql -U postgres -d sicgt -c "SELECT company_name, cnpj FROM clients WHERE cnpj = '99.888.777/0001-66';"
  
  # Esperado:
  #       company_name     |         cnpj
  # ───────────────────────────────────────
  #  Nova Empresa Teste | 99.888.777/0001-66
  ```

### Passo 12: Registrar Novo Usuário (Admin)

- [ ] POST para registrar contador
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "novo.contador@speedneves.com.br",
      "password": "senha_segura_123",
      "name": "Novo Contador",
      "role": "contador"
    }' | jq .
  
  # Esperado:
  # {
  #   "message": "Usuário registrado com sucesso.",
  #   "user": {
  #     "id": 4,
  #     "email": "novo.contador@speedneves.com.br",
  #     "name": "Novo Contador",
  #     "role": "contador"
  #   }
  # }
  ```

- [ ] Testar login com novo usuário
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "novo.contador@speedneves.com.br",
      "password": "senha_segura_123"
    }' | jq .
  
  # Esperado: novo token + user info
  ```

### Passo 13: Testar RBAC (Rejeitar Permissão)

- [ ] Tentar criar usuário com role contador (deve falhar)
  ```bash
  # Primeiro, login como contador
  CONTADOR_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "contador@speedneves.com.br",
      "password": "contador123"
    }' | jq -r '.accessToken')
  
  # Tentar registrar novo usuário (deve falhar)
  curl -X POST http://localhost:3000/auth/register \
    -H "Authorization: Bearer $CONTADOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "test",
      "name": "Test User",
      "role": "contador"
    }' | jq .
  
  # Esperado: 403 Forbidden
  # {"error":"Acesso negado. Permissão necessária: admin"}
  ```

---

## 🔍 Verificar Auditoria

### Passo 14: Logs de Auditoria

- [ ] Ver logs no banco
  ```bash
  psql -U postgres -d sicgt -c "SELECT user_id, action, resource_type, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
  
  # Esperado:
  #  user_id | action | resource_type | status  |     created_at
  # ─────────┼────────┼───────────────┼─────────┼──────────────────────
  #  1       | LOGIN  | user          | success | 2024-01-15 14:50:00
  #  1       | CREATE | client        | success | 2024-01-15 14:51:00
  #  ...
  ```

- [ ] Ver logins específicos
  ```bash
  psql -U postgres -d sicgt -c "SELECT * FROM audit_logs WHERE action = 'LOGIN' ORDER BY created_at DESC LIMIT 5;"
  
  # Esperado: múltiplos registros de LOGIN
  ```

---

## 📊 Testes de Erro (Edge Cases)

### Passo 15: Erro 400 - Validação

- [ ] Tentar criar cliente sem email
  ```bash
  curl -X POST http://localhost:3000/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"company_name":"Teste"}' | jq .
  
  # Esperado:
  # {"error":"Email e nome da empresa são obrigatórios."}
  ```

### Passo 16: Erro 409 - Conflito (Email Duplicado)

- [ ] Tentar criar cliente com email duplicado
  ```bash
  curl -X POST http://localhost:3000/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "contato@empresa1.com.br",
      "company_name": "Duplicada"
    }' | jq .
  
  # Esperado:
  # {"error":"Cliente com este email já existe."}
  ```

### Passo 17: Erro 404 - Recurso Não Encontrado

- [ ] Obter cliente inexistente
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/clients/9999 | jq .
  
  # Esperado:
  # {"error":"Cliente não encontrado."}
  ```

---

## 🔐 Testes de Segurança

### Passo 18: Refresh Token Expirado

- [ ] Testar com refresh token revogado (após logout)
  ```bash
  # Primeiro, fazer logout
  curl -X POST http://localhost:3000/auth/logout \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"'$REFRESH_TOKEN'"}' | jq .
  
  # Tentar usar refresh token revogado
  curl -X POST http://localhost:3000/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"'$REFRESH_TOKEN'"}' | jq .
  
  # Esperado:
  # {"error":"Refresh token inválido ou revogado."}
  ```

---

## 📁 Verificação de Arquivos

### Passo 19: Estrutura de Pastas

- [ ] Verificar estrutura criada
  ```bash
  find . -type f -name "*.js" | grep -v node_modules | sort
  
  # Esperado:
  # ./scripts/seed.js
  # ./src/config/database.js
  # ./src/middleware/auth.js
  # ./src/middleware/authorize.js
  # ./src/routes/auth.js
  # ./src/routes/clients.js
  # ./src/routes/users.js
  # ./src/server.js
  # ./src/utils/logger.js
  ```

- [ ] Verificar arquivos de documentação
  ```bash
  ls -la | grep -E "\.md|schema\.sql|package\.json"
  
  # Esperado:
  # README.md
  # EXEMPLOS_API.md
  # ESTRUTURA_PROJETO.md
  # FASE1_RESUMO.md
  # VALIDACAO_FASE1.md (este arquivo)
  # package.json
  # schema.sql
  ```

---

## 🎉 Resumo Final

Se todos os testes passaram:

- [x] ✅ Servidor Node.js rodando
- [x] ✅ Banco PostgreSQL conectado
- [x] ✅ Autenticação JWT funcionando
- [x] ✅ RBAC validando permissões
- [x] ✅ CRUD de usuários ok
- [x] ✅ CRUD de clientes ok
- [x] ✅ Auditoria registrando ações
- [x] ✅ Error handling correto
- [x] ✅ Documentação completa

**🎯 Fase 1 está 100% validada e pronta para produção!**

---

## 📝 Notas Importantes

1. **Senhas padrão:** Altere em produção (admin123, etc)
2. **JWT_SECRET:** Mude em produção para valor aleatório seguro
3. **CORS_ORIGIN:** Ajuste para seu domínio de frontend
4. **Logs:** Cheque `/var/log` se houver erros de permissão
5. **Port:** Mude em .env se 3000 estiver ocupada

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Cannot find module 'express'" | `npm install` |
| "FATAL: database \"sicgt\" does not exist" | `createdb sicgt` + `psql ... -f schema.sql` |
| "connect ECONNREFUSED 127.0.0.1:5432" | PostgreSQL não está rodando |
| "Port 3000 in use" | Mude PORT em .env ou mate processo: `lsof -i :3000` |
| "jwt signature invalid" | Verifica JWT_SECRET em .env |
| "insert or update on table violates" | Email/CNPJ já existente |

---

**Próximo passo:** Quando tudo passar, começar Fase 2! 🚀
