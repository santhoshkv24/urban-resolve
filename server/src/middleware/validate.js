// ===========================================
// Input Validation Middleware
// Reusable validators for common fields
// ===========================================

const { sendError } = require('../utils/helpers');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required fields exist in request body.
 * @param  {...string} fields - Required field names
 * @returns {Function} Express middleware
 */
const requireFields = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      return sendError(
        res,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        'VALIDATION_ERROR',
        missing.map((field) => ({ field, message: `${field} is required` }))
      );
    }

    next();
  };
};

/**
 * Validate registration input
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  next();
};

/**
 * Sanitize string inputs — trim and escape basic HTML
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  isValidEmail,
  requireFields,
  validateRegistration,
  validateLogin,
  sanitizeBody,
};
