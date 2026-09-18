// src/routes/clients.js
// CRUD de Clientes: criar, listar, obter, atualizar, desativar

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { logAction, logError } = require('../utils/logger');

const router = express.Router();

// POST /clients
// Cria novo cliente (admin, contador, gestor)
router.post('/', authenticateToken, authorize(['admin', 'contador', 'gestor']), async (req, res) => {
  const { email, company_name, legal_name, cnpj, phone, contact_person, billing_email, notes } = req.body;
  const creatorId = req.user.userId;

  // Validações
  if (!email || !company_name) {
    return res.status(400).json({ error: 'Email e nome da empresa são obrigatórios.' });
  }

  try {
    // Verifica se email já existe
    const existingClient = await query('SELECT id FROM clients WHERE email = $1', [email]);
    if (existingClient.rows.length > 0) {
      return res.status(409).json({ error: 'Cliente com este email já existe.' });
    }

    // Verifica se CNPJ já existe (se fornecido)
    if (cnpj) {
      const existingCnpj = await query('SELECT id FROM clients WHERE cnpj = $1', [cnpj]);
      if (existingCnpj.rows.length > 0) {
        return res.status(409).json({ error: 'Cliente com este CNPJ já existe.' });
      }
    }

    // Insere novo cliente
    const result = await query(
      `INSERT INTO clients (email, company_name, legal_name, cnpj, phone, contact_person, billing_email, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, company_name, legal_name, cnpj, phone, contact_person, billing_email, is_active, created_at`,
      [email, company_name, legal_name, cnpj, phone, contact_person, billing_email, notes, creatorId]
    );

    const newClient = result.rows[0];
    await logAction(creatorId, 'CREATE', 'client', newClient.id, { company_name, email }, 'success', req.ip);

    res.status(201).json({
      message: 'Cliente criado com sucesso.',
      client: newClient,
    });
  } catch (error) {
    logError('Create Client', error, req.ip);
    res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
});

// GET /clients
// Lista todos os clientes (autenticado)
router.get('/', authenticateToken, async (req, res) => {
  const { active_only = true } = req.query;

  try {
    let queryText = `SELECT id, email, company_name, legal_name, cnpj, phone, contact_person, billing_email, is_active, created_at
                     FROM clients`;

    if (active_only === 'true') {
      queryText += ' WHERE is_active = true';
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText);

    res.json({
      message: 'Clientes listados com sucesso.',
      clients: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    logError('List Clients', error, req.ip);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

// GET /clients/:id
// Obtém detalhes de um cliente específico
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT id, email, company_name, legal_name, cnpj, phone, contact_person, billing_email, is_active, created_at, updated_at, created_by, notes
       FROM clients
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json({
      message: 'Cliente obtido com sucesso.',
      client: result.rows[0],
    });
  } catch (error) {
    logError('Get Client', error, req.ip);
    res.status(500).json({ error: 'Erro ao obter cliente.' });
  }
});

// PUT /clients/:id
// Atualiza dados do cliente (admin, contador, gestor)
router.put('/:id', authenticateToken, authorize(['admin', 'contador', 'gestor']), async (req, res) => {
  const { id } = req.params;
  const { email, company_name, legal_name, cnpj, phone, contact_person, billing_email, notes } = req.body;

  try {
    // Verifica se cliente existe
    const existingClient = await query('SELECT id FROM clients WHERE id = $1', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Verifica se novo email já existe
    if (email) {
      const emailExists = await query('SELECT id FROM clients WHERE email = $1 AND id != $2', [email, id]);
      if (emailExists.rows.length > 0) {
        return res.status(409).json({ error: 'Este email já está em uso.' });
      }
    }

    // Verifica se novo CNPJ já existe
    if (cnpj) {
      const cnpjExists = await query('SELECT id FROM clients WHERE cnpj = $1 AND id != $2', [cnpj, id]);
      if (cnpjExists.rows.length > 0) {
        return res.status(409).json({ error: 'Este CNPJ já está em uso.' });
      }
    }

    // Monta query dinâmica
    const updates = [];
    const params = [parseInt(id)];

    if (email !== undefined) {
      updates.push('email = $' + (params.length + 1));
      params.push(email);
    }
    if (company_name !== undefined) {
      updates.push('company_name = $' + (params.length + 1));
      params.push(company_name);
    }
    if (legal_name !== undefined) {
      updates.push('legal_name = $' + (params.length + 1));
      params.push(legal_name);
    }
    if (cnpj !== undefined) {
      updates.push('cnpj = $' + (params.length + 1));
      params.push(cnpj);
    }
    if (phone !== undefined) {
      updates.push('phone = $' + (params.length + 1));
      params.push(phone);
    }
    if (contact_person !== undefined) {
      updates.push('contact_person = $' + (params.length + 1));
      params.push(contact_person);
    }
    if (billing_email !== undefined) {
      updates.push('billing_email = $' + (params.length + 1));
      params.push(billing_email);
    }
    if (notes !== undefined) {
      updates.push('notes = $' + (params.length + 1));
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const updateQuery = `UPDATE clients SET ${updates.join(', ')} WHERE id = $1 RETURNING id, email, company_name, legal_name, cnpj, phone, contact_person, billing_email, is_active, created_at, updated_at`;

    const result = await query(updateQuery, params);

    await logAction(req.user.userId, 'UPDATE', 'client', parseInt(id), { company_name }, 'success', req.ip);

    res.json({
      message: 'Cliente atualizado com sucesso.',
      client: result.rows[0],
    });
  } catch (error) {
    logError('Update Client', error, req.ip);
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
});

// DELETE /clients/:id
// Desativa um cliente (soft delete, admin apenas)
router.delete('/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE clients SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, company_name, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    await logAction(req.user.userId, 'DELETE', 'client', parseInt(id), {}, 'success', req.ip);

    res.json({
      message: 'Cliente desativado com sucesso.',
      client: result.rows[0],
    });
  } catch (error) {
    logError('Delete Client', error, req.ip);
    res.status(500).json({ error: 'Erro ao desativar cliente.' });
  }
});

module.exports = router;
