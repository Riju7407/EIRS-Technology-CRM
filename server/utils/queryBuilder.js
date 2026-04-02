/**
 * Database utilities for efficient queries
 * Reduces code duplication and improves query performance
 */

/**
 * Build optimized client query with filters
 */
const buildClientQuery = (filters = {}) => {
  const query = { isDeleted: false };
  
  if (filters.status) query.status = filters.status;
  if (filters.source) query.source = filters.source;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  
  if (filters.search) {
    // Use text search if index exists, fallback to regex
    query.$text = { $search: filters.search };
  }
  
  return query;
};

/**
 * Build clean pagination options
 */
const getPaginationOptions = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;
  
  return { pageNum, limitNum, skip };
};

/**
 * Consistent response format for list endpoints
 */
const formatListResponse = (items, total, page, limit) => ({
  success: true,
  count: items.length,
  total,
  totalPages: Math.ceil(total / limit),
  currentPage: parseInt(page),
  items
});

/**
 * Safe error response
 */
const formatErrorResponse = (error, statusCode = 500) => {
  const message = error.message || 'An error occurred';
  const isDuplicateKey = error.code === 11000;
  
  if (isDuplicateKey) {
    const field = Object.keys(error.keyValue)[0];
    return {
      statusCode: 400,
      success: false,
      message: `${field} already exists`
    };
  }
  
  return {
    statusCode,
    success: false,
    message
  };
};

/**
 * Validate pagination params
 */
const validatePagination = (page, limit) => {
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max 100 per page
  
  return { page: parseInt(page), limit: parseInt(limit) };
};

module.exports = {
  buildClientQuery,
  getPaginationOptions,
  formatListResponse,
  formatErrorResponse,
  validatePagination
};
