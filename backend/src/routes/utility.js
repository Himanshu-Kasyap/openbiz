/**
 * @fileoverview Utility routes for PIN code lookup, form schema, and field validation
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const express = require('express');
const { validateRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const LocationService = require('../services/locationService');
const FormSchemaService = require('../services/formSchemaService');
const RegistrationService = require('../services/registrationService');
const Joi = require('joi');

const router = express.Router();

/**
 * Validation schemas for utility endpoints
 */
const pincodeParamSchema = Joi.object({
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN code must be exactly 6 digits',
      'any.required': 'PIN code is required'
    })
});

const fieldValidationSchema = Joi.object({
  field: Joi.string()
    .valid('aadhaarNumber', 'panNumber', 'otp', 'mobileNumber', 'email', 'pincode', 'firstName', 'lastName')
    .required()
    .messages({
      'any.only': 'Field must be one of: aadhaarNumber, panNumber, otp, mobileNumber, email, pincode, firstName, lastName',
      'any.required': 'Field name is required'
    }),
  
  value: Joi.string()
    .allow('')
    .required()
    .messages({
      'any.required': 'Field value is required'
    })
});

/**
 * @typedef {Object} LocationResponse
 * @property {boolean} success - Success status
 * @property {Object} data - Location data
 * @property {string} data.pincode - PIN code
 * @property {string} data.city - City name
 * @property {string} data.state - State name
 * @property {string} data.district - District name
 * @property {string} data.country - Country name
 * @property {Object} metadata - Response metadata
 * @property {string} metadata.source - Data source (cache/api/fallback)
 * @property {string} metadata.timestamp - Response timestamp
 */

/**
 * GET /api/v1/pincode/:code/location
 * Get location details by PIN code
 * 
 * @route GET /api/v1/pincode/:code/location
 * @param {string} req.params.code - 6-digit PIN code
 * @returns {LocationResponse} Location details
 */
router.get('/:code/location',
  validateRequest(pincodeParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { code } = req.params;

    const locationData = await LocationService.getLocationByPincode(code);

    res.json({
      success: true,
      data: locationData,
      metadata: {
        source: 'location_service',
        timestamp: new Date().toISOString(),
        cached: LocationService.getCachedLocation(code) !== null
      }
    });
  })
);

/**
 * @typedef {Object} FormSchemaResponse
 * @property {boolean} success - Success status
 * @property {Object} data - Form schema data
 * @property {string} data.version - Schema version
 * @property {string} data.title - Form title
 * @property {string} data.description - Form description
 * @property {Array} data.steps - Form steps with fields
 * @property {Object} data.metadata - Schema metadata
 */

/**
 * GET /api/v1/form-schema
 * Get complete form schema structure
 * 
 * @route GET /api/v1/form-schema
 * @returns {FormSchemaResponse} Complete form schema
 */
router.get('/form-schema',
  asyncHandler(async (req, res) => {
    const schema = await FormSchemaService.getFormSchema();

    res.json({
      success: true,
      data: schema,
      metadata: {
        timestamp: new Date().toISOString(),
        totalSteps: schema.steps.length,
        totalFields: schema.steps.reduce((total, step) => total + step.fields.length, 0)
      }
    });
  })
);

/**
 * GET /api/v1/form-schema/step/:stepNumber
 * Get form schema for a specific step
 * 
 * @route GET /api/v1/form-schema/step/:stepNumber
 * @param {string} req.params.stepNumber - Step number (1 or 2)
 * @returns {Object} Step schema
 */
router.get('/form-schema/step/:stepNumber',
  validateRequest(Joi.object({
    stepNumber: Joi.number().integer().min(1).max(2).required()
  }), 'params'),
  asyncHandler(async (req, res) => {
    const stepNumber = parseInt(req.params.stepNumber);
    const stepSchema = await FormSchemaService.getStepSchema(stepNumber);

    res.json({
      success: true,
      data: stepSchema,
      metadata: {
        timestamp: new Date().toISOString(),
        fieldCount: stepSchema.fields.length
      }
    });
  })
);

/**
 * GET /api/v1/form-schema/metadata
 * Get form schema metadata
 * 
 * @route GET /api/v1/form-schema/metadata
 * @returns {Object} Schema metadata
 */
