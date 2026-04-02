/**
 * Input Validation Middleware
 * Validates and sanitizes incoming requests
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Client creation validation
 */
const validateClientCreate = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Valid phone number is required'),
  
  body('alternatePhone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Invalid phone number format'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lead', 'prospect', 'churned'])
    .withMessage('Invalid status'),
  
  body('source')
    .optional()
    .isIn(['referral', 'website', 'social_media', 'cold_call', 'market', 'other'])
    .withMessage('Invalid source'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Invalid ZIP code format'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  
  handleValidationErrors
];

/**
 * Client update validation
 */
const validateClientUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Valid phone number is required'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lead', 'prospect', 'churned'])
    .withMessage('Invalid status'),
  
  body('source')
    .optional()
    .isIn(['referral', 'website', 'social_media', 'cold_call', 'market', 'other'])
    .withMessage('Invalid source'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Follow-up creation validation
 */
const validateFollowUpCreate = [
  body('client')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('label')
    .optional()
    .isIn([
      'Pending Response',
      'Payment Due',
      'Scheduled Call',
      'Market Follow-up',
      'Urgent',
      'New Lead',
      'Proposal Sent',
      'Negotiation',
      'Contract Review',
      'Onboarding',
      'General'
    ])
    .withMessage('Invalid label'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('channel')
    .optional()
    .isIn(['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'other'])
    .withMessage('Invalid channel'),
  
  handleValidationErrors
];

/**
 * Interaction creation validation
 */
const validateInteractionCreate = [
  body('client')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID'),
  
  body('type')
    .notEmpty()
    .withMessage('Interaction type is required')
    .isIn(['query', 'complaint', 'feedback', 'call', 'email', 'meeting', 'note', 'other'])
    .withMessage('Invalid interaction type'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 3000 })
    .withMessage('Description must be between 5 and 3000 characters'),
  
  body('channel')
    .optional()
    .isIn(['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'portal', 'other'])
    .withMessage('Invalid channel'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  
  body('sentiment')
    .optional()
    .isIn(['positive', 'neutral', 'negative'])
    .withMessage('Invalid sentiment'),
  
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateIdParam = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateClientCreate,
  validateClientUpdate,
  validatePagination,
  validateFollowUpCreate,
  validateInteractionCreate,
  validateIdParam
};
