/**
 * @fileoverview Request logging middleware
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const logger = require('../config/logger');

/**
 * Generate unique request ID
 * @returns {string}
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request logging middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = generateRequestId();
  
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing Response', {
      requestId: req.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(body).length
    });
    
    return originalJson.call(this, body);
  };

  next();
}

module.exports = {
  requestLogger,
  generateRequestId
};