import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ApiError, asyncHandler, validate } from '../middleware/error.js';

export const tasksRouter = Router();
tasksRouter.use(authenticate);

const access = authorize('admin', 'contador', 'gestor', 'cliente');
const write = authorize('admin', 'contador', 'gestor');
const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
const priorities = ['low', 'medium', 'high', 'urgent'];

tasksRouter.get('/', access, [query('status').optional().isIn(statuses), query('priority').optional().isIn(priorities), query('assignee').optional().isUUID()], validate, asyncHandler(async (req, res) => {
  const vals = [];
  const where = ['deleted_at IS NULL'];
  const map = { status: 'status', priority: 'priority', assignee: 'assigned_to' };
  for (const [q, col] of Object.entries(map)) {
    if (req.query[q]) { vals.push(req.query[q]); where.push(`${col}=$${vals.length}`); }
  }
  const r = await pool.query(`SELECT * FROM tasks WHERE ${where.join(' AND ')} ORDER BY due_date NULLS LAST,created_at DESC`, vals);
  res.json(r.rows);
}));

tasksRouter.post('/', write, [body('title').isString().trim().notEmpty(), body('description').optional().isString(), body('client_id').isUUID(), body('assigned_to').optional({ nullable: true }).isUUID(), body('status').optional().isIn(statuses), body('priority').optional().isIn(priorities), body('due_date').optional({ nullable: true }).isISO8601()], validate, asyncHandler(async (req, res) => {
  const r = await pool.query(`INSERT INTO tasks(title,description,client_id,assigned_to,status,priority,due_date,created_by) VALUES($1,$2,$3,$4,COALESCE($5,'pending'),COALESCE($6,'medium'),$7,$8) RETURNING *`, [req.body.title, req.body.description ?? null, req.body.client_id, req.body.assigned_to ?? null, req.body.status ?? null, req.body.priority ?? null, req.body.due_date ?? null, req.user?.id]);
  res.locals.resourceId = r.rows[0]?.id;
  res.status(201).json(r.rows[0]);
}));

tasksRouter.get('/:id', access, [param('id').isUUID()], validate, asyncHandler(async (req, res) => {
  const r = await pool.query('SELECT * FROM tasks WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
  if (!r.rowCount) throw new ApiError(404, 'Tarefa não encontrada');
  res.json(r.rows[0]);
}));

tasksRouter.put('/:id', write, [param('id').isUUID(), body('title').optional().isString().notEmpty(), body('description').optional().isString(), body('client_id').optional().isUUID(), body('assigned_to').optional({ nullable: true }).isUUID(), body('status').optional().isIn(statuses), body('priority').optional().isIn(priorities), body('due_date').optional({ nullable: true }).isISO8601()], validate, asyncHandler(async (req, res) => {
  const allowed = ['title','description','client_id','assigned_to','status','priority','due_date'];
  const fs = allowed.filter(f => req.body[f] !== undefined);
  if (!fs.length) throw new ApiError(422, 'Nenhum campo para atualizar');
  const vals = fs.map(f => req.body[f]);
  vals.push(req.params.id);
  const r = await pool.query(`UPDATE tasks SET ${fs.map((f,i) => `${f}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${vals.length} AND deleted_at IS NULL RETURNING *`, vals);
  if (!r.rowCount) throw new ApiError(404, 'Tarefa não encontrada');
  res.json(r.rows[0]);
}));

tasksRouter.delete('/:id', write, [param('id').isUUID()], validate, asyncHandler(async (req, res) => {
  const r = await pool.query('UPDATE tasks SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
  if (!r.rowCount) throw new ApiError(404, 'Tarefa não encontrado');
  res.status(204).send();
}));
