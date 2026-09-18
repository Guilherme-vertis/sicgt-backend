# 🚀 Setup Supabase - SICGT

## Credenciais

```
URL: https://govenwcklmifzgiqswcv.supabase.co
ANON_KEY: sb_publishable_AB04rq0clIyJ8LlHUS2iPg_YPkZvQwb
PROJECT_REF: govenwcklmifzgiqswcv
PASSWORD: #Coxonete21212121!
```

## ✅ Passo 1: Aplicar Schema via SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Clique no projeto `sicgt`
3. Vá em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**
5. Cole TODO o conteúdo de `schema.sql` abaixo
6. Clique em **Run**

---

## Schema SQL Completo

```sql
-- SICGT: Schema PostgreSQL
-- Sistema Integrado de Gestão de Comunicação e Tarefas Contábil

-- 1. Usuários da plataforma (admin, contador, gestor)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'contador', 'gestor', 'cliente')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Clientes da contabilidade
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  cnpj VARCHAR(20) UNIQUE,
  phone VARCHAR(20),
  contact_person VARCHAR(255),
  billing_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- 3. Auditoria de ações do sistema
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  details JSONB,
  ip_address VARCHAR(45),
  status VARCHAR(20) CHECK (status IN ('success', 'error')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Refresh tokens para JWT
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_cnpj ON clients(cnpj);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

## ✅ Passo 2: Verificar Tabelas

No Supabase Dashboard:
1. Vá em **Table Editor** (lado esquerdo)
2. Você deve ver: `users`, `clients`, `audit_logs`, `refresh_tokens`
3. ✅ Se vir as 4 tabelas = sucesso!

---

## ✅ Passo 3: Popular com Dados de Teste

No **SQL Editor**, rode este SQL:

```sql
-- Inserir usuários de teste
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES 
  ('admin@speedneves.com.br', '$2a$10$JpqEBPXmz8YJ7vXXXXXXXOb5DYqjK3Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Administrador Sistema', 'admin', true),
  ('contador@speedneves.com.br', '$2a$10$JpqEBPXmz8YJ7vXXXXXXXOb5DYqjK3Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Contador Principal', 'contador', true),
  ('gestor@speedneves.com.br', '$2a$10$JpqEBPXmz8YJ7vXXXXXXXOb5DYqjK3Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Gestor de Tarefas', 'gestor', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir clientes de exemplo
INSERT INTO clients (email, company_name, legal_name, cnpj, phone, contact_person, billing_email, created_by)
VALUES 
  ('contato@empresa1.com.br', 'Empresa 1 Ltda', 'EMPRESA UM LTDA', '12.345.678/0001-01', '11-3000-1000', 'João Silva', 'financeiro@empresa1.com.br', 1),
  ('suporte@empresa2.com.br', 'Empresa 2 S/A', 'EMPRESA DOIS S/A', '98.765.432/0001-09', '11-3000-2000', 'Maria Santos', 'contabil@empresa2.com.br', 1)
ON CONFLICT (email) DO NOTHING;
```

⚠️ **Nota:** Essas são hashes de exemplo, não senhas reais. Vamos usar seed.js depois.

---

## ✅ Passo 4: Confirmar Setup

Na próxima etapa, vamos adaptar o código Node.js para usar Supabase!

**Confirma quando tiver rodado o schema acima.** ✨
