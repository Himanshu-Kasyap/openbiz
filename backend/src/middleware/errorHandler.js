/**
 * @fileoverview Error handling middleware for Express application
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const logger = require('../config/logger');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Error code for client identification
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class for input validation failures
 */
class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Validation error details
   */
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Database error class for database operation failures
 */
class DatabaseError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Database error details
   */
  constructor(message, details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * External service error class for third-party API failures
 */
class ExternalServiceError extends AppError {
  /**
   * @param {string} service - Service name
   * @param {string} message - Error message
   * @param {number} [statusCode=503] - HTTP status code
   */
  constructor(service, message, statusCode = 503) {
    super(`${service}: ${message}`, statusCode, 'EXTERNAL_SERVICE_ERROR', { service });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Generate unique request ID for error tracking
 * @returns {string}
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format error response based on error type and environment
 * @param {Error} error - Error object
 * @param {string} requestId - Request ID for tracking
 * @returns {Object}
 */
function formatErrorResponse(error, requestId) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const baseResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Add error details for operational errors
  if (error.isOperational && error.details) {
    baseResponse.error.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    baseResponse.error.stack = error.stack;
  }

  return baseResponse;
}

/**
 * Log error with appropriate level and context
 * @param {Error} error - Error object
 * @param {import('express').Request} req - Express request object
 * @param {string} requestId - Request ID for tracking
 */
function logError(error, req, requestId) {
  const errorContext = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    sessionId: req.session?.id,
    body: req.body,
    query: req.query,
    params: req.params
  };

  if (error.isOperational) {
    logger.warn('Operational Error', {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      },
      ...errorContext
    });
  } else {
    logger.error('System Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...errorContext
    });
  }
}

/**
 * Global error handling middleware
 * @param {Error} error - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function errorHandler(error, req, res, next) {
  // Generate unique request ID if not present
  const requestId = req.id || generateRequestId();
  req.id = requestId;

  // Log the error
  logError(error, req, requestId);

  // Determine status code
  let statusCode = 500;
  if (error.statusCode) {
    statusCode = error.statusCode;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
  }

  // Handle specific error types
  if (error.name === 'SyntaxError' && error.status === 400 && 'body' in error) {
    const validationError = new ValidationError('Invalid JSON in request body');
    return res.status(400).json(formatErrorResponse(validationError, requestId));
  }

  // Handle Joi validation errors
  if (error.isJoi) {
    const validationError = new ValidationError(
      'Validation failed',
      {
        fields: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      }
    );
    return res.status(400).json(formatErrorResponse(validationError, requestId));
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    let dbError;
    switch (error.code) {
      case 'P2002':
        dbError = new DatabaseError('Unique constraint violation', {
          field: error.meta?.target
        });
        break;
      case 'P2025':
        dbError = new DatabaseError('Record not found');
        break;
      default:
        dbError = new DatabaseError('Database operation failed');
    }
    return res.status(dbError.statusCode).json(formatErrorResponse(dbError, requestId));
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(error, requestId);
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const requestId = req.id || generateRequestId();
  req.id = requestId;

  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );

  logger.warn('Route Not Found', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(formatErrorResponse(error, requestId));
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create error with specific type
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Object} [options] - Additional options
 * @returns {AppError}
 */
function createError(type, message, options = {}) {
  const { statusCode = 500, code = null, details = null } = options;
  
  switch (type) {
    case 'validation':
      return new ValidationError(message, details);
    case 'database':
      return new DatabaseError(message, details);
    case 'external':
      return new ExternalServiceError(options.service || 'Unknown', message, statusCode);
    default:
      return new AppError(message, statusCode, code, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError
};