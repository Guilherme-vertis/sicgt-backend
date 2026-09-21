import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { ApiError, asyncHandler, validate } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { hashToken, newRefreshToken, signAccessToken, type Role } from '../utils/auth.js';

export const authRouter = Router();

const credentials = [
  body('email').isEmail().normalizeEmail(),
  body('password').isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),
];

async function issue(user: { id: string; email: string; roles: Role[] }) {
  const refreshToken = newRefreshToken();
  await pool.query(
    `INSERT INTO refresh_tokens(user_id, token_hash, expires_at)
     VALUES($1, $2, now() + interval '30 days')`,
    [user.id, hashToken(refreshToken)],
  );
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email, roles: user.roles }),
    refreshToken,
    expiresIn: 900,
  };
}

authRouter.post('/register', credentials, validate, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [
      req.body.email,
    ]);
    if (exists.rowCount) throw new ApiError(409, 'Email já cadastrado');

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const result = await client.query<{ id: string; email: string }>(
      `INSERT INTO users(email, password_hash, status)
       VALUES($1, $2, 'active') RETURNING id, email`,
      [req.body.email, passwordHash],
    );

    await client.query(
      `INSERT INTO user_roles(user_id, role) VALUES($1, 'cliente')`,
      [result.rows[0]!.id],
    );
    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0]!.id, email: result.rows[0]!.email, role: 'cliente' });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

authRouter.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query<{ id: string; email: string; password_hash: string; role: Role }>(
      `SELECT u.id, u.email, u.password_hash, ur.role FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE lower(u.email) = lower($1) AND u.deleted_at IS NULL AND u.status = 'active'`,
      [req.body.email],
    );

    if (!result.rowCount || !await bcrypt.compare(req.body.password, result.rows[0]!.password_hash)) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    const user = {
      id: result.rows[0]!.id,
      email: result.rows[0]!.email,
      roles: result.rows.map(r => r.role),
    };
    res.json(await issue(user));
  }),
);

authRouter.post(
  '/refresh',
  [body('refreshToken').isString().isLength({ min: 64 })],
  validate,
  asyncHandler(async (req, res) => {
    const tokenHash = hashToken(req.body.refreshToken);
    const result = await pool.query<{
      id: string;
      user_id: string;
      email: string;
      role: Role;
    }>(
      `SELECT rt.id, rt.user_id, u.email, ur.role FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL
         AND rt.expires_at > now() AND u.deleted_at IS NULL`,
      [tokenHash],
    );

    if (!result.rowCount) throw new ApiError(401, 'Refresh token inválido');

    await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [
      result.rows[0]!.id,
    ]);

    res.json(
      await issue({
        id: result.rows[0]!.user_id,
        email: result.rows[0]!.email,
        roles: result.rows.map(r => r.role),
      }),
    );
  }),
);

authRouter.post(
  '/logout',
  authenticate,
  [body('refreshToken').isString()],
  validate,
  asyncHandler(async (req, res) => {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND user_id = $2',
      [hashToken(req.body.refreshToken), req.user?.id],
    );
    res.status(204).send();
  }),
);
