import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const roles = ['admin', 'contador', 'gestor', 'cliente'] as const;
export type Role = typeof roles[number];

export type TokenPayload = {
  sub: string;
  email: string;
  roles: Role[];
};

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: '15m',
    issuer: 'sicgt-api',
    audience: 'sicgt-web',
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtSecret, {
    issuer: 'sicgt-api',
    audience: 'sicgt-web',
  }) as TokenPayload;

export const newRefreshToken = () => crypto.randomBytes(48).toString('hex');
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
