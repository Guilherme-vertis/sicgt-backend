import type { RequestHandler } from 'express';
import { ApiError } from './error.js';
import type { Role } from '../utils/auth.js';

export const authorize = (...allowed: Role[]): RequestHandler => (req, _res, next) => {
  if (!req.user || !req.user.roles.some(r => allowed.includes(r))) {
    return next(new ApiError(403, 'Acesso negado'));
  }
  next();
};
