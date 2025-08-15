/**
 * @fileoverview Validation middleware using Joi
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema object
 * @param {string} [property='body'] - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
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
      return next(validationError);
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
}

module.exports = {
  validateRequest
};