// ===========================================
// JWT Authentication Middleware
// Verifies Bearer token and attaches user to req
// ===========================================

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/helpers');

/**
 * Middleware: Authenticate incoming requests via JWT.
 * Expects header: Authorization: Bearer <token>
 * On success, attaches decoded user data to req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Please provide a valid token.', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach user info to request for downstream use
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please login again.', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token. Please login again.', 401, 'INVALID_TOKEN');
    }
    return sendError(res, 'Authentication failed.', 401, 'AUTH_FAILED');
  }
};

module.exports = { authenticate };
