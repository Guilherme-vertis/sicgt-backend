// src/middleware/auth.js
// Middleware de autenticação JWT

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    // Verifica se usuário ainda existe e está ativo
    try {
      const result = await query('SELECT id, email, role, is_active FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });
};

const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = {
  authenticateToken,
  generateTokens,
};
