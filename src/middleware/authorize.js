// src/middleware/authorize.js
// Middleware de autorização por roles

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Permissão necessária: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { authorize };