router.get('/form-schema/metadata',
  asyncHandler(async (req, res) => {
    const metadata = await FormSchemaService.getSchemaMetadata();

    res.json({
      success: true,
      data: metadata,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @typedef {Object} FieldValidationRequest
 * @property {string} field - Field name to validate
 * @property {string} value - Field value to validate
 */

/**
 * @typedef {Object} FieldValidationResponse
 * @property {boolean} success - Success status
 * @property {Object} data - Validation result
 * @property {string} data.field - Field name
 * @property {string} data.value - Field value
 * @property {boolean} data.isValid - Validation result
 * @property {string} data.message - Validation message
 * @property {Array} [data.suggestions] - Validation suggestions
 */

/**
 * POST /api/v1/validate-field
 * Validate individual form field in real-time
 * 
 * @route POST /api/v1/validate-field
 * @param {FieldValidationRequest} req.body - Field validation data
 * @returns {FieldValidationResponse} Validation result
 */
router.post('/validate-field',
  validateRequest(fieldValidationSchema),
  asyncHandler(async (req, res) => {
    const { field, value } = req.body;

    // Use existing registration service validation
    const result = await RegistrationService.validateField(field, value);

    // Add additional validation suggestions based on field type
    const suggestions = [];
    
    if (!result.isValid) {
      switch (field) {
        case 'aadhaarNumber':
          if (value.length < 12) {
            suggestions.push('Aadhaar number should be 12 digits long');
          } else if (value.length > 12) {
            suggestions.push('Aadhaar number should not exceed 12 digits');
          }
          if (!/^\d+$/.test(value)) {
            suggestions.push('Aadhaar number should contain only digits');
          }
          break;
          
        case 'panNumber':
          if (value.length !== 10) {
            suggestions.push('PAN number should be exactly 10 characters');
          }
          if (!/^[A-Za-z]{5}/.test(value)) {
            suggestions.push('PAN should start with 5 letters');
          }
          if (!/[0-9]{4}/.test(value.substring(5, 9))) {
            suggestions.push('PAN should have 4 digits after the first 5 letters');
          }
          if (!/[A-Za-z]$/.test(value)) {
            suggestions.push('PAN should end with a letter');
          }
          break;
          
        case 'mobileNumber':
          if (value.length !== 10) {
            suggestions.push('Mobile number should be 10 digits long');
          }
          if (!/^[6-9]/.test(value)) {
            suggestions.push('Mobile number should start with 6, 7, 8, or 9');
          }
          break;
          
        case 'email':
          if (!value.includes('@')) {
            suggestions.push('Email should contain @ symbol');
          }
          if (!value.includes('.')) {
            suggestions.push('Email should contain a domain extension');
          }
          break;
          
        case 'pincode':
          if (value.length !== 6) {
            suggestions.push('PIN code should be exactly 6 digits');
          }
          if (!/^\d+$/.test(value)) {
            suggestions.push('PIN code should contain only digits');
          }
          break;
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      },
      metadata: {
        timestamp: new Date().toISOString(),
        validationType: 'real-time'
      }
    });
  })
);

/**
 * POST /api/v1/validate-form
 * Validate complete form data for a step
 * 
 * @route POST /api/v1/validate-form
 * @param {Object} req.body - Form validation data
 * @param {number} req.body.stepNumber - Step number
 * @param {Object} req.body.formData - Form data to validate
 * @returns {Object} Validation result
 */
router.post('/validate-form',
  validateRequest(Joi.object({
    stepNumber: Joi.number().integer().min(1).max(2).required(),
    formData: Joi.object().required()
  })),
  asyncHandler(async (req, res) => {
    const { stepNumber, formData } = req.body;

    const validationResult = await FormSchemaService.validateFormData(formData, stepNumber);

    res.json({
      success: true,
      data: validationResult,
      metadata: {
        timestamp: new Date().toISOString(),
        stepNumber,
        validationType: 'form-level'
      }
    });
  })
);

/**
 * GET /api/v1/cache/stats
 * Get cache statistics for monitoring
 * 
 * @route GET /api/v1/cache/stats
 * @returns {Object} Cache statistics
 */
router.get('/cache/stats',
  asyncHandler(async (req, res) => {
    const cacheStats = LocationService.getCacheStats();

    res.json({
      success: true,
      data: {
        location_cache: cacheStats,
        cache_ttl_hours: LocationService.CACHE_TTL / (1000 * 60 * 60)
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * POST /api/v1/cache/clear
 * Clear expired cache entries (admin endpoint)
 * 
 * @route POST /api/v1/cache/clear
 * @returns {Object} Cache clear result
 */
router.post('/cache/clear',
  asyncHandler(async (req, res) => {
    const beforeCount = LocationService.cache.size;
    LocationService.clearExpiredCache();
    const afterCount = LocationService.cache.size;

    res.json({
      success: true,
      data: {
        entriesCleared: beforeCount - afterCount,
        remainingEntries: afterCount
      },
      metadata: {
        timestamp: new Date().toISOString(),
        action: 'cache_clear'
      }
    });
  })
);

module.exports = router;