// scripts/seed.js
// Script para popular o banco com dados iniciais

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Hash das senhas padrão
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const contadorPasswordHash = await bcrypt.hash('contador123', 10);
    const gestorPasswordHash = await bcrypt.hash('gestor123', 10);

    // Cria usuários padrão
    console.log('📝 Criando usuários padrão...');

    // Admin
    await query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      ['admin@speedneves.com.br', adminPasswordHash, 'Administrador Sistema', 'admin', true]
    );

    // Contador
    await query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      ['contador@speedneves.com.br', contadorPasswordHash, 'Contador Principal', 'contador', true]
    );

    // Gestor
    await query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      ['gestor@speedneves.com.br', gestorPasswordHash, 'Gestor de Tarefas', 'gestor', true]
    );

    // Cria clientes de exemplo
    console.log('🏢 Criando clientes de exemplo...');

    const adminUserId = await query('SELECT id FROM users WHERE email = $1', ['admin@speedneves.com.br']);
    const creatorId = adminUserId.rows[0].id;

    await query(
      `INSERT INTO clients (email, company_name, legal_name, cnpj, phone, contact_person, billing_email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      ['contato@empresa1.com.br', 'Empresa 1 Ltda', 'EMPRESA UM LTDA', '12.345.678/0001-01', '11-3000-1000', 'João Silva', 'financeiro@empresa1.com.br', creatorId]
    );

    await query(
      `INSERT INTO clients (email, company_name, legal_name, cnpj, phone, contact_person, billing_email, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      ['suporte@empresa2.com.br', 'Empresa 2 S/A', 'EMPRESA DOIS S/A', '98.765.432/0001-09', '11-3000-2000', 'Maria Santos', 'contabil@empresa2.com.br', creatorId]
    );

    console.log('✅ Seed completado com sucesso!');
    console.log(`
📊 Dados criados:
  👤 Admin: admin@speedneves.com.br / senha: admin123
  👤 Contador: contador@speedneves.com.br / senha: contador123
  👤 Gestor: gestor@speedneves.com.br / senha: gestor123
  🏢 2 clientes de exemplo

⚠️  IMPORTANTE: Altere as senhas padrão na produção!
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante seed:', error.message);
    process.exit(1);
  }
}

seed();
