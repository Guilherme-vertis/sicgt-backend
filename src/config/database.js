// src/config/database.js
// Configuração do pool de conexões PostgreSQL (Local ou Supabase)

const { Pool } = require('pg');
require('dotenv').config();

// Conecta via DATABASE_URL (Supabase) ou config individual (Local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'sicgt'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
});

// Função para executar queries com logging
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('Executed query:', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Função para executar transações
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
};
