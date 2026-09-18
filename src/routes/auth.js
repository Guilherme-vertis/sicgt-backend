// src/routes/auth.js
// Rotas de autenticação: login, logout, refresh token

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, generateTokens } = require('../middleware/auth');
const { logAction, logError } = require('../utils/logger');

const router = express.Router();

// POST /auth/register
// Registra novo usuário (apenas admin pode registrar)
router.post('/register', authenticateToken, async (req, res) => {
  const { email, password, name, role } = req.body;
  const creatorId = req.user.userId;

  // Validações básicas
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Email, senha, nome e role são obrigatórios.' });
  }

  if (!['admin', 'contador', 'gestor', 'cliente'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida.' });
  }

  try {
    // Verifica se criador é admin
    const creatorResult = await query('SELECT role FROM users WHERE id = $1', [creatorId]);
    if (creatorResult.rows.length === 0 || creatorResult.rows[0].role !== 'admin') {
      await logAction(creatorId, 'REGISTER', 'user', null, { email }, 'error', req.ip);
      return res.status(403).json({ error: 'Apenas admin pode registrar usuários.' });
    }

    // Verifica se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Usuário com este email já existe.' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria novo usuário
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [email, passwordHash, name, role, creatorId]
    );

    const newUser = result.rows[0];
    await logAction(creatorId, 'REGISTER', 'user', newUser.id, { email, role }, 'success', req.ip);

    res.status(201).json({
      message: 'Usuário registrado com sucesso.',
      user: newUser,
    });
  } catch (error) {
    logError('Register', error, req.ip);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// POST /auth/login
// Autentica usuário e retorna access + refresh tokens
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const result = await query('SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      await logAction(null, 'LOGIN', 'user', null, { email }, 'error', req.ip);
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      await logAction(user.id, 'LOGIN', 'user', user.id, { status: 'inactive' }, 'error', req.ip);
      return res.status(403).json({ error: 'Usuário inativo.' });
    }

    // Verifica senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAction(user.id, 'LOGIN', 'user', user.id, {}, 'error', req.ip);
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Gera tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Armazena refresh token no banco
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    // Atualiza last_login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    await logAction(user.id, 'LOGIN', 'user', user.id, {}, 'success', req.ip);

    res.json({
      message: 'Login realizado com sucesso.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logError('Login', error, req.ip);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

// POST /auth/refresh
// Gera novo access token a partir do refresh token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token é obrigatório.' });
  }

  try {
    // Verifica se refresh token existe e é válido
    const tokenResult = await query(
      `SELECT rt.user_id, rt.expires_at, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.is_revoked = false`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido ou revogado.' });
    }

    const token = tokenResult.rows[0];

    if (new Date(token.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expirado.' });
    }

    // Gera novo access token
    const { accessToken } = generateTokens(token.user_id, token.email, token.role);

    res.json({
      message: 'Access token renovado.',
      accessToken,
    });
  } catch (error) {
    logError('Refresh Token', error, req.ip);
    res.status(500).json({ error: 'Erro ao renovar token.' });
  }
});

// POST /auth/logout
// Revoga o refresh token
router.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token é obrigatório.' });
  }

  try {
    await query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE token = $1 AND user_id = $2`,
      [refreshToken, req.user.userId]
    );

    await logAction(req.user.userId, 'LOGOUT', 'user', req.user.userId, {}, 'success', req.ip);

    res.json({ message: 'Logout realizado com sucesso.' });
  } catch (error) {
    logError('Logout', error, req.ip);
    res.status(500).json({ error: 'Erro ao fazer logout.' });
  }
});

module.exports = router;
