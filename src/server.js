// src/server.js
// Servidor principal Express - SICGT

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');

// Importa rotas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
  credentials: true,
}));

// Middleware de logging (opcional)
app.use((req, res, next) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SICGT Backend rodando' });
});

// Rotas
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/clients', clientsRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                      SICGT Backend                         ║
║          Sistema de Gestão de Comunicação e Tarefas         ║
║                                                             ║
║  🚀 Servidor rodando em http://localhost:${PORT}           ║
║  📊 Banco de dados conectado                              ║
║  🔐 Autenticação JWT ativa                                ║
║  📝 Fase 1: Core Backend & Autenticação (Completa)       ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Encerrando gracefully...');
  await pool.end();
  process.exit(0);
});
