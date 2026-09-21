import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () =>
  console.log(`SICGT API ativa na porta ${env.port}`),
);

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
