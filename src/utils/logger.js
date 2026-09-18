// src/utils/logger.js
// Sistema de logging centralizado com auditoria

const { query } = require('../config/database');

const logAction = async (userId, action, resourceType, resourceId, details = {}, status = 'success', ipAddress = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, status, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details), status, ipAddress]
    );
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};

const logError = (action, error, ipAddress = null) => {
  console.error(`[${new Date().toISOString()}] ${action}:`, error.message);
};

module.exports = {
  logAction,
  logError,
};
