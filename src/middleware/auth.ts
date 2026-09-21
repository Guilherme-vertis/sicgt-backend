import type { RequestHandler } from 'express';
import { pool } from '../config/database.js';
import { ApiError, asyncHandler } from './error.js';
import { verifyAccessToken, type Role } from '../utils/auth.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Token ausente');

  try {
    const payload = verifyAccessToken(token);
    const result = await pool.query<{ id: string; email: string; role: Role }>(
      `SELECT u.id, u.email, ur.role FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL AND u.status = 'active'`,
      [payload.sub],
    );

    if (!result.rowCount) throw new ApiError(401, 'Usuário inativo ou inexistente');

    req.user = {
      id: result.rows[0]!.id,
      email: result.rows[0]!.email,
      roles: result.rows.map(r => r.role),
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Token inválido ou expirado');
  }
});
