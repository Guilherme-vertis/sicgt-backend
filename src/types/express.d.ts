import type { Role } from '../utils/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: Role[];
      };
    }
  }
}

export {};
