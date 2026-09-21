import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { clientsRouter } from './routes/clients.js';
import { documentsRouter } from './routes/documents.js';
import { tasksRouter } from './routes/tasks.js';
import { auditMutations } from './middleware/audit.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(auditMutations);

app.get('/', (_req, res) => res.json({ service: 'SICGT API', status: 'ok' }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/clients', clientsRouter);
app.use('/documents', documentsRouter);
app.use('/tasks', tasksRouter);

app.use(notFound);
app.use(errorHandler);
