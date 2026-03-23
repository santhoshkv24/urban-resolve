// ===========================================
// Response Helpers
// Standard success/error response formatters
// ===========================================

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response payload
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 */
const sendSuccess = (res, data = null, statusCode = 200, message = 'Success') => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code identifier
 * @param {Array} details - Additional error details
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, code = 'SERVER_ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

/**
 * Build pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total item count
 */
const getPagination = (page = 1, limit = 20, total = 0) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / parsedLimit);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages,
    skip: (parsedPage - 1) * parsedLimit,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1,
  };
};

module.exports = {
  sendSuccess,
  sendError,
  getPagination,
};
