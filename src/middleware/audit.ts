import type { RequestHandler } from 'express';
import { pool } from '../config/database.js';

export const auditMutations: RequestHandler = (req, res, next) => {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;

    const segments = req.path.split('/').filter(Boolean);
    const resourceType = segments[0] ?? 'unknown';
    const resourceId = res.locals.resourceId ?? req.params.id ?? null;
    const changes = res.locals.auditChanges ?? (req.path.includes('password') ? {} : req.body);

    void pool
      .query(
        `INSERT INTO audit_logs(user_id, action, resource_type, resource_id, ip_address, changes)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [req.user.id, req.method, resourceType, resourceId, req.ip, changes],
      )
      .catch(console.error);
  });

  next();
};
