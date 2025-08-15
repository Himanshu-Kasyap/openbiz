/**
 * @fileoverview Joi validation schemas for registration endpoints
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const Joi = require('joi');

/**
 * Aadhaar number validation pattern (12 digits)
 * @type {RegExp}
 */
const AADHAAR_PATTERN = /^\d{12}$/;

/**
 * PAN number validation pattern
 * @type {RegExp}
 */
const PAN_PATTERN = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;

/**
 * OTP validation pattern (6 digits)
 * @type {RegExp}
 */
const OTP_PATTERN = /^\d{6}$/;

/**
 * PIN code validation pattern (6 digits)
 * @type {RegExp}
 */
const PINCODE_PATTERN = /^\d{6}$/;

/**
 * Mobile number validation pattern (10 digits)
 * @type {RegExp}
 */
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Step 1 registration schema - Aadhaar verification
 */
const step1Schema = Joi.object({
  aadhaarNumber: Joi.string()
    .pattern(AADHAAR_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'Aadhaar number must be exactly 12 digits',
      'any.required': 'Aadhaar number is required'
    }),
  
  otp: Joi.string()
    .pattern(OTP_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be exactly 6 digits',
      'any.required': 'OTP is required'
    }),
  
  sessionId: Joi.string()
    .optional()
    .allow('')
    .messages({
      'string.base': 'Session ID must be a string'
    })
});

/**
 * Step 2 registration schema - PAN verification and personal details
 */
const step2Schema = Joi.object({
  sessionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Session ID is required',
      'string.empty': 'Session ID cannot be empty'
    }),
  
  panNumber: Joi.string()
    .pattern(PAN_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'PAN number must follow format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)',
      'any.required': 'PAN number is required'
    }),
  
  personalDetails: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z\s]+$/)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces',
        'any.required': 'First name is required'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z\s]+$/)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'any.required': 'Last name is required'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .required()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'any.required': 'Date of birth is required'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required()
      .messages({
        'any.only': 'Gender must be one of: male, female, other',
        'any.required': 'Gender is required'
      }),
    
    mobileNumber: Joi.string()
      .pattern(MOBILE_PATTERN)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must be 10 digits starting with 6, 7, 8, or 9',
        'any.required': 'Mobile number is required'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    address: Joi.object({
      street: Joi.string()
        .min(5)
        .max(100)
        .required()
        .messages({
          'string.min': 'Street address must be at least 5 characters',
          'string.max': 'Street address cannot exceed 100 characters',
          'any.required': 'Street address is required'
        }),
      
      city: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[A-Za-z\s]+$/)
        .required()
        .messages({
          'string.min': 'City must be at least 2 characters',
          'string.max': 'City cannot exceed 50 characters',
          'string.pattern.base': 'City can only contain letters and spaces',
          'any.required': 'City is required'
        }),
      
      state: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[A-Za-z\s]+$/)
        .required()
        .messages({
          'string.min': 'State must be at least 2 characters',
          'string.max': 'State cannot exceed 50 characters',
          'string.pattern.base': 'State can only contain letters and spaces',
          'any.required': 'State is required'
        }),
      
      pincode: Joi.string()
        .pattern(PINCODE_PATTERN)
        .required()
        .messages({
          'string.pattern.base': 'PIN code must be exactly 6 digits',
          'any.required': 'PIN code is required'
        })
    }).required()
  }).required()
});

/**
 * Session ID parameter schema
 */
const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Session ID is required',
      'string.empty': 'Session ID cannot be empty'
    })
});

/**
 * Field validation schema for real-time validation
 */
const fieldValidationSchema = Joi.object({
  field: Joi.string()
    .valid('aadhaarNumber', 'panNumber', 'otp', 'mobileNumber', 'email', 'pincode')
    .required()
    .messages({
      'any.only': 'Field must be one of: aadhaarNumber, panNumber, otp, mobileNumber, email, pincode',
      'any.required': 'Field name is required'
    }),
  
  value: Joi.string()
    .required()
    .messages({
      'any.required': 'Field value is required'
    })
});

module.exports = {
  step1Schema,
  step2Schema,
  sessionIdParamSchema,
  fieldValidationSchema,
  patterns: {
    AADHAAR_PATTERN,
    PAN_PATTERN,
    OTP_PATTERN,
    PINCODE_PATTERN,
    MOBILE_PATTERN
  }
};