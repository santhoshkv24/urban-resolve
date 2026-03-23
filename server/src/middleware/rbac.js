// ===========================================
// Role-Based Access Control (RBAC) Middleware
// Enforces role requirements on protected routes
// ===========================================

const { sendError } = require('../utils/helpers');

/**
 * Middleware factory: Restricts access to users with specified roles.
 * Must be used AFTER the authenticate middleware.
 * @param  {...string} allowedRoles - List of allowed roles (e.g., 'ADMIN', 'CITIZEN')
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('ADMIN'), handler);
 *   router.get('/multi-role', authenticate, requireRole('ADMIN', 'OFFICER'), handler);
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Authentication required.', 401, 'AUTH_REQUIRED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

module.exports = { requireRole };
