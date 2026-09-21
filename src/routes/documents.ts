import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ApiError, asyncHandler, validate } from '../middleware/error.js';

export const documentsRouter = Router();
documentsRouter.use(authenticate);

const access = authorize('admin', 'contador', 'gestor', 'cliente');
const write = authorize('admin', 'contador', 'gestor');

documentsRouter.get(
  '/',
  access,
  [query('type').optional().isString(), query('client_id').optional().isUUID(), query('uploaded_by').optional().isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const values = [];
    const where = ['deleted_at IS NULL'];
    for (const f of ['type', 'client_id', 'uploaded_by']) {
      if (req.query[f]) {
        values.push(req.query[f]);
        where.push(`${f}=$values.length}`);
      }
    }
    const result = await pool.query(`SELECT * FROM documents WHERE ${where.join(' AND ')} ORDER BY upload_date DESC`, values);
    res.json(result.rows);
  }),
);

documentsRouter.post(
  '/',
  write,
  [body('name').isString().trim().notEmpty(), body('type').isString().trim().notEmpty(), body('client_id').isUUID(), body('upload_date').optional().isISO8601(), body('file_url').isURL(), body('notes').optional().isString()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(`INSERT INTO documents(name,type,client_id,upload_date,uploaded_by,file_url,notes) VALUES($1,$2,$3,COALESCE($4::timestamptz,now()),$5,$6,$7) RETURNING *`, [req.body.name, req.body.type, req.body.client_id, req.body.upload_date ?? null, req.user?.id, req.body.file_url, req.body.notes ?? null]);
    res.locals.resourceId = result.rows[0]?.id;
    res.status(201).json(result.rows[0]);
  }),
);

documentsRouter.get('/:id', access, [param('id').isUUID()], validate, asyncHandler(async (req, res) => {
  const r = await pool.query('SELECT * FROM documents WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
  if (!r.rowCount) throw new ApiError(404, 'Documento não encontrado');
  res.json(r.rows[0]);
}));

documentsRouter.put('/:id', write, [param('id').isUUID(), body('name').optional().isString().notEmpty(), body('type').optional().isString(), body('client_id').optional().isUUID(), body('file_url').optional().isURL(), body('notes').optional().isString()], validate, asyncHandler(async (req, res) => {
  const fs = ['name','type','client_id','file_url','notes'].filter(f => req.body[f] !== undefined);
  if (!fs.length) throw new ApiError(422, 'Nenhum campo para atualizar');
  const vals = fs.map(f => req.body[f]);
  vals.push(req.params.id);
  const r = await pool.query(`UPDATE documents SET ${fs.map((f,i) => `${f}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${vals.length} AND deleted_at IS NULL RETURNING *`, vals);
  if (!r.rowCount) throw new ApiError(404, 'Documento não encontrado');
  res.json(r.rows[0]);
}));

documentsRouter.delete('/:id', write, [param('id').isUUID()], validate, asyncHandler(async (req, res) => {
  const r = await pool.query('UPDATE documents SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
  if (!r.rowCount) throw new ApiError(404, 'Documento não encontrado');
  res.status(204).send();
}));
