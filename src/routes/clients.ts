import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ApiError, asyncHandler, validate } from '../middleware/error.js';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

const read = authorize('admin', 'contador', 'gestor', 'cliente');
const write = authorize('admin', 'contador', 'gestor');
const fields = ['email', 'company_name', 'legal_name', 'cnpj', 'phone', 'contact_person', 'billing_email', 'notes'] as const;

clientsRouter.get(
  '/',
  read,
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
  validate,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const offset = (page - 1) * limit;

    const [data, count] = await Promise.all([
      pool.query('SELECT * FROM clients WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query<{ count: string }>('SELECT count(*) FROM clients WHERE deleted_at IS NULL'),
    ]);

    res.json({ data: data.rows, page, limit, total: Number(count.rows[0]?.count ?? 0) });
  }),
);

clientsRouter.post(
  '/',
  write,
  [
    body('email').isEmail().normalizeEmail(),
    body('company_name').isString().trim().notEmpty(),
    body('legal_name').isString().trim().notEmpty(),
    body('cnpj').isString().matches(/^\d{14}$/),
    body('phone').optional().isString(),
    body('contact_person').optional().isString(),
    body('billing_email').optional().isEmail(),
    body('notes').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const v = fields.map(f => req.body[f] ?? null);
    const result = await pool.query(
      `INSERT INTO clients(${fields.join(',')}) VALUES(${fields.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`,
      v,
    );
    const row = result.rows[0];
    res.locals.resourceId = row?.id;
    res.status(201).json(row);
  }),
);

clientsRouter.get(
  '/:id',
  read,
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!result.rowCount) throw new ApiError(404, 'Cliente não encontrado');
    res.json(result.rows[0]);
  }),
);

clientsRouter.put(
  '/:id',
  write,
  [param('id').isUUID(), ...fields.map(f => body(f).optional().isString())],
  validate,
  asyncHandler(async (req, res) => {
    const supplied = fields.filter(f => req.body[f] !== undefined);
    if (!supplied.length) throw new ApiError(422, 'Nenhum campo para atualizar');

    const values = supplied.map(f => req.body[f]);
    values.push(req.params.id);
    const set = supplied.map((f, i) => `${f} = $${i + 1}`).join(',');

    const result = await pool.query(
      `UPDATE clients SET ${set}, updated_at = now() WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`,
      values,
    );

    if (!result.rowCount) throw new ApiError(404, 'Cliente não encontrado');
    res.json(result.rows[0]);
  }),
);

clientsRouter.delete(
  '/:id',
  write,
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      'UPDATE clients SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [req.params.id],
    );
    if (!result.rowCount) throw new ApiError(404, 'Cliente não encontrado');
    res.status(204).send();
  }),
);
