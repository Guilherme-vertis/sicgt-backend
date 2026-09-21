import { Router } from 'express';
import { body, param, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ApiError, asyncHandler, validate } from '../middleware/error.js';
import { roles, type Role } from '../utils/auth.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

const idRule = param('id').isUUID();

usersRouter.get(
  '/',
  authorize('admin', 'gestor'),
  [query('role').optional().isIn(roles), query('status').optional().isIn(['active', 'inactive'])],
  validate,
  asyncHandler(async (req, res) => {
    const values: unknown[] = [];
    const where = ['u.deleted_at IS NULL'];

    if (req.query.role) {
      values.push(req.query.role);
      where.push(`ur.role = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      where.push(`u.status = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.status, u.created_at, array_agg(ur.role) roles
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE ${where.join(' AND ')}
       GROUP BY u.id ORDER BY u.created_at DESC`,
      values,
    );
    res.json(result.rows);
  }),
);

usersRouter.post(
  '/',
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isStrongPassword(),
    body('role').isIn(roles),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const exists = await client.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [
        req.body.email,
      ]);
      if (exists.rowCount) throw new ApiError(409, 'Email já cadastrado');

      const hash = await bcrypt.hash(req.body.password, 12);
      const user = await client.query<{ id: string; email: string; status: string }>(
        `INSERT INTO users(email, password_hash, status) VALUES($1, $2, 'active')
         RETURNING id, email, status`,
        [req.body.email, hash],
      );

      const created = user.rows[0];
      if (!created) throw new ApiError(500, 'Falha ao criar usuário');

      await client.query('INSERT INTO user_roles(user_id, role) VALUES($1, $2)', [
        created.id,
        req.body.role as Role,
      ]);
      await client.query('COMMIT');
      res.locals.resourceId = created.id;
      res.status(201).json({ ...created, roles: [req.body.role] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }),
);

usersRouter.get(
  '/:id',
  [idRule],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT u.id, u.email, u.status, u.created_at, u.updated_at, array_agg(ur.role) roles
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [req.params.id],
    );

    const user = result.rows[0];
    if (!user) throw new ApiError(404, 'Usuário não encontrado');

    if (req.user?.id !== req.params.id && !req.user?.roles.some(r => ['admin', 'gestor'].includes(r))) {
      throw new ApiError(403, 'Acesso negado');
    }

    res.json(user);
  }),
);

usersRouter.put(
  '/:id',
  [idRule, body('email').optional().isEmail().normalizeEmail(), body('status').optional().isIn(['active', 'inactive']), body('role').optional().isIn(roles)],
  validate,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.roles.includes('admin') ?? false;
    if (req.user?.id !== req.params.id && !isAdmin) throw new ApiError(403, 'Acesso negado');
    if ((req.body.status || req.body.role) && !isAdmin) throw new ApiError(403, 'Somente administradores alteram status ou papel');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE users SET email = COALESCE($2, email), status = COALESCE($3, status), updated_at = now()
         WHERE id = $1 AND deleted_at IS NULL RETURNING id, email, status, updated_at`,
        [req.params.id, req.body.email ?? null, req.body.status ?? null],
      );

      if (!result.rowCount) throw new ApiError(404, 'Usuário não encontrado');

      if (req.body.role) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [req.params.id]);
        await client.query('INSERT INTO user_roles(user_id, role) VALUES($1, $2)', [
          req.params.id,
          req.body.role as Role,
        ]);
      }
      await client.query('COMMIT');
      res.json({ ...result.rows[0], roles: req.body.role ? [req.body.role] : undefined });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }),
);

usersRouter.delete(
  '/:id',
  authorize('admin'),
  [idRule],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE users SET deleted_at = now(), status = 'inactive', updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [req.params.id],
    );

    if (!result.rowCount) throw new ApiError(404, 'Usuário não encontrado');
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [req.params.id],
    );
    res.status(204).send();
  }),
);

usersRouter.post(
  '/:id/password',
  [idRule, body('current_password').optional().isString(), body('password').isStrongPassword()],
  validate,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.roles.includes('admin') ?? false;
    if (req.user?.id !== req.params.id && !isAdmin) throw new ApiError(403, 'Acesso negado');

    const found = await pool.query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id],
    );

    const target = found.rows[0];
    if (!target) throw new ApiError(404, 'Usuário não encontrado');

    if (!isAdmin && (!req.body.current_password || !await bcrypt.compare(req.body.current_password, target.password_hash))) {
      throw new ApiError(401, 'Senha atual inválida');
    }

    await pool.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
      req.params.id,
      await bcrypt.hash(req.body.password, 12),
    ]);
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [req.params.id],
    );
    res.status(204).send();
  }),
);
