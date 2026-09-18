# 🚀 Deploy no Vercel - SICGT Backend

Backend Node.js + Supabase → Vercel em 5 minutos.

---

## ✅ Passo 1: Criar Repositório GitHub

```bash
# Na sua máquina, dentro da pasta sicgt-backend
git init
git add .
git commit -m "Initial SICGT backend setup"
git branch -M main

# No GitHub: criar novo repo 'sicgt-backend'
git remote add origin https://github.com/SEU_USER/sicgt-backend.git
git push -u origin main
```

---

## ✅ Passo 2: Conectar Vercel ao GitHub

1. Acesse: https://vercel.com/dashboard
2. Clique em **Add New... → Project**
3. Selecione **Import Git Repository**
4. Procure por `sicgt-backend`
5. Clique em **Import**

---

## ✅ Passo 3: Configurar Variáveis de Ambiente

Na tela de configuração do Vercel:

**Environment Variables:**

```
DATABASE_URL = postgresql://postgres:#Coxonete21212121!@db.govenwcklmifzgiqswcv.supabase.co:5432/postgres

JWT_SECRET = sicgt_jwt_super_secret_production_key_32_chars_minimum_secure

SUPABASE_URL = https://govenwcklmifzgiqswcv.supabase.co

SUPABASE_ANON_KEY = sb_publishable_AB04rq0clIyJ8LlHUS2iPg_YPkZvQwb

COMPANY_NAME = Speed Neves Contabilidade

COMPANY_EMAIL = contabilidade@speedneves.com.br

CORS_ORIGIN = http://localhost:3001,http://localhost:5173,https://YOUR_VERCEL_URL.vercel.app

NODE_ENV = production

LOG_LEVEL = info
```

⚠️ **NÃO deixe variáveis vazias!** Vercel vai reclamar.

---

## ✅ Passo 4: Deploy

1. Clique em **Deploy**
2. Aguarde 2-3 min
3. Vercel gera uma URL: `https://sicgt-backend-xxxxx.vercel.app`

**Pronto! Backend online!** 🎉

---

## 🧪 Testar Backend Deployado

Sua API agora está em: `https://sicgt-backend-xxxxx.vercel.app`

### Health Check
```bash
curl https://sicgt-backend-xxxxx.vercel.app/health

# Esperado:
# {"status":"ok","message":"SICGT Backend rodando"}
```

### Login
```bash
curl -X POST https://sicgt-backend-xxxxx.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@speedneves.com.br",
    "password":"admin123"
  }'
```

⚠️ **Problema:** Usuários ainda não estão no banco!

---

## ⚠️ Próximo Passo: Popular Banco

Precisa rodar o seed.js no Supabase:

1. Vá em Supabase → SQL Editor
2. Crie nova query
3. Cole SQL para inserir usuários (veja SETUP_SUPABASE.md)

**OU** use o script Python:

```bash
npx supabase db push
npm run db:seed
```

---

## 🔄 Auto-Deploy

Toda vez que você faz `git push` para main:
1. Vercel detecta mudança
2. Faz build automático
3. Faz deploy automático
4. Sua API atualiza sozinha ✨

---

## 📊 Monitorar Deployment

No Vercel Dashboard:
- **Deployments** → Ver histórico
- **Logs** → Ver erros em tempo real
- **Settings** → Editar variáveis de ambiente

---

## 🆘 Troubleshooting

**"Build failed"**
- Verifica: `npm install` funciona localmente?
- Verifica: Todas variáveis de ambiente estão definidas?

**"Cannot connect to database"**
- Verifica: `DATABASE_URL` está correto em variáveis de ambiente?
- Verifica: Supabase está rodando?

**"Token inválido"**
- Verifica: JWT_SECRET é o mesmo em `.env` e Vercel?

---

## 🎯 Próximo Passo

Quando backend estiver online:
1. Copie a URL do Vercel
2. Use em Lovable (frontend)
3. Frontend vai chamar seus endpoints
4. Sistema completo online! 🚀

---

**URL do seu backend após deploy:**
```
https://sicgt-backend-XXXXX.vercel.app
```

**Guarde essa URL!** Vai usar no Lovable.
