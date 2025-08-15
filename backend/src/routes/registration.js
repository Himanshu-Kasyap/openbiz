/**
 * @fileoverview Registration routes for Udyam registration replica
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const express = require('express');
const { validateRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const RegistrationService = require('../services/registrationService');
const {
  step1Schema,
  step2Schema,
  sessionIdParamSchema,
  fieldValidationSchema
} = require('../schemas/registration');

const router = express.Router();

/**
 * @typedef {Object} Step1Request
 * @property {string} aadhaarNumber - 12-digit Aadhaar number
 * @property {string} otp - 6-digit OTP
 * @property {string} [sessionId] - Optional existing session ID
 */

/**
 * @typedef {Object} Step1Response
 * @property {boolean} success - Success status
 * @property {string} sessionId - Session ID for tracking
 * @property {number} nextStep - Next step number
 * @property {string} message - Success message
 */

/**
 * POST /api/v1/registration/step1
 * Process Step 1 registration - Aadhaar verification with OTP
 * 
 * @route POST /api/v1/registration/step1
 * @param {Step1Request} req.body - Step 1 registration data
 * @returns {Step1Response} Registration result
 */
router.post('/step1', 
  validateRequest(step1Schema),
  asyncHandler(async (req, res) => {
    const { aadhaarNumber, otp, sessionId } = req.body;

    const result = await RegistrationService.processStep1({
      aadhaarNumber,
      otp,
      sessionId
    });

    res.status(201).json(result);
  })
);

/**
 * @typedef {Object} PersonalDetails
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} dateOfBirth - Date of birth (ISO format)
 * @property {string} gender - Gender (male/female/other)
 * @property {string} mobileNumber - 10-digit mobile number
 * @property {string} email - Email address
 * @property {Object} address - Address details
 * @property {string} address.street - Street address
 * @property {string} address.city - City
 * @property {string} address.state - State
 * @property {string} address.pincode - 6-digit PIN code
 */

/**
 * @typedef {Object} Step2Request
 * @property {string} sessionId - Session ID from Step 1
 * @property {string} panNumber - PAN number
 * @property {PersonalDetails} personalDetails - Personal details
 */

/**
 * @typedef {Object} Step2Response
 * @property {boolean} success - Success status
 * @property {string} sessionId - Session ID
 * @property {string} status - Registration status
 * @property {string} message - Success message
 */

/**
 * POST /api/v1/registration/step2
 * Process Step 2 registration - PAN verification and personal details
 * 
 * @route POST /api/v1/registration/step2
 * @param {Step2Request} req.body - Step 2 registration data
 * @returns {Step2Response} Registration result
 */
router.post('/step2',
  validateRequest(step2Schema),
  asyncHandler(async (req, res) => {
    const { sessionId, panNumber, personalDetails } = req.body;

    const result = await RegistrationService.processStep2({
      sessionId,
      panNumber,
      personalDetails
    });

    res.status(201).json(result);
  })
);

/**
 * @typedef {Object} RegistrationStatus
 * @property {string} sessionId - Session ID
 * @property {string} status - Overall status (in_progress/step1_completed/completed)
 * @property {number} currentStep - Current step number
 * @property {Object} steps - Step completion details
 * @property {Object} steps.step1 - Step 1 details
 * @property {boolean} steps.step1.completed - Step 1 completion status
 * @property {string} [steps.step1.completedAt] - Step 1 completion timestamp
 * @property {Object} steps.step2 - Step 2 details
 * @property {boolean} steps.step2.completed - Step 2 completion status
 * @property {string} [steps.step2.completedAt] - Step 2 completion timestamp
 * @property {string} createdAt - Registration creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * GET /api/v1/registration/:sessionId/status
 * Get registration status by session ID
 * 
 * @route GET /api/v1/registration/:sessionId/status
 * @param {string} req.params.sessionId - Session ID
 * @returns {RegistrationStatus} Registration status
 */
router.get('/:sessionId/status',
  validateRequest(sessionIdParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const status = await RegistrationService.getRegistrationStatus(sessionId);

    res.json(status);
  })
);

/**
 * @typedef {Object} FieldValidationRequest
 * @property {string} field - Field name to validate
 * @property {string} value - Field value to validate
 */

/**
 * @typedef {Object} FieldValidationResponse
 * @property {string} field - Field name
 * @property {string} value - Field value
 * @property {boolean} isValid - Validation result
 * @property {string} message - Validation message
 */

/**
 * POST /api/v1/registration/validate-field
 * Validate individual form field in real-time
 * 
 * @route POST /api/v1/registration/validate-field
 * @param {FieldValidationRequest} req.body - Field validation data
 * @returns {FieldValidationResponse} Validation result
 */
router.post('/validate-field',
  validateRequest(fieldValidationSchema),
  asyncHandler(async (req, res) => {
    const { field, value } = req.body;

    const result = await RegistrationService.validateField(field, value);

    res.json(result);
  })
);

module.exports = router;