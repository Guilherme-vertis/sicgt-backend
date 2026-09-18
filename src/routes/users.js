// src/routes/users.js
// CRUD de Usuários: listar, obter, atualizar, desativar

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { logAction, logError } = require('../utils/logger');

const router = express.Router();

// GET /users
// Lista todos os usuários (apenas admin)
router.get('/', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, role, is_active, last_login, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      message: 'Usuários listados com sucesso.',
      users: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    logError('List Users', error, req.ip);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// GET /users/:id
// Obtém detalhes de um usuário específico
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.user.role;

  // Usuários podem ver seu próprio perfil; admin vê qualquer um
  if (req.user.userId !== parseInt(id) && requesterRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    const result = await query(
      `SELECT id, email, name, role, is_active, last_login, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({
      message: 'Usuário obtido com sucesso.',
      user: result.rows[0],
    });
  } catch (error) {
    logError('Get User', error, req.ip);
    res.status(500).json({ error: 'Erro ao obter usuário.' });
  }
});

// PUT /users/:id
// Atualiza dados do usuário (próprio perfil ou admin)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // Usuários podem atualizar seu próprio perfil; admin atualiza qualquer um
  if (req.user.userId !== parseInt(id) && req.user.role !== 'admin') {
    await logAction(req.user.userId, 'UPDATE', 'user', parseInt(id), {}, 'error', req.ip);
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    // Verifica se novo email já existe (se for diferente)
    if (email) {
      const existingEmail = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ error: 'Este email já está em uso.' });
      }
    }

    let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [parseInt(id)];
    let paramIndex = 2;

    if (name) {
      updateQuery += `, name = $${paramIndex}`;
      params.splice(1, 0, name);
      paramIndex++;
    }

    if (email) {
      updateQuery += `, email = $${paramIndex}`;
      params.splice(1, 0, email);
      paramIndex++;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $${paramIndex}`;
      params.splice(1, 0, passwordHash);
      paramIndex++;
    }

    updateQuery += ' WHERE id = $1 RETURNING id, email, name, role, is_active';

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await logAction(req.user.userId, 'UPDATE', 'user', parseInt(id), { name, email }, 'success', req.ip);

    res.json({
      message: 'Usuário atualizado com sucesso.',
      user: result.rows[0],
    });
  } catch (error) {
    logError('Update User', error, req.ip);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /users/:id
// Desativa um usuário (soft delete)
router.delete('/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  // Admin não pode desativar a si mesmo
  if (req.user.userId === parseInt(id)) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
  }

  try {
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await logAction(req.user.userId, 'DELETE', 'user', parseInt(id), {}, 'success', req.ip);

    res.json({
      message: 'Usuário desativado com sucesso.',
      user: result.rows[0],
    });
  } catch (error) {
    logError('Delete User', error, req.ip);
    res.status(500).json({ error: 'Erro ao desativar usuário.' });
  }
});

module.exports = router;
