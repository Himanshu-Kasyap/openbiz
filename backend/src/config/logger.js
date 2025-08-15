/**
 * @fileoverview Winston logger configuration for structured logging
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const winston = require('winston');
const path = require('path');

/**
 * Log levels configuration
 * @type {Object<string, number>}
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Log colors for console output
 * @type {Object<string, string>}
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

/**
 * Custom log format for structured logging
 * @type {winston.Logform.Format}
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'udyam-backend',
      environment: process.env.NODE_ENV || 'development'
    };

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    // Add stack trace for errors
    if (info.stack) {
      logEntry.stack = info.stack;
    }

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 * @type {winston.Logform.Format}
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

/**
 * Create transports array based on environment
 * @returns {winston.transport[]}
 */
function createTransports() {
  const transports = [];

  // Console transport for all environments
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // File transports for production and development
  if (process.env.NODE_ENV !== 'test') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    // HTTP requests log file
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'http.log'),
        level: 'http',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3
      })
    );
  }

  return transports;
}

/**
 * Winston logger instance
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: createTransports(),
  exitOnError: false
});

/**
 * Create a child logger with additional context
 * @param {Object} context - Additional context to include in logs
 * @returns {winston.Logger}
 */
logger.child = function(context) {
  return logger.child(context);
};

/**
 * Log HTTP request details
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 */
logger.logRequest = function(req, res, responseTime) {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    sessionId: req.session?.id
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log database operations
 * @param {string} operation - Database operation type
 * @param {string} table - Database table name
 * @param {Object} [metadata] - Additional metadata
 */
logger.logDatabase = function(operation, table, metadata = {}) {
  logger.debug('Database Operation', {
    operation,
    table,
    ...metadata
  });
};

/**
 * Log external API calls
 * @param {string} service - External service name
 * @param {string} endpoint - API endpoint
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in milliseconds
 */
logger.logExternalAPI = function(service, endpoint, statusCode, responseTime) {
  const logData = {
    service,
    endpoint,
    statusCode,
    responseTime: `${responseTime}ms`
  };

  if (statusCode >= 400) {
    logger.warn('External API Call', logData);
  } else {
    logger.info('External API Call', logData);
  }
};

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir) && process.env.NODE_ENV !== 'test') {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;