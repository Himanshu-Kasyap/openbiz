/**
 * @fileoverview Registration API service for Udyam registration endpoints
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import api from './api'

/**
 * @typedef {Object} Step1Data
 * @property {string} aadhaarNumber - 12-digit Aadhaar number
 * @property {string} otp - 6-digit OTP
 * @property {string} [sessionId] - Optional existing session ID
 */

/**
 * @typedef {Object} Step1Response
 * @property {boolean} success
 * @property {string} sessionId
 * @property {number} nextStep
 * @property {string} message
 */

/**
 * @typedef {Object} PersonalDetails
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} dateOfBirth
 * @property {string} gender
 * @property {string} mobileNumber
 * @property {string} email
 * @property {Object} address
 * @property {string} address.street
 * @property {string} address.city
 * @property {string} address.state
 * @property {string} address.pincode
 */

/**
 * @typedef {Object} Step2Data
 * @property {string} sessionId
 * @property {string} panNumber
 * @property {PersonalDetails} personalDetails
 */

/**
 * @typedef {Object} Step2Response
 * @property {boolean} success
 * @property {string} sessionId
 * @property {string} status
 * @property {string} message
 */

/**
 * @typedef {Object} RegistrationStatus
 * @property {string} sessionId
 * @property {string} status
 * @property {number} currentStep
 * @property {Object} steps
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FieldValidationRequest
 * @property {string} field
 * @property {string} value
 */

/**
 * @typedef {Object} FieldValidationResponse
 * @property {string} field
 * @property {string} value
 * @property {boolean} isValid
 * @property {string} message
 * @property {string[]} [suggestions]
 */

/**
 * Registration API service
 */
const registrationApi = {
  /**
   * Submit Step 1 registration data (Aadhaar verification)
   * @param {Step1Data} data
   * @returns {Promise<Step1Response>}
   */
  async submitStep1(data) {
    const response = await api.post('/registration/step1', data)
    return response
  },

  /**
   * Submit Step 2 registration data (PAN and personal details)
   * @param {Step2Data} data
   * @returns {Promise<Step2Response>}
   */
  async submitStep2(data) {
    const response = await api.post('/registration/step2', data)
    return response
  },

  /**
   * Get registration status by session ID
   * @param {string} sessionId
   * @returns {Promise<RegistrationStatus>}
   */
  async getRegistrationStatus(sessionId) {
    const response = await api.get(`/registration/${sessionId}/status`)
    return response
  },

  /**
   * Validate individual form field
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @returns {Promise<FieldValidationResponse>}
   */
  async validateField(field, value) {
    const response = await api.post('/validate-field', { field, value })
    return response.data
  },

  /**
   * Validate complete form data for a step
   * @param {number} stepNumber - Step number (1 or 2)
   * @param {Object} formData - Form data to validate
   * @returns {Promise<Object>}
   */
  async validateForm(stepNumber, formData) {
    const response = await api.post('/validate-form', { stepNumber, formData })
    return response.data
  }
}

export default registrationApi